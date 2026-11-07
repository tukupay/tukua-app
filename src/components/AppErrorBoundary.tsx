import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/yana';
import { log } from '../lib/logger';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; attempt: number };

/**
 * Last line of defence around the whole provider tree (App.tsx). A render error anywhere above the
 * navigator's own boundary (a context provider, the navigator itself) shows a friendly screen with
 * Reload — which remounts the app tree — instead of a red screen / crash.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    log.warn('App', 'render error', error?.message || String(error));
  }

  private reload = () => {
    this.setState((s) => ({ hasError: false, attempt: s.attempt + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>Tukua hit a problem. Reload to carry on.</Text>
          <Pressable
            onPress={this.reload}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Reload</Text>
          </Pressable>
        </View>
      );
    }
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 14, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  button: {
    minHeight: 44,
    minWidth: 140,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  pressed: { opacity: 0.85 },
  buttonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
