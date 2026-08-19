import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

/** Nested navigate into Dashboard stack from headers / push handlers. */
export function navigateDashboard(
  screen: string,
  params?: Record<string, unknown>,
) {
  if (!rootNavigationRef.isReady()) return;
  rootNavigationRef.navigate('Main', {
    screen: 'Dashboard',
    params: { screen, params },
  } as never);
}

/** Nested navigate into the native Profile stack from the floating app header. */
export function navigateProfile(screen: string) {
  if (!rootNavigationRef.isReady()) return;
  rootNavigationRef.navigate('Main', {
    screen: 'Profile',
    params: { screen },
  } as never);
}
