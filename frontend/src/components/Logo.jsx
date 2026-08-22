export default function Logo({ size = "normal" }) {
  const isLarge = size === "large";
  
  return (
    <div className={`cineverse-logo-container ${isLarge ? 'logo-large' : ''}`}>
      <div className="logo-badge">
        <svg 
          width={isLarge ? "36" : "28"} 
          height={isLarge ? "36" : "28"} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="logo-svg"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3e8ff" />
            </linearGradient>
            <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Glowing outer diamond badge */}
          <rect 
            x="4" 
            y="4" 
            width="32" 
            height="32" 
            rx="10" 
            fill="url(#logoGrad)" 
            filter="url(#badgeGlow)" 
          />
          
          {/* Inner dark core */}
          <rect 
            x="6" 
            y="6" 
            width="28" 
            height="28" 
            rx="8" 
            fill="#0f0c20" 
            fillOpacity="0.4" 
          />

          {/* Film reel holes / accent dots */}
          <circle cx="11" cy="11" r="1.8" fill="#ffffff" fillOpacity="0.8" />
          <circle cx="29" cy="11" r="1.8" fill="#ffffff" fillOpacity="0.8" />
          <circle cx="11" cy="29" r="1.8" fill="#ffffff" fillOpacity="0.8" />
          <circle cx="29" cy="29" r="1.8" fill="#ffffff" fillOpacity="0.8" />

          {/* Modern Play / Cinema Sparkle Triangle */}
          <path 
            d="M17 13.5L27 20L17 26.5V13.5Z" 
            fill="url(#playGrad)" 
          />
        </svg>
      </div>

      <span className="logo-text">
        CINE<span className="logo-highlight">VERSE</span>
      </span>
    </div>
  );
}
