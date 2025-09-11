import React, {useState, useEffect} from 'react';
import {API_URL, API_URL_BE, GOOGLE_MAPS_API_KEY} from '@env';
import {
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  View,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigations/root/RootNavigator';
import {useTranslation} from 'react-i18next';

type Question = {
  question: string;
  options: string[];
};

type Props = NativeStackScreenProps<RootStackParamList, 'QuestionScreen'>;

export default function QuestionScreen({navigation}: Props) {
  const {t, i18n} = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ 공통 axios 인스턴스(환경변수 기반)
  const api = axios.create({
    baseURL: API_URL || 'http://10.147.17.48:8000', // 환경변수 또는 기본값
    timeout: 15000,
  });

  // ✅ API_URL 유효성 점검
  const ensureApiUrl = () => {
    const baseURL = API_URL || 'http://10.147.17.48:8000';
    if (!baseURL) {
      Alert.alert(
        '환경설정 오류',
        'API_URL이 설정되지 않았습니다. 기본값을 사용합니다.',
      );
      return false;
    }
    console.log('🔧 사용할 API_URL:', baseURL);
    return true;
  };

  // ✅ Authorization 헤더 생성(Bearer 중복 제거)
  const getAuthHeader = async () => {
    const raw = await AsyncStorage.getItem('accessToken');
    if (!raw) {
      return {};
    }
    const clean = raw.replace(/^Bearer\s+/i, '');
    return {Authorization: `Bearer ${clean}`};
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!ensureApiUrl()) {
          return;
        }

        const authHeader = await getAuthHeader();
        if (!('Authorization' in authHeader)) {
          Alert.alert(t('notification'), t('loginRequired'));
          return;
        }

        const res = await api.get('/generate_question', {
          params: {language: i18n.language},
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...authHeader,
          },
        });

        if (Array.isArray(res.data?.questions)) {
          setQuestions(res.data.questions);
        } else {
          console.log('[generate_question] unexpected response:', res.data);
          Alert.alert(t('error'), t('questionLoadError'));
        }
      } catch (error) {
        console.error('[generate_question] error:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          Alert.alert(t('notification'), t('loginRequired'));
        } else {
          Alert.alert(t('error'), t('questionLoadError'));
        }
      }
    };

    fetchQuestions();
    console.log('📦 현재 언어:', i18n.language);
    console.log('🔧 환경변수 확인:', {
      API_URL,
      API_URL_BE,
      GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY ? '설정됨' : 'undefined'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.language]);

  const handleSelectAnswer = async (option: string) => {
    setSelected(option);
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = option;
    setAnswers(updatedAnswers);

    setTimeout(async () => {
      setSelected('');
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setLoading(true);
        try {
          if (!ensureApiUrl()) {
            return;
          }

          const authHeader = await getAuthHeader();
          if (!('Authorization' in authHeader)) {
            Alert.alert(t('notification'), t('loginRequired'));
            return;
          }

          console.log('📤 최종 제출된 답변:', updatedAnswers);
          console.log(
            '🌐 호출 URL:',
            `${API_URL}/rag_recommend?language=${i18n.language}`,
          );

          // language는 params로 넘김
          const res = await api.post(
            '/rag_recommend',
            {answers: updatedAnswers},
            {
              params: {language: i18n.language},
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...authHeader,
              },
            },
          );

          console.log('✅ 분석 결과 응답:', res.data);
          navigation.navigate('Result', {result: res.data});
        } catch (error) {
          console.error('❌ 분석 중 오류 발생:', error);
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            Alert.alert(t('notification'), t('loginRequired'));
          } else {
            Alert.alert(t('error'), t('analysisError'));
          }
        } finally {
          setLoading(false);
        }
      }
    }, 300);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelected(answers[currentIndex - 1] || '');
    }
  };

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ActivityIndicator size="large" color="#0288d1" />
        <Text style={styles.loadingText}>{t('analyzing')}</Text>
      </ScrollView>
    );
  }

  if (questions.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ActivityIndicator size="large" color="#0288d1" />
        <Text style={styles.loadingText}>{t('loadingQuestions')}</Text>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>{t('travelPersonalityQuestion')}</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>
          {t('questionProgress', {
            current: currentIndex + 1,
            total: questions.length,
          })}
        </Text>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.buttonGroup}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelectAnswer(option)}
              style={[
                styles.optionButton,
                selected === option && styles.optionSelected,
              ]}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.optionText,
                  selected === option && styles.optionTextSelected,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentIndex > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
            <Text style={styles.prevButtonText}>{t('previousQuestion')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0f9ff',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
    lineHeight: 26,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#BBDEFB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  optionSelected: {
    backgroundColor: '#2196F3',
  },
  optionText: {
    fontSize: 16,
    color: '#0d47a1',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  prevButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  prevButtonText: {
    color: '#1976D2',
    fontSize: 14,
  },
});
