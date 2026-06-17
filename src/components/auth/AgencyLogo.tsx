import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  getAgencyLogoCandidates,
  getImageFormatFromUrl,
} from '../../lib/resolveAgencyLogo';
import { Colors } from '../../theme/yana';

type Props = {
  logoUrl?: string | null;
  slug?: string | null;
  name: string;
  shortName?: string | null;
  style?: StyleProp<ImageStyle>;
  size?: number;
};

export function AgencyLogo({ logoUrl, slug, name, shortName, style, size = 32 }: Props) {
  const candidates = useMemo(() => getAgencyLogoCandidates(logoUrl, slug), [logoUrl, slug]);
  const [index, setIndex] = useState(0);
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [svgFailed, setSvgFailed] = useState(false);
  const [rasterFailed, setRasterFailed] = useState(false);

  const uri = candidates[index] ?? null;
  const format = uri ? getImageFormatFromUrl(uri) : 'unknown';
  const isSvg = format === 'svg';

  useEffect(() => {
    setIndex(0);
    setSvgXml(null);
    setSvgFailed(false);
    setRasterFailed(false);
  }, [logoUrl, slug]);

  useEffect(() => {
    if (!uri || !isSvg) {
      setSvgXml(null);
      setSvgFailed(false);
      return;
    }

    let cancelled = false;
    setSvgXml(null);
    setSvgFailed(false);

    fetch(uri)
      .then((res) => {
        if (!res.ok) throw new Error(`SVG ${res.status}`);
        return res.text();
      })
      .then((xml) => {
        if (!cancelled) setSvgXml(xml);
      })
      .catch(() => {
        if (!cancelled) setSvgFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uri, isSvg]);

  useEffect(() => {
    if (!svgFailed) return;
    setSvgFailed(false);
    setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [svgFailed, candidates.length]);

  const tryNext = () => {
    setIndex((i) => {
      if (i + 1 < candidates.length) return i + 1;
      setRasterFailed(true);
      return i;
    });
  };

  const frameStyle = [styles.frame, { width: size, height: size }, style];

  if (rasterFailed || !uri || index >= candidates.length) {
    return (
      <View style={[frameStyle, styles.fallbackFrame]}>
        <Text style={styles.fallbackText}>{(shortName || name).slice(0, 3).toUpperCase()}</Text>
      </View>
    );
  }

  if (isSvg) {
    if (svgXml) {
      return (
        <View style={[frameStyle, styles.mediaFrame, styles.svgWrap]}>
          <SvgXml xml={svgXml} width={size - 8} height={size - 8} />
        </View>
      );
    }
    if (!svgFailed) {
      return <View style={[frameStyle, styles.mediaFrame]} />;
    }
  }

  return (
    <Image
      source={{ uri }}
      style={[frameStyle, styles.mediaFrame]}
      resizeMode="contain"
      onError={tryNext}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaFrame: {
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  fallbackFrame: {
    borderColor: 'rgba(31,139,76,0.2)',
    backgroundColor: Colors.primaryLight,
  },
  svgWrap: {
    padding: 4,
  },
  fallbackText: {
    fontSize: 7,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
});
