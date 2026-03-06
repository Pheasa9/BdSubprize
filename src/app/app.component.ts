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

  @ViewChild('musicPicker', { static: true })
  private musicPickerRef?: ElementRef<HTMLInputElement>;

  protected musicPlaying = false;
  protected musicStatus = '';
  private objectUrl: string | null = null;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.musicStatus = 'Tap Play Music, then choose MP3 file';
  }

  ngOnDestroy(): void {
    const audio = this.globalMusicRef?.nativeElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.musicPlaying = false;
  }

  protected toggleGlobalMusic(): void {
    const audio = this.globalMusicRef?.nativeElement;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      const picker = this.musicPickerRef?.nativeElement;
      if (!picker) {
        return;
      }
      picker.value = '';
      picker.click();
      return;
    }

    audio.pause();
    this.musicPlaying = false;
    this.musicStatus = 'Music paused';
  }

  protected async onMusicFilePicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.musicStatus = 'No file selected';
      return;
    }

    const audio = this.globalMusicRef?.nativeElement;
    if (!audio) {
      return;
    }

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    this.objectUrl = URL.createObjectURL(file);
    audio.src = this.objectUrl;
    audio.load();

    audio.volume = 0.38;
    try {
      await audio.play();
      this.musicPlaying = true;
      this.musicStatus = `Playing: ${file.name}`;
    } catch {
      this.musicPlaying = false;
      this.musicStatus = 'Cannot play selected file';
    }
  }

  protected onGlobalMusicError(): void {
    this.musicPlaying = false;
    this.musicStatus = 'Selected file is not playable';
  }
}