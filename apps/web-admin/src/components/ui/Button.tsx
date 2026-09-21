// Standardized Button Component - Pure Tailwind UI Design System
import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'cyan' | 'default';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    loading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97] select-none';

    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 focus:ring-primary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border focus:ring-ring shadow-sm',
        outline: 'border border-border bg-background/50 hover:bg-accent text-foreground focus:ring-border',
        ghost: 'bg-transparent hover:bg-muted/80 text-muted-foreground hover:text-foreground focus:ring-accent',
        danger: 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20 focus:ring-rose-600',
        success: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 focus:ring-emerald-600',
        warning: 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-md shadow-amber-500/20 focus:ring-amber-500',
        cyan: 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-md shadow-cyan-500/25 focus:ring-cyan-500',
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 focus:ring-primary',
    };

    const sizes = {
        xs: 'px-2.5 py-1 text-xs rounded-lg',
        sm: 'px-3.5 py-1.5 text-xs rounded-xl font-semibold',
        md: 'px-4.5 py-2.5 text-sm rounded-xl font-semibold',
        lg: 'px-6 py-3 text-base rounded-2xl font-bold',
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
                leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
            )}
            <span>{children}</span>
            {!loading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </button>
    );
}

