import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardBackground } from '../../components/dashboard/DashboardBackground';
import {
  ModuleBackBar,
  ModuleEmpty,
  ModuleGlassCard,
  ModuleKicker,
  ModuleScreenHeader,
} from '../dashboard/ModuleChrome';
import { floatingHeaderInset, moduleScrollBottomPad } from '../../constants/layout';
import { DashboardStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<DashboardStackParamList, 'TukuaPayBank'>;

/** Honest stub — bank withdraw API not live on staging Nest. */
export function TukuaPayBankScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <DashboardBackground patternOnly liquid />
      <View
        style={{
          paddingTop: floatingHeaderInset(insets.top),
          paddingBottom: moduleScrollBottomPad(insets.bottom),
          paddingHorizontal: 18,
        }}>
        <ModuleBackBar onBack={() => navigation.goBack()} />
        <ModuleKicker>Tukua Pay</ModuleKicker>
        <ModuleScreenHeader title="Send to bank" description="Withdraw to a linked bank account." />
        <ModuleGlassCard>
          <ModuleEmpty
            title="Bank transfer coming soon"
            body="We haven’t enabled bank withdrawals yet. Use M-Pesa deposit or send to a Tukua ID for now."
          />
          <Text style={styles.note}>No charge was made.</Text>
        </ModuleGlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  note: { marginTop: 8, textAlign: 'center', color: '#64748B', fontSize: 12, fontWeight: '600' },
});
