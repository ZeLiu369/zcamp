// components/icons/MapPin.tsx
import React from "react";

export function RedMapPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="airbnbGrad"
          cx="50%"
          cy="30%"
          r="75%"
          gradientTransform="translate(0,-10%)"
        >
          <stop offset="0%" stopColor="#FF5A5F" />
          <stop offset="100%" stopColor="#D82C2E" />
        </radialGradient>
      </defs>
      <path
        d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
        fill="url(#airbnbGrad)"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  );
}

export function GreenMapPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="tripadvisorGrad"
          cx="50%"
          cy="30%"
          r="75%"
          gradientTransform="translate(0,-10%)"
        >
          <stop offset="0%" stopColor="#00A699" />
          <stop offset="100%" stopColor="#007C66" />
        </radialGradient>
      </defs>
      <path
        d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
        fill="url(#tripadvisorGrad)"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  );
}

export function SkyblueMapPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="skyblueGrad"
          cx="50%"
          cy="30%"
          r="75%"
          gradientTransform="translate(0, -10%)"
        >
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#00BFFF" />
        </radialGradient>
      </defs>
      <path
        d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
        fill="url(#skyblueGrad)"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  );
}

export function DeepBlueMapPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id="deepBlueGrad"
          cx="50%"
          cy="30%"
          r="75%"
          gradientTransform="translate(0, -10%)"
        >
          <stop offset="0%" stopColor="#00008B" /> {/* 深午夜蓝 */}
          <stop offset="100%" stopColor="#0000CD" /> {/* 经典蓝 */}
        </radialGradient>
      </defs>
      <path
        d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"
        fill="url(#deepBlueGrad)"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  );
}
