import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-soft-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './soft-background.component.html',
  styleUrls: ['./soft-background.component.scss']
})
export class SoftBackgroundComponent {
  dots = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 13) % 100}%`,
    top: `${(i * 17) % 100}%`,
  }));
}
