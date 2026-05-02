"use client";
import { useEffect, useRef } from "react";
import styles from "./ParticleField.module.css";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  isHexagon: boolean;
  phase: number;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    const getParticleCount = () => {
      const area = width * height;
      return Math.min(120, Math.max(35, Math.floor(area / 5000)));
    };

    const generateHexagonPositions = (count: number): Array<[number, number]> => {
      const positions: Array<[number, number]> = [];
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;

      const outerCount = Math.floor(count * 0.4);
      for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2 - Math.PI / 2;
        const sector = Math.PI / 3;
        const sectorIndex = Math.floor((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2) / sector);
        const sectorStart = sectorIndex * sector - Math.PI / 2;
        const t = ((angle - sectorStart) % sector + sector) % sector / sector;
        const interpAngle = sectorStart + t * sector;
        positions.push([
          centerX + Math.cos(interpAngle) * radius,
          centerY + Math.sin(interpAngle) * radius,
        ]);
      }

      const midCount = Math.floor(count * 0.35);
      for (let i = 0; i < midCount; i++) {
        const angle = (i / midCount) * Math.PI * 2;
        const r = radius * 0.6 + Math.random() * radius * 0.1;
        positions.push([
          centerX + Math.cos(angle) * r,
          centerY + Math.sin(angle) * r,
        ]);
      }

      const centerCount = count - outerCount - midCount;
      for (let i = 0; i < centerCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius * 0.35;
        positions.push([
          centerX + Math.cos(angle) * r,
          centerY + Math.sin(angle) * r,
        ]);
      }

      return positions;
    };

    const particleCount = getParticleCount();
    const basePositions = generateHexagonPositions(particleCount);
    const particles: Particle[] = basePositions.map(([bx, by], i) => ({
      x: Math.random() * width,
      y: Math.random() < 0.5 ? -50 : height + 50,
      baseX: bx,
      baseY: by,
      vx: 0,
      vy: 0,
      radius: 1.2 + Math.random() * 1.3,
      isHexagon: i < particleCount * 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    const mouse = { x: -9999, y: -9999, active: false };
    if (!isMobile) {
      container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      });
      container.addEventListener("mouseleave", () => {
        mouse.active = false;
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    let formationProgress = 0;
    const FORMATION_DURATION = 90;

    let rotation = 0;
    let isVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    let pulseTimer = 0;
    const PULSE_INTERVAL = 600;
    let activePulse = -1;

    let raf = 0;
    let frame = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);
      frame++;

      if (formationProgress < FORMATION_DURATION) formationProgress++;
      const formationT = Math.min(1, formationProgress / FORMATION_DURATION);
      const formationEase = 1 - Math.pow(1 - formationT, 4);

      if (isMobile) {
        rotation += (Math.PI * 2) / (60 * 60);
        pulseTimer++;
        if (pulseTimer >= PULSE_INTERVAL) {
          pulseTimer = 0;
          activePulse = frame;
        }
      }

      const centerX = width / 2;
      const centerY = height / 2;

      particles.forEach((p) => {
        let targetX = p.baseX;
        let targetY = p.baseY;

        if (isMobile && rotation !== 0) {
          const dx = p.baseX - centerX;
          const dy = p.baseY - centerY;
          targetX = centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation);
          targetY = centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation);
        }

        const float = Math.sin(frame * 0.01 + p.phase) * 2;
        targetY += float;

        if (formationT < 1) {
          p.x = p.x + (targetX - p.x) * 0.05 * (formationEase * 1.5);
          p.y = p.y + (targetY - p.y) * 0.05 * (formationEase * 1.5);
        } else {
          if (!isMobile && mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const REPEL_RADIUS = 110;
            if (dist < REPEL_RADIUS && dist > 0) {
              const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * 2.2;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          if (isMobile && activePulse > 0) {
            const elapsed = frame - activePulse;
            if (elapsed < 60) {
              const pulseStrength = (1 - elapsed / 60) * 0.6;
              const dx = p.x - centerX;
              const dy = p.y - centerY;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              p.vx += (dx / dist) * pulseStrength;
              p.vy += (dy / dist) * pulseStrength;
            } else {
              activePulse = -1;
            }
          }

          const dxBase = targetX - p.x;
          const dyBase = targetY - p.y;
          p.vx += dxBase * 0.012;
          p.vy += dyBase * 0.012;
          p.vx *= 0.88;
          p.vy *= 0.88;
          p.x += p.vx;
          p.y += p.vy;
        }
      });

      const MAX_DIST = 90;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(27, 47, 110, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 5);
        glowGradient.addColorStop(0, "rgba(27, 47, 110, 0.55)");
        glowGradient.addColorStop(1, "rgba(27, 47, 110, 0)");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1B2F6E";
        if (p.isHexagon) {
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const angle = (k / 6) * Math.PI * 2 - Math.PI / 2;
            const x = p.x + Math.cos(angle) * p.radius * 1.4;
            const y = p.y + Math.sin(angle) * p.radius * 1.4;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
