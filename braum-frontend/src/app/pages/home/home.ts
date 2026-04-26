import { Component, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  url: string = '';
  isScanning = false;
  errorMessage = '';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    const trimmed = this.url.trim();
    if (!trimmed || this.isScanning) {
      return;
    }

    this.errorMessage = '';
    this.isScanning = true;

    this.http
      .post<{ scanId: string; status: string }>(`${this.getApiBase()}/api/scan`, { url: trimmed })
      .subscribe({
        next: (response) => {
          void this.router.navigate(['/dashboard', response.scanId]);
        },
        error: (error) => {
          console.error('Scan failed', error);
          this.errorMessage =
            error?.error?.error ??
            'Scan failed. Please check the URL and try again.';
          this.isScanning = false;
        },
      });
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
