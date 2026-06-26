import { supabase } from './supabase';
import { resolveAgencyLogoUrl } from './resolveAgencyLogo';

export type CertifyingAgency = {
  id: string;
  name: string;
  slug?: string | null;
  short_name?: string | null;
  logo_url?: string | null;
};

function withResolvedLogo(agency: CertifyingAgency): CertifyingAgency {
  const slug = agency.slug ?? agency.id;
  return {
    ...agency,
    logo_url: resolveAgencyLogoUrl(agency.logo_url, slug),
  };
}

const FALLBACK: CertifyingAgency[] = [
  { id: 'jkuates', slug: 'jkuates', name: 'JKUAT Enterprises', short_name: 'JKUATES' },
  { id: 'uon', slug: 'uon', name: 'University of Nairobi', short_name: 'UON' },
  { id: 'mku', slug: 'mku', name: 'Mount Kenya University', short_name: 'MKU' },
  { id: 'pac', slug: 'pac', name: 'PAC University', short_name: 'PAC' },
  { id: 'kemi', slug: 'kemi', name: 'Kenya Education Management Institute', short_name: 'KEMI' },
  { id: 'tukua', slug: 'tuk', name: 'Tukua Academy', short_name: 'Tukua' },
].map(withResolvedLogo);

export async function fetchCertifyingAgencies(): Promise<CertifyingAgency[]> {
  try {
    const { data, error } = await supabase
      .from('certifying_agencies')
      .select('id, name, slug, short_name, logo_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error || !data?.length) return FALLBACK;
    return (data as CertifyingAgency[]).map(withResolvedLogo);
  } catch {
    return FALLBACK;
  }
}
