import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit {
  images = [
    'assets/gallery/1.jpg',
    'assets/gallery/2.jpg',
    'assets/gallery/3.jpg',
    'assets/gallery/4.jpg',
    'assets/gallery/5.jpg',
    'assets/gallery/6.jpg',
    'assets/gallery/7.jpg'
  ];

  currentIndex = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'ArrowRight') {
      this.next();
    }
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  getDotClass(index: number): string {
    return index === this.currentIndex ? 'active' : '';
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
}
