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
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-flower-glory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flower-glory.component.html',
  styleUrls: ['./flower-glory.component.scss'],
})
export class FlowerGloryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gardenCanvas', { static: true })
  private gardenCanvasRef?: ElementRef<HTMLCanvasElement>;

  private animationFrameId: number | null = null;
  private removeListeners: Array<() => void> = [];

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => this.startAnimation());
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
  }

  private startAnimation(): void {
    const canvas = this.gardenCanvasRef?.nativeElement;
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
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
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
    }

    interface Flower {
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

    interface Grass {
      x: number;
      y: number;
      h: number;
      w: number;
      ph: number;
      a: number;
    }

    const stars: Star[] = [];
    const particles: Particle[] = [];
    const flowers: Flower[] = [];
    const grass: Grass[] = [];

    const pMax = 140;
    const grassCount = 140;

    const groundY = () => height * rnd(0.72, 0.88);

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
    };

    const makeStars = () => {
      stars.length = 0;
      const count = Math.max(80, Math.floor((width * height) / 18000));
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.55,
          r: rnd(0.6, 1.6),
          tw: rnd(0.8, 1.8),
          ph: rnd(0, Math.PI * 2),
          a: rnd(0.15, 0.65),
        });
      }
    };

    const makeGrass = () => {
      grass.length = 0;
      for (let i = 0; i < grassCount; i += 1) {
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

    const spawnParticle = (x: number, y: number, boost = 1) => {
      particles.push({
        x,
        y,
        vx: rnd(-0.22, 0.22) * boost,
        vy: rnd(-0.55, -0.15) * boost,
        r: rnd(1.0, 2.2),
        life: rnd(70, 140),
        t: 0,
        a: rnd(0.25, 0.8),
      });

      if (particles.length > pMax) {
        particles.shift();
      }
    };

    const addFlower = (x = rnd(width * 0.12, width * 0.88)) => {
      const baseY = groundY();
      const flowerHeight = rnd(height * 0.1, height * 0.26);
      flowers.push({
        x,
        baseY,
        height: flowerHeight,
        stemW: rnd(2.0, 3.6),
        bloomSize: rnd(18, 34),
        swaySeed: rnd(0, 999),
        grow: 0,
        bloom: 0,
        phase: rnd(0, Math.PI * 2),
        leafCount: Math.floor(rnd(2, 5)),
        leafAngle: rnd(0.3, 0.9),
        tw: rnd(0.8, 1.6),
      });
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

    const drawStem = (flower: Flower, t: number, sway: number) => {
      const topY = flower.baseY - flower.height * t;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const grad = ctx.createLinearGradient(flower.x, flower.baseY, flower.x + sway * 20, topY);
      grad.addColorStop(0, 'rgba(20,160,130,0.85)');
      grad.addColorStop(1, 'rgba(60,230,210,0.95)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = flower.stemW;
      ctx.shadowColor = 'rgba(90,255,240,0.35)';
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

    const drawLeaves = (flower: Flower, t: number, sway: number) => {
      const topY = flower.baseY - flower.height * t;
      const base = { x: flower.x, y: flower.baseY };
      const tip = { x: flower.x + sway * 10, y: topY };

      for (let i = 0; i < flower.leafCount; i += 1) {
        const lt = clamp((t - 0.15 - i * 0.08) / 0.65, 0, 1);
        const p = easeOutCubic(lt);
        const along = lerp(0.25, 0.78, i / (flower.leafCount - 1 || 1));
        const sx = lerp(base.x, tip.x, along);
        const sy = lerp(base.y, tip.y, along);

        const dir = i % 2 === 0 ? -1 : 1;
        const ang = dir * (flower.leafAngle + i * 0.12) + sway * 0.35;
        const len = lerp(10, 26, p) * rnd(0.9, 1.1);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.strokeStyle = `rgba(60,230,200,${0.22 + 0.25 * p})`;
        ctx.lineWidth = lerp(1.0, 2.0, p);
        ctx.shadowColor = 'rgba(100,255,240,0.35)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -len * 0.35, len, 0);
        ctx.stroke();

        glowCircle(len, 0, lerp(0.8, 1.6, p), 'rgba(140,255,240,0.75)', 0.45);
        ctx.restore();
      }
    };

    const drawBloom = (
      flower: Flower,
      top: { topX: number; topY: number },
      bloomT: number,
      time: number,
    ) => {
      const b = easeInOutSine(bloomT);
      const size = flower.bloomSize * b;

      glowCircle(top.topX, top.topY, size * 0.35, 'rgba(120,255,255,0.55)', 0.55);
      glowCircle(top.topX, top.topY, size * 0.2, 'rgba(120,255,200,0.45)', 0.55);

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

        ctx.fillStyle = `rgba(200,255,250,${0.35 + 0.35 * b})`;
        ctx.shadowColor = 'rgba(120,255,255,0.55)';
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(petLen * 0.35, -petWid, petLen, 0);
        ctx.quadraticCurveTo(petLen * 0.35, petWid, 0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.shadowColor = 'rgba(120,255,200,0.65)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = `rgba(90,240,220,${0.55 + 0.35 * b})`;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() < 0.12 * b) {
        for (let i = 0; i < 2; i += 1) {
          spawnParticle(top.topX + rnd(-8, 8), top.topY + rnd(-6, 6), 1);
        }
      }

      ctx.restore();
    };

    const drawGrass = (time: number, sway: number) => {
      for (const g of grass) {
        const s = Math.sin(time * 0.0015 + g.ph) * 0.6 + sway * 0.35;
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(s * 0.15);

        ctx.strokeStyle = `rgba(60,230,200,${g.a})`;
        ctx.lineWidth = g.w;
        ctx.shadowColor = 'rgba(100,255,240,0.25)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(g.h * 0.25, -g.h * 0.55, 0, -g.h);
        ctx.stroke();

        ctx.restore();
      }
    };

    const drawStars = (time: number) => {
      for (const star of stars) {
        const tw = (Math.sin(time * 0.001 * star.tw + star.ph) + 1) / 2;
        const alpha = star.a * (0.45 + 0.55 * tw);
        glowCircle(star.x, star.y, star.r, 'rgba(220,255,255,0.95)', alpha);
      }
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
        glowCircle(p.x, p.y, p.r, 'rgba(140,255,240,0.9)', alpha);

        if (p.t >= p.life) {
          particles.splice(i, 1);
        }
      }
    };

    const ambientParticles = () => {
      if (Math.random() < 0.55) {
        const x = rnd(0, width);
        const y = rnd(height * 0.35, height * 0.9);
        spawnParticle(x, y, rnd(0.6, 1.2));
      }
    };

    let mouseX = width / 2;
    let mouseY = height / 2;

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onClick = (event: MouseEvent) => {
      for (let i = 0; i < 4; i += 1) {
        addFlower(event.clientX + rnd(-40, 40));
      }
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

    addWindowListener('resize', resize);
    addWindowListener('pointermove', onPointerMove);
    addWindowListener('click', onClick);

    resize();

    const initialFlowers = 18;
    for (let i = 0; i < initialFlowers; i += 1) {
      addFlower(rnd(width * 0.08, width * 0.92));
    }

    let last = performance.now();
    const frame = (now: number) => {
      const dt = now - last;
      last = now;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(width * 0.5, height * 0.8, 40, width * 0.5, height * 0.8, Math.max(width, height));
      bg.addColorStop(0, 'rgba(20,40,40,0.35)');
      bg.addColorStop(0.45, 'rgba(8,12,18,0.55)');
      bg.addColorStop(1, 'rgba(2,3,6,1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const sway = clamp((mouseX / width - 0.5) * 2, -1, 1);
      const depthSway = clamp((mouseY / height - 0.5) * 2, -1, 1);

      drawStars(now);
      drawGrass(now, sway + depthSway * 0.1);

      flowers.sort((a, b) => a.baseY - b.baseY);
      for (const flower of flowers) {
        const growSpeed = 0.00018 + flower.tw * 0.00002;
        flower.grow = clamp(flower.grow + dt * growSpeed, 0, 1);

        const bloomStart = 0.55;
        flower.bloom = clamp((flower.grow - bloomStart) / (1 - bloomStart), 0, 1);

        const wind = Math.sin(now * 0.0012 + flower.swaySeed) * 0.55 + sway * 0.9;
        const stem = drawStem(flower, easeOutCubic(flower.grow), wind);
        drawLeaves(flower, flower.grow, wind);

        if (flower.bloom > 0) {
          drawBloom(flower, stem, flower.bloom, now);
        }

        if (Math.random() < 0.06) {
          glowCircle(flower.x + rnd(-3, 3), flower.baseY + rnd(-2, 2), rnd(0.7, 1.4), 'rgba(120,255,220,0.65)', 0.25);
        }
      }

      ambientParticles();
      drawParticles();

      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }
}
