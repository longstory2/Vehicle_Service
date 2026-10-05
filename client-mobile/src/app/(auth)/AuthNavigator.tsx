import React from 'react'
import { createNativeStackNavigator } from 'expo-router/build/react-navigation/native-stack'
import LoginScreen from './sign-in'
import HomeScreen from '../(tabs)/(customer)/home'
import signup from './sign-up'

const Stack = createNativeStackNavigator()

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="signup" component={signup} />
    </Stack.Navigator>
  )
}

export default AuthNavigator