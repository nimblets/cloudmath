import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { BufferHeaderContext } from '@/types/buffer';

const HeaderContext = createContext<BufferHeaderContext>({});

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [direction, setDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [maximized, setMaximized] = useState(false);

  return (
    <HeaderContext.Provider value={{ direction, maximized, setDirection, setMaximized }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeaderContext must be used within a HeaderProvider');
  }
  return context;
};