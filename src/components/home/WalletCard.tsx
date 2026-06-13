import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Gradients } from '../../theme/colors';
import { Images } from '../../constants/images';

export type Wallet = {
  id: string;
  name: string;
  alias: string;
  balance: number;
  colors?: [string, string];
};

type Props = {
  wallet: Wallet;
  index: number;
  phoneNumber?: string;
  hideBalance: boolean;
  onToggleBalance: () => void;
};

function formatThousands(amount: number) {
  return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WalletCard({
  wallet,
  index,
  phoneNumber = '254701234567',
  hideBalance,
  onToggleBalance,
}: Props) {
  const gradient = wallet.colors ?? Gradients.walletDefault;
  const walletSuffix = `0${index + 1}`;

  const copy = async (value: string, message: string) => {
    await Clipboard.setStringAsync(value);
  };

  return (
    <LinearGradient colors={gradient as [string, string, ...string[]]} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.logoWrap}>
            <Image source={Images.tuku} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.meta}>
            <Text style={styles.walletName} numberOfLines={1}>{wallet.name}</Text>
            <View style={styles.accountRow}>
              <Text style={styles.accountText}>Acc: {phoneNumber.slice(0, 12)}</Text>
              <Text style={styles.walletIndex}>{walletSuffix}</Text>
              <TouchableOpacity
                onPress={() => copy(`${phoneNumber} ${walletSuffix}`, 'Copied')}
                style={styles.iconBtn}>
                <Ionicons name="copy-outline" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.aliasRow}>
          <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={styles.alias}>{wallet.alias}</Text>
        </View>

        <View style={styles.linkRow}>
          <Ionicons name="link-outline" size={12} color="rgba(255,255,255,0.5)" />
          <Text style={styles.link} numberOfLines={1}>tukua.money/pay/{wallet.alias}</Text>
        </View>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <View style={styles.balanceValueRow}>
              <Text style={styles.balanceValue}>
                {hideBalance ? '••••••' : `KES ${formatThousands(wallet.balance)}`}
              </Text>
              <TouchableOpacity onPress={onToggleBalance} style={styles.iconBtn}>
                <Ionicons
                  name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.historyBtn}>
            <Text style={styles.historyText}>History</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 190,
    borderRadius: 20,
    marginHorizontal: 4,
    overflow: 'hidden',
    shadowColor: '#0D1B2A',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glowTop: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  meta: {
    flex: 1,
    marginHorizontal: 12,
  },
  walletName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  accountText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  walletIndex: {
    color: Colors.walletGold,
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aliasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  alias: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'Roboto_400Regular',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  link: {
    flex: 1,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontFamily: 'Roboto_400Regular',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  historyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
