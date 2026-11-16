import React from 'react';

const Badge = ({ status, children }) => {
  const normalized = (status || children || '').toString().toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['ACTIVE', 'PAID', 'APPROVED', 'COMPLETED', 'VALID'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (['PENDING', 'REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'UPCOMING'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (['EXPIRED', 'REJECTED', 'FAILED', 'REVOKED', 'INACTIVE', 'CANCELLED', 'INVALID'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (['MAINTENANCE', 'ON_LEAVE'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {children || status}
    </span>
  );
};

export default Badge;
