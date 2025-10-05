export default function Logo({ size = 180 }) {
  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 400 140"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#6366F1' }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6' }} />
        </linearGradient>
        
        <linearGradient id="syncGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#8B5CF6' }} />
          <stop offset="100%" style={{ stopColor: '#EC4899' }} />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366F1' }} />
          <stop offset="100%" style={{ stopColor: '#EC4899' }} />
        </linearGradient>
        
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366F1' }} />
          <stop offset="50%" style={{ stopColor: '#8B5CF6' }} />
          <stop offset="100%" style={{ stopColor: '#EC4899' }} />
        </linearGradient>
        
        <filter id="textShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366F1" floodOpacity="0.2"/>
        </filter>
        
        <filter id="iconGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Modern icon - connection nodes */}
      <g filter="url(#iconGlow)">
        {/* Connection network */}
        <circle cx="35" cy="50" r="8" fill="url(#iconGrad)" opacity="0.9"/>
        <circle cx="70" cy="35" r="6" fill="url(#iconGrad)" opacity="0.8"/>
        <circle cx="70" cy="65" r="6" fill="url(#iconGrad)" opacity="0.8"/>
        <circle cx="55" cy="50" r="5" fill="url(#iconGrad)" opacity="0.7"/>
        
        {/* Connecting lines */}
        <line x1="35" y1="50" x2="55" y2="50" stroke="url(#accentGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <line x1="55" y1="50" x2="70" y2="35" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
        <line x1="55" y1="50" x2="70" y2="65" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      </g>
      
      {/* Decorative background shape */}
      <path
        d="M 15 25 Q 50 20, 85 25 L 85 75 Q 50 80, 15 75 Z"
        fill="url(#accentGrad)"
        opacity="0.08"
      />
      
      {/* Main text - Skill */}
      <text
        x="105"
        y="75"
        fontSize="56"
        fontWeight="800"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fill="url(#skillGrad)"
        letterSpacing="-1.5"
        filter="url(#textShadow)"
      >
        Skill
      </text>
      
      {/* Main text - Sync */}
      <text
        x="240"
        y="75"
        fontSize="56"
        fontWeight="800"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fill="url(#syncGrad)"
        letterSpacing="-1.5"
        filter="url(#textShadow)"
      >
        Sync
      </text>
      
      {/* Underline accent */}
      <line 
        x1="105" 
        y1="88" 
        x2="200" 
        y2="88" 
        stroke="url(#accentGrad)" 
        strokeWidth="4" 
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Tagline */}
      <text
        x="105"
        y="110"
        fontSize="13"
        fontWeight="600"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fill="#8B5CF6"
        letterSpacing="3"
        opacity="0.8"
      >
        CONNECT • LEARN • GROW
      </text>
    </svg>
  );
}