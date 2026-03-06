import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('globalMusic', { static: true })
  private globalMusicRef?: ElementRef<HTMLAudioElement>;

  protected musicPlaying = false;
  private removeStartListeners: Array<() => void> = [];

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.installAutoplayKickstart();
      void this.playGlobalMusic();
    });
  }

  ngOnDestroy(): void {
    this.disposeStartListeners();
    const audio = this.globalMusicRef?.nativeElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.musicPlaying = false;
  }

  protected toggleGlobalMusic(): void {
    const audio = this.globalMusicRef?.nativeElement;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      void this.playGlobalMusic();
      return;
    }

    audio.pause();
    this.musicPlaying = false;
  }

  private async playGlobalMusic(): Promise<void> {
    const audio = this.globalMusicRef?.nativeElement;
    if (!audio) {
      return;
    }

    audio.volume = 0.38;
    try {
      await audio.play();
      this.musicPlaying = true;
      this.disposeStartListeners();
    } catch {
      this.musicPlaying = false;
    }
  }

  private installAutoplayKickstart(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.disposeStartListeners();

    const start = () => {
      void this.playGlobalMusic();
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    for (const eventName of events) {
      const handler = () => {
        start();
      };
      window.addEventListener(eventName, handler, { passive: true });
      this.removeStartListeners.push(() => window.removeEventListener(eventName, handler));
    }
  }

  private disposeStartListeners(): void {
    for (const remove of this.removeStartListeners) {
      remove();
    }
    this.removeStartListeners = [];
  }
}