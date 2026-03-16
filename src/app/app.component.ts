import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

interface Pine {
  id: number;
  left: number;
  scale: number;
}

interface GrassBlade {
  id: number;
  left: number;
  height: number;
  rotate: number;
  duration: number;
  opacity: number;
}

interface FlowerStem {
  id: number;
  left: number;
  height: number;
  width: number;
  scale: number;
  swayDuration: number;
  budDuration: number;
  budBottom: number;
  motionDelay: number;
  glow: number;
  blur: number;
}

class IntroRocket {
  x: number;
  y: number;
  targetY: number;
  color: string;
  speed: number;
  done = false;

  constructor(x: number, targetY: number, color: string, startY: number) {
    this.x = x;
    this.y = startY;
    this.targetY = targetY;
    this.color = color;
    this.speed = 6 + Math.random() * 2.2;
  }
}

class IntroParticle {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  alpha = 1;
  gravity = 0.038;
  decay: number;
  size: number;

  constructor(x: number, y: number, color: string, angle: number, speed: number) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.decay = 0.01 + Math.random() * 0.016;
    this.size = 1.8 + Math.random() * 2.5;
  }
}

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

  @ViewChild('introFireworks', { static: false })
  private introFireworksRef?: ElementRef<HTMLCanvasElement>;

  private introTimerId?: ReturnType<typeof setInterval>;
  private introRevealId?: ReturnType<typeof setTimeout>;
  private fireworksLaunchId?: ReturnType<typeof setInterval>;
  private fireworksKickId?: ReturnType<typeof setTimeout>;
  private animationFrameId?: number;
  private removeResizeListener?: () => void;

  private fireworksStarted = false;
  private readonly fireColors = ['#ff88c2', '#ffd56b', '#8ad9ff', '#d6a7ff', '#ffffff'];
  private rockets: IntroRocket[] = [];
  private particles: IntroParticle[] = [];
  private fwW = 0;
  private fwH = 0;

  protected musicPlaying = false;
  protected musicStatus = 'Shared music mode: same song for all devices.';
  protected readonly appVersion = '0.002';
  protected readonly sharedMusicSrc = 'assets/music/s.MP4';
  protected showIntro = true;
  protected introStarted = false;
  protected introSeconds = 10;
  protected introCanEnter = false;
  protected introCountdownHidden = false;
  protected introTitleShown = false;
  protected routeTransitioning = false;

  protected stars: Star[] = this.createStars(140);
  protected pines: Pine[] = this.createPines(24);
  protected grassBlades: GrassBlade[] = this.createGrassBlades(80);
  protected flowers: FlowerStem[] = this.createFlowers();

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly router: Router,
  ) {
    if (!isPlatformBrowser(this.platformId)) {
      this.showIntro = false;
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.routeTransitioning = true;
      }
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          this.routeTransitioning = false;
        }, 280);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.showIntro = false;
      return;
    }

    // Start the countdown automatically on page load, like before.
    setTimeout(() => {
      this.startIntro();
    });
  }

  ngOnDestroy(): void {
    if (this.introTimerId) {
      clearInterval(this.introTimerId);
      this.introTimerId = undefined;
    }
    if (this.introRevealId) {
      clearTimeout(this.introRevealId);
      this.introRevealId = undefined;
    }
    if (this.fireworksLaunchId) {
      clearInterval(this.fireworksLaunchId);
      this.fireworksLaunchId = undefined;
    }
    if (this.fireworksKickId) {
      clearTimeout(this.fireworksKickId);
      this.fireworksKickId = undefined;
    }
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    if (this.removeResizeListener) {
      this.removeResizeListener();
      this.removeResizeListener = undefined;
    }

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

  protected enterLovescapeFromIntro(): void {
    if (!this.introCanEnter) {
      return;
    }

    this.navigateToLovescape();
  }

  private startIntro(): void {
    this.introStarted = true;
    this.introSeconds = 10;
    this.introCountdownHidden = false;
    this.introTitleShown = false;
    this.introCanEnter = false;

    this.setupFireworksCanvas();
    this.startIntroCountdown();
  }

  private navigateToLovescape(): void {
    this.showIntro = false;
    void this.router.navigate(['/lovescape']);
  }

  protected trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  protected getStarStyle(star: Star): Record<string, string> {
    return {
      width: `${star.size}px`,
      height: `${star.size}px`,
      left: `${star.left}%`,
      top: `${star.top}%`,
      animationDuration: `${star.duration}s`,
      animationDelay: `${star.delay}s`,
    };
  }

  protected getPineStyle(pine: Pine): Record<string, string> {
    return {
      left: `${pine.left}%`,
      transform: `scale(${pine.scale})`,
    };
  }

  protected getBladeStyle(blade: GrassBlade): Record<string, string> {
    return {
      left: `${blade.left}%`,
      height: `${blade.height}px`,
      '--blade-tilt': `${blade.rotate}deg`,
      '--bDur': `${blade.duration}s`,
      opacity: blade.opacity.toFixed(2),
    };
  }

  protected getFlowerStyle(flower: FlowerStem): Record<string, string> {
    return {
      left: `${flower.left}%`,
      height: `${flower.height}px`,
      width: `${flower.width}px`,
      '--flower-scale': `${flower.scale}`,
      '--dur': `${flower.swayDuration}s`,
      '--budDur': `${flower.budDuration}s`,
      '--flower-delay': `${flower.motionDelay}s`,
      '--flower-glow': `${flower.glow}`,
      '--flower-blur': `${flower.blur}px`,
    };
  }

  private startIntroCountdown(): void {
    if (this.introTimerId) {
      clearInterval(this.introTimerId);
    }

    this.introTimerId = setInterval(() => {
      if (this.introSeconds <= 1) {
        this.introSeconds = 0;
        this.introCountdownHidden = true;

        if (this.introTimerId) {
          clearInterval(this.introTimerId);
          this.introTimerId = undefined;
        }

        this.introRevealId = setTimeout(() => {
          this.introTitleShown = true;
          this.introCanEnter = true;
          this.startFireworks();
        }, 800);
        return;
      }

      this.introSeconds -= 1;
    }, 1000);
  }

  private createStars(count: number): Star[] {
    return Array.from({ length: count }, (_, id) => ({
      id,
      size: this.random(1, 3.4),
      left: this.random(0, 100),
      top: this.random(0, 55),
      duration: this.random(1.5, 4.5),
      delay: this.random(0, 3),
    }));
  }

  private createPines(count: number): Pine[] {
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: id * 4.4 + this.random(0, 2),
      scale: this.random(0.7, 1.3),
    }));
  }

  private createGrassBlades(count: number): GrassBlade[] {
    return Array.from({ length: count }, (_, id) => ({
      id,
      left: this.random(0, 100),
      height: this.random(55, 125),
      rotate: this.random(-5, 5),
      duration: this.random(2.8, 5.3),
      opacity: this.random(0.5, 0.95),
    }));
  }

  private createFlowers(): FlowerStem[] {
    const positions = [4, 10, 16, 23, 29, 36, 43, 49, 55, 61, 67, 73, 79, 84, 89, 93, 96, 98];
    return positions.map((left, id) => {
      const height = this.random(96, 146);
      const stemH = Math.max(62, height - 70);
      return {
        id,
        left,
        height,
        width: this.random(70, 98),
        scale: this.random(0.7, 1.35),
        swayDuration: this.random(4.4, 7.2),
        budDuration: this.random(5.1, 8.2),
        budBottom: Math.min(height - 30, stemH - 2),
        motionDelay: this.random(-6, 0),
        glow: this.random(0.18, 0.55),
        blur: this.random(0, 0.9),
      };
    });
  }

  private setupFireworksCanvas(): void {
    const canvas = this.introFireworksRef?.nativeElement;
    if (!canvas || typeof window === 'undefined') {
      return;
    }

    const resize = () => {
      this.fwW = canvas.width = window.innerWidth;
      this.fwH = canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    this.removeResizeListener = () => window.removeEventListener('resize', resize);

    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, this.fwW, this.fwH);

      for (let i = this.rockets.length - 1; i >= 0; i -= 1) {
        const r = this.rockets[i];
        r.y -= r.speed;

        if (r.y <= r.targetY && !r.done) {
          r.done = true;
          this.explode(r.x, r.y, r.color);
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.shadowBlur = 16;
        ctx.shadowColor = r.color;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r.x, r.y + 8);
        ctx.lineTo(r.x, r.y + 22);
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        if (r.done) {
          this.rockets.splice(i, 1);
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.994;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private startFireworks(): void {
    if (this.fireworksStarted) {
      return;
    }

    this.fireworksStarted = true;
    for (let i = 0; i < 7; i += 1) {
      this.fireworksKickId = setTimeout(() => this.launchRocket(), i * 220);
    }

    this.fireworksLaunchId = setInterval(() => {
      const burst = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burst; i += 1) {
        setTimeout(() => this.launchRocket(), i * 170);
      }
    }, 1100);
  }

  private launchRocket(): void {
    const x = 70 + Math.random() * Math.max(this.fwW - 140, 140);
    const targetY = 40 + Math.random() * Math.max(this.fwH * 0.3, 120);
    const color = this.fireColors[Math.floor(Math.random() * this.fireColors.length)];
    this.rockets.push(new IntroRocket(x, targetY, color, this.fwH + 20));
  }

  private explode(x: number, y: number, baseColor: string): void {
    const count = 70 + Math.floor(Math.random() * 40);
    const ring = Math.random() < 0.45;

    for (let i = 0; i < count; i += 1) {
      const angle = ring ? (Math.PI * 2 * i) / count : Math.random() * Math.PI * 2;
      const speed = ring ? 2.4 + Math.random() * 1.3 : 1 + Math.random() * 4.5;
      const color = Math.random() > 0.2
        ? baseColor
        : this.fireColors[Math.floor(Math.random() * this.fireColors.length)];
      this.particles.push(new IntroParticle(x, y, color, angle, speed));
    }
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}