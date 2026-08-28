import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-8 text-primary' }) => {
  return (
    <svg
      viewBox="0 0 120 90"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Propeller */}
      <ellipse cx="22" cy="29" rx="18" ry="2.2" />

      {/* Right Propeller */}
      <ellipse cx="98" cy="29" rx="18" ry="2.2" />

      {/* Left Motor Shaft */}
      <rect x="20" y="30" width="4" height="6" rx="1" />

      {/* Right Motor Shaft */}
      <rect x="96" y="30" width="4" height="6" rx="1" />

      {/* Left Leg (Landing Gear) */}
      <path
        d="M 45 43 Q 32 48 30 68"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right Leg (Landing Gear) */}
      <path
        d="M 75 43 Q 88 48 90 68"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left Arm */}
      <path
        d="M 42 41 C 32 41 24 38 22 35"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right Arm */}
      <path
        d="M 78 41 C 88 41 96 38 98 35"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Central Drone Body */}
      <ellipse cx="60" cy="41" rx="19" ry="8.5" />

      {/* Camera Gimbal Mount */}
      <rect x="58" y="47" width="4" height="6" />

      {/* Camera Body */}
      <rect x="47" y="52" width="26" height="17" rx="3.5" />

      {/* Camera Lens White Ring */}
      <circle cx="60" cy="60.5" r="4.5" stroke="white" strokeWidth="1.8" fill="none" />

      {/* Camera Flash/LED indicator */}
      <circle cx="68" cy="56" r="1.1" fill="white" />
    </svg>
  );
};
