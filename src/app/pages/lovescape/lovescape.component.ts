import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IntroSequenceComponent } from './intro-sequence.component';
import { MatrixBackgroundComponent } from './matrix-background.component';

@Component({
  selector: 'app-lovescape',
  standalone: true,
  imports: [
    CommonModule,
    IntroSequenceComponent,
    MatrixBackgroundComponent
  ],
  templateUrl: './lovescape.component.html',
  styleUrls: ['./lovescape.component.scss']
})
export class LovescapeComponent implements OnInit, OnDestroy {
  stage: 'intro' | 'label' | 'fading' | 'black' = 'intro';
  showIntroSequence = false;
  showLabel = false;

  private routerSub?: Subscription;
  private navigateTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.resetState();

    // Ensure returning back into this route always resets the screen
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        const nav = event as NavigationEnd;
        if (nav.urlAfterRedirects.includes('/lovescape')) {
          this.resetState();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    clearTimeout(this.navigateTimer);
  }

  startIntro(): void {
    this.showIntroSequence = true;
  }

  onSokyaDone(): void {
    // SOKYA has appeared and stopped. After 2 seconds, replace it with the clickable label.
    this.stage = 'label';
    this.navigateTimer = setTimeout(() => {
      this.showLabel = true;
    }, 2000);
  }

  navigateToFlower(): void {
    // Start golden bloom animation, then navigate to flower
    this.stage = 'fading';
    this.navigateTimer = setTimeout(() => {
      void this.router.navigate(['/flower']);
    }, 1400);
  }

  private resetState() {
    this.stage = 'intro';
    this.showIntroSequence = false;
    this.showLabel = false;

    clearTimeout(this.navigateTimer);
  }
}
