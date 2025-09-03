// components/ui/InteractiveBackground.tsx
"use client";
import React, { useEffect, useRef, PropsWithChildren } from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function InteractiveBackground({
  children,
  className = "",
}: PropsWithChildren<DivProps>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const target = useRef({ x: 50, y: 50 }); // 百分比
  const pos = useRef({ x: 50, y: 50 }); // 百分比
  const reduceMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reduceMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }
    // 初始化变量，避免 SSR 样式闪烁
    if (rootRef.current) {
      rootRef.current.style.setProperty("--spot-x", "50%");
      rootRef.current.style.setProperty("--spot-y", "50%");
    }
    const animate = () => {
      // 惯性插值，手感更柔和
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      if (rootRef.current) {
        rootRef.current.style.setProperty("--spot-x", `${pos.current.x}%`);
        rootRef.current.style.setProperty("--spot-y", `${pos.current.y}%`);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    if (!reduceMotion.current) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const el = e.currentTarget as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    target.current = { x, y };
    // 减动效下，直接设置为目标（不启用 rAF 动画）
    if (reduceMotion.current && rootRef.current) {
      rootRef.current.style.setProperty("--spot-x", `${x}%`);
      rootRef.current.style.setProperty("--spot-y", `${y}%`);
    }
  };

  const onPointerLeave = () => {
    target.current = { x: 50, y: 50 };
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`relative overflow-hidden ${className}`}
    >
      {/* 背景层：1) 跟随光晕 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(400px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(59,130,246, 0.8), transparent 60%)", // tailwind: blue-500
          filter: "blur(1px)",
        }}
      />
      {/* 背景层：2) 微网格，用 mask 只在光晕附近更明显 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[1.0] dark:opacity-[1.0]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          maskImage:
            "radial-gradient(1600px circle at var(--spot-x, 50%) var(--spot-y, 50%), black 35%, transparent 60%)",
          WebkitMaskImage:
            "radial-gradient(1200px circle at var(--spot-x, 50%) var(--spot-y, 50%), black 35%, transparent 60%)",
        }}
      />
      {/* 背景层：3) 慢速彩色光环（非常淡），用现成的 spin 关键帧 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-40 mix-blend-overlay"
        style={{
          opacity: 0.35,
          background:
            "conic-gradient(from 180deg at 50% 50%, #06b6d4, #a855f7, #22c55e, #06b6d4)", // cyan → violet → green
          animation: reduceMotion.current
            ? undefined
            : "spin 20s linear infinite",
          // 让边缘更柔，防止突兀的硬边
          maskImage:
            "radial-gradient(80% 80% at 50% 50%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(80% 80% at 50% 50%, black 60%, transparent 100%)",
        }}
      />
      {/* 内容层 */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
