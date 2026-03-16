import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Petal {
  id: number;
  left: number;
  startY: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  rotate: number;
}

interface Sparkle {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  travelX: number;
  travelY: number;
}

interface Firefly {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  moveX: number;
  moveY: number;
}

interface Firework {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  petals: Petal[] = [];
  sparkles: Sparkle[] = [];
  fireflies: Firefly[] = [];
  fireworks: Firework[] = [];

  birthdayName: string = 'Birthday Girl';

  constructor(private router: Router) {}
  goToLovescape() {
    this.router.navigate(['/lovescape']);
  }

  ngOnInit() {
    this.petals = this.createPetals(40);
    this.sparkles = this.createSparkles(48);
    this.fireflies = this.createFireflies(26);
    this.fireworks = this.createFireworks(10);
  }

  private createPetals(count: number): Petal[] {
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: this.random(2, 98),
      startY: this.random(-30, -5),
      delay: this.random(0, 8),
      duration: this.random(8, 15),
      size: this.random(14, 30),
      drift: this.random(-90, 90),
      rotate: this.random(220, 540),
    }));
  }

  private createSparkles(count: number): Sparkle[] {
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: this.random(0, 100),
      top: this.random(0, 72),
      size: this.random(2, 6),
      delay: this.random(0, 4),
      duration: this.random(2.2, 4.6),
      travelX: this.random(-28, 28),
      travelY: this.random(-50, -12),
    }));
  }

  private createFireflies(count: number): Firefly[] {
    const colors = ['#ff8ec6', '#ffd47e', '#7de7e1', '#b9a7ff', '#98ffa8'];
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: this.random(2, 98),
      top: this.random(8, 92),
      size: this.random(5, 10),
      delay: this.random(0, 6),
      duration: this.random(9, 16),
      color: colors[Math.floor(Math.random() * colors.length)],
      moveX: this.random(-80, 80),
      moveY: this.random(-90, 40),
    }));
  }

  private createFireworks(count: number): Firework[] {
    const colors = ['#ff6f9a', '#ffd47d', '#8ce7ff', '#9affb8', '#ff9fd6'];
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: this.random(10, 90),
      top: this.random(14, 58),
      size: this.random(44, 90),
      delay: this.random(0, 9),
      duration: this.random(3, 5.8),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }

  goToFlower() {
    this.router.navigate(['/flower']);
  }

  goToGallery() {
    this.router.navigate(['/gallery']);
  }

  goToNote() {
    this.router.navigate(['/note']);
  }

  goToWishes() {
    this.router.navigate(['/wishes']);
  }

  goToTimeline() {
    this.router.navigate(['/timeline']);
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  getPetalStyle(petal: Petal) {
    return {
      left: `${petal.left}%`,
      top: `${petal.startY}%`,
      width: `${petal.size}px`,
      height: `${petal.size}px`,
      animationDelay: `${petal.delay}s`,
      animationDuration: `${petal.duration}s`,
      '--petal-drift': `${petal.drift}px`,
      '--petal-rotate': `${petal.rotate}deg`,
    };
  }

  getSparkleStyle(sparkle: Sparkle) {
    return {
      left: `${sparkle.left}%`,
      top: `${sparkle.top}%`,
      width: `${sparkle.size}px`,
      height: `${sparkle.size}px`,
      animationDelay: `${sparkle.delay}s`,
      animationDuration: `${sparkle.duration}s`,
      '--sparkle-x': `${sparkle.travelX}px`,
      '--sparkle-y': `${sparkle.travelY}px`,
    };
  }

  getFireflyStyle(firefly: Firefly) {
    return {
      left: `${firefly.left}%`,
      top: `${firefly.top}%`,
      width: `${firefly.size}px`,
      height: `${firefly.size}px`,
      animationDelay: `${firefly.delay}s`,
      animationDuration: `${firefly.duration}s`,
      '--firefly-color': firefly.color,
      '--firefly-x': `${firefly.moveX}px`,
      '--firefly-y': `${firefly.moveY}px`,
    };
  }

  getFireworkStyle(firework: Firework) {
    return {
      left: `${firework.left}%`,
      top: `${firework.top}%`,
      width: `${firework.size}px`,
      height: `${firework.size}px`,
      animationDelay: `${firework.delay}s`,
      animationDuration: `${firework.duration}s`,
      '--firework-color': firework.color,
    };
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
