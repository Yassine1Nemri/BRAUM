import { Component, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef, NgZone, inject } from '@angular/core';
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
  timeoutSecondsRemaining: number = 0;
  errorMessage: string = '';
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private countdownInterval: any = null;
  private static readonly SCAN_TIMEOUT_SECONDS = 20;
  private fetchInFlight = false;
  private hasFetchedAfterCountdown = false;
  private wsConnectTimeout: any = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.scanId = this.route.snapshot.paramMap.get('scanId') || '';
    this.fetchScanResult();
  }

  ngOnDestroy() {
    this.closeWebSocket();
    this.stopPolling();
    this.stopCountdown();
    if (this.wsConnectTimeout) {
      clearTimeout(this.wsConnectTimeout);
      this.wsConnectTimeout = null;
    }
  }

  connectWebSocket() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Don't connect WebSocket on server
    }

    if (this.ws) {
      return;
    }

    try {
      const apiBase = this.getApiBase();
      const wsBase = apiBase.replace(/^http/, 'ws');
      this.ws = new WebSocket(`${wsBase}/ws?scanId=${encodeURIComponent(this.scanId)}`);
      this.ws.onopen = () => {
        this.ngZone.run(() => {
          // WS is the fast path; stop polling once connected.
          this.stopPolling();
        });
      };
      this.ws.onmessage = (event) => {
        this.ngZone.run(() => {
          const data = JSON.parse(event.data);
          if (data.status === 'completed' || data.module) {
            this.fetchScanResult();
          }
        });
      };
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.ngZone.run(() => {
          this.closeWebSocket();
          this.startPolling();
        });
      };
      this.ws.onclose = () => {
        this.ngZone.run(() => {
          this.ws = null;
          // Ensure polling continues even if WS drops
          if (this.scanResult?.status === 'processing') {
            this.startPolling();
          }
        });
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  fetchScanResult() {
    if (this.fetchInFlight) {
      return;
    }

    this.fetchInFlight = true;

    this.http.get<ScanApiResponse>(`${this.getApiBase()}/api/scan/${this.scanId}`)
      .subscribe({
        next: (result) => {
          this.ngZone.run(() => {
            this.scanResult = result;
            this.cdr.detectChanges();
            this.onScanUpdated();
            this.errorMessage = '';
            // If scan is still processing, start polling
            if (result.status === 'processing') {
              this.startPolling();
              if (!this.ws && !this.wsConnectTimeout) {
                this.wsConnectTimeout = setTimeout(() => {
                  this.wsConnectTimeout = null;
                  this.connectWebSocket();
                }, 1000);
              }
            } else {
              this.stopPolling();
              this.closeWebSocket();
              if (this.wsConnectTimeout) {
                clearTimeout(this.wsConnectTimeout);
                this.wsConnectTimeout = null;
              }
            }

            this.fetchInFlight = false;
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            console.error('Failed to fetch scan result', error);
            if (error.status === 404) {
              this.errorMessage = 'Scan not found. Please check the scan ID and try again.';
            } else {
              this.errorMessage = 'Failed to fetch scan results. Please try again later.';
            }

            this.startPolling();
            this.fetchInFlight = false;
          });
        }
      });
  }

  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      this.http.get<ScanApiResponse>(`${this.getApiBase()}/api/scan/${this.scanId}`)
        .subscribe({
          next: (result) => {
            this.ngZone.run(() => {
              this.scanResult = result;
              this.cdr.detectChanges();
              this.onScanUpdated();
              this.errorMessage = '';
              // Stop polling once scan is completed
              if (result.status !== 'processing') {
                this.stopPolling();
                this.closeWebSocket();
              }
            });
          },
          error: (error) => {
            this.ngZone.run(() => {
              console.error('Polling error:', error);
              // Stop polling on 404 errors
              if (error.status === 404) {
                this.stopPolling();
                this.errorMessage = 'Scan not found. Please check the scan ID and try again.';
              }
            });
          }
        });
    }, 1000); // Poll every 1 second
  }

  get modules() {
    return this.scanResult && this.scanResult.status !== 'processing'
      ? Object.keys(this.scanResult.results)
      : [];
  }

  private stopPolling(): void {
    if (!this.pollingInterval) {
      return;
    }

    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }

  private closeWebSocket(): void {
    if (!this.ws) {
      return;
    }

    try {
      this.ws.close();
    } catch {
      // ignore
    } finally {
      this.ws = null;
    }
  }

  private onScanUpdated(): void {
    if (!this.scanResult || this.scanResult.status !== 'processing') {
      this.stopCountdown();
      return;
    }

    this.hasFetchedAfterCountdown = false;
    this.startCountdown(this.scanResult.startedAt);
  }

  private startCountdown(startedAtIso: string): void {
    if (this.countdownInterval) {
      return;
    }

    const startedAtMs = Date.parse(startedAtIso);
    const effectiveStartedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : Date.now();

    const update = () => {
      const elapsedSeconds = Math.floor((Date.now() - effectiveStartedAtMs) / 1000);
      const remaining = DashboardComponent.SCAN_TIMEOUT_SECONDS - elapsedSeconds;
      this.timeoutSecondsRemaining = Math.max(0, remaining);

      if (this.timeoutSecondsRemaining === 0 && !this.hasFetchedAfterCountdown) {
        this.hasFetchedAfterCountdown = true;
        this.fetchScanResult();
      }
    };

    update();
    this.countdownInterval = setInterval(update, 250);
  }

  private stopCountdown(): void {
    if (!this.countdownInterval) {
      return;
    }

    clearInterval(this.countdownInterval);
    this.countdownInterval = null;
  }

  private getApiBase(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'http://localhost:3000';
    }

    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const host = window.location.hostname || 'localhost';
    return `${protocol}://${host}:3000`;
  }
}
