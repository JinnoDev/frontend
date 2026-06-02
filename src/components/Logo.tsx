export default function Logo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="50" cy="50" r="44" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
      {/* Speed lines left */}
      <line x1="6" y1="38" x2="22" y2="38" stroke="#c9a84c" strokeWidth="1.5"/>
      <line x1="3" y1="44" x2="19" y2="44" stroke="#c9a84c" strokeWidth="1.5"/>
      <line x1="6" y1="50" x2="22" y2="50" stroke="#c9a84c" strokeWidth="1.5"/>
      {/* Speed lines right */}
      <line x1="94" y1="38" x2="78" y2="38" stroke="#c9a84c" strokeWidth="1.5"/>
      <line x1="97" y1="44" x2="81" y2="44" stroke="#c9a84c" strokeWidth="1.5"/>
      <line x1="94" y1="50" x2="78" y2="50" stroke="#c9a84c" strokeWidth="1.5"/>
      {/* Center gear/circle */}
      <circle cx="50" cy="50" r="14" stroke="#c9a84c" strokeWidth="1.5" fill="none"/>
      <circle cx="50" cy="50" r="5" fill="#c9a84c"/>
      {/* Orbital dots */}
      <circle cx="50" cy="22" r="3.5" fill="#c9a84c"/>
      <circle cx="74" cy="64" r="3.5" fill="#c9a84c"/>
      <circle cx="26" cy="64" r="3.5" fill="#c9a84c"/>
      {/* Orbital rings */}
      <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.5" transform="rotate(-30 50 50)"/>
      <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.5" transform="rotate(30 50 50)"/>
      <ellipse cx="50" cy="50" rx="30" ry="12" stroke="#c9a84c" strokeWidth="1" fill="none" opacity="0.5" transform="rotate(90 50 50)"/>
    </svg>
  );
}
