import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer min-h-[44px] px-5',
  {
    variants: {
      variant: {
        primary: 'bg-[#0033B3] hover:bg-[#002799] text-white shadow-md active:scale-[0.98]',
        gold: 'fl-gradient-gold text-[#001B6B] hover:brightness-95 shadow-md active:scale-[0.98]',
        white: 'bg-white text-[#0033B3] hover:bg-slate-50 shadow-sm border border-slate-200',
        outline: 'border-2 border-[#0033B3] text-[#0033B3] bg-transparent hover:bg-[#EEF4FF]',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
      },
      size: {
        sm: 'min-h-[36px] px-3.5 text-xs',
        md: 'min-h-[44px] px-5 text-sm',
        lg: 'min-h-[50px] px-7 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export function Button({ className, variant, size, type = 'button', ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
