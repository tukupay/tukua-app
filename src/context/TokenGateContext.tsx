import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ZeroTokenModal } from '../components/wallet/ZeroTokenModal';
import { fetchTokenBalance } from '../lib/tokenBalance';
import { useAuth } from './AuthContext';
import { useDeskAuth } from './DeskAuthContext';
import { useWebViewControl } from './WebViewControlContext';
import { MainTabParamList } from '../navigation/types';
import { isDashboardActionTokenGated, type DashboardAction } from '../screens/dashboard/dashboardActions';

type TokenGateContextType = {
  balance: number | null;
  balanceRevision: number;
  loading: boolean;
  isZeroBalance: boolean;
  refreshBalance: () => Promise<number>;
  showZeroTokenModal: () => void;
  /** Returns true when navigation may proceed; otherwise shows the modal. */
  guardNavigation: (fn: () => void) => boolean;
  guardTab: (tab: keyof MainTabParamList) => boolean;
  guardDashboardAction: (action: DashboardAction, fn: () => void) => boolean;
};

const TokenGateContext = createContext<TokenGateContextType>({
  balance: null,
  balanceRevision: 0,
  loading: false,
  isZeroBalance: false,
  refreshBalance: async () => 0,
  showZeroTokenModal: () => {},
  guardNavigation: () => true,
  guardTab: () => true,
  guardDashboardAction: () => true,
});

const ALLOWED_TABS = new Set<keyof MainTabParamList>(['Profile']);

export function TokenGateProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { deskToken, isDeskAuthenticated } = useDeskAuth();
  const { jumpToTab, navigate } = useWebViewControl();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [balanceRevision, setBalanceRevision] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!session) {
      setBalance(null);
      return 0;
    }
    setLoading(true);
    try {
      const next = await fetchTokenBalance(isDeskAuthenticated ? deskToken : null);
      setBalance(next);
      setBalanceRevision((n) => n + 1);
      return next;
    } catch {
      setBalance(0);
      setBalanceRevision((n) => n + 1);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [deskToken, isDeskAuthenticated, session]);

  useEffect(() => {
    if (!session) {
      setBalance(null);
      return;
    }
    void refreshBalance();
    const id = setInterval(() => void refreshBalance(), 5 * 60_000);
    return () => clearInterval(id);
  }, [refreshBalance, session]);

  const isZeroBalance = balance != null && balance <= 0;

  const showZeroTokenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const guardNavigation = useCallback(
    (fn: () => void) => {
      if (!isZeroBalance) {
        fn();
        return true;
      }
      showZeroTokenModal();
      return false;
    },
    [isZeroBalance, showZeroTokenModal],
  );

  const guardTab = useCallback(
    (tab: keyof MainTabParamList) => {
      if (!isZeroBalance) return true;
      if (ALLOWED_TABS.has(tab)) return true;
      showZeroTokenModal();
      return false;
    },
    [isZeroBalance, showZeroTokenModal],
  );

  const guardDashboardAction = useCallback(
    (action: DashboardAction, fn: () => void) => {
      if (!isZeroBalance) {
        fn();
        return true;
      }
      if (!isDashboardActionTokenGated(action)) {
        fn();
        return true;
      }
      showZeroTokenModal();
      return false;
    },
    [isZeroBalance, showZeroTokenModal],
  );

  const openBalances = useCallback(() => {
    setModalVisible(false);
    jumpToTab('Profile');
    navigate('/profile/balances', '/profile');
  }, [jumpToTab, navigate]);

  const value = useMemo(
    () => ({
      balance,
      balanceRevision,
      loading,
      isZeroBalance,
      refreshBalance,
      showZeroTokenModal,
      guardNavigation,
      guardTab,
      guardDashboardAction,
    }),
    [
      balance,
      balanceRevision,
      guardDashboardAction,
      guardNavigation,
      guardTab,
      isZeroBalance,
      loading,
      refreshBalance,
      showZeroTokenModal,
    ],
  );

  return (
    <TokenGateContext.Provider value={value}>
      {children}
      <ZeroTokenModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        onTopUpComplete={() => void refreshBalance()}
        onOpenBalances={openBalances}
      />
    </TokenGateContext.Provider>
  );
}

export function useTokenGate() {
  return useContext(TokenGateContext);
}
