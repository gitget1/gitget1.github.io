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
import {useTranslation} from 'react-i18next';

export default function ResultScreen({
  route,
  navigation,
}: AppStackScreenProps<'Result'>) {
  const {t} = useTranslation();
  const {result} = route.params;
  // const result = {
  //   mbti: 'ENFJ',
  //   trait: {
  //     main_title: '사람 좋아하는 인싸 여행자',
  //     description:
  //       '친화력 1등! 혼자 여행가도 문제없어. 사람을 잘 챙기고 잘 어울림. 아 그거? 혹시나 해서 가져왔지~ 여행 준비성 철저한 편. 이번 휴가에 거기 가볼래!? 추진력 갑.. 부드럽게 계획 제시하는 편. 새로운 여행지 가보는 것 좋아함.',
  //   },
  //   recommendation:
  //     '사람을 잘 챙기고 리더십도 있는 타입. 단체 여행을 잘 이끌며 새로운 지역을 탐험하는 걸 즐깁니다. 타인의 필요를 잘 캐치하고 계획도 잘 세우는 든든한 여행 동반자!',
  //   tags: ['친화력', '사교성', '리더십', '계획적', '여행 준비성'],
  //   recommended_regions: ['부산', '전주', '제주도'],
  //   user_answer_id: 1,
  // };
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
        Alert.alert(t('saveSuccess'), t('saveSuccessMessage'));
      } else {
        Alert.alert(t('saveFailed'), t('serverResponseError'));
      }
    } catch (error: any) {
      console.error('MBTI 저장 실패:', error);
      Alert.alert(
        t('saveError'),
        error?.response?.data?.detail || t('serverError'),
      );
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedFeedback) {
      Alert.alert(t('notification'), t('selectSatisfaction'));
      return;
    }

    const feedbackMap: Record<string, {isAgree: boolean; comment: string}> = {
      very_good: {isAgree: true, comment: t('veryAccurate')},
      good: {isAgree: true, comment: t('quiteAccurate')},
      neutral: {isAgree: true, comment: t('neutral')},
      bad: {isAgree: false, comment: t('slightlyDifferent')},
      very_bad: {isAgree: false, comment: t('notAccurate')},
    };

    const selected = feedbackMap[selectedFeedback];

    try {
      const response = await axios.post(`${API_URL}/feedback`, {
        user_answer_id: result.user_answer_id,
        is_agree: selected.isAgree,
        comment: selected.comment,
      });

      if (response.data.message) {
        Alert.alert(t('submitComplete'), t('satisfactionSaved'));
      } else {
        Alert.alert(t('error'), response.data.error || t('unknownError'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('error'), t('feedbackError'));
    }
  };

  const handleMain = () => {
    navigation.navigate('Main');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerWrapper}>
        <Text style={styles.title}>{t('travelPersonalityResult')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('predictedMbti')}</Text>
        <Text style={styles.mbti}>{result.mbti}</Text>
        <Text style={styles.description}>
          {result.trait?.description || t('noDescription')}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {t('travelPersonalityAnalysis')}
        </Text>
        <Text style={styles.text}>{result.recommendation}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('recommendedHashtags')}</Text>
        <View style={styles.tagsWrapperLeft}>
          {result.tags?.map((tag: string, idx: number) => (
            <Text key={idx} style={styles.tag}>
              {tag}
            </Text>
          )) || <Text>{t('none')}</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('recommendedDestinations')}</Text>
        {result.recommended_regions?.map((region: string, index: number) => (
          <Text key={index} style={styles.region}>
            - {region}
          </Text>
        )) || <Text>{t('none')}</Text>}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.inlineButton} onPress={handleSave}>
          <Text style={styles.inlineText}>{t('saveResult')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineButton}
          onPress={() => navigation.navigate('QuestionScreen')}>
          <Text style={styles.inlineText}>{t('retakeTest')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inlineButton} onPress={handleMain}>
          <Text style={styles.inlineText}>{t('goToMain')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feedbackContainer}>
        <Text style={styles.sectionTitle}>{t('howAccurate')}</Text>
        <View style={styles.feedbackOptions}>
          {[
            {key: 'very_good', label: t('veryAccurate')},
            {key: 'good', label: t('quiteAccurate')},
            {key: 'neutral', label: t('neutral')},
            {key: 'bad', label: t('slightlyDifferent')},
            {key: 'very_bad', label: t('notAccurate')},
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
          <Text style={styles.submitText}>{t('submitSatisfaction')}</Text>
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
