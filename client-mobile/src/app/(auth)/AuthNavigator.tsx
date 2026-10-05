import React from 'react'
import { createNativeStackNavigator } from 'expo-router/build/react-navigation/native-stack'
import LoginScreen from './sign-in'

const Stack = createNativeStackNavigator()

const AuthNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
    </Stack.Navigator>
  )
}

export default AuthNavigator