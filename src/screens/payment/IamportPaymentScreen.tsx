import React from 'react';
import IMP from 'iamport-react-native';
import axios from 'axios';
import {useNavigation, useRoute} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ 1. AsyncStorage import 추가
import {View, Text, ActivityIndicator} from 'react-native';

const IamportPaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {userCode, data, reservationInfo} = route.params;

  // ✅ 2. AsyncStorage에서 토큰을 가져와 인증 헤더를 생성하는 함수 추가
  const getAuthHeader = async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      console.error('❌ 저장된 액세스 토큰이 없습니다. 로그인 상태를 확인하세요.');
      // 실제 앱에서는 여기서 로그인 화면으로 보내는 등의 처리가 필요할 수 있습니다.
      return {};
    }
    // "Bearer " 접두사가 중복되지 않도록 정리 후 헤더 객체 반환
    const cleanToken = accessToken.replace(/^Bearer\s+/i, '');
    return {Authorization: `Bearer ${cleanToken}`};
  };

  const callback = async (response: any) => {
    console.log('🧾 아임포트 결제 결과:', response);

    const isSuccess =
      response.success === true ||
      response.success === 'true' ||
      response.imp_success === 'true' ||
      response.imp_success === true ||
      (response.error_code === null && response.imp_uid) ||
      (response.error_code === undefined && response.imp_uid);

    console.log('🎯 결제 성공 여부 판단:', isSuccess);

    if (isSuccess) {
      try {
        // ✅ 3. 서버 DTO에 맞춰 payload 수정 (userId 필드 제거)
        // 서버는 JWT 토큰을 통해 사용자를 식별하므로 프론트에서 userId를 보낼 필요가 없습니다.
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
          impUid: response.imp_uid,
          merchantUid: response.merchant_uid,
        };

        // API 요청에 필요한 헤더 생성
        const headers = {
          'Content-Type': 'application/json',
          ...(await getAuthHeader()),
        };
        
        const requestUrl = 'http://124.60.137.10:8083/api/reservations';

        // ✅ 4. [디버깅 로그] API 요청 직전의 모든 정보 출력
        console.log('📡 API 요청 정보 ==========================');
        console.log('Request URL:', requestUrl);
        // JSON.stringify를 사용하면 객체를 보기 좋게 출력할 수 있습니다.
        console.log('Request Headers:', JSON.stringify(headers, null, 2));
        console.log('Request Body (payload):', JSON.stringify(payload, null, 2));
        console.log('=========================================');

        // ✅ 5. axios.post 호출 시 headers 포함
        const res = await axios.post(
          requestUrl,
          payload,
          { headers },
        );
        
        // ✅ 6. [디버깅 로그] 서버 응답 결과 출력
        console.log('✅ 서버 응답 성공 ==========================');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        console.log('=========================================');

        navigation.replace('PaymentComplete', {
          success: true,
          tourProgramId: reservationInfo?.tourProgramId,
          tourData: reservationInfo?.tourData,
        });

      } catch (e: any) {
        // ✅ 7. [디버깅 로그] 에러 발생 시 더 상세한 정보 출력
        console.error('❌ 서버 요청 에러 ========================');
        if (axios.isAxiosError(e)) {
          console.error('Status:', e.response?.status);
          console.error('Response Data:', JSON.stringify(e.response?.data, null, 2));
          console.error('Request Headers:', JSON.stringify(e.config?.headers, null, 2));
        } else {
          console.error('Unknown Error:', e.message);
        }
        console.error('=========================================');
        
        navigation.replace('PaymentComplete', {
          success: true, // 결제 자체는 성공했으므로
          tourProgramId: reservationInfo?.tourProgramId,
          tourData: reservationInfo?.tourData,
          serverError: true,
          errorMessage: e.response?.data || e.message || '서버에 예약 정보를 기록하는 중 오류가 발생했습니다.',
        });
      }
    } else {
      // 아임포트 결제 실패
      navigation.replace('PaymentComplete', {
        success: false,
        errorMessage: response.error_msg,
      });
    }
  };

  return (
    <IMP.Payment
      userCode={userCode}
      loading={
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f6fa'}}>
          <Text style={{fontSize: 18, color: '#228B22', marginBottom: 20}}>결제 페이지를 불러오는 중...</Text>
          <ActivityIndicator size="large" color="#228B22" />
        </View>
      }
      data={{
        ...data,
        app_scheme: 'tourapps',
        // 테스트 모드 설정
        test_mode: true, // 테스트 모드 활성화
        // 사용자에게 더 명확한 안내
        notice_url: '', // 공지사항 URL (필요시)
      }}
      callback={callback}
    />
  );
};

export default IamportPaymentScreen;