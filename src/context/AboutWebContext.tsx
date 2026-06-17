import React, { createContext, useCallback, useContext, useState } from 'react';

type AboutWebContextType = {
  publicPath: string | null;
  showPublicPage: (path: string) => void;
  hidePublicPage: () => void;
};

const AboutWebContext = createContext<AboutWebContextType>({
  publicPath: null,
  showPublicPage: () => {},
  hidePublicPage: () => {},
});

export function AboutWebProvider({ children }: { children: React.ReactNode }) {
  const [publicPath, setPublicPath] = useState<string | null>(null);

  const showPublicPage = useCallback((path: string) => {
    setPublicPath(path);
  }, []);

  const hidePublicPage = useCallback(() => {
    setPublicPath(null);
  }, []);

  return (
    <AboutWebContext.Provider value={{ publicPath, showPublicPage, hidePublicPage }}>
      {children}
    </AboutWebContext.Provider>
  );
}

export function useAboutWeb() {
  return useContext(AboutWebContext);
}
