import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface Petal {
  left: number;
  delay: number;
  size: number;
  spin: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  girlName = 'My Love';
  petals: Petal[] = Array.from({ length: 20 }, (_, i) => ({
    left: (i * 13) % 100,
    delay: (i % 9) * 0.5,
    size: 14 + (i % 4) * 4,
    spin: (i % 2 === 0 ? 1 : -1) * (220 + i * 8),
  }));

  constructor(private router: Router) {}

  navigateTo(path: 'flower' | 'gallery' | 'note' | '') {
    this.router.navigate([path]);
  }
}