import React from 'react';

export const SHOW_SECTION_NUMBERS = true;

interface SectionNumberBadgeProps {
  id: string | number;
  label: string;
  className?: string;
}

export const SectionNumberBadge: React.FC<SectionNumberBadgeProps> = ({ id, label, className }) => {
  if (!SHOW_SECTION_NUMBERS) {
    return null;
  }

  const classes = [
    'inline-flex items-center gap-2 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span>Section {id}</span>
      <span className="normal-case text-slate-400">{label}</span>
    </div>
  );
};
