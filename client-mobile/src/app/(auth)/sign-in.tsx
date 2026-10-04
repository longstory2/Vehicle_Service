import {View, Text} from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignIn = () => {
    return (
        <View>
            <Text>Đăng nhập</Text>
            <Link href="/(auth)/sign-up">Tạo tài khoản</Link>
        </View>
    )
}
export default SignIn