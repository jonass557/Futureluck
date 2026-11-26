import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl bg-white border border-slate-100 fl-card-shadow', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ className, variant = 'default', children }) {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    open: 'bg-emerald-500 text-white',
    closed: 'bg-slate-500 text-white',
    settled: 'bg-amber-400 text-[#001B6B]',
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-700',
    gold: 'bg-[#FFD200] text-[#001B6B]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
        styles[variant] || styles.default,
        className
      )}
    >
      {children}
    </span>
  );
}
