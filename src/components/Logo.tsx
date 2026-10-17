import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = false }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-extrabold',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        {/* Geometric constellation emblem */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 rotate-45 transform" />
        <div className="absolute inset-1 rounded-md bg-[#0B0D13] rotate-45 transform" />
        <div className="relative w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
      </div>
      <div className="flex flex-col">
        <div className={`tracking-tight text-white ${textSizes[size]} flex items-center leading-none`}>
          <span>My</span>
          <span className="text-violet-400">Space</span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] tracking-wider text-slate-400 uppercase font-medium mt-0.5">
            Personal Internet
          </span>
        )}
      </div>
    </div>
  );
};
