import { supabase } from './supabase';

export type CertifyingAgency = {
  id: string;
  name: string;
  short_name?: string | null;
  logo_url?: string | null;
};

const FALLBACK: CertifyingAgency[] = [
  { id: 'jkuates', name: 'JKUAT Enterprises', short_name: 'JKUATES' },
  { id: 'uon', name: 'University of Nairobi', short_name: 'UON' },
  { id: 'mku', name: 'Mount Kenya University', short_name: 'MKU' },
  { id: 'pac', name: 'PAC University', short_name: 'PAC' },
  { id: 'kemi', name: 'Kenya Education Management Institute', short_name: 'KEMI' },
  { id: 'tukua', name: 'Tukua Academy', short_name: 'Tukua' },
];

export async function fetchCertifyingAgencies(): Promise<CertifyingAgency[]> {
  try {
    const { data, error } = await supabase
      .from('certifying_agencies')
      .select('id, name, short_name, logo_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .limit(12);

    if (error || !data?.length) return FALLBACK;
    return data as CertifyingAgency[];
  } catch {
    return FALLBACK;
  }
}
