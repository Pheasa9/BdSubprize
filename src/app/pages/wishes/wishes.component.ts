import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Wish {
  id: number;
  title: string;
  text: string;
}

@Component({
  selector: 'app-wishes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishes.component.html',
  styleUrls: ['./wishes.component.scss'],
})
export class WishesComponent {
  protected readonly wishes: Wish[] = [
    {
      id: 1,
      title: 'Joy',
      text: 'May your days be filled with laughter, peace, and tiny beautiful surprises.',
    },
    {
      id: 2,
      title: 'Dreams',
      text: 'May every dream you carry in your heart find its way into real life.',
    },
    {
      id: 3,
      title: 'Love',
      text: 'May love wrap around you every morning and follow you into every night.',
    },
    {
      id: 4,
      title: 'Forever',
      text: 'I wish to keep celebrating your smile, your light, and your magic forever.',
    },
  ];

  constructor(private readonly router: Router) {}

  protected goHome(): void {
    void this.router.navigate(['/']);
  }

  protected goToGallery(): void {
    void this.router.navigate(['/gallery']);
  }

  protected trackById(_: number, item: Wish): number {
    return item.id;
  }
}
