import React, {useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '@env';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import {AppStackScreenProps} from '../../navigations/AppNavigator';

export default function ResultScreen({
  route,
  navigation,
}: AppStackScreenProps<'Result'>) {
  const {result} = route.params;
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const payload = {
        travelMbti: result.mbti,
        hashtags: result.tags,
        regions: result.recommended_regions,
      };

      // ✅ 토큰 가져오기
      const token = await AsyncStorage.getItem('accessToken');
      console.log('📦 저장 요청용 Access Token:', token);
      console.log('📤 서버로 보낼 payload:', payload);
      const response = await axios.post(
        'http://124.60.137.10:80/api/mbti',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && {Authorization: `Bearer ${token}`}), // 토큰이 있으면 추가
          },
        },
      );

      if (response.status === 200) {
        Alert.alert(
          '✅ 저장 성공',
          'MBTI 분석 결과가 성공적으로 저장되었습니다.',
        );
      } else {
        Alert.alert('⚠️ 저장 실패', '서버 응답이 올바르지 않습니다.');
      }
    } catch (error: any) {
      console.error('MBTI 저장 실패:', error);
      Alert.alert(
        '❌ 저장 실패',
        error?.response?.data?.detail || '서버 오류가 발생했습니다.',
      );
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeedback) {
      Alert.alert('알림', '만족도를 선택해주세요.');
      return;
    }

    const feedbackMap: Record<string, {isAgree: boolean; comment: string}> = {
      very_good: {isAgree: true, comment: '매우 정확했어요!'},
      good: {isAgree: true, comment: '꽤 맞는 것 같아요'},
      neutral: {isAgree: true, comment: '보통이에요'},
      bad: {isAgree: false, comment: '조금 다른 것 같아요'},
      very_bad: {isAgree: false, comment: '전혀 맞지 않았어요'},
    };

    const selected = feedbackMap[selectedFeedback];

    try {
      const response = await axios.post(`${API_URL}/feedback`, {
        user_answer_id: result.user_answer_id,
        is_agree: selected.isAgree,
        comment: selected.comment,
      });

      if (response.data.message) {
        Alert.alert('제출 완료', '만족도가 성공적으로 저장되었습니다!');
      } else {
        Alert.alert('에러', response.data.error || '알 수 없는 오류');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류 발생', '피드백 전송 중 문제가 발생했습니다.');
    }
  };

  const handleMain = () => {
    Alert.alert('메인화면', '메인 화면으로 이동 될 예정입니다.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerWrapper}>
        <Text style={styles.title}>여행 성향 분석 결과</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🧠 예측된 MBTI</Text>
        <Text style={styles.mbti}>{result.mbti}</Text>
        <Text style={styles.description}>
          {result.trait?.description || '설명 없음'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💬 여행 성향 분석</Text>
        <Text style={styles.text}>{result.recommendation}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏷️ 추천 해시태그</Text>
        <View style={styles.tagsWrapperLeft}>
          {result.tags?.map((tag: string, idx: number) => (
            <Text key={idx} style={styles.tag}>
              {tag}
            </Text>
          )) || <Text>없음</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📍 추천 여행지</Text>
        {result.recommended_regions?.map((region: string, index: number) => (
          <Text key={index} style={styles.region}>
            - {region}
          </Text>
        )) || <Text>없음</Text>}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.inlineButton} onPress={handleSave}>
          <Text style={styles.inlineText}>💾 결과 저장</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineButton}
          onPress={() => navigation.navigate('QuestionScreen')}>
          <Text style={styles.inlineText}>🔄 다시 검사하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inlineButton} onPress={handleMain}>
          <Text style={styles.inlineText}>🏠 메인 화면</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedbackContainer}>
        <Text style={styles.sectionTitle}>
          😊 이 MBTI 결과는 얼마나 잘 맞았나요?
        </Text>
        <View style={styles.feedbackOptions}>
          {[
            {key: 'very_good', label: '매우 정확해요'},
            {key: 'good', label: '꽤 맞아요'},
            {key: 'neutral', label: '보통이에요'},
            {key: 'bad', label: '조금 달라요'},
            {key: 'very_bad', label: '전혀 아니에요'},
          ].map(({key, label}) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.feedbackOption,
                selectedFeedback === key && styles.feedbackOptionSelected,
              ]}
              onPress={() => setSelectedFeedback(key)}>
              <Text style={styles.feedbackOptionText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitFeedback}>
          <Text style={styles.submitText}>📝 만족도 제출</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
  },
  headerWrapper: {
    marginBottom: 10,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 20,
    color: '#0288d1',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0288d1',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0077b6',
  },
  mbti: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0096c7',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  tagsWrapperLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#b2ebf2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    fontSize: 14,
    color: '#00796b',
    margin: 6,
  },
  region: {
    fontSize: 16,
    marginBottom: 6,
    color: '#006064',
  },
  feedbackContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  feedbackOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  feedbackOption: {
    backgroundColor: '#eeeeee',
    padding: 10,
    borderRadius: 12,
    margin: 6,
  },
  feedbackOptionSelected: {
    backgroundColor: '#4fc3f7',
  },
  feedbackOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: '#0288d1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  inlineButton: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    margin: 5,
  },
  inlineText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
