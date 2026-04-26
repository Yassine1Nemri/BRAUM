import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Finding {
  severity: string | undefined;
  message: string;
  [key: string]: any;
}

interface ModuleResult {
  score: number;
  findings: Finding[];
  [key: string]: any;
}

@Component({
  selector: 'app-module-card',
  imports: [CommonModule],
  templateUrl: './module-card.html',
  styleUrl: './module-card.css',
})
export class ModuleCardComponent {
  @Input() moduleName: string = '';
  @Input() moduleResult: ModuleResult | null = null;
  @Input() overallStatus: string = '';

  get status(): string {
    if (this.overallStatus === 'failed') return 'error';
    if (this.moduleResult) return 'complete';
    return 'loading';
  }

  get statusIcon(): string {
    switch (this.status) {
      case 'loading': return '⏳';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '';
    }
  }

  findingIcon(severity: string | undefined): string {
    if (!severity) return '⚪';
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low':
      case 'info': return '🟢';
      default: return '⚪';
    }
  }
}
