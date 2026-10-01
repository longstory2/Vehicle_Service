import {View, Text} from "react-native";
import React from "react";
import {Link} from "expo-router";

const SignUp = () => {
    return (
        <View>
            <Text>Sign Up</Text>
            <Link href="/(pages)/sign-in" >Create Account</Link>
        </View>
    )
}
export default SignUp;