import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flower',
  standalone: true,
  templateUrl: './flower.component.html',
  styleUrls: ['./flower.component.scss'],
})
export class FlowerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('flowerCanvas', { static: true })
  private flowerCanvasRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('bgMusic', { static: true })
  private bgMusicRef?: ElementRef<HTMLAudioElement>;

  private animationFrameId: number | null = null;
  private removeListeners: Array<() => void> = [];
  protected isMusicPlaying = false;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ngZone: NgZone,
    private readonly router: Router,
  ) {}

  protected goHome(): void {
    void this.router.navigate(['/']);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => this.startScene());
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    for (const removeListener of this.removeListeners) {
      removeListener();
    }
    this.removeListeners = [];

    const audio = this.bgMusicRef?.nativeElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.isMusicPlaying = false;
  }

  protected toggleMusic(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const audio = this.bgMusicRef?.nativeElement;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.volume = 0.42;
      void audio.play().then(() => {
        this.isMusicPlaying = true;
      }).catch(() => {
        this.isMusicPlaying = false;
      });
      return;
    }

    audio.pause();
    this.isMusicPlaying = false;
  }

  private startScene(): void {
    const canvas = this.flowerCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return;
    }

    let width = 0;
    let height = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

    interface Star {
      x: number;
      y: number;
      r: number;
      tw: number;
      ph: number;
      a: number;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      life: number;
      t: number;
      a: number;
      color: string;
    }

    interface GrassBlade {
      x: number;
      y: number;
      h: number;
      w: number;
      ph: number;
      a: number;
    }

    interface BackgroundFlower {
      x: number;
      baseY: number;
      height: number;
      stemW: number;
      bloomSize: number;
      swaySeed: number;
      grow: number;
      bloom: number;
      phase: number;
      leafCount: number;
      leafAngle: number;
      tw: number;
    }

    interface HeroFlower {
      x: number;
      baseY: number;
      height: number;
      bloomSize: number;
      scaleMax: number;
      swaySeed: number;
      phase: number;
      grow: number;
    }

    const stars: Star[] = [];
    const particles: Particle[] = [];
    const grass: GrassBlade[] = [];
    const heroGrass: GrassBlade[] = [];
    const flowers: BackgroundFlower[] = [];
    const pMax = 300;
    let hero: HeroFlower | null = null;

    let mouseX = 0;

    const makeStars = () => {
      stars.length = 0;
      const n = Math.max(110, Math.floor((width * height) / 16000));
      for (let i = 0; i < n; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.55,
          r: rnd(0.6, 1.7),
          tw: rnd(0.8, 1.9),
          ph: rnd(0, Math.PI * 2),
          a: rnd(0.15, 0.7),
        });
      }
    };

    const groundY = () => height * rnd(0.72, 0.88);
    const heroGroundY = () => height * 0.87;

    const addFlower = (x = rnd(width * 0.12, width * 0.88)) => {
      const baseY = groundY();
      flowers.push({
        x,
        baseY,
        height: rnd(height * 0.07, height * 0.17),
        stemW: rnd(2.0, 3.6),
        bloomSize: rnd(16, 30),
        swaySeed: rnd(0, 999),
        grow: 0,
        bloom: 0,
        phase: rnd(0, Math.PI * 2),
        leafCount: Math.floor(rnd(2, 5)),
        leafAngle: rnd(0.3, 0.9),
        tw: rnd(0.8, 1.6),
      });
    };

    const seedBackground = () => {
      flowers.length = 0;
      for (let i = 0; i < 10; i += 1) {
        addFlower(rnd(width * 0.08, width * 0.92));
      }
    };

    const makeGrass = () => {
      grass.length = 0;
      for (let i = 0; i < 140; i += 1) {
        grass.push({
          x: Math.random() * width,
          y: groundY(),
          h: rnd(10, 42),
          w: rnd(0.8, 1.8),
          ph: rnd(0, Math.PI * 2),
          a: rnd(0.12, 0.35),
        });
      }
    };

    const makeHeroGrass = () => {
      heroGrass.length = 0;
      const centerX = hero?.x ?? width * 0.5;
      const baseY = hero?.baseY ?? heroGroundY();
      const spread = Math.min(width * 0.32, 300);

      // Left tall blades.
      for (let i = 0; i < 8; i += 1) {
        heroGrass.push({
          x: centerX - spread * rnd(0.58, 0.96),
          y: baseY + rnd(8, 24),
          h: rnd(height * 0.28, height * 0.46),
          w: rnd(2.0, 3.8),
          ph: rnd(0, Math.PI * 2),
          a: rnd(0.24, 0.44),
        });
      }

      // Right tall blades.
      for (let i = 0; i < 8; i += 1) {
        heroGrass.push({
          x: centerX + spread * rnd(0.58, 0.96),
          y: baseY + rnd(8, 24),
          h: rnd(height * 0.28, height * 0.46),
          w: rnd(2.0, 3.8),
          ph: rnd(0, Math.PI * 2),
          a: rnd(0.24, 0.44),
        });
      }

      // Near-center shorter blades around hero base.
      for (let i = 0; i < 10; i += 1) {
        heroGrass.push({
          x: centerX + rnd(-spread * 0.30, spread * 0.30),
          y: baseY + rnd(10, 24),
          h: rnd(height * 0.14, height * 0.26),
          w: rnd(1.8, 3.6),
          ph: rnd(0, Math.PI * 2),
          a: rnd(0.22, 0.42),
        });
      }
    };

    const resize = () => {
      width = Math.floor(window.innerWidth);
      height = Math.floor(window.innerHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      makeStars();
      makeGrass();
      seedBackground();

      if (hero) {
        hero.x = width * 0.5;
        hero.baseY = heroGroundY();
        hero.height = Math.min(height * 0.45, 430);
        hero.bloomSize = Math.min(Math.max(54, height * 0.086), 96);
        hero.scaleMax = Math.min(Math.max(0.88, height / 820), 1.10);
      }

      makeHeroGrass();

      mouseX = width * 0.5;
    };

    const spawnParticle = (x: number, y: number, boost = 1, color = 'rgba(140,255,240,0.95)') => {
      particles.push({
        x,
        y,
        vx: rnd(-0.25, 0.25) * boost,
        vy: rnd(-0.6, -0.18) * boost,
        r: rnd(1.0, 2.4),
        life: rnd(70, 150),
        t: 0,
        a: rnd(0.25, 0.9),
        color,
      });
      if (particles.length > pMax) {
        particles.shift();
      }
    };

    const glowCircle = (x: number, y: number, r: number, color: string, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = r * 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawStars = (time: number) => {
      for (const star of stars) {
        const tw = (Math.sin(time * 0.001 * star.tw + star.ph) + 1) / 2;
        const alpha = star.a * (0.45 + 0.55 * tw);
        glowCircle(star.x, star.y, star.r, 'rgba(220,255,255,0.95)', alpha);
      }
    };

    const glowPuff = (x: number, y: number, size: number, color: string) => {
      ctx.save();
      const g = ctx.createRadialGradient(x, y, 0, x, y, size);
      g.addColorStop(0, color);
      g.addColorStop(0.55, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const spawnSparkBurst = (x: number, y: number) => {
      for (let i = 0; i < 55; i += 1) {
        const color =
          Math.random() < 0.35
            ? 'rgba(210,255,230,0.95)'
            : Math.random() < 0.55
              ? 'rgba(180,255,255,0.95)'
              : 'rgba(255,220,245,0.95)';
        spawnParticle(x + rnd(-30, 30), y + rnd(-30, 30), rnd(0.95, 1.9), color);
      }
      for (let i = 0; i < 16; i += 1) {
        spawnParticle(x + rnd(-16, 16), y + rnd(-10, 10), rnd(1.2, 2.0), 'rgba(140,255,200,0.95)');
      }
      glowPuff(x, y, 95, 'rgba(120,255,210,0.38)');
    };

    const drawParticles = () => {
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.t += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.995;
        p.vx *= 0.995;
        const lifeT = 1 - p.t / p.life;
        const alpha = p.a * clamp(lifeT, 0, 1);
        glowCircle(p.x, p.y, p.r, p.color, alpha);
        if (p.t >= p.life) {
          particles.splice(i, 1);
        }
      }
    };

    const drawGrass = (time: number, sway: number) => {
      for (const blade of grass) {
        const s = Math.sin(time * 0.0015 + blade.ph) * 0.75 + sway * 0.44;
        ctx.save();
        ctx.translate(blade.x, blade.y);
        ctx.rotate(s * 0.24);

        ctx.strokeStyle = `rgba(70,255,200,${blade.a})`;
        ctx.lineWidth = blade.w;
        ctx.shadowColor = 'rgba(120,255,200,0.25)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        const bend = Math.sin(time * 0.0012 + blade.ph) * blade.h * 0.20 + (s > 0 ? 1 : -1) * blade.h * 0.12;
        ctx.bezierCurveTo(blade.h * 0.22 + bend * 0.34, -blade.h * 0.24, bend * 0.98, -blade.h * 0.74, bend, -blade.h);
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawHeroGrass = (time: number, sway: number) => {
      const centerX = hero?.x ?? width * 0.5;
      const baseY = hero?.baseY ?? heroGroundY();

      for (const blade of heroGrass) {
        const side = blade.x < centerX ? -1 : 1;
        const throwDir = Math.sin(blade.ph * 2.7) > 0 ? 1 : -1;
        const sideBias = Math.abs(blade.x - centerX) > width * 0.16 ? side * 0.34 : side * 0.12;
        const throwBias = throwDir * 0.20;
        const s = Math.sin(time * 0.0011 + blade.ph) * 0.50 + sway * 0.24 + sideBias + throwBias;
        ctx.save();
        ctx.translate(blade.x, blade.y);
        ctx.rotate(s * 0.20);

        const grad = ctx.createLinearGradient(0, 0, 0, -blade.h);
        grad.addColorStop(0, `rgba(22,188,90,${blade.a})`);
        grad.addColorStop(0.55, `rgba(42,236,122,${blade.a * 0.92})`);
        grad.addColorStop(1, `rgba(136,255,184,${blade.a * 0.76})`);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(76,255,172,0.34)';
        ctx.shadowBlur = 12;

        const baseW = blade.w;
        const bend = side * blade.h * 0.20 + throwDir * blade.h * 0.20 + Math.sin(time * 0.001 + blade.ph) * blade.h * 0.08;
        const tipX = bend;
        ctx.beginPath();
        ctx.moveTo(-baseW, 0);
        ctx.bezierCurveTo(-baseW * 0.95 + bend * 0.18, -blade.h * 0.18, -baseW * 0.35 + bend * 0.56, -blade.h * 0.72, tipX, -blade.h);
        ctx.bezierCurveTo(baseW * 0.35 + bend * 0.52, -blade.h * 0.72, baseW * 0.95 + bend * 0.12, -blade.h * 0.18, baseW, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Stylized central glass/grass tuft like the reference cluster.
      const tuftCount = 13;
      for (let i = 0; i < tuftCount; i += 1) {
        const t = i / (tuftCount - 1);
        const tx = centerX + lerp(-88, 88, t) + Math.sin(time * 0.0007 + i) * 2.4;
        const ty = baseY + 8;
        const h = lerp(72, 126, 1 - Math.abs(t - 0.5) * 1.6);
        const w = lerp(18, 32, 1 - Math.abs(t - 0.5) * 1.5);
        const throwSide = i % 2 === 0 ? -1 : 1;
        const rot = lerp(-0.9, 0.9, t) * 0.95 + throwSide * 0.10 + sway * 0.02;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(rot);

        const leaf = ctx.createLinearGradient(0, 0, 0, -h);
        leaf.addColorStop(0, 'rgba(32,170,128,0.70)');
        leaf.addColorStop(0.55, 'rgba(88,226,196,0.74)');
        leaf.addColorStop(1, 'rgba(180,255,238,0.70)');
        ctx.fillStyle = leaf;
        ctx.shadowColor = 'rgba(120,255,220,0.22)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(w * 0.35, -h * 0.28, w * 0.40, -h * 0.76, 0, -h);
        ctx.bezierCurveTo(-w * 0.42, -h * 0.76, -w * 0.34, -h * 0.28, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    const drawStem = (flower: BackgroundFlower, t: number, sway: number) => {
      const topY = flower.baseY - flower.height * t;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const grad = ctx.createLinearGradient(flower.x, flower.baseY, flower.x + sway * 20, topY);
      grad.addColorStop(0, 'rgba(25,185,120,0.85)');
      grad.addColorStop(1, 'rgba(80,255,200,0.92)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = flower.stemW;
      ctx.shadowColor = 'rgba(120,255,210,0.28)';
      ctx.shadowBlur = 10;

      const ctrlX = flower.x + sway * 28;
      const midY = lerp(flower.baseY, topY, 0.55);
      ctx.beginPath();
      ctx.moveTo(flower.x, flower.baseY);
      ctx.quadraticCurveTo(ctrlX, midY, flower.x + sway * 10, topY);
      ctx.stroke();
      ctx.restore();
      return { topX: flower.x + sway * 10, topY };
    };

    const drawLeaves = (flower: BackgroundFlower, t: number, sway: number) => {
      const topY = flower.baseY - flower.height * t;
      const base = { x: flower.x, y: flower.baseY };
      const tip = { x: flower.x + sway * 10, y: topY };

      for (let i = 0; i < flower.leafCount; i += 1) {
        const lt = clamp((t - 0.15 - i * 0.08) / 0.65, 0, 1);
        const p = easeOutCubic(lt);
        if (p <= 0) {
          continue;
        }

        const along = lerp(0.25, 0.78, i / (flower.leafCount - 1 || 1));
        const sx = lerp(base.x, tip.x, along);
        const sy = lerp(base.y, tip.y, along);

        const dir = i % 2 === 0 ? -1 : 1;
        const ang = dir * (flower.leafAngle + i * 0.12) + sway * 0.35;
        const len = lerp(10, 26, p) * rnd(0.9, 1.1);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);

        ctx.strokeStyle = `rgba(110,255,200,${0.20 + 0.28 * p})`;
        ctx.lineWidth = lerp(1.0, 2.0, p);
        ctx.shadowColor = 'rgba(140,255,220,0.28)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -len * 0.35, len, 0);
        ctx.stroke();

        glowCircle(len, 0, lerp(0.8, 1.6, p), 'rgba(140,255,220,0.65)', 0.45);
        ctx.restore();
      }
    };

    const drawBloom = (flower: BackgroundFlower, top: { topX: number; topY: number }, bloomT: number, time: number) => {
      const b = easeInOutSine(bloomT);
      const size = flower.bloomSize * b;

      glowCircle(top.topX, top.topY, size * 0.35, 'rgba(170,255,230,0.30)', 0.55);
      glowCircle(top.topX, top.topY, size * 0.20, 'rgba(120,255,255,0.22)', 0.55);

      const wob = Math.sin(time * 0.0012 + flower.phase) * 0.08;

      ctx.save();
      ctx.translate(top.topX, top.topY);
      ctx.rotate(wob);

      const petals = 6;
      for (let i = 0; i < petals; i += 1) {
        const angle = (Math.PI * 2 * i) / petals;

        ctx.save();
        ctx.rotate(angle);

        const petLen = size * rnd(0.7, 0.95);
        const petWid = size * rnd(0.28, 0.42);

        ctx.fillStyle = `rgba(210,255,240,${0.30 + 0.30 * b})`;
        ctx.shadowColor = 'rgba(140,255,220,0.35)';
        ctx.shadowBlur = 16;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(petLen * 0.35, -petWid, petLen, 0);
        ctx.quadraticCurveTo(petLen * 0.35, petWid, 0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.shadowColor = 'rgba(140,255,200,0.45)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = `rgba(90,240,180,${0.50 + 0.35 * b})`;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() < 0.10 * b) {
        spawnParticle(top.topX + rnd(-8, 8), top.topY + rnd(-6, 6), 1, 'rgba(160,255,210,0.95)');
        spawnParticle(top.topX + rnd(-8, 8), top.topY + rnd(-6, 6), 1, 'rgba(180,255,255,0.95)');
      }

      ctx.restore();
    };

    const drawTealLeaf = (x: number, y: number, w: number, h: number, rot: number, alpha = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const solidAlpha = Math.max(0.94, alpha);
      ctx.globalAlpha = solidAlpha;

      const grad = ctx.createLinearGradient(-w * 0.2, -h * 0.2, w, h * 0.3);
      grad.addColorStop(0, 'rgba(185,255,210,0.98)');
      grad.addColorStop(0.45, 'rgba(74,220,128,0.96)');
      grad.addColorStop(1, 'rgba(20,120,58,0.94)');

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(120,255,170,0.40)';
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.moveTo(-w * 0.18, 0);
      ctx.quadraticCurveTo(w * 0.04, -h * 0.88, w, -h * 0.08);
      ctx.quadraticCurveTo(w * 0.18, h * 0.78, -w * 0.18, 0);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.max(0.88, solidAlpha * 0.92);
      ctx.strokeStyle = 'rgba(210,255,225,0.58)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Midrib and side veins for a cleaner leaf style.
      ctx.strokeStyle = 'rgba(225,255,235,0.55)';
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(-w * 0.06, 0);
      ctx.quadraticCurveTo(w * 0.38, -h * 0.18, w * 0.82, -h * 0.04);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(200,255,220,0.34)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(w * 0.18, -h * 0.08);
      ctx.lineTo(w * 0.42, -h * 0.32);
      ctx.moveTo(w * 0.24, 0.04 * h);
      ctx.lineTo(w * 0.52, h * 0.24);
      ctx.stroke();

      ctx.restore();
    };

    const drawHeroFlowerHead = (
      x: number,
      y: number,
      size: number,
      time: number,
      style: 'ya1' | 'ya1-white' | 'other' | 'rose' | 'tulip' = 'other',
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time * 0.0016) * 0.08);
      if (style === 'ya1-white') {
        // Orient white ya1 bloom to face upward.
        ctx.rotate(-Math.PI / 2);
      }

      const drawPetal = (petLen: number, petWid: number, fill: string, glow: string) => {
        ctx.fillStyle = fill;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(petLen * 0.10, -petWid, petLen * 0.72, -petWid * 0.88, petLen * 0.86, -petLen * 0.06);
        ctx.bezierCurveTo(petLen * 0.66, petWid * 1.02, petLen * 0.12, petWid * 0.90, 0, 0);
        ctx.closePath();
        ctx.fill();
      };

      const coreSpin = Math.sin(time * 0.0009) * 0.06;
      const stable = (i: number, seed: number, amp: number) => 1 + Math.sin(i * seed + 0.7) * amp;

      if (style === 'ya1' || style === 'ya1-white') {
        const isWhiteYa1 = style === 'ya1-white';
        const wingFill = isWhiteYa1 ? 'rgba(238,246,255,0.96)' : 'rgba(198,152,255,0.95)';
        const wingGlow = isWhiteYa1 ? 'rgba(182,224,255,0.60)' : 'rgba(136,82,238,0.72)';
        const midFill = isWhiteYa1 ? 'rgba(248,252,255,0.98)' : 'rgba(236,214,255,0.98)';
        const midGlow = isWhiteYa1 ? 'rgba(198,232,255,0.54)' : 'rgba(184,128,252,0.62)';
        const lipFill = isWhiteYa1 ? 'rgba(252,254,255,0.98)' : 'rgba(244,226,255,0.98)';
        const lipGlow = isWhiteYa1 ? 'rgba(210,236,255,0.48)' : 'rgba(196,144,255,0.58)';
        const crownFill = isWhiteYa1 ? 'rgba(255,255,255,0.98)' : 'rgba(252,240,255,0.98)';
        const crownGlow = isWhiteYa1 ? 'rgba(224,242,255,0.44)' : 'rgba(214,170,255,0.50)';

        // Orchid-like: wings + top + lower lip.
        for (let i = 0; i < 2; i += 1) {
          ctx.save();
          ctx.rotate((i === 0 ? -0.9 : 0.9) + Math.sin(time * 0.0007 + i) * 0.005);
          drawPetal(size * 0.88 * stable(i, 1.6, 0.03), size * 0.27, wingFill, wingGlow);
          ctx.restore();
        }

        for (let i = 0; i < 3; i += 1) {
          ctx.save();
          const base = [-Math.PI / 2, -0.14, 0.14][i] ?? -Math.PI / 2;
          ctx.rotate(base + 0.06 + Math.sin(time * 0.0008 + i) * 0.004);
          drawPetal(size * 0.56 * stable(i, 2.0, 0.04), size * 0.19, midFill, midGlow);
          ctx.restore();
        }

        ctx.save();
        ctx.rotate(Math.PI / 2 + 0.03);
        drawPetal(size * 0.66, size * 0.23, lipFill, lipGlow);
        ctx.restore();

        ctx.save();
        ctx.rotate(-Math.PI / 2 + 0.02);
        drawPetal(size * 0.30, size * 0.10, crownFill, crownGlow);
        ctx.restore();
      } else if (style === 'rose') {
        for (let i = 0; i < 10; i += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * i) / 10 + coreSpin * 0.7);
          drawPetal(size * 0.70 * stable(i, 1.5, 0.06), size * 0.22, 'rgba(240,96,122,0.92)', 'rgba(196,42,96,0.66)');
          ctx.restore();
        }
        for (let i = 0; i < 7; i += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * i) / 7 + 0.34 + coreSpin * 1.3);
          drawPetal(size * 0.48 * stable(i, 1.8, 0.07), size * 0.17, 'rgba(255,142,172,0.93)', 'rgba(220,74,138,0.62)');
          ctx.restore();
        }
        for (let i = 0; i < 4; i += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * i) / 4 + 0.52 + coreSpin * 1.8);
          drawPetal(size * 0.29 * stable(i, 2.4, 0.06), size * 0.11, 'rgba(255,198,214,0.95)', 'rgba(232,128,170,0.56)');
          ctx.restore();
        }
      } else if (style === 'tulip') {
        ctx.save();
        ctx.rotate(-Math.PI / 2 + Math.sin(time * 0.0012) * 0.04);

        for (let i = -1; i <= 1; i += 1) {
          ctx.save();
          ctx.rotate(i * 0.28);
          drawPetal(size * 0.94 * stable(i + 2, 1.7, 0.04), size * 0.31, 'rgba(255,186,102,0.94)', 'rgba(244,126,32,0.62)');
          ctx.restore();
        }

        ctx.save();
        ctx.rotate(0.04);
        drawPetal(size * 0.52, size * 0.16, 'rgba(255,228,156,0.92)', 'rgba(255,172,82,0.46)');
        ctx.restore();

        ctx.restore();
      } else {
        // "other" style.
        for (let i = 0; i < 7; i += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * i) / 7 - Math.PI / 2 + Math.sin(time * 0.001 + i) * 0.006);
          drawPetal(size * 0.88 * stable(i, 1.6, 0.05), size * 0.18, 'rgba(154,222,255,0.90)', 'rgba(74,184,236,0.54)');
          ctx.restore();
        }
        for (let i = 0; i < 6; i += 1) {
          ctx.save();
          ctx.rotate((Math.PI * 2 * i) / 6 - Math.PI / 2 + 0.22 + coreSpin * 0.3);
          drawPetal(size * 0.44 * stable(i, 2.1, 0.06), size * 0.13, 'rgba(198,242,255,0.94)', 'rgba(118,208,245,0.58)');
          ctx.restore();
        }
      }

      if (style !== 'tulip') {
        const centerPulse = 0.96 + 0.05 * Math.sin(time * 0.0018 + x * 0.003);
        const centerShiftY = Math.sin(time * 0.0014 + y * 0.003) * size * 0.004;
        const coreR = size * (style === 'rose' ? 0.072 : style === 'other' ? 0.090 : 0.080) * centerPulse;
        const centerPetals = style === 'rose' ? 8 : style === 'other' ? 5 : 6;
        const centerColor =
          style === 'rose'
            ? 'rgba(255,204,182,0.90)'
            : style === 'other'
              ? 'rgba(214,246,255,0.90)'
              : style === 'ya1-white'
                ? 'rgba(244,250,255,0.92)'
                : 'rgba(255,220,168,0.90)';

        ctx.shadowColor = style === 'other' ? 'rgba(140,220,255,0.34)' : style === 'ya1-white' ? 'rgba(188,228,255,0.40)' : 'rgba(255,212,156,0.44)';
        ctx.shadowBlur = 8;

        for (let i = 0; i < centerPetals; i += 1) {
          const a = (Math.PI * 2 * i) / centerPetals - Math.PI / 2;
          ctx.save();
          ctx.translate(0, centerShiftY);
          ctx.rotate(a);
          ctx.fillStyle = centerColor;
          ctx.beginPath();
          ctx.moveTo(0, -coreR * 0.84);
          ctx.quadraticCurveTo(coreR * (style === 'other' ? 0.30 : 0.44), -coreR * 0.34, 0, coreR * 0.10);
          ctx.quadraticCurveTo(-coreR * (style === 'other' ? 0.30 : 0.44), -coreR * 0.34, 0, -coreR * 0.84);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();
    };

    const drawMoon = (time: number) => {
      const mx = width * 0.84;
      const my = height * 0.17;
      const mr = Math.min(width, height) * 0.06;

      glowCircle(mx, my, mr * 1.35, 'rgba(205,225,255,0.28)', 0.52);

      const floatY = Math.sin(time * 0.00045) * 2;
      const moonGrad = ctx.createRadialGradient(mx - mr * 0.22, my - mr * 0.24 + floatY, mr * 0.15, mx, my + floatY, mr);
      moonGrad.addColorStop(0, 'rgba(248,252,255,0.96)');
      moonGrad.addColorStop(0.55, 'rgba(215,232,255,0.92)');
      moonGrad.addColorStop(1, 'rgba(170,198,235,0.88)');

      ctx.save();
      ctx.fillStyle = moonGrad;
      ctx.shadowColor = 'rgba(195,225,255,0.60)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(mx, my + floatY, mr, 0, Math.PI * 2);
      ctx.fill();

      // Subtle crescent bite.
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(6,10,20,0.40)';
      ctx.beginPath();
      ctx.arc(mx + mr * 0.34, my - mr * 0.08 + floatY, mr * 0.88, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawHero = (now: number, sway: number, tms: number) => {
      if (!hero) {
        return;
      }

      const growT = clamp(tms / 6000, 0, 1);
      const g = easeOutCubic(growT);
      hero.grow = growT;

      const heroX = hero.x;
      const sproutT = clamp(growT / 0.18, 0, 1);
      const stemRise = easeOutCubic(clamp((growT - 0.08) / 0.52, 0, 1));
      const scale = hero.scaleMax * (0.15 * easeOutCubic(sproutT) + 0.85 * stemRise);
      const wind = Math.sin(now * 0.0012 + hero.swaySeed) * 0.55 + sway * 0.9;

      const leafBaseY = hero.baseY - 22 * scale;
      const stems = [
        { dx: -20, h: 0.84, lean: -16 },
        { dx: 0, h: 1.02, lean: 0 },
        { dx: 20, h: 0.86, lean: 16 },
      ];

      const topPoints: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < stems.length; i += 1) {
        const s = stems[i];
        const stemDelay = 0.10 + i * 0.09;
        const stemGrow = easeOutCubic(clamp((growT - stemDelay) / 0.46, 0, 1));
        const swayGrow = easeOutCubic(clamp((stemGrow - 0.25) / 0.75, 0, 1));
        const sx = heroX + s.dx * scale;
        const topY = hero.baseY - hero.height * stemGrow * s.h;
        const endX = sx + wind * (2 + 9 * swayGrow) + s.lean * scale * (0.30 + 0.70 * swayGrow);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const grad = ctx.createLinearGradient(sx, hero.baseY, sx + wind * 20, topY);
        grad.addColorStop(0, 'rgba(65,185,120,0.95)');
        grad.addColorStop(1, 'rgba(215,245,170,0.98)');
        ctx.strokeStyle = grad;

        ctx.lineWidth = 5.4 * scale * (0.6 + 0.4 * stemGrow);
        ctx.shadowColor = 'rgba(140,255,180,0.34)';
        ctx.shadowBlur = 16;

        const ctrlX = sx + s.lean * scale * (0.16 + 0.44 * swayGrow) + wind * (8 + 20 * swayGrow);
        const midY = lerp(hero.baseY, topY, 0.55);

        ctx.beginPath();
        ctx.moveTo(sx, hero.baseY);
        ctx.quadraticCurveTo(ctrlX, midY, endX, topY);
        ctx.stroke();
        ctx.restore();

        if (stemGrow > 0.34) {
          const leafT = i === 1 ? 0.52 : 0.58;
          const inv = 1 - leafT;
          // Anchor leaves to the actual stem curve so they do not detach during animation.
          const leafX = inv * inv * sx + 2 * inv * leafT * ctrlX + leafT * leafT * endX;
          const leafY = inv * inv * hero.baseY + 2 * inv * leafT * midY + leafT * leafT * topY;
          const tanX = 2 * inv * (ctrlX - sx) + 2 * leafT * (endX - ctrlX);
          const tanY = 2 * inv * (midY - hero.baseY) + 2 * leafT * (topY - midY);
          const stemAngle = Math.atan2(tanY, tanX);
          const leafRot = stemAngle + (i === 1 ? -0.9 : i === 0 ? -0.72 : 0.72);

          drawTealLeaf(leafX, leafY, (i === 1 ? 34 : 28) * scale, (i === 1 ? 22 : 18) * scale, leafRot, i === 1 ? 0.72 : 0.62);
        }

        topPoints.push({ x: endX, y: topY });
      }

      const bloomT = clamp((growT - 0.68) / 0.32, 0, 1);
      if (bloomT > 0) {
        const b = easeInOutSine(bloomT);
        const baseSize = hero.bloomSize * scale * (0.30 + 1.28 * b);

        // Three big leaves behind the top flower cluster.
        const topAnchor = topPoints[1] ?? { x: heroX, y: hero.baseY - hero.height * 0.9 };
        const leafGrow = easeOutCubic(clamp((bloomT - 0.08) / 0.72, 0, 1));
        const backLeafAlpha = (0.68 + 0.30 * b) * leafGrow;
        drawTealLeaf(
          topAnchor.x - 34 * scale * leafGrow,
          topAnchor.y + 1 * scale * leafGrow,
          80 * scale * leafGrow,
          54 * scale * leafGrow,
          2.18 + wind * 0.05,
          backLeafAlpha,
        );
        drawTealLeaf(
          topAnchor.x,
          topAnchor.y - 54 * scale * leafGrow,
          82 * scale * leafGrow,
          56 * scale * leafGrow,
          -Math.PI / 2 + wind * 0.03,
          backLeafAlpha,
        );
        drawTealLeaf(
          topAnchor.x + 52 * scale * leafGrow,
          topAnchor.y - 24 * scale * leafGrow,
          80 * scale * leafGrow,
          54 * scale * leafGrow,
          -0.78 + wind * 0.05,
          backLeafAlpha,
        );
        drawTealLeaf(
          topAnchor.x - 26 * scale * leafGrow,
          topAnchor.y + 8 * scale * leafGrow,
          92 * scale * leafGrow,
          62 * scale * leafGrow,
          2.02 + wind * 0.04,
          Math.min(1, backLeafAlpha + 0.08 * leafGrow),
        );

        // Keep heads hidden until back leaves start opening.
        const headGrow = easeOutCubic(clamp((bloomT - 0.20) / 0.80, 0, 1));
        const grownBaseSize = baseSize * (0.30 + 0.70 * headGrow);

        const heads = [
          { px: topPoints[0].x - 22 * scale, py: topPoints[0].y - 20 * scale, s: 0.94, style: 'rose' as const },
          { px: topPoints[1].x, py: topPoints[1].y - 34 * scale, s: 1.34, style: 'ya1' as const },
          { px: topPoints[2].x + 22 * scale, py: topPoints[2].y - 20 * scale, s: 0.96, style: 'other' as const },
          { px: topPoints[1].x - 26 * scale, py: topPoints[1].y - 18 * scale, s: 0.82, style: 'ya1-white' as const },
          { px: topPoints[1].x, py: topPoints[1].y + 52 * scale, s: 0.84, style: 'tulip' as const },
        ];

        for (const h of heads) {
          if (h.style !== 'tulip') {
            drawHeroFlowerHead(h.px, h.py, grownBaseSize * h.s, now, h.style);
          }
        }
        for (const h of heads) {
          if (h.style === 'tulip') {
            drawHeroFlowerHead(h.px, h.py, grownBaseSize * h.s, now, h.style);
          }
        }

        if (Math.random() < 0.22 * b) {
          spawnParticle(
            heroX + rnd(-20, 20),
            (topPoints[1]?.y ?? hero.baseY - 240) + rnd(-20, 20),
            1.2,
            'rgba(210,135,255,0.95)',
          );
          spawnParticle(
            heroX + rnd(-20, 20),
            (topPoints[1]?.y ?? hero.baseY - 240) + rnd(-20, 20),
            1.2,
            'rgba(255,195,240,0.95)',
          );
        }
      }

      if (Math.random() < 0.65) {
        spawnParticle(
          heroX + rnd(-90, 90),
          hero.baseY - rnd(80, 360) * scale,
          rnd(0.6, 1.1),
          'rgba(215,145,255,0.90)',
        );
      }

      // Draw base leaves in front overlay so hero stays behind leaves.
      drawTealLeaf(heroX - 58 * scale, leafBaseY + 44 * scale, 82 * scale, 56 * scale, -0.96 + wind * 0.04, 0.96);
      drawTealLeaf(heroX, leafBaseY + 56 * scale, 92 * scale, 62 * scale, 0.04 + wind * 0.03, 0.96);
      drawTealLeaf(heroX + 52 * scale, leafBaseY + 44 * scale, 80 * scale, 54 * scale, 0.90 + wind * 0.04, 0.96);
    };

    const drawButterfly = (time: number, targetX: number, targetY: number, approachT: number, scale = 1) => {
      const startX = width * 0.92;
      const startY = height * 0.18;
      const ctrlX = width * 0.7;
      const ctrlY = height * 0.1;

      const t = easeInOutSine(approachT);
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * targetX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * targetY;

      const flap = Math.sin(time * 0.018) * (0.55 + 0.45 * (1 - t));
      const rot = Math.sin(time * 0.002 + 1.3) * 0.18;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
      ctx.rotate(rot);

        ctx.shadowColor = 'rgba(120,180,255,0.50)';
      ctx.shadowBlur = 14;
        ctx.strokeStyle = 'rgba(230,245,255,0.76)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(2, 0, 0, 6);
      ctx.stroke();

      const wing = (side: number) => {
        ctx.save();
        ctx.scale(side, 1);
        ctx.rotate(flap * 0.45);

        const grad = ctx.createRadialGradient(10, -2, 2, 18, 0, 26);
      grad.addColorStop(0, 'rgba(200,235,255,0.84)');
      grad.addColorStop(0.5, 'rgba(110,180,255,0.64)');
      grad.addColorStop(1, 'rgba(120,130,255,0.36)');
        ctx.fillStyle = grad;

      ctx.shadowColor = 'rgba(125,170,255,0.58)';
        ctx.shadowBlur = 22;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(14, -20, 34, -6);
        ctx.quadraticCurveTo(22, 8, 6, 10);
        ctx.quadraticCurveTo(2, 6, 0, 0);
        ctx.closePath();
        ctx.fill();

        glowCircle(18, -6, 1.3, 'rgba(235,245,255,0.95)', 0.65);
        glowCircle(26, -8, 1.0, 'rgba(165,205,255,0.95)', 0.62);

        ctx.restore();
      };

      wing(-1);
      wing(1);

      if (Math.random() < 0.16) {
        spawnParticle(x + rnd(-4, 4), y + rnd(-2, 2), 0.9, 'rgba(165,205,255,0.95)');
      }

      ctx.restore();
    };

    const drawExtraButterflies = (time: number) => {
      // Butterfly swarm moving in different random-like paths around the scene.
      for (let i = 0; i < 7; i += 1) {
        const t = time * (0.0006 + i * 0.00008);
        const x = width * (0.5 + 0.42 * Math.sin(t * (1.4 + i * 0.07) + i * 1.77));
        const y = height * (0.52 + 0.40 * Math.cos(t * (1.1 + i * 0.05) + i * 0.91));
        drawButterfly(time + i * 220, x, y, 1, 0.45 + (i % 3) * 0.12);
      }

      if (hero) {
        const baseX = hero.x;
        const baseY = hero.baseY - hero.height * 0.90;

        const t1 = time * 0.0012;
        const x1 = baseX + Math.cos(t1) * 90;
        const y1 = baseY + Math.sin(t1 * 1.4) * 28 - 20;
        drawButterfly(time, x1, y1, 1, 0.70);

        const t2 = time * 0.0016 + 2.2;
        const x2 = baseX + Math.cos(t2) * 120;
        const y2 = baseY + Math.sin(t2 * 1.1) * 34 + 18;
        drawButterfly(time, x2, y2, 1, 0.58);
      }
    };

    const drawAnimeText = (time: number, showT: number) => {
      const t = easeOutCubic(clamp(showT, 0, 1));
      if (t <= 0) {
        return;
      }

      const x = width * 0.07;
      const y = height * 0.11;
      const floating = Math.sin(time * 0.0022) * 4;
      const titleSize = Math.floor(clamp(width * 0.052, 34, 62));
      const nameSize = Math.floor(clamp(width * 0.033, 24, 42));

      ctx.save();
      ctx.translate(x, y + floating);
      ctx.globalAlpha = 0.10 + 0.90 * t;

      const text = 'Happy Birthday';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `400 ${titleSize}px 'Great Vibes', 'Times New Roman', serif`;

      ctx.shadowColor = 'rgba(210,170,255,0.52)';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = 'rgba(20,10,38,0.68)';
      ctx.strokeText(text, 0, 0);

      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(255,255,255,0.66)';
      ctx.strokeText(text, 0, 0);

      const grad = ctx.createLinearGradient(0, 0, 300, 0);
      grad.addColorStop(0, 'rgba(246,250,255,0.98)');
      grad.addColorStop(0.45, 'rgba(206,230,255,0.96)');
      grad.addColorStop(1, 'rgba(242,206,255,0.96)');
      ctx.fillStyle = grad;
      ctx.fillText(text, 0, 0);

      const subText = 'Sok Ya';
      ctx.translate(0, titleSize * 0.92);
      ctx.font = `700 ${Math.floor(nameSize * 0.84)}px 'Manrope', 'Segoe UI', Arial, sans-serif`;

      ctx.shadowColor = 'rgba(130,210,255,0.45)';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(12,18,34,0.62)';
      ctx.strokeText(subText, 0, 0);

      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.strokeText(subText, 0, 0);

      const grad2 = ctx.createLinearGradient(0, 0, 220, 0);
      grad2.addColorStop(0, 'rgba(236,246,255,0.98)');
      grad2.addColorStop(1, 'rgba(188,224,255,0.96)');
      ctx.fillStyle = grad2;
      ctx.fillText(subText, 0, 0);

      // Hand-drawn flourish under the name.
      ctx.strokeStyle = 'rgba(200,225,255,0.62)';
      ctx.lineWidth = Math.max(1.2, nameSize * 0.04);
      ctx.beginPath();
      ctx.moveTo(0, nameSize * 0.33);
      ctx.bezierCurveTo(nameSize * 0.8, nameSize * 0.80, nameSize * 2.0, nameSize * 0.02, nameSize * 2.8, nameSize * 0.36);
      ctx.stroke();

      if (Math.random() < 0.12 * t) {
        spawnParticle(x + rnd(-10, 280), y + rnd(-15, 100), 1.0, 'rgba(185,225,255,0.95)');
      }

      ctx.restore();
    };

    const addWindowListener = <K extends keyof WindowEventMap>(
      eventName: K,
      listener: (event: WindowEventMap[K]) => void,
    ) => {
      window.addEventListener(eventName, listener, { passive: true });
      this.removeListeners.push(() => {
        window.removeEventListener(eventName, listener);
      });
    };

    const maxClickGrow = 20;
    let clickGrowCount = 0;

    addWindowListener('resize', resize);
    addWindowListener('pointermove', (e: PointerEvent) => {
      mouseX = e.clientX;
    });
    addWindowListener('click', (e: MouseEvent) => {
      if (clickGrowCount < maxClickGrow && flowers.length < autoFlowerMaxCount) {
        addFlower(e.clientX + rnd(-20, 20));
        clickGrowCount += 1;
      }

      if (hero) {
        const hx = hero.x;
        const hy = hero.baseY - hero.height * 0.84;
        spawnSparkBurst(hx, hy);
      }
    });

    hero = {
      x: width * 0.5,
      baseY: heroGroundY(),
      height: Math.min(height * 0.45, 430),
      bloomSize: Math.min(Math.max(54, height * 0.086), 96),
      scaleMax: Math.min(Math.max(0.88, height / 820), 1.10),
      swaySeed: rnd(0, 999),
      phase: rnd(0, Math.PI * 2),
      grow: 0,
    };

    resize();

    const start = performance.now();
    const autoFlowerDelay = 3000;
    const autoFlowerMaxCount = 150;
    let nextAutoFlowerAt = start + 3000;
    const butterflyStart = 6200;
    const butterflyDuration = 3200;
    const textStart = 5200;
    const textDuration = 1800;

    let last = performance.now();
    const frame = (now: number) => {
      const dt = now - last;
      last = now;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(width * 0.5, height * 0.92, 20, width * 0.5, height * 0.92, Math.max(width, height) * 1.25);
      bg.addColorStop(0, 'rgba(24,58,40,0.24)');
      bg.addColorStop(0.42, 'rgba(8,14,22,0.62)');
      bg.addColorStop(1, 'rgba(1,2,5,1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Distant haze/hill layers for a "viewed from far" background depth.
      const haze1 = ctx.createLinearGradient(0, height * 0.46, 0, height * 0.90);
      haze1.addColorStop(0, 'rgba(44,96,116,0.09)');
      haze1.addColorStop(1, 'rgba(10,24,28,0.34)');
      ctx.fillStyle = haze1;
      ctx.beginPath();
      ctx.ellipse(width * 0.50, height * 0.87, width * 0.86, height * 0.23, 0, 0, Math.PI * 2);
      ctx.fill();

      const haze2 = ctx.createLinearGradient(0, height * 0.40, 0, height * 0.84);
      haze2.addColorStop(0, 'rgba(36,78,106,0.07)');
      haze2.addColorStop(1, 'rgba(6,16,24,0.30)');
      ctx.fillStyle = haze2;
      ctx.beginPath();
      ctx.ellipse(width * 0.52, height * 0.81, width * 1.10, height * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      const sway = clamp((((mouseX || width / 2) / width - 0.5) * 2), -1, 1);

      drawStars(now);
      drawMoon(now);
      drawGrass(now, sway);

      if (now >= nextAutoFlowerAt) {
        if (flowers.length < autoFlowerMaxCount) {
          addFlower(rnd(width * 0.14, width * 0.86));
        }
        nextAutoFlowerAt = now + autoFlowerDelay;
      }

      const tms = now - start;

      flowers.sort((a, b) => a.baseY - b.baseY);
      for (const flower of flowers) {
        flower.grow = clamp(flower.grow + dt * (0.00008 + flower.tw * 0.00001), 0, 1);

        const bloomStart = 0.60;
        flower.bloom = clamp((flower.grow - bloomStart) / (1 - bloomStart), 0, 1);

        const wind = Math.sin(now * 0.0012 + flower.swaySeed) * 0.55 + sway * 0.9;
        const stem = drawStem(flower, easeOutCubic(flower.grow), wind);
        drawLeaves(flower, flower.grow, wind);
        if (flower.bloom > 0) {
          drawBloom(flower, stem, flower.bloom, now);
        }

        if (Math.random() < 0.04) {
          glowCircle(flower.x + rnd(-3, 3), flower.baseY + rnd(-2, 2), rnd(0.7, 1.4), 'rgba(140,255,210,0.55)', 0.16);
        }
      }

      drawHeroGrass(now, sway);
      drawHero(now, sway, tms);

      if (hero) {
        const bT = clamp((tms - butterflyStart) / butterflyDuration, 0, 1);
        if (bT > 0) {
          drawButterfly(now, hero.x + 18, hero.baseY - hero.height * 0.86, bT, 1);
        }

        drawExtraButterflies(now);
      }

      const textT = clamp((tms - textStart) / textDuration, 0, 1);
      drawAnimeText(now, textT);

      if (Math.random() < 0.55) {
        spawnParticle(rnd(0, width), rnd(height * 0.35, height * 0.9), rnd(0.6, 1.2), 'rgba(140,255,220,0.95)');
      }

      drawParticles();

      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }
}
