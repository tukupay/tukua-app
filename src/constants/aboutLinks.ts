import { Ionicons } from '@expo/vector-icons';

export type AboutLinkItem = {
  id: string;
  label: string;
  subtitle?: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Switch to a main tab instead of opening a web page */
  tab?: 'Courses';
};

export type AboutSection = {
  title: string;
  items: AboutLinkItem[];
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    title: 'Discover',
    items: [
      {
        id: 'courses',
        label: 'All courses',
        subtitle: 'Certified programs & partners',
        path: '/courses',
        icon: 'book-outline',
        tab: 'Courses',
      },
      {
        id: 'opportunities',
        label: 'Opportunities',
        subtitle: 'Jobs, grants & funding',
        path: '/opportunities',
        icon: 'briefcase-outline',
      },
      {
        id: 'pricing',
        label: 'Pricing',
        subtitle: 'Plans, tokens & top-ups',
        path: '/pricing',
        icon: 'pricetag-outline',
      },
    ],
  },
  {
    title: 'Community',
    items: [
      {
        id: 'partners',
        label: 'Partners',
        subtitle: 'Institutions powering Tukua',
        path: '/partners',
        icon: 'people-outline',
      },
      {
        id: 'agencies',
        label: 'Certifying agencies',
        subtitle: 'Accredited certification bodies',
        path: '/certifying-agencies',
        icon: 'ribbon-outline',
      },
      {
        id: 'verify',
        label: 'Verify certificate',
        subtitle: 'Check a credential instantly',
        path: '/verify',
        icon: 'shield-checkmark-outline',
      },
      {
        id: 'support',
        label: 'Support',
        subtitle: 'Help, FAQs & contact',
        path: '/support',
        icon: 'help-circle-outline',
      },
    ],
  },
  {
    title: 'Legal',
    items: [
      {
        id: 'privacy',
        label: 'Privacy policy',
        path: '/privacy-policy',
        icon: 'lock-closed-outline',
      },
      {
        id: 'terms',
        label: 'Terms of service',
        path: '/terms',
        icon: 'document-text-outline',
      },
      {
        id: 'refund',
        label: 'Refund policy',
        path: '/refund-policy',
        icon: 'receipt-outline',
      },
    ],
  },
];
