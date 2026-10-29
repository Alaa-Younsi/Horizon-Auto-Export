/**
 * Static stand-in for the WebGL globe: shown while three.js loads, and instead of
 * it on constrained devices. Same composition as the live scene (a navy planet,
 * dotted land, gold lanes leaving Bucharest), so the swap is quiet.
 */
export function GlobePoster({ className, label }: { className?: string; label: string }) {
  return (
    <svg viewBox="0 0 800 800" className={className} role="img" aria-label={label}>
      <defs>
        <radialGradient id="gp-body" cx="40%" cy="32%" r="78%">
          <stop offset="0" stopColor="#0d2552" />
          <stop offset="0.8" stopColor="#040e24" />
          <stop offset="1" stopColor="#24447d" />
        </radialGradient>
        <radialGradient id="gp-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.86" stopColor="#3d5a92" stopOpacity="0.45" />
          <stop offset="1" stopColor="#3d5a92" stopOpacity="0" />
        </radialGradient>
        <pattern id="gp-dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.4" fill="#8e9cbd" fillOpacity="0.4" />
        </pattern>
        <clipPath id="gp-clip">
          <circle cx="400" cy="400" r="330" />
        </clipPath>
      </defs>
      <circle cx="400" cy="400" r="372" fill="url(#gp-halo)" />
      <circle cx="400" cy="400" r="330" fill="url(#gp-body)" />
      <g clipPath="url(#gp-clip)">
        <path
          d="M210 250 Q300 200 390 230 T560 240 L600 330 Q540 380 470 360 T330 390 Q260 360 220 320 Z"
          fill="url(#gp-dots)"
        />
        <path
          d="M300 420 Q360 400 420 430 L440 560 Q390 640 340 600 Q300 520 300 420 Z"
          fill="url(#gp-dots)"
        />
      </g>
      <g fill="none" strokeWidth="2" strokeLinecap="round">
        <path d="M470 330 Q400 250 300 290" stroke="#d5b67f" />
        <path d="M470 330 Q420 230 360 250" stroke="#c3cbe0" strokeOpacity="0.8" />
        <path d="M470 330 Q370 300 250 340" stroke="#bf9653" />
        <path d="M470 330 Q470 260 430 240" stroke="#d5b67f" strokeOpacity="0.8" />
      </g>
      <circle cx="470" cy="330" r="6" fill="#f3eadb" />
      <circle cx="470" cy="330" r="15" fill="none" stroke="#d5b67f" strokeOpacity="0.7" />
    </svg>
  );
}
