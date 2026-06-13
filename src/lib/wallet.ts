import { supabase } from './supabase';

export type Wallet = {
  id: number;
  name: string | null;
  wallet_type: string;
  balance: number;
  currency: string;
  is_active: boolean;
  is_primary: boolean;
  is_tukupay_wallet: boolean;
  alias: string;
};

export async function listWallets(accessToken: string): Promise<Wallet[]> {
  const { data, error } = await supabase.functions.invoke('tukupay-proxy', {
    body: {
      endpoint_name: 'list_wallets',
      parameters: {},
      access_token: accessToken,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.success || !data?.data?.wallets) {
    throw new Error(data?.error ?? 'Failed to load wallets');
  }
  return data.data.wallets as Wallet[];
}

export function totalSavings(wallets: Wallet[]) {
  return wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);
}
