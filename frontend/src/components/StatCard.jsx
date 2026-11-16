import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: {
      bg: 'bg-brand-50',
      text: 'text-brand-600',
      border: 'border-brand-100',
      iconBg: 'bg-brand-500/10 text-brand-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-500/10 text-emerald-600'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      iconBg: 'bg-amber-500/10 text-amber-600'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      iconBg: 'bg-purple-500/10 text-purple-600'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      iconBg: 'bg-rose-500/10 text-rose-600'
    }
  };

  const current = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${current.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
          {trend && (
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
