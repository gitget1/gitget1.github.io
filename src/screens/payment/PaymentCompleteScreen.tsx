import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';

const PaymentCompleteScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const success = route.params?.success;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
      <Text style={styles.text}>
        {success ? '결제가 완료되었습니다!' : '결제에 실패했습니다.'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Main')}>
        <Text style={styles.buttonText}>
          {success ? '메인으로 이동' : '다시 시도'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PaymentCompleteScreen;
