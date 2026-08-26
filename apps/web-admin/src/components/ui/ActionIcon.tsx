// Action Icon Button - Pure Tailwind UI Design System
import { type ReactNode, type ButtonHTMLAttributes } from 'react';

export interface ActionIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'default' | 'danger' | 'success' | 'warning' | 'info' | 'ghost';
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function ActionIcon({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    disabled,
    ...props
}: ActionIconProps) {
    const variants = {
        default: 'text-slate-300 bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700/60',
        danger: 'text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white border border-rose-500/20',
        success: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white border border-emerald-500/20',
        warning: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20',
        info: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/20',
        ghost: 'text-slate-400 bg-transparent hover:bg-slate-800 hover:text-slate-100',
    };

    const sizes = {
        xs: 'p-1 text-xs rounded-md min-w-[26px] min-h-[26px]',
        sm: 'p-1.5 text-xs rounded-lg min-w-[32px] min-h-[32px]',
        md: 'p-2 text-sm rounded-xl min-w-[38px] min-h-[38px]',
        lg: 'p-2.5 text-base rounded-2xl min-w-[44px] min-h-[44px]',
    };

    return (
        <button
            type="button"
            className={`
                inline-flex items-center justify-center shrink-0
                transition-all duration-200 active:scale-90 select-none
                disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
                focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
