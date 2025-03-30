import React from 'react';

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  // Additional props can be added here
}

export function LogoIcon({ className, ...props }: LogoIconProps) {
  return (
    <svg 
      viewBox="0 0 43.3492 43.3492"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="m20.9107 43.3492c-4.4841-.6874-8.3047-4.5252-6.4541-12.6705 1.8744 2.7178 2.556 1.282 2.556 1.282.1136-9.2306 7.1001-11.5383 7.1001-11.5383-2.0906 4.7186 2.0464 4.849 2.3288 10.205 1.7041-.8718 2.3289-1.8461 2.3289-1.8461 5.6422 7.5864 1.459 13.0147-3.8784 14.4074 8.5487-1.0965 15.8986-8.3355 12.3784-23.8296-3.5381 5.1302-4.8246 2.42-4.8246 2.42-.2144-17.4232-13.4017-21.7791-13.4017-21.7791 3.9462 8.9067-3.8627 9.1527-4.3959 19.2624-3.2164-1.6456-4.3957-3.4847-4.3957-3.4847-11.8065 15.8754-.8211 26.7455 10.6582 27.5715z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
} 