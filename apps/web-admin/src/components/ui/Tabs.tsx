import { type ReactNode, createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

// Context for tabs
interface TabsContextValue {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// Tabs Root
interface TabsProps {
    children: ReactNode;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
}

export function Tabs({ children, defaultValue, value, onValueChange, className = '' }: TabsProps) {
    // If value is provided, it's controlled. Otherwise use internal state.
    const isControlled = value !== undefined;
    const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || '');

    const activeTab = isControlled ? value : internalActiveTab;

    const setActiveTab = (tab: string) => {
        if (!isControlled) {
            setInternalActiveTab(tab);
        }
        if (onValueChange) {
            onValueChange(tab);
        }
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

// Tabs List
interface TabsListProps {
    children: ReactNode;
    className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
    return (
        <div
            role="tablist"
            className={cn(
                'flex gap-1 p-1 bg-muted/60 border border-border rounded-xl backdrop-blur-sm',
                className
            )}
        >
            {children}
        </div>
    );
}

// Tab Trigger
interface TabsTriggerProps {
    children: ReactNode;
    value: string;
    icon?: ReactNode;
    className?: string;
}

export function TabsTrigger({ children, value, icon, className = '' }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => setActiveTab(value)}
            className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none',
                isActive
                    ? 'bg-card text-foreground shadow-sm font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40',
                className
            )}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{children}</span>
        </button>
    );
}

// Tab Content
interface TabsContentProps {
    children: ReactNode;
    value: string;
    className?: string;
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.activeTab !== value) return null;

    return <div role="tabpanel" className={cn('mt-4', className)}>{children}</div>;
}
