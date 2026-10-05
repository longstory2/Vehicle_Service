import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const signin = () => {
  return (
    <View>
      <Text>sign-in</Text>
      <Link href="/(tabs)/(customer)/home">đến trang chủ khách</Link>
    </View>
  )
}

export default signin