import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  url: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    if (this.url.trim()) {
      this.http.post<{ scanId: string; status: string }>('http://localhost:3000/api/scan', { url: this.url })
        .subscribe({
          next: (response) => {
            this.router.navigate(['/dashboard', response.scanId]);
          },
          error: (error) => {
            console.error('Scan failed', error);
          }
        });
    }
  }
}
