import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentCompleteScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const success = route.params?.success;
  const tourProgramId = route.params?.tourProgramId;
  const tourData = route.params?.tourData;
  const reservationInfo = route.params?.reservationInfo;
  const paymentData = route.params?.paymentData;
  const serverError = route.params?.serverError;
  const errorMessage = route.params?.errorMessage;
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // 예약 데이터를 서버에 저장하는 함수
  const saveReservation = async () => {
    if (!success || !reservationInfo || !tourProgramId || hasAttemptedSave) {
      console.log('❌ 예약 저장 조건 불충족 또는 이미 시도됨:', { 
        success, 
        reservationInfo, 
        tourProgramId, 
        hasAttemptedSave 
      });
      return;
    }

    try {
      setIsSaving(true);
      setHasAttemptedSave(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('로그인 토큰이 없습니다.');
      }

      const cleanToken = token.replace('Bearer ', '');
      
      // IamportPaymentScreen과 동일한 payload 구조 사용
      const payload = {
        reservation: {
          numOfPeople: reservationInfo?.numOfPeople,
          guideStartDate: reservationInfo?.guideStartDate,
          guideEndDate: reservationInfo?.guideEndDate,
          tourProgramId: reservationInfo?.tourProgramId,
          paymentMethod: reservationInfo?.paymentMethod,
          guideId: reservationInfo?.guideId,
          totalPrice: reservationInfo?.totalPrice,
        },
        impUid: paymentData?.merchant_uid || `mock_${Date.now()}`, // 모의 결제 UID
        merchantUid: paymentData?.merchant_uid || `merchant_${Date.now()}`,
      };

      // API 요청에 필요한 헤더 생성
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanToken}`,
      };
      
      const requestUrl = 'http://124.60.137.10:8083/api/reservations';

      // 디버깅 로그
      console.log('📡 API 요청 정보 ==========================');
      console.log('Request URL:', requestUrl);
      console.log('Request Headers:', JSON.stringify(headers, null, 2));
      console.log('Request Body (payload):', JSON.stringify(payload, null, 2));
      console.log('=========================================');

      const response = await axios.post(
        requestUrl,
        payload,
        { headers },
      );

      if (response.status === 200 || response.status === 201) {
        // 디버깅 로그
        console.log('✅ 서버 응답 성공 ==========================');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('=========================================');
        setSaveStatus('success');
      } else {
        throw new Error(response.data?.message || '예약 저장에 실패했습니다.');
      }
    } catch (error: any) {
      // 디버깅 로그
      console.error('❌ 서버 요청 에러 ========================');
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Request Headers:', JSON.stringify(error.config?.headers, null, 2));
      } else {
        console.error('Unknown Error:', error.message);
      }
      console.error('=========================================');
      
      setSaveStatus('error');
      
      // 에러가 발생해도 사용자에게는 성공으로 표시 (결제는 이미 완료됨)
      Alert.alert(
        '알림',
        '결제는 완료되었지만 예약 저장에 문제가 있습니다. 고객센터에 문의해주세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 컴포넌트 마운트 시 예약 저장 실행 (한 번만)
  useEffect(() => {
    if (success && reservationInfo && !hasAttemptedSave) {
      console.log('🚀 예약 저장 시작 (한 번만 실행)');
      saveReservation();
    }
  }, [success, reservationInfo, hasAttemptedSave]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
      <Text style={styles.text}>
        {success ? '예약이 완료되었습니다!' : '결제에 실패했습니다.'}
      </Text>
      
      {/* 사업자 승인 오류 메시지 */}
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ 결제 시스템은 추가될 예정입니다</Text>
        <Text style={styles.errorText}>
          사업자승인 등록문제로 인하여 현재 결제가 불가능합니다.
        </Text>
        <Text style={styles.errorDetail}>
          예약은 정상적으로 처리되었습니다.
        </Text>
      </View>
      
      {success && isSaving && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>📅 예약을 저장하는 중...</Text>
        </View>
      )}
      
      {success && saveStatus === 'success' && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>✅ 예약이 캘린더에 저장되었습니다!</Text>
        </View>
      )}
      
      {success && saveStatus === 'error' && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>⚠️ 예약 저장에 문제가 있습니다.</Text>
        </View>
      )}
      
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
  statusContainer: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default PaymentCompleteScreen;
