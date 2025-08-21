import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Plataforma Fenix Logo"
    role="img"
    {...props}
  >
    <title>Plataforma Fenix Logo</title>
    
    <text x="50" y="18" fontFamily="sans-serif" fontSize="12" textAnchor="middle" fontWeight="bold">PLATAFORMA</text>
    
    {/* Phoenix Bird */}
    <path d="M35,42 C40,28 60,28 65,42 C58,37 42,37 35,42 Z" />
    <path d="M50 40 Q35 45 25 65 L35 60 Q45 50 50 55 Z" />
    <path d="M50 40 Q65 45 75 65 L65 60 Q55 50 50 55 Z" />
    <path d="M46 53 L54 53 L54 70 L50 80 L46 70 Z" />
    
    <text x="50" y="92" fontFamily="sans-serif" fontSize="14" textAnchor="middle" fontWeight="bold">FENIX</text>
  </svg>
);

export default Logo;
