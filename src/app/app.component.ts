import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('globalMusic', { static: true })
  private globalMusicRef?: ElementRef<HTMLAudioElement>;

  protected musicPlaying = false;
  protected musicStatus = '';
  protected readonly appVersion = '0.01';
  protected readonly sharedMusicSrc = 'assets/music/s.MP4';

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.musicStatus = 'Shared music mode: same song for all devices.';
  }

  ngOnDestroy(): void {
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
    this.musicStatus = 'Music paused';
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
      this.musicStatus = 'Music playing';
    } catch {
      this.musicPlaying = false;
      this.musicStatus = 'Cannot play shared file. Replace with MP3 and redeploy.';
    }
  }

  protected onGlobalMusicError(): void {
    this.musicPlaying = false;
    this.musicStatus = 'Shared file is not playable. Upload valid MP3 then redeploy.';
  }
}