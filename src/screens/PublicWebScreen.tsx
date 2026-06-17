import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAboutWeb } from '../context/AboutWebContext';
import { AboutStackParamList } from '../navigation/types';
import { Colors } from '../theme/yana';

type Props = NativeStackScreenProps<AboutStackParamList, 'PublicWeb'>;

/** Native chrome over the shared public WebView — no second SPA load per page. */
export function PublicWebScreen({ navigation, route }: Props) {
  const { path, title } = route.params;
  const { showPublicPage, hidePublicPage } = useAboutWeb();

  useEffect(() => {
    showPublicPage(path);
    return () => hidePublicPage();
  }, [path, showPublicPage, hidePublicPage]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: 'Inter_600SemiBold',
  },
});
