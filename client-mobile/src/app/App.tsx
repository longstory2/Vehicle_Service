import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import IntroScreen from './(tabs)/IntroScreen';
import AuthNavigator from './(auth)/AuthNavigator';
import { NavigationContainer } from 'expo-router/build/react-navigation';

const App = () => {
    const[isShowIntro, SetisShowIntro] = useState(true);

    //Người dùng đã đăng nhập hay chưa

    useEffect(()=>{
        const timeout =setTimeout(()=>{
            SetisShowIntro(false);
        },1500);

        return () => clearTimeout(timeout);
    })
  return isShowIntro ? 
    <IntroScreen/> : <AuthNavigator/>

    

};

export default App