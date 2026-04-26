import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-score-badge',
  imports: [],
  templateUrl: './score-badge.html',
  styleUrl: './score-badge.css',
})
export class ScoreBadgeComponent {
  @Input() grade: string = '';

  get badgeClass(): string {
    switch (this.grade) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-yellow-500';
      case 'C': return 'bg-orange-500';
      case 'D': return 'bg-red-500';
      case 'F': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  }
}
