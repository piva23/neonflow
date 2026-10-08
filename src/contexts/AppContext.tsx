import React, { createContext, useContext, useState } from 'react';
import { AppNotification } from '../types';

interface AppContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type: AppNotification['type']) => void;
  clearNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n-1',
      title: 'Boas-vindas!',
      message: 'Comece cadastrando suas músicas favoritas via link do YouTube.',
      type: 'info',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'n-2',
      title: 'Música em Família',
      message: 'Lucas adicionou "Can\'t Stop the Feeling!" na playlist Viagem em Família!',
      type: 'gamification',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    }
  ]);

  const addNotification = (title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: `n-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        isMobileSidebarOpen,
        setMobileSidebarOpen,
        notifications,
        addNotification,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
};
