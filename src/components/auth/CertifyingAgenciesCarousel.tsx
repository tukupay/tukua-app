import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AgencyLogo } from './AgencyLogo';
import { CertifyingAgency, fetchCertifyingAgencies } from '../../lib/certifyingAgencies';
import { Colors } from '../../theme/yana';

type Props = { compact?: boolean };

const SCROLL_STEP = 0.35;

export function CertifyingAgenciesCarousel({ compact }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [agencies, setAgencies] = useState<CertifyingAgency[]>([]);
  const [loopWidth, setLoopWidth] = useState(0);
  const scrollXRef = useRef(0);
  const userScrollingRef = useRef(false);
  const halfWidthRef = useRef(0);

  useEffect(() => {
    fetchCertifyingAgencies().then(setAgencies);
  }, []);

  const loopItems = agencies.length ? [...agencies, ...agencies] : [];

  useEffect(() => {
    if (!loopWidth || !agencies.length) return;

    const id = setInterval(() => {
      if (userScrollingRef.current || !scrollRef.current) return;

      scrollXRef.current += SCROLL_STEP;
      if (scrollXRef.current >= halfWidthRef.current) {
        scrollXRef.current = 0;
      }
      scrollRef.current.scrollTo({ x: scrollXRef.current, animated: false });
    }, 20);

    return () => clearInterval(id);
  }, [loopWidth, agencies.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollXRef.current = e.nativeEvent.contentOffset.x;
  };

  const onScrollBeginDrag = () => {
    userScrollingRef.current = true;
  };

  const onScrollEndDrag = () => {
    userScrollingRef.current = false;
    if (halfWidthRef.current > 0 && scrollXRef.current >= halfWidthRef.current) {
      scrollXRef.current -= halfWidthRef.current;
      scrollRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
    }
  };

  if (!agencies.length) return null;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onScrollEndDrag}
        onContentSizeChange={(w) => {
          setLoopWidth(w);
          halfWidthRef.current = w / 2;
        }}
        contentContainerStyle={styles.scrollContent}>
        {loopItems.map((a, i) => (
          <View key={`${a.id}-${i}`} style={styles.item}>
            <AgencyLogo
              logoUrl={a.logo_url}
              slug={a.slug ?? a.id}
              name={a.name}
              shortName={a.short_name}
              size={32}
            />
            <Text style={styles.label} numberOfLines={1}>
              {a.short_name || a.name.split(' ')[0]}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 320,
  },
  wrapCompact: {},
  scrollContent: {
    paddingHorizontal: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  item: {
    width: 52,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 7,
    fontWeight: '600',
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 9,
    fontFamily: 'Inter_500Medium',
  },
});
