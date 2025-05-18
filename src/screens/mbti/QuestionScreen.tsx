import React, {useState, useEffect} from 'react';
import {API_URL} from '@env';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigations/root/RootNavigator';

type Question = {
  question: string;
  options: string[];
  result:undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'QuestionScreen'>;

export default function QuestionScreen({ navigation }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API_URL}/generate_question`);

        setQuestions(res.data.questions);
      } catch (error) {
        console.error(error);
        Alert.alert('오류', '질문을 불러오는 데 실패했어요.');
      }
    };
    fetchQuestions();
  }, []);

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
          const res = await axios.post(`${API_URL}/rag_recommend`, {
            answers: updatedAnswers,
          });
          navigation.navigate('Result', {result: res.data});
        } catch (error) {
          console.error(error);
          Alert.alert('오류', '분석 중 문제가 발생했어요.');
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
        <Text style={styles.loadingText}>분석 중입니다...</Text>
      </ScrollView>
    );
  }

  if (questions.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ActivityIndicator size="large" color="#0288d1" />
        <Text style={styles.loadingText}>질문을 불러오는 중...</Text>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>🌴 여행 성향 질문</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>
          질문 {currentIndex + 1} / {questions.length}
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
            <Text style={styles.prevButtonText}>⬅️ 이전 질문</Text>
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
    backgroundColor: '#e0f7fa',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0288d1',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  question: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 26,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  optionSelected: {
    backgroundColor: '#0288d1',
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  prevButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  prevButtonText: {
    color: '#0288d1',
    fontSize: 14,
  },
});