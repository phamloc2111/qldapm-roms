import React from 'react';

export function RestaurantTableSvg({ className = 'w-7 h-7', strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >

      <path
        d="M5 12C5 10.8954 5.89543 10 7 10H25C26.1046 10 27 10.8954 27 12V14H5V12Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 14V24M25 14V24"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M11 17V23M15 17V23M11 20H15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M17 17V23M21 17V23M17 20H21"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GridTableGlyph({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 7L7 12H17L18 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12V17M16 12V17M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RomsLogo({ size = 'md', showText = true }) {
  const iconDimensions =
    size === 'lg' ? 'w-11 h-11' : size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textSize =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${iconDimensions} rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/25`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Muỗng bên trái */}
          <path
            d="M8 3C6.34315 3 5 4.567 5 6.5C5 8.1549 5.98404 9.54167 7.3 9.9035V21H8.7V9.9035C10.016 9.54167 11 8.1549 11 6.5C11 4.567 9.65685 3 8 3Z"
            fill="currentColor"
          />
          {/* Nĩa bên phải */}
          <path
            d="M15 3V8C15 9.10457 15.8954 10 17 10V21H18.5V10C19.6046 10 20.5 9.10457 20.5 8V3H19.2V7.2H18.3V3H17.2V7.2H16.3V3H15Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {showText && (
        <span className={`font-extrabold tracking-tight text-slate-900 ${textSize}`}>
          ROMS
        </span>
      )}
    </div>
  );
}

