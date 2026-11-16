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
        <ModuleScreenHeader title="Send to bank" description="Money to a bank goes through TukuPay." />
        <ModuleGlassCard>
          <ModuleEmpty
            title="Use the TukuPay app"
            body="Tukua does not send money out. To pay into a bank account, open the TukuPay app and confirm there with your PIN."
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
