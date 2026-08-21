// Modal Component - Clean, Modern ERP UI Design (Matching Image 1 Left)
import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen?: boolean;
    opened?: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | 'half' | '60p' | '75p';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    opened,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}: ModalProps) {
    const isModalOpen = Boolean(isOpen ?? opened ?? false);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isModalOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen, onClose]);

    if (!isModalOpen) return null;

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
        half: 'w-full md:w-[50%] max-w-none',
        '60p': 'w-full md:w-[60%] max-w-none',
        '75p': 'w-full md:w-[75%] max-w-none',
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog Container */}
            <div
                className={`relative w-full ${sizes[size]} max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-card border border-border/80 shadow-2xl transition-all transform scale-100 z-10 overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border/60 bg-muted/20 shrink-0">
                        {title && (
                            <h3 className="text-base sm:text-lg font-semibold text-foreground truncate pr-2">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors ml-auto shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content Body with scroll */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
