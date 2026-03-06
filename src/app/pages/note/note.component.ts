import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent implements OnInit {
  petalsVisible: boolean[] = [];

  ngOnInit() {
    this.generateFloatingPetals();
  }

  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['']);
  }

  generateFloatingPetals() {
    const petalsContainer = document.querySelector('.note-petals');
    if (!petalsContainer) return;

    for (let i = 0; i < 15; i++) {
      const petal = document.createElement('div');
      petal.classList.add('note-petal');
      petal.textContent = '🌸';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.top = Math.random() * 100 - 10 + '%';
      petal.style.animationDelay = Math.random() * 3 + 's';
      petalsContainer.appendChild(petal);
    }
  }
}
