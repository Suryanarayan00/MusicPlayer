import {View, Text, StatusBar, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import MusicPlayer from './src/Component/MusicPlayer';

import SplashScreen from 'react-native-splash-screen';
const App = () => {
  useEffect(() => {
    SplashScreen.hide();
  }, []);
  return (
    <View style={styles.container}>
      {/* <StatusBar  barStyle='light' /> */}
      <MusicPlayer />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});
