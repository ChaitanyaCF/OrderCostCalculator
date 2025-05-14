import React from 'react';

// A simple SVG component that renders the CFT logo (red fish)
const CFTLogo: React.FC<{ width?: string, height?: string, className?: string }> = ({ 
  width = '100px', 
  height = 'auto',
  className
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 300 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Red fish logo */}
      <g transform="translate(80, 70)">
        <path 
          d="M26.5,0 L0,26.5 L11.5,38 L23,26.5 L35.5,38 L47,26.5 L71,50.5 L83,38 L71,26.5 L83,14 L71,2 L58.5,14 L47,2 L35.5,14 L26.5,0 Z" 
          fill="#e43131"
        />
        <circle cx="47" cy="20" r="6" fill="#e43131" />
      </g>
    </svg>
  );
};

export default CFTLogo;