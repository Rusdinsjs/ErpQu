import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface CurrencyInputProps {
    value?: number | null;
    onChange: (value: number) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    helperText?: string;
    min?: number;
    max?: number;
    currencyPrefix?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    label,
    placeholder = '0',
    disabled = false,
    required = false,
    error,
    helperText,
    min,
    max,
    currencyPrefix = 'Rp',
    className = '',
    size = 'md',
}) => {
    // Format number to IDR string with thousand dots
    const formatDisplay = (val: number | null | undefined): string => {
        if (val === null || val === undefined || isNaN(val)) return '';
        if (val === 0) return '0';
        return Math.round(val).toLocaleString('id-ID');
    };

    const [displayVal, setDisplayVal] = useState<string>(formatDisplay(value));
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external value changes
    useEffect(() => {
        setDisplayVal(formatDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawText = e.target.value;
        // Keep only digits
        const cleanDigits = rawText.replace(/\D/g, '');

        if (!cleanDigits) {
            setDisplayVal('');
            onChange(0);
            return;
        }

        const numVal = parseInt(cleanDigits, 10);
        
        if (max !== undefined && numVal > max) {
            return; // Enforce max limit
        }

        setDisplayVal(numVal.toLocaleString('id-ID'));
        onChange(numVal);
    };

    const handleClear = () => {
        setDisplayVal('');
        onChange(0);
        inputRef.current?.focus();
    };

    const sizeClasses = {
        sm: 'py-1.5 text-xs',
        md: 'py-2 text-sm',
        lg: 'py-3 text-base',
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="block text-xs font-semibold text-foreground/90 uppercase tracking-wider">
                    {label} {required && <span className="text-rose-500 font-bold">*</span>}
                </label>
            )}

            <div className="relative flex items-center rounded-xl border border-border/60 bg-muted/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                {/* Prefix Badge */}
                <div className="flex items-center justify-center px-3 py-2 text-xs font-bold text-muted-foreground bg-muted/80 rounded-l-xl border-r border-border/40 select-none">
                    {currencyPrefix}
                </div>

                {/* Main Input */}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    disabled={disabled}
                    placeholder={placeholder}
                    value={displayVal}
                    onChange={handleChange}
                    className={`w-full px-3 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-mono font-medium ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />

                {/* Clear Button */}
                {displayVal && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1.5 mr-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                        title="Hapus Nilai"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Error or Helper Message */}
            {error ? (
                <p className="flex items-center gap-1 text-xs text-rose-400 font-medium animate-in fade-in">
                    <AlertCircle size={12} />
                    {error}
                </p>
            ) : helperText ? (
                <p className="text-[11px] text-muted-foreground px-1">{helperText}</p>
            ) : null}
        </div>
    );
};
