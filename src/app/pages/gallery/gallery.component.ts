import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface GalleryImage {
  id: number;
  src: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  images: GalleryImage[] = [
    { id: 1, src: 'assets/gallery/1.jpg' },
    { id: 2, src: 'assets/gallery/2.jpg' },
    { id: 3, src: 'assets/gallery/3.jpg' },
    { id: 4, src: 'assets/gallery/4.jpg' },
    { id: 5, src: 'assets/gallery/5.jpg' },
    { id: 6, src: 'assets/gallery/6.jpg' },
    { id: 7, src: 'assets/gallery/7.jpg' }
  ];

  currentIndex: number = 0;
  touchStartX: number = 0;
  touchEndX: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.generateFloatingPetals();
  }

  // Keyboard navigation
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.previousImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    }
  }

  // Touch/Swipe handling
  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe() {
    if (this.touchStartX - this.touchEndX > 50) {
      // Swiped left
      this.nextImage();
    } else if (this.touchEndX - this.touchStartX > 50) {
      // Swiped right
      this.previousImage();
    }
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  previousImage() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  goToNote() {
    this.router.navigate(['/note']);
  }

  goToFlower() {
    this.router.navigate(['/flower']);
  }

  goHome() {
    this.router.navigate(['']);
  }

  generateFloatingPetals() {
    const petalsContainer = document.querySelector('.gallery-petals');
    if (!petalsContainer) return;

    for (let i = 0; i < 12; i++) {
      const petal = document.createElement('div');
      petal.classList.add('floating-petal');
      petal.textContent = '🌸';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.top = Math.random() * 100 + '%';
      petal.style.animationDelay = Math.random() * 2 + 's';
      petal.style.opacity = '0.3';
      petalsContainer.appendChild(petal);
    }
  }

  getCurrentImage(): GalleryImage {
    return this.images[this.currentIndex];
  }

  getImagePosition(index: number): string {
    const diff = index - this.currentIndex;
    if (diff === 0) return 'active';
    if (diff === 1 || diff === -this.images.length + 1) return 'next';
    if (diff === -1 || diff === this.images.length - 1) return 'prev';
    return 'hidden';
  }
}
