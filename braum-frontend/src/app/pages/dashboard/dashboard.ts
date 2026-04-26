import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ScoreBadgeComponent } from '../../shared/score-badge/score-badge';
import { ModuleCardComponent } from '../../shared/module-card/module-card';

interface Finding {
  severity: string;
  message: string;
  [key: string]: any;
}

interface ModuleResult {
  score: number;
  findings: Finding[];
  [key: string]: any;
}

interface ScanResult {
  scanId: string;
  url: string;
  hostname: string;
  startedAt: string;
}

interface ScanInProgress extends ScanResult {
  status: 'processing';
}

interface ScanTerminal extends ScanResult {
  status: 'completed' | 'failed';
  completedAt: string;
  results: {
    headers: ModuleResult;
    ssl: ModuleResult;
    ports: ModuleResult;
    files: ModuleResult;
    [key: string]: ModuleResult;
  };
  errors: any[];
  grade: {
    score: number;
    grade: string;
    breakdown: any;
  };
}

type ScanApiResponse = ScanInProgress | ScanTerminal;

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ScoreBadgeComponent, ModuleCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  scanId: string = '';
  scanResult: ScanApiResponse | null = null;
  ws: WebSocket | null = null;
  pollingInterval: any = null;
  errorMessage: string = '';
  private platformId = inject(PLATFORM_ID);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.scanId = this.route.snapshot.paramMap.get('scanId') || '';
    this.connectWebSocket();
    this.fetchScanResult();
  }

  ngOnDestroy() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  connectWebSocket() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Don't connect WebSocket on server
    }

    try {
      this.ws = new WebSocket(`ws://localhost:3000/ws?scanId=${encodeURIComponent(this.scanId)}`);
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.scanId === this.scanId) {
          if (message.result) {
            // Full result update from WebSocket
            this.scanResult = message.result;
            // Stop polling once we have a completed result
            if (message.result.status === 'completed' && this.pollingInterval) {
              clearInterval(this.pollingInterval);
              this.pollingInterval = null;
            }
          }
        }
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  fetchScanResult() {
    this.http.get<ScanApiResponse>(`http://localhost:3000/api/scan/${this.scanId}`)
      .subscribe({
        next: (result) => {
          this.scanResult = result;
          this.errorMessage = '';
          // If scan is still processing, start polling
          if (result.status === 'processing') {
            this.startPolling();
          }
        },
        error: (error) => {
          console.error('Failed to fetch scan result', error);
          if (error.status === 404) {
            this.errorMessage = 'Scan not found. Please check the scan ID and try again.';
          } else {
            this.errorMessage = 'Failed to fetch scan results. Please try again later.';
          }
        }
      });
  }

  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      this.http.get<ScanApiResponse>(`http://localhost:3000/api/scan/${this.scanId}`)
        .subscribe({
          next: (result) => {
            this.scanResult = result;
            this.errorMessage = '';
            // Stop polling once scan is completed
            if (result.status === 'completed') {
              clearInterval(this.pollingInterval);
              this.pollingInterval = null;
            }
          },
          error: (error) => {
            console.error('Polling error:', error);
            // Stop polling on 404 errors
            if (error.status === 404) {
              clearInterval(this.pollingInterval);
              this.pollingInterval = null;
              this.errorMessage = 'Scan not found. Please check the scan ID and try again.';
            }
          }
        });
    }, 2000); // Poll every 2 seconds
  }

  get modules() {
    return this.scanResult && this.scanResult.status !== 'processing'
      ? Object.keys(this.scanResult.results)
      : [];
  }
}
