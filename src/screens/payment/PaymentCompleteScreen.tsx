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
  const tourProgramId = route.params?.tourProgramId;
  const tourData = route.params?.tourData;
  const serverError = route.params?.serverError;
  const errorMessage = route.params?.errorMessage;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
      <Text style={styles.text}>
        {success ? '결제가 완료되었습니다!' : '결제에 실패했습니다.'}
      </Text>
      
      {serverError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ 서버 연결 문제</Text>
          <Text style={styles.errorText}>
            결제는 성공했지만 서버 연결에 문제가 있습니다.
          </Text>
          <Text style={styles.errorDetail}>
            {errorMessage || '네트워크를 확인해주세요.'}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          // 확인 버튼을 누르면 메인 화면으로 이동
          navigation.navigate('Main');
        }}>
        <Text style={styles.buttonText}>
          확인
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
  errorContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    width: '100%',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
  },
  errorDetail: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
});

export default PaymentCompleteScreen;
