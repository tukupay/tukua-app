import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { buildClientNavigateScript } from '../lib/webviewAuth';
import { MainTabParamList } from '../navigation/types';

type WebViewHandle = {
  path: string;
  ref: React.RefObject<WebView | null>;
};

type TabJumper = (tab: keyof MainTabParamList) => void;

type WebViewControlContextType = {
  activeTabPath: string;
  setActiveTabPath: (path: string) => void;
  register: (path: string, ref: React.RefObject<WebView | null>) => () => void;
  registerTabJumper: (jumper: TabJumper) => () => void;
  navigate: (webPath: string, preferTabPath?: string) => void;
  sendChatCommand: (action: string, payload?: Record<string, unknown>) => void;
  consumePendingRoute: (tabPath: string) => string | undefined;
};

const TAB_WEB_PATHS: Partial<Record<keyof MainTabParamList, string>> = {
  Chat: '/chat',
  Courses: '/courses',
  Profile: '/profile',
};

const PATH_TO_TAB: Record<string, keyof MainTabParamList> = {
  '/chat': 'Chat',
  '/courses': 'Courses',
  '/profile': 'Profile',
};

function resolveTabPath(webPath: string, preferTabPath?: string): string {
  if (preferTabPath) return preferTabPath;
  if (webPath.startsWith('/courses')) return '/courses';
  if (webPath.startsWith('/profile')) return '/profile';
  return '/chat';
}

function tabNameForPath(tabPath: string): keyof MainTabParamList {
  return PATH_TO_TAB[tabPath] ?? 'Chat';
}

const WebViewControlContext = createContext<WebViewControlContextType>({
  activeTabPath: '/chat',
  setActiveTabPath: () => {},
  register: () => () => {},
  registerTabJumper: () => () => {},
  navigate: () => {},
  sendChatCommand: () => {},
  consumePendingRoute: () => undefined,
});

export function WebViewControlProvider({ children }: { children: React.ReactNode }) {
  const handlesRef = useRef<Map<string, WebViewHandle>>(new Map());
  const pendingRoutesRef = useRef<Map<string, string>>(new Map());
  const tabJumperRef = useRef<TabJumper>(() => {});
  const [activeTabPath, setActiveTabPath] = useState('/chat');

  const register = useCallback((path: string, ref: React.RefObject<WebView | null>) => {
    handlesRef.current.set(path, { path, ref });
    return () => {
      handlesRef.current.delete(path);
    };
  }, []);

  const registerTabJumper = useCallback((jumper: TabJumper) => {
    tabJumperRef.current = jumper;
    return () => {
      tabJumperRef.current = () => {};
    };
  }, []);

  const inject = useCallback((tabPath: string, script: string) => {
    const handle = handlesRef.current.get(tabPath);
    handle?.ref.current?.injectJavaScript(`${script}\ntrue;`);
    return !!handle?.ref.current;
  }, []);

  const injectWithRetry = useCallback(
    (tabPath: string, script: string, attempts = 20, delayMs = 200) => {
      const attempt = (left: number) => {
        if (inject(tabPath, script) || left <= 0) return;
        setTimeout(() => attempt(left - 1), delayMs);
      };
      attempt(attempts);
    },
    [inject],
  );

  const focusTab = useCallback((tabPath: string) => {
    const tabName = tabNameForPath(tabPath);
    setActiveTabPath(tabPath);
    tabJumperRef.current(tabName);
  }, []);

  const consumePendingRoute = useCallback((tabPath: string) => {
    const pending = pendingRoutesRef.current.get(tabPath);
    if (pending) pendingRoutesRef.current.delete(tabPath);
    return pending;
  }, []);

  const navigate = useCallback(
    (webPath: string, preferTabPath?: string) => {
      const tabPath = resolveTabPath(webPath, preferTabPath);
      pendingRoutesRef.current.set(tabPath, webPath);
      focusTab(tabPath);
      const script = buildClientNavigateScript(webPath, true);
      setTimeout(() => injectWithRetry(tabPath, script, 30, 150), 250);
    },
    [focusTab, injectWithRetry],
  );

  const sendChatCommand = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      focusTab('/chat');
      const run = () => {
        if (action === 'new_chat') {
          injectWithRetry(
            '/chat',
            `window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_NEW_CHAT'));`,
            24,
            180,
          );
          return;
        }
        const detail = JSON.stringify({ action, ...payload });
        injectWithRetry(
          '/chat',
          `window.dispatchEvent(new CustomEvent('TUKUA_MOBILE_CMD', { detail: ${detail} }));`,
          24,
          180,
        );
      };
      setTimeout(run, 300);
    },
    [focusTab, injectWithRetry],
  );

  return (
    <WebViewControlContext.Provider
      value={{
        activeTabPath,
        setActiveTabPath,
        register,
        registerTabJumper,
        navigate,
        sendChatCommand,
        consumePendingRoute,
      }}>
      {children}
    </WebViewControlContext.Provider>
  );
}

export function useWebViewControl() {
  return useContext(WebViewControlContext);
}

export { TAB_WEB_PATHS as TAB_PATHS };
