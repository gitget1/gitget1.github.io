// ✅ PaymentScreen.tsx (fixed - /api/users/me 호출 제거됨)
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const refundTable = Array.from({length: 11}, (_, i) => ({
  day: 10 - i,
  percent: (10 - i) * 10,
}));

const PaymentScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();

  // route params에서 투어 데이터 받아오기
  const tourData = route.params?.tourData as any;
  const resultParam = route.params?.result as 'success' | 'fail' | undefined;

  console.log('🎯 PaymentScreen - route.params:', route.params);
  console.log('🎯 PaymentScreen - tourData:', tourData);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [people, setPeople] = useState(1);
  const [appliedPeople, setAppliedPeople] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const totalPrice =
    appliedPeople && tourData ? tourData.guidePrice * appliedPeople : 0;

  console.log('💰 totalPrice 계산:', {
    appliedPeople,
    guidePrice: tourData?.guidePrice,
    totalPrice,
  });

  const [result, setResult] = useState<'success' | 'fail' | null>(null);

  useEffect(() => {
    if (resultParam) {
      setResult(resultParam);
      // URL 파라미터를 한 번만 처리하고 제거
      navigation.setParams({result: undefined});
    }
  }, [resultParam, navigation]);

  // tourData가 없을 경우 처리
  useEffect(() => {
    if (!tourData && !resultParam) {
      Alert.alert('오류', '투어 정보를 불러올 수 없습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  }, [tourData, resultParam, navigation]);

  // 사용자 ID 가져오기
  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          // JWT 토큰에서 사용자 ID 추출하는 로직 필요
          // 임시로 1로 설정
          setUserId(1);
        }
      } catch (error) {
        console.error('사용자 ID 가져오기 실패:', error);
      }
    };
    getUserId();
  }, []);

  const handlePayment = () => {
    if (appliedPeople === null) {
      Alert.alert('알림', '인원 수를 설정하고 "적용" 버튼을 눌러주세요.');
      return;
    }

    if (!tourData) {
      Alert.alert('오류', '투어 정보를 찾을 수 없습니다.');
      return;
    }

    if (!userId) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    console.log('🧮 최종 totalPrice:', totalPrice);
    console.log('📌 appliedPeople:', appliedPeople);
    console.log('🎯 tourData:', tourData);

    const merchantUid = `merchant_${new Date().getTime()}`;

    const paymentData = {
      pg: 'html5_inicis',
      pay_method: 'card',
      name: tourData.title,
      amount: totalPrice,
      merchant_uid: merchantUid,
      buyer_name: '홍길동', // 실제 사용자 정보로 변경 필요
      buyer_tel: '01012345678', // 실제 사용자 정보로 변경 필요
      buyer_email: 'test@example.com', // 실제 사용자 정보로 변경 필요
      app_scheme: 'tourapps',
    };

    // 서버로 전송할 예약 데이터
    const reservationData = {
      reservation: {
        tourProgramId: tourData.tourProgramId || tourData.id,
        userId: userId,
        numOfPeople: appliedPeople,
        totalPrice: totalPrice,
        guideStartDate: `${year}-${String(month).padStart(2, '0')}-${String(
          day,
        ).padStart(2, '0')}T10:00:00`,
        guideEndDate: `${year}-${String(month).padStart(2, '0')}-${String(
          day,
        ).padStart(2, '0')}T13:00:00`,
        paymentMethod: 'card', // 기본값으로 카드 결제 사용
      },
      impUid: '', // 결제 완료 후 아임포트에서 받을 값
      merchantUid: merchantUid, // 가맹점 주문 번호
      userId: userId, // 결제/예약 요청 사용자 ID
    };

    console.log('💳 결제 데이터:', paymentData);
    console.log('📋 예약 데이터:', reservationData);

    navigation.navigate('IamportPayment', {
      userCode: 'imp33770537',
      data: paymentData,
      reservationInfo: reservationData,
    });
  };

  if (result === 'success') {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultIcon}>✅</Text>
        <Text style={styles.resultText}>결제에 성공하였습니다!</Text>
        <TouchableOpacity
          style={styles.resultBtn}
          onPress={() => navigation.navigate('Main')}>
          <Text style={styles.resultBtnText}>메인으로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // tourData가 없으면 로딩 표시
  if (!tourData && !result) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>투어 정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#f5f6fa'}}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 120}}>
        <View style={styles.box}>
          <Text style={styles.title}>{tourData?.title || '투어 제목'}</Text>
          <Text style={styles.region}>{tourData?.region || '지역 정보'}</Text>
          <Text style={styles.price}>
            가격: ₩{(tourData?.guidePrice || 0).toLocaleString()} /인
          </Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>날짜</Text>
          <View style={styles.row}>
            <Picker
              selectedValue={year}
              style={styles.yearPicker}
              onValueChange={setYear}>
              {[2024, 2025, 2026].map(y => (
                <Picker.Item key={y} label={`${y}년`} value={y} />
              ))}
            </Picker>
            <Picker
              selectedValue={month}
              style={styles.picker}
              onValueChange={setMonth}>
              {[...Array(12)].map((_, i) => (
                <Picker.Item key={i + 1} label={`${i + 1}월`} value={i + 1} />
              ))}
            </Picker>
            <Picker
              selectedValue={day}
              style={styles.picker}
              onValueChange={setDay}>
              {[...Array(31)].map((_, i) => (
                <Picker.Item key={i + 1} label={`${i + 1}일`} value={i + 1} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>인원</Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setPeople(Math.max(1, people - 1))}
              style={styles.counterBtn}>
              <Text>-</Text>
            </TouchableOpacity>
            <Text style={styles.peopleNum}>{people}</Text>
            <TouchableOpacity
              onPress={() => setPeople(people + 1)}
              style={styles.counterBtn}>
              <Text>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setAppliedPeople(people)}>
              <Text>적용</Text>
            </TouchableOpacity>
          </View>
          {appliedPeople !== null && (
            <View style={styles.totalPeopleBox}>
              <Text style={styles.totalPeopleText}>
                총 인원: {appliedPeople}명
              </Text>
            </View>
          )}
        </View>

        {appliedPeople !== null && (
          <View style={styles.box}>
            <Text style={styles.label}>총 금액</Text>
            <Text style={styles.totalPrice}>
              {totalPrice.toLocaleString()}원
            </Text>
          </View>
        )}

        <View style={styles.box}>
          <Text style={styles.label}>환불제도</Text>
          <Text style={styles.refundInfo}>
            예약취소시 환불의 비용은 다음과 같습니다
          </Text>
          <View style={styles.refundTable}>
            <View style={styles.refundRow}>
              <Text style={styles.refundHeader}>일차</Text>
              <Text style={styles.refundHeader}>환불률</Text>
            </View>
            {refundTable.map(row => (
              <View style={styles.refundRow} key={row.day}>
                <Text style={styles.refundCell}>
                  {row.day === 0 ? '당일' : `${row.day}일`}
                </Text>
                <Text style={styles.refundCell}>{row.percent}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.payButtonFixed} onPress={handlePayment}>
        <Text style={styles.payButtonText}>결제하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f6fa', padding: 16},
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {fontSize: 22, fontWeight: 'bold', marginBottom: 4},
  region: {fontSize: 16, color: '#666'},
  price: {fontSize: 16, color: '#1976d2', fontWeight: 'bold', marginTop: 4},
  label: {fontWeight: 'bold', marginBottom: 8, fontSize: 16},
  row: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  picker: {
    width: 90,
    height: 40,
  },
  yearPicker: {
    width: 120,
    height: 40,
  },
  counterBtn: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  peopleNum: {fontSize: 18, fontWeight: 'bold', marginHorizontal: 8},
  applyBtn: {
    backgroundColor: '#ffe082',
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  totalPeopleBox: {position: 'absolute', right: 20, bottom: 20},
  totalPeopleText: {fontSize: 15, color: '#1976d2', fontWeight: 'bold'},
  totalPrice: {fontWeight: 'bold', color: '#d32f2f', fontSize: 18},
  refundInfo: {color: '#d32f2f', marginBottom: 8},
  refundTable: {borderWidth: 1, borderColor: '#ccc', borderRadius: 6},
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  refundHeader: {fontWeight: 'bold', fontSize: 15},
  refundCell: {fontSize: 15},
  payButtonFixed: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  payButtonText: {color: '#fff', fontWeight: 'bold', fontSize: 18},
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
  },
  resultBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resultBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PaymentScreen;
