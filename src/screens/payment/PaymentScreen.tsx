import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';

const paymentMethods = ['네이버 페이', '카카오 페이', '카드 추가'];

const refundTable = Array.from({length: 11}, (_, i) => ({
  day: 10 - i,
  percent: (10 - i) * 10,
}));

const PaymentScreen = () => {
  // 게시물 정보 (예시)
  const post = {
    title: '제주 바다',
    region: '제주',
    rating: 4.5,
    pricePerNight: 100000,
    nights: 2,
  };

  // 날짜 상태
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  // 인원 상태
  const [people, setPeople] = useState(1);
  const [appliedPeople, setAppliedPeople] = useState<number | null>(null);

  // 결제수단 상태
  const [payment, setPayment] = useState(paymentMethods[0]);

  // 총 금액 계산
  const totalPrice = appliedPeople
    ? post.pricePerNight * post.nights * appliedPeople
    : 0;

  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);

  const handlePayment = () => {
    setIsLoading(true);
    setResult(null);
    // 실제 결제 API 호출 부분
    setTimeout(() => {
      // 성공/실패 랜덤 예시 (실제는 API 응답에 따라)
      const isSuccess = Math.random() > 0.3;
      setIsLoading(false);
      setResult(isSuccess ? 'success' : 'fail');
    }, 2000);
  };

  // 결과 화면
  if (isLoading) {
    return (
      <View style={styles.resultContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.resultText}>결제 처리 중...</Text>
      </View>
    );
  }
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
  if (result === 'fail') {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultIcon}>❌</Text>
        <Text style={styles.resultText}>결제에 실패하였습니다.</Text>
        <TouchableOpacity
          style={styles.resultBtn}
          onPress={() => setResult(null)}>
          <Text style={styles.resultBtnText}>다시 시도</Text>
        </TouchableOpacity>
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
          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.region}>{post.region}</Text>
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

        {/* 결제수단 선택 */}
        <View style={styles.box}>
          <Text style={styles.label}>결제수단</Text>
          <View style={styles.payMethodCol}>
            {['네이버 페이', '카카오 페이', '카드 추가'].map(method => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.payBtn,
                  payment === method && styles.payBtnSelected,
                ]}
                onPress={() => setPayment(method)}>
                <Text style={styles.payBtnText}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  payMethodCol: {
    flexDirection: 'column',
    gap: 12,
  },
  payBtn: {
    backgroundColor: '#eee',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%',
    marginTop: 0,
  },
  payBtnSelected: {
    backgroundColor: '#ffd6e0',
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
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
