import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface NotificationAction {
    label: string;
    onClick: () => void;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    action?: NotificationAction;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
    isSuppressed: boolean;
    toggleSuppression: (value: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isSuppressed, setIsSuppressed] = useState(() => {
        const saved = localStorage.getItem('notifications-suppressed');
        return saved === 'true';
    });

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const toggleSuppression = useCallback((value: boolean) => {
        setIsSuppressed(value);
        localStorage.setItem('notifications-suppressed', String(value));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        if (isSuppressed) return;

        const id = Math.random().toString(36).substring(2, 9);
        const newNotification = { ...notification, id };

        setNotifications((prev) => [...prev, newNotification]);

        if (notification.duration !== 0) { // 0 means persistent
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
    }, [removeNotification]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, isSuppressed, toggleSuppression }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
