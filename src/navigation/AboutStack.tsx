import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SharedPublicWebLayer } from '../components/web/SharedPublicWebLayer';
import { AboutWebProvider } from '../context/AboutWebContext';
import { AboutScreen } from '../screens/AboutScreen';
import { PublicWebScreen } from '../screens/PublicWebScreen';
import { AboutStackParamList } from './types';
import { Colors } from '../theme/yana';

const Stack = createNativeStackNavigator<AboutStackParamList>();

function AboutStackNavigator() {
  return (
    <View style={styles.root}>
      <SharedPublicWebLayer />
      <View style={styles.stackLayer}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}>
          <Stack.Screen
            name="AboutHome"
            component={AboutScreen}
            options={{ contentStyle: { backgroundColor: Colors.background } }}
          />
          <Stack.Screen name="PublicWeb" component={PublicWebScreen} />
        </Stack.Navigator>
      </View>
    </View>
  );
}

export function AboutStack() {
  return (
    <AboutWebProvider>
      <AboutStackNavigator />
    </AboutWebProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stackLayer: { flex: 1, zIndex: 1 },
});
