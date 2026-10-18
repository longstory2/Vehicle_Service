import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import LeafletMap from './LeafletMap';
export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <LeafletMap />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});