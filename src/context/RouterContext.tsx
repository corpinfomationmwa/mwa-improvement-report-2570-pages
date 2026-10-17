import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface RouteMatch {
  path: string;
  params: Record<string, string>;
}

interface RouterContextType {
  currentPath: string;
  params: Record<string, string>;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function normalizePath(rawPath: string): string {
  // Support both hash-based routing (/ #/dashboard) and normal pathname
  if (rawPath.startsWith('#/')) {
    return rawPath.replace('#', '') || '/dashboard';
  }
  const clean = rawPath.replace(/\/+$/, '') || '/';
  return clean === '/' ? '/dashboard' : clean;
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getInitialPath = (): string => {
    if (typeof window === 'undefined') return '/dashboard';
    if (window.location.hash.startsWith('#/')) {
      return normalizePath(window.location.hash);
    }
    return normalizePath(window.location.pathname);
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleLocationChange = () => {
      let path = window.location.pathname;
      if (window.location.hash.startsWith('#/')) {
        path = window.location.hash.replace('#', '');
      }
      const norm = normalizePath(path);
      setCurrentPath(norm);

      // Check for /reports/:id
      const reportIdMatch = norm.match(/^\/reports\/([^/]+)$/);
      if (reportIdMatch && reportIdMatch[1] !== 'new' && reportIdMatch[1] !== 'mine') {
        setParams({ id: reportIdMatch[1] });
      } else {
        setParams({});
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Initial check
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (to: string) => {
    const target = normalizePath(to);
    if (target === currentPath) return;

    // Use pushState and hash for optimal compatibility in iframe/sandboxed environments
    try {
      window.history.pushState({}, '', `#${target}`);
    } catch {
      window.location.hash = `#${target}`;
    }

    setCurrentPath(target);
    const reportIdMatch = target.match(/^\/reports\/([^/]+)$/);
    if (reportIdMatch && reportIdMatch[1] !== 'new' && reportIdMatch[1] !== 'mine') {
      setParams({ id: reportIdMatch[1] });
    } else {
      setParams({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ currentPath, params, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
