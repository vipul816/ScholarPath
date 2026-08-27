import React from 'react';

const ScholarPathLogo = ({ className = "w-10 h-10" }) => (
    <svg 
        viewBox="0 0 100 100" 
        className={`scholar-path-logo ${className}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Deep Navy Background per request */}
        <rect width="100" height="100" rx="20" fill="#0A192F" />

        {/* Isometric Cube Group */}
        <g transform="translate(0, 4)">
            {/* Left Dark Cream Face */}
            <polygon points="15,45 50,62.5 50,90 15,72.5" fill="#CEC6A8" />
            
            {/* Right Medium Cream Face */}
            <polygon points="50,62.5 85,45 85,72.5 50,90" fill="#E8E1C2" />
            
            {/* Top Light Cream Face */}
            <polygon points="15,45 50,62.5 85,45 50,27.5" fill="#FAF7EB" />

            {/* --- Nested channels forming open book --- */}
            {/* Left Page channel/cutout */}
            <polygon points="25,45 44,54.5 44,37.5 25,28" fill="#DCD3B3" />
            {/* Left Page Inner Shadow */}
            <polygon points="25,45 44,54.5 44,50 25,40.5" fill="#BCB393" />

            {/* Right Page channel/cutout */}
            <polygon points="75,45 56,54.5 56,37.5 75,28" fill="#BCB393" />
            {/* Right Page Inner Highlight */}
            <polygon points="75,45 56,54.5 56,50 75,40.5" fill="#E8E1C2" />

            {/* Center abstract Spine */}
            <polygon points="48,60 48,27.5 52,25.5 52,61.5" fill="#A89F7D" />

            {/* Geometric Lines for depth optimization */}
            <line x1="50" y1="62.5" x2="50" y2="90" stroke="#FAF7EB" strokeWidth="0.75" opacity="0.5"/>
            <line x1="15" y1="45" x2="50" y2="62.5" stroke="#FAF7EB" strokeWidth="0.75" opacity="0.5"/>
            <line x1="85" y1="45" x2="50" y2="62.5" stroke="#FAF7EB" strokeWidth="0.75" opacity="0.5"/>
        </g>
    </svg>
);

export default ScholarPathLogo;