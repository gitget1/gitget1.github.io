import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const PaymentCompleteScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>결제가 완료되었습니다!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {fontSize: 22, fontWeight: 'bold', color: '#1976d2'},
});

export default PaymentCompleteScreen;
