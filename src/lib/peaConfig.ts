import { getPeaConfig as nestGetPeaConfig } from './platformAuthApi';

export type PeaConfig = {
  amount: number;
  free_tokens: number;
  message: string;
};

const DEFAULT_MESSAGE =
  'Thank you for joining Tukua. To complete registration, we ask for a one-time registration fee of KES {amount} for the school. This helps us verify your phone number and keeps our learning community focused on committed learners.';

export const DEFAULT_PEA_CONFIG: PeaConfig = {
  amount: 950,
  free_tokens: 5000,
  message: DEFAULT_MESSAGE,
};

/** Interpolate admin-editable PEA registration copy. Placeholders: {amount}, {free_tokens} */
export function formatPeaMessage(template: string, amount: number, freeTokens: number): string {
  return template
    .replace(/\{amount\}/g, String(amount))
    .replace(/\{free_tokens\}/g, String(freeTokens));
}

/** Load PEA config from Nest GET /platform/registration/pea-config (same as web). */
export async function fetchPeaConfig(role?: string): Promise<PeaConfig> {
  try {
    const r = await nestGetPeaConfig(role);
    const cfg = r.data;
    if (!r.ok || !cfg || typeof cfg.amount !== 'number') {
      return DEFAULT_PEA_CONFIG;
    }
    return {
      amount: Number(cfg.amount) || DEFAULT_PEA_CONFIG.amount,
      free_tokens: Number(cfg.free_tokens) || DEFAULT_PEA_CONFIG.free_tokens,
      message: typeof cfg.message === 'string' && cfg.message.trim() ? cfg.message : DEFAULT_MESSAGE,
    };
  } catch {
    return DEFAULT_PEA_CONFIG;
  }
}
