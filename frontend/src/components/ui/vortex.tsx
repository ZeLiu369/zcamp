// In src/components/ui/vortex.tsx

"use client";
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils"; // Assuming you have a utility for classnames
import { motion } from "framer-motion";

// Helper function to create a circle on the canvas
const createCircle = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: boolean,
  color: string
) => {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI, false);
  if (fill) {
    context.fillStyle = color;
    context.fill();
  } else {
    context.strokeStyle = color;
    context.stroke();
  }
};

// Main Vortex component
export const Vortex = ({
  children,
  className,
  containerClassName,
  particleCount = 700,
  // rangeY = 100,
  baseHue = 220,
  baseSpeed = 0.05,
  rangeSpeed = 0.1,
  baseRadius = 1,
  rangeRadius = 2,
  backgroundColor = "black",
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlePool = useRef<unknown[]>([]);
  const particleCountRef = useRef(particleCount);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    // const screenCenter = { x: w / 2, y: h / 2 };

    const resize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      // screenCenter = { x: w / 2, y: h / 2 };
    };

    window.addEventListener("resize", resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      if (container) {
        const rect = container.getBoundingClientRect();
        mousePosition.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };
    container.addEventListener("mousemove", handleMouseMove);

    class Particle {
      // ... (Particle class implementation - a bit long, but copy it verbatim)
      private x: number;
      private y: number;
      private angle: number;
      private speed: number;
      private radius: number;
      private color: string;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.angle = Math.random() * 2 * Math.PI;
        this.speed = baseSpeed + Math.random() * rangeSpeed;
        this.radius = baseRadius + Math.random() * rangeRadius;
        const hue = baseHue + Math.random() * 50;
        this.color = `hsla(${hue}, 100%, 60%, 0.8)`;
      }

      private update() {
        const dx = this.x - mousePosition.current.x;
        const dy = this.y - mousePosition.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToMouse = Math.atan2(dy, dx);
        const newAngle = angleToMouse + Math.PI; // Move away from the mouse
        const influence = Math.max(0, 100 - dist) / 100;
        this.angle = this.angle * (1 - influence) + newAngle * influence;

        this.x += Math.cos(this.angle) * this.speed * 5;
        this.y += Math.sin(this.angle) * this.speed * 5;

        // Boundary checks
        if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) {
          this.x = Math.random() * w;
          this.y = Math.random() * h;
        }
      }

      public draw(context: CanvasRenderingContext2D) {
        this.update();
        createCircle(context, this.x, this.y, this.radius, true, this.color);
      }
    }

    const initParticles = () => {
      particlePool.current = [];
      for (let i = 0; i < particleCountRef.current; i++) {
        particlePool.current.push(new Particle());
      }
    };
    initParticles();

    let animationFrameId: number;

    const animate = () => {
      context.clearRect(0, 0, w, h);
      for (const particle of particlePool.current) {
        particle.draw(context);
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className={cn("relative h-full w-full", containerClassName)}
      ref={containerRef}
    >
      <motion.div
        className={cn("absolute inset-0 z-0 h-full w-full", backgroundColor)}
      ></motion.div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 h-full w-full"
      ></canvas>
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};
