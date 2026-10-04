import {View, Text} from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignIn = () => {
    return (
        <View>
            <Text>Đăng ký</Text>
            <Link href="/(auth)/sign-in">Đăng nhập</Link>
        </View>
    )
}
export default SignIn