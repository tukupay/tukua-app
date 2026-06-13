import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AboutScreen } from '../screens/AboutScreen';
import { PublicWebScreen } from '../screens/PublicWebScreen';
import { AboutStackParamList } from './types';
import { Colors } from '../theme/yana';

const Stack = createNativeStackNavigator<AboutStackParamList>();

export function AboutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="AboutHome" component={AboutScreen} />
      <Stack.Screen name="PublicWeb" component={PublicWebScreen} />
    </Stack.Navigator>
  );
}
