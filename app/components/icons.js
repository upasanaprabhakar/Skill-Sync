// app/utils/icons.js

export const UsersIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="r" values="4;4.5;4" dur="2s" repeatCount="indefinite" />
    </circle>
    <path 
      d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    >
      <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
    </path>
    <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="r" values="3;3.5;3" dur="2s" begin="0.5s" repeatCount="indefinite" />
    </circle>
    <path 
      d="M21 21v-2a4 4 0 00-3-3.87" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    >
      <animate attributeName="opacity" values="1;0.7;1" dur="2s" begin="0.5s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const SearchIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="8;8.5;8" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.8;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 21 21"
        to="10 21 21"
        dur="3s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const ChartIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 16l4-8 4 4 4-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="2s" repeatCount="indefinite" />
    </path>
    <circle cx="7" cy="16" r="2" fill="currentColor">
      <animate attributeName="cy" values="16;14;16" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="11" cy="8" r="2" fill="currentColor">
      <animate attributeName="cy" values="8;6;8" dur="2s" begin="0.3s" repeatCount="indefinite" />
    </circle>
    <circle cx="15" cy="12" r="2" fill="currentColor">
      <animate attributeName="cy" values="12;10;12" dur="2s" begin="0.6s" repeatCount="indefinite" />
    </circle>
    <circle cx="19" cy="6" r="2" fill="currentColor">
      <animate attributeName="cy" values="6;4;6" dur="2s" begin="0.9s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const BookIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2">
      <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
    </path>
    <path d="M8 6h8M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="3s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const TrophyIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
    </path>
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="1;0.6;1" dur="2s" begin="0.3s" repeatCount="indefinite" />
    </path>
    <path d="M6 9a6 6 0 0012 0V4H6v5z" stroke="currentColor" strokeWidth="2">
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1;1.05;1"
        dur="2s"
        additive="sum"
        repeatCount="indefinite"
      />
    </path>
    <path d="M10 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="1" fill="currentColor">
      <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const TargetIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="10;10.5;10" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="6;6.5;6" dur="2s" begin="0.3s" repeatCount="indefinite" />
    </circle>
    <circle cx="12" cy="12" r="2" fill="currentColor">
      <animate attributeName="r" values="2;2.5;2" dur="2s" begin="0.6s" repeatCount="indefinite" />
    </circle>
    <path d="M22 12h-2M4 12H2M12 2v2M12 20v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const CheckCircleIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="10;11;10" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="1.5s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const StarIcon = ({ className = "", size = 24, filled = false }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="10 12 12"
        dur="5s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const ArrowRightIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M5 12h14M12 5l7 7-7 7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0 0; 3 0; 0 0"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const Logo = ({ className = "", width = 180, height = 63 }) => {
  // Calculate size based on width prop for consistency
  const size = width;
  
  return (
    <svg 
      width={size} 
      height={size * 0.4} 
      viewBox="0 0 400 140" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="skillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        
        <linearGradient id="syncGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
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
      
      <g filter="url(#iconGlow)">
        <circle cx="35" cy="50" r="8" fill="url(#iconGrad)" opacity="0.9"/>
        <circle cx="70" cy="35" r="6" fill="url(#iconGrad)" opacity="0.8"/>
        <circle cx="70" cy="65" r="6" fill="url(#iconGrad)" opacity="0.8"/>
        <circle cx="55" cy="50" r="5" fill="url(#iconGrad)" opacity="0.7"/>
        
        <line x1="35" y1="50" x2="55" y2="50" stroke="url(#accentGrad)" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <line x1="55" y1="50" x2="70" y2="35" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
        <line x1="55" y1="50" x2="70" y2="65" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      </g>
      
      <path
        d="M 15 25 Q 50 20, 85 25 L 85 75 Q 50 80, 15 75 Z"
        fill="url(#accentGrad)"
        opacity="0.08"
      />
      
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
}; 

export const SparklesIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 2l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="currentColor">
      <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 6"
        to="360 12 6"
        dur="10s"
        repeatCount="indefinite"
      />
    </path>
    <path d="M19 14l1.5 2 2 1.5-2 1.5-1.5 2-1.5-2-2-1.5 2-1.5 1.5-2z" fill="currentColor" opacity="0.7">
      <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 20.5 17.5"
        to="360 20.5 17.5"
        dur="8s"
        repeatCount="indefinite"
      />
    </path>
    <path d="M5 18l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1 1-1.5z" fill="currentColor" opacity="0.5">
      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" begin="1s" repeatCount="indefinite" />
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 6.5 20.5"
        to="360 6.5 20.5"
        dur="12s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);


export const HeartIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="2s" repeatCount="indefinite" />
      <animateTransform
        attributeName="transform"
        type="scale"
        values="1;1.1;1"
        dur="2s"
        additive="sum"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const ZapIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="currentColor"
      opacity="0.9"
    >
      <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite" />
    </path>
    <path 
      d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    >
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="2s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const ShieldIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animate attributeName="opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite" />
    </path>
    <path 
      d="M12 2v20" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      opacity="0.5"
    >
      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite" />
    </path>
    <path 
      d="M9 12l2 2 4-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="2s" repeatCount="indefinite" />
    </path>
  </svg>
);

export const BriefcaseIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

export const MessageIcon = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate
        attributeName="opacity"
        values="1;0.7;1"
        dur="2s"
        repeatCount="indefinite"
      />
    </path>
    <path
      d="M7 8h10M7 12h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <animate
        attributeName="stroke-dasharray"
        values="0 100;100 0"
        dur="2s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const FilterIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M4 4h16M7 12h10M10 20h4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" repeatCount="indefinite"/>
    </path>
  </svg>
);

export const UserIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="4;4.5;4" dur="2s" repeatCount="indefinite"/>
    </circle>
    <path 
      d="M4 21v-2a8 8 0 0116 0v2" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    >
      <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
    </path>
  </svg>
);

export const XCircleIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="10;11;10" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" repeatCount="indefinite"/>
    </path>
  </svg>
);


export const SettingsIcon = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" values="3;3.5;3" dur="2s" repeatCount="indefinite" />
    </circle>
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="6s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

export const LogOutIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animateTransform attributeName="transform" type="translate" values="0 0; 2 0; 0 0" dur="1.5s" repeatCount="indefinite"/>
    </path>
    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19H5a2 2 0 01-2-2V7a2 2 0 012-2h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BellIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="1.5s" repeatCount="indefinite"/>
    </path>
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
    </path>
  </svg>
);


// Trending Up Icon
export const TrendingUpIcon = ({ className = "", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="stroke-dasharray" values="0 100; 100 0" dur="2s" repeatCount="indefinite" />
    </path>
    <path d="M21 7V13M21 7H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Award Icon
export const AwardIcon = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M15.5 14L17 21L12 18L7 21L8.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Clock Icon
export const ClockIcon = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const EditIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M4 21v-4l12-12 4 4-12 12H4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SaveIcon = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 21v-8H7v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



export const ArrowLeftIcon = ({ className = "", size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M19 12H5M12 19l-7-7 7-7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <animateTransform
        attributeName="transform"
        type="translate"
        values="0 0; -3 0; 0 0"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

