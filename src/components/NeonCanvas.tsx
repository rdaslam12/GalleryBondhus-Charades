/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

interface NeonCanvasProps {
  glowColor?: "pink" | "blue" | "green" | "purple";
  intensity?: "high" | "normal";
}

export default function NeonCanvas({ glowColor = "purple", intensity = "normal" }: NeonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Dynamic resize handler
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Particle class
    class Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      alphaGrowth: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.alphaGrowth = Math.random() * 0.01 + 0.003;

        // Colors centered around neon party themes
        const colors = [
          "rgba(255, 0, 127, ", // Neon Pink
          "rgba(0, 240, 255, ", // Neon Blue
          "rgba(57, 255, 20, ", // Neon Green
          "rgba(189, 0, 255, "  // Neon Purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color + this.alpha + ")";
        c.fill();
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Pulse alpha
        this.alpha += this.alphaGrowth;
        if (this.alpha > 0.7 || this.alpha < 0.1) {
          this.alphaGrowth = -this.alphaGrowth;
        }

        // Boundary wrap
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }
    }

    // Generate stable background particles
    const particleCount = intensity === "high" ? 45 : 25;
    const particlesArray: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particlesArray.push(new Particle());
    }

    // Flowing neon grids
    let offset = 0;
    
    // Choose tint overlays based on active glow state
    const resolveGlowTint = () => {
      switch (glowColor) {
        case "pink":
          return "rgba(255, 0, 127, 0.05)";
        case "blue":
          return "rgba(0, 240, 255, 0.05)";
        case "green":
          return "rgba(57, 255, 20, 0.05)";
        case "purple":
        default:
          return "rgba(189, 0, 255, 0.04)";
      }
    };

    // Render loop
    const render = () => {
      // Clear with dark subtle fade
      ctx.fillStyle = "rgba(7, 2, 18, 0.2)";
      ctx.fillRect(0, 0, width, height);

      // Simple grid lines for retro arcade vibe
      ctx.strokeStyle = resolveGlowTint();
      ctx.lineWidth = 1;
      
      const gridSize = 60;
      offset = (offset + 0.3) % gridSize;

      // Vertical lines
      for (let x = offset; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = offset; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw and update ambient particles
      particlesArray.forEach((part) => {
        part.update();
        part.draw(ctx);
      });

      // Draw two colossal glowing ambient nodes in the corners
      const gradient = ctx.createRadialGradient(
        width * 0.1, height * 0.2, 50,
        width * 0.1, height * 0.2, 350
      );
      gradient.addColorStop(0, resolveGlowTint());
      gradient.addColorStop(1, "rgba(7, 2, 18, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(width * 0.1, height * 0.2, 350, 0, Math.PI * 2);
      ctx.fill();

      const gradient2 = ctx.createRadialGradient(
        width * 0.9, height * 0.8, 50,
        width * 0.9, height * 0.8, 350
      );
      // Pink or green helper nodes
      gradient2.addColorStop(0, glowColor === "green" ? "rgba(57, 255, 20, 0.05)" : "rgba(255, 0, 127, 0.04)");
      gradient2.addColorStop(1, "rgba(7, 2, 18, 0)");
      ctx.fillStyle = gradient2;
      ctx.beginPath();
      ctx.arc(width * 0.9, height * 0.8, 350, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [glowColor, intensity]);

  return (
    <canvas
      id="neon-party-canvas"
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}
