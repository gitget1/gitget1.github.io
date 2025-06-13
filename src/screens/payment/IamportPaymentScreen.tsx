import React from 'react';
import IMP from 'iamport-react-native';
import axios from 'axios';
import {useNavigation, useRoute} from '@react-navigation/native';

const IamportPaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {userCode, data, reservationInfo} = route.params;

  const callback = async (response: any) => {
    console.log('🧾 결제 결과 전체:', response);
    console.log('✅ response.success:', response.success);
    console.log('✅ response.imp_success:', response.imp_success);

    const isSuccess =
      response.success === true || response.imp_success === 'true';

    if (isSuccess) {
      try {
        const payload = {
          reservation: {
            tourProgramId: reservationInfo?.tourProgramId ?? 3,
            userId: reservationInfo?.userId ?? 1, // ✅ 이 줄이 없으면 userId가 reservation 객체에 안 들어감!
            numOfPeople: reservationInfo?.numOfPeople ?? 2,
            totalPrice: reservationInfo?.totalPrice ?? 150000,
            guideStartDate:
              reservationInfo?.guideStartDate ?? '2025-06-05T10:00:00',
            guideEndDate:
              reservationInfo?.guideEndDate ?? '2025-06-05T13:00:00',
            paymentMethod: reservationInfo?.paymentMethod ?? 'kakaoPay',
            guideId: reservationInfo?.guideId ?? 1,
          },
          impUid: response.imp_uid,
          merchantUid: response.merchant_uid,
          userId: reservationInfo?.userId ?? 1,
        };

        console.log('📦 예약 전송 Payload:', payload);

        const res = await axios.post(
          'http://192.168.1.120:8080/api/reservations',
          payload,
        );

        console.log('✅ 예약 서버 응답:', res.data);
        navigation.replace('PaymentScreen');
      } catch (e: any) {
        console.error('❌ 서버 응답 에러:', e.response?.data || e.message);
        navigation.replace('PaymentScreen', {result: 'fail'});
      }
    } else {
      console.warn('⚠️ 결제 실패 or 취소됨:', response);
      navigation.replace('PaymentScreen', {result: 'fail'});
    }
  };

  return (
    <IMP.Payment
      userCode={userCode} // 예: imp33770537
      loading={<></>}
      data={{
        ...data,
        app_scheme: 'tourapps', // ✅ 반드시 AndroidManifest.xml과 동일
      }}
      callback={callback}
    />
  );
};

export default IamportPaymentScreen;
