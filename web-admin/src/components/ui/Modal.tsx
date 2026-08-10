// Modal Component - Clean, Modern ERP UI Design (Matching Image 1 Left)
import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | 'half' | '60p' | '75p';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}: ModalProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
        '3xl': 'max-w-6xl',
        '4xl': 'max-w-7xl',
        '5xl': 'w-full md:w-[85%] max-w-none',
        full: 'w-full md:w-[95%] max-w-none',
        half: 'w-full md:w-[65%] max-w-none',
        '60p': 'w-full md:w-[75%] max-w-none',
        '75p': 'w-full md:w-[75%] max-w-none',
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Content Box */}
            <div
                className={`
                    relative w-full ${sizes[size] || sizes.md}
                    bg-card rounded-2xl shadow-2xl border border-border/80 overflow-hidden
                    transform transition-all duration-200 ease-out
                    animate-in fade-in zoom-in-95 slide-in-from-bottom-2
                    flex flex-col max-h-[92vh]
                `}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="relative flex-none flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card">
                        {title && (
                            <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200 ml-auto flex items-center justify-center"
                                title="Tutup Modal"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="relative p-6 overflow-y-auto global-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
