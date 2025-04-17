import React from 'react';

interface RobiIconProps {
  className?: string;
  size?: number;
}

const RobiIcon: React.FC<RobiIconProps> = ({ className = '', size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Yellow antenna ball */}
      <circle cx="230" cy="50" r="30" fill="#F9D923" />
      
      {/* Purple antenna */}
      <path d="M230 80L230 120" stroke="#1D267D" strokeWidth="15" />
      
      {/* Teal Head */}
      <path d="M160 180C160 138.13 194.13 104 236 104H264C305.87 104 340 138.13 340 180V200C340 241.87 305.87 276 264 276H236C194.13 276 160 241.87 160 200V180Z" fill="#0EB1D2" />
      
      {/* Purple Eye Area */}
      <path d="M200 190C200 173.43 213.43 160 230 160H280C296.57 160 310 173.43 310 190V200C310 216.57 296.57 230 280 230H230C213.43 230 200 216.57 200 200V190Z" fill="#1D267D" />
      
      {/* Yellow Eyeglass */}
      <circle cx="230" cy="195" r="25" stroke="#F9D923" strokeWidth="10" />
      
      {/* Yellow Eyeglass Handle */}
      <path d="M200 195H170" stroke="#F9D923" strokeWidth="10" />
      
      {/* Yellow Eye */}
      <ellipse cx="230" cy="195" rx="10" ry="15" fill="#F9D923" />
      
      {/* Eye Wink */}
      <path d="M270 180L290 200" stroke="#F9D923" strokeWidth="5" />
      <path d="M290 180L270 200" stroke="#F9D923" strokeWidth="5" />
      
      {/* Teal Body */}
      <ellipse cx="250" cy="350" rx="100" ry="80" fill="#0EB1D2" />
      
      {/* Dark Blue bottom */}
      <ellipse cx="250" cy="400" rx="70" ry="30" fill="#1D267D" />
      
      {/* Teal Arm Left */}
      <path d="M150 300C120 300 100 280 100 250C100 220 120 200 150 200" stroke="#0EB1D2" strokeWidth="40" />
      
      {/* Dark Blue Hand Left */}
      <circle cx="150" cy="200" r="20" fill="#1D267D" />
      
      {/* Teal Arm Right */}
      <path d="M350 300C380 300 400 280 400 250C400 220 380 200 350 200" stroke="#0EB1D2" strokeWidth="40" />
      
      {/* Dark Blue Hand Right */}
      <circle cx="350" cy="200" r="20" fill="#1D267D" />
      
      {/* Yellow Buttons */}
      <rect x="300" y="340" width="30" height="10" fill="#F9D923" />
      <rect x="300" y="360" width="30" height="10" fill="#F9D923" />
      
      {/* Teal Feet */}
      <ellipse cx="220" cy="440" rx="30" ry="10" fill="#0EB1D2" />
      <ellipse cx="280" cy="440" rx="30" ry="10" fill="#0EB1D2" />
    </svg>
  );
};

export default RobiIcon;