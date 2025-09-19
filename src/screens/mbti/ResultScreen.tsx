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
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);

  // ✅ Authorization 헤더 유틸 (Bearer 중복 제거)
  const getAuthHeader = async () => {
    const raw = await AsyncStorage.getItem('accessToken');
    if (!raw) {
      return {};
    }
    const clean = raw.replace(/^Bearer\s+/i, '');
    return {Authorization: `Bearer ${clean}`};
  };

  const handleSave = async () => {
    try {
      const payload = {
        travelMbti: result.mbti,
        hashtags: result.tags,
        regions: result.recommended_regions,
      };

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(await getAuthHeader()),
      };

      console.log('📤 MBTI 저장 payload:', payload);

      // NOTE: 필요시 여기를 API_URL 기반으로 교체하세요 (예: `${API_URL}/mbti`)
      const response = await axios.post(
        'http://124.60.137.10:8083/api/mbti',
        payload,
        {headers},
      );

      if (response.status === 200 || response.data?.status === 'OK') {
        Alert.alert(t('saveSuccess'), t('saveSuccessMessage'));
      } else {
        Alert.alert(t('saveFailed'), t('serverResponseError'));
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log('[MBTI SAVE][AxiosError]', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
        });
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          t('serverError');
        Alert.alert(t('saveError'), msg);
      } else {
        console.error('[MBTI SAVE][UnknownError]', error);
        Alert.alert(t('saveError'), t('serverError'));
      }
    }
  };

  // ⬇️ 기존 handleSubmitFeedback 전체 교체
  const handleSubmitFeedback = async () => {
    if (!selectedFeedback) {
      Alert.alert(t('notification'), t('selectSatisfaction'));
      return;
    }

    // API_URL 유효성 체크
    if (!API_URL) {
      Alert.alert(
        '환경설정 오류',
        '.env의 API_URL이 비어 있습니다. 설정 후 앱을 재시작하세요.',
      );
      return;
    }

    // user_answer_id 검증 (숫자 변환)
    const userAnswerId = Number(result.user_answer_id);
    if (!Number.isFinite(userAnswerId)) {
      Alert.alert(t('error'), 'user_answer_id가 유효하지 않습니다.');
      return;
    }

    // 선택 맵핑
    const feedbackMap: Record<string, {isAgree: boolean; comment: string}> = {
      very_good: {isAgree: true, comment: t('veryAccurate')},
      good: {isAgree: true, comment: t('quiteAccurate')},
      neutral: {isAgree: true, comment: t('neutral')},
      bad: {isAgree: false, comment: t('slightlyDifferent')},
      very_bad: {isAgree: false, comment: t('notAccurate')},
    };
    const selected = feedbackMap[selectedFeedback];

    try {
      // 인증 헤더 + 공통 헤더
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(await getAuthHeader()), // ✅ Authorization: Bearer <token>
      };

      // URL 정규화(말단 슬래시 제거 후 /feedback 부착)
      const url = `${API_URL.replace(/\/+$/, '')}/feedback`;

      // 요청 바디
      const body = {
        user_answer_id: userAnswerId,
        is_agree: selected.isAgree,
        comment: selected.comment,
      };

      console.log('📤 Feedback POST:', url, body);

      const response = await axios.post(url, body, {
        headers,
        timeout: 15000,
      });

      if (
        response.status === 200 ||
        response.status === 201 ||
        response.status === 204 ||
        response.data?.message
      ) {
        Alert.alert(t('submitComplete'), t('satisfactionSaved'));
      } else {
        Alert.alert(t('error'), response.data?.error || t('unknownError'));
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        console.log('[FEEDBACK][AxiosError]', {
          status,
          data,
          url: error.config?.url || `${API_URL}/feedback`,
          message: error.message,
        });

        // 상태별 메시지 보완
        let msg =
          data?.detail ||
          data?.message ||
          (status === 401 ? t('loginRequired') : t('feedbackError'));

        Alert.alert(t('error'), msg);
      } else {
        console.log('[FEEDBACK][UnknownError]', error);
        Alert.alert(t('error'), t('feedbackError'));
      }
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