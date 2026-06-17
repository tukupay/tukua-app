import React from 'react';
import { Image, View } from 'react-native';
import { Images } from '../../constants/images';

const NAVBAR_LOGO_SIZE = 34;

/** Square Tukua bird in the native header. */
export function TukuaBrandMark() {
  return (
    <View style={{ width: NAVBAR_LOGO_SIZE, height: NAVBAR_LOGO_SIZE }}>
      <Image
        source={Images.logoNavbar}
        style={{ width: NAVBAR_LOGO_SIZE, height: NAVBAR_LOGO_SIZE }}
        resizeMode="contain"
        accessibilityLabel="Tukua"
      />
    </View>
  );
}

export { NAVBAR_LOGO_SIZE };
