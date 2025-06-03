import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import IMP from 'iamport-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://124.60.137.10:80';
const IMP_USER_CODE = 'imp33770537'; // 아임포트 가맹점 식별코드

const refundTable = Array.from({length: 11}, (_, i) => ({
  day: 10 - i,
  percent: (10 - i) * 10,
}));

const PaymentScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const tourData = route.params?.tourData;

  // 날짜 상태
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  // 인원 상태
  const [people, setPeople] = useState(1);
  const [appliedPeople, setAppliedPeople] = useState<number | null>(null);

  // 총 금액 계산
  const totalPrice = appliedPeople ? tourData.guidePrice * appliedPeople : 0;

  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null>(null);

  const fetchUserInfo = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.goBack();
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.status === 'OK') {
        setUserInfo(response.data.data);
      } else {
        throw new Error(
          response.data.message || '사용자 정보를 불러오는데 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error);
      Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
      navigation.goBack();
    }
  }, [navigation]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handlePayment = async () => {
    if (!userInfo) {
      Alert.alert('오류', '사용자 정보를 불러오는 중입니다.');
      return;
    }

    if (!appliedPeople) {
      Alert.alert('오류', '인원을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const cleanToken = token.replace('Bearer ', '');
      const merchantUid = `mid_${new Date().getTime()}`;

      return (
        <IMP.Payment
          userCode={IMP_USER_CODE}
          data={{
            pg: 'html5_inicis',
            pay_method: 'card',
            merchant_uid: merchantUid,
            name: tourData.title,
            amount: totalPrice,
            buyer_name: userInfo.name,
            buyer_tel: userInfo.phone,
            buyer_email: userInfo.email,
            app_scheme: 'tourapps1',
            escrow: false,
          }}
          loading={<ActivityIndicator size="large" color="#1976d2" />}
          callback={async response => {
            if (response.success) {
              try {
                const reservationResponse = await axios.post(
                  `${API_BASE_URL}/api/reservations`,
                  {
                    reservation: {
                      tourProgramId: tourData.id,
                      userId: userInfo.id,
                      numOfPeople: appliedPeople,
                      totalPrice: totalPrice,
                      guideStartDate: `${year}-${month
                        .toString()
                        .padStart(2, '0')}-${day
                        .toString()
                        .padStart(2, '0')}T10:00:00`,
                      guideEndDate: `${year}-${month
                        .toString()
                        .padStart(2, '0')}-${day
                        .toString()
                        .padStart(2, '0')}T13:00:00`,
                      paymentMethod: 'kakaoPay',
                    },
                    impUid: response.imp_uid,
                    merchantUid: merchantUid,
                    userId: userInfo.id,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${cleanToken}`,
                      'Content-Type': 'application/json',
                    },
                  },
                );

                if (reservationResponse.data.status === 'OK') {
                  navigation.navigate('PaymentComplete', {success: true});
                } else {
                  navigation.navigate('PaymentComplete', {success: false});
                }
              } catch (error) {
                console.error('예약 정보 저장 실패:', error);
                navigation.navigate('PaymentComplete', {success: false});
              }
            } else {
              console.error('결제 실패:', response);
              navigation.navigate('PaymentComplete', {success: false});
            }
          }}
        />
      );
    } catch (error) {
      console.error('결제 처리 실패:', error);
      navigation.navigate('PaymentComplete', {success: false});
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.resultContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.resultText}>결제 처리 중...</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#f5f6fa'}}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 120}}>
        {/* 제목, 지역 */}
        <View style={styles.box}>
          <Text style={styles.title}>{tourData.title}</Text>
          <Text style={styles.region}>{tourData.region}</Text>
        </View>

        {/* 날짜 선택 */}
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

        {/* 인원 선택 */}
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

        {/* 총 금액 */}
        {appliedPeople !== null && (
          <View style={styles.box}>
            <Text style={styles.label}>총 금액</Text>
            <Text style={styles.totalPrice}>
              {totalPrice.toLocaleString()}원
            </Text>
          </View>
        )}

        {/* 환불제도 */}
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
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
  },
});

export default PaymentScreen;
