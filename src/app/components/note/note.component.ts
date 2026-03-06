import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-note',
  standalone: true,
  imports: [],
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss'
})
export class NoteComponent {
  constructor(private router: Router) {}

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
}
