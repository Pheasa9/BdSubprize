import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-intro-sequence',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-sequence.component.html',
  styleUrls: ['./intro-sequence.component.scss'],
  animations: [
    trigger('introStep', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.72) rotateX(40deg)' }),
        animate('350ms cubic-bezier(.22,1,.36,1)',
          style({ opacity: 1, transform: 'scale(1) rotateX(0)' })
        )
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ]),
    trigger('finalStep', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.72) rotateX(40deg)' }),
        animate('350ms cubic-bezier(.22,1,.36,1)',
          style({ opacity: 1, transform: 'scale(1) rotateX(0)' })
        )
      ])
      // No leave animation for final text - keeps SOKYA visible
    ]),
    trigger('buttonFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('350ms', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class IntroSequenceComponent {
  @Output() done = new EventEmitter<void>();
  @Output() sokyadone = new EventEmitter<void>();

  step = 0;
  finished = false;
  sequence = ['3', '2', '1', 'HAPPY', 'BIRTHDAY', 'TO', 'SOKYA'];

  get isFinalStep(): boolean {
    return this.step === this.sequence.length - 1;
  }

  ngOnInit() {
    let total = 600;
    this.sequence.forEach((_, index) => {
      setTimeout(() => {
        this.step = index;

        if (index === this.sequence.length - 1) {
          // SOKYA appears - emit sokyadone instead of auto-advancing
          this.sokyadone.emit();
        }
      }, total);
      total += index < 3 ? 800 : 950;
    });
  }

  onDoneClick() {
    this.done.emit();
  }
}
