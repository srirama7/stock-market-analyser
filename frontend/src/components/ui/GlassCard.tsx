import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  accent?: 'blue' | 'green' | 'red' | 'purple' | 'none';
  hover?: boolean;
  delay?: number;
}

const accentColors: Record<string, string> = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  red: 'from-red-500 to-rose-500',
  purple: 'from-purple-500 to-indigo-500',
};

export default function GlassCard({
  children,
  className = '',
  accent = 'none',
  hover = true,
  delay = 0,
}: Props) {
  const hasAccent = accent !== 'none' && accentColors[accent];

  return (
    <div
      className={`glass-card animate-fade-in-up ${hover ? 'hover-lift' : ''} relative overflow-hidden ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {hasAccent && (
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentColors[accent]}`}
        />
      )}
      {children}
    </div>
  );
}
