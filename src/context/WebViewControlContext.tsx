import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { buildMobileNewChatScript, buildSpaNavigateScript } from '../lib/webviewAuth';
import { log } from '../lib/logger';
import { MainTabParamList } from '../navigation/types';

type WebViewHandle = {
  path: string;
  ref: React.RefObject<WebView | null>;
};

type TabJumper = (tab: keyof MainTabParamList) => void;

type TabFocusHandler = () => void;

type WebViewControlContextType = {
  activeTabPath: string;
  setActiveTabPath: (path: string) => void;
  register: (path: string, ref: React.RefObject<WebView | null>) => () => void;
  registerTabFocusHandler: (tabPath: string, handler: TabFocusHandler) => () => void;
  notifyTabFocused: (tabPath: string) => void;
  registerTabJumper: (jumper: TabJumper) => () => void;
  jumpToTab: (tab: keyof MainTabParamList) => void;
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
  registerTabFocusHandler: () => () => {},
  notifyTabFocused: () => {},
  registerTabJumper: () => () => {},
  jumpToTab: () => {},
  navigate: () => {},
  sendChatCommand: () => {},
  consumePendingRoute: () => undefined,
});

export function WebViewControlProvider({ children }: { children: React.ReactNode }) {
  const handlesRef = useRef<Map<string, WebViewHandle>>(new Map());
  const pendingRoutesRef = useRef<Map<string, string>>(new Map());
  const tabFocusHandlersRef = useRef<Map<string, TabFocusHandler>>(new Map());
  const tabJumperRef = useRef<TabJumper>(() => {});
  const [activeTabPath, setActiveTabPath] = useState('/chat');

  const register = useCallback((path: string, ref: React.RefObject<WebView | null>) => {
    handlesRef.current.set(path, { path, ref });
    return () => {
      handlesRef.current.delete(path);
    };
  }, []);

  const registerTabFocusHandler = useCallback((tabPath: string, handler: TabFocusHandler) => {
    tabFocusHandlersRef.current.set(tabPath, handler);
    return () => {
      tabFocusHandlersRef.current.delete(tabPath);
    };
  }, []);

  const notifyTabFocused = useCallback((tabPath: string) => {
    tabFocusHandlersRef.current.get(tabPath)?.();
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

  const jumpToTab = useCallback((tab: keyof MainTabParamList) => {
    const webPath = TAB_WEB_PATHS[tab];
    if (webPath) setActiveTabPath(webPath);
    try {
      tabJumperRef.current(tab);
    } catch (error) {
      log.warn('WebViewControl', 'jumpToTab failed', { tab, error: String(error) });
    }
  }, []);

  const focusTab = useCallback(
    (tabPath: string) => {
      const tabName = tabNameForPath(tabPath);
      setActiveTabPath(tabPath);
      try {
        tabJumperRef.current(tabName);
      } catch (error) {
        log.warn('WebViewControl', 'focusTab failed', { tab: tabName, error: String(error) });
      }
      notifyTabFocused(tabPath);
    },
    [notifyTabFocused],
  );

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
      const script = buildSpaNavigateScript(webPath, { force: true, push: webPath !== tabPath });
      setTimeout(() => injectWithRetry(tabPath, script, 30, 150), 250);
    },
    [focusTab, injectWithRetry],
  );

  const sendChatCommand = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      focusTab('/chat');
      const run = () => {
        if (action === 'new_chat') {
          injectWithRetry('/chat', buildMobileNewChatScript(), 24, 180);
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
        registerTabFocusHandler,
        notifyTabFocused,
        registerTabJumper,
        jumpToTab,
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
