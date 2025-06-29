import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface TranslationHistory {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  isFavorite: boolean;
}

const TranslatorScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<Language>({
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
  });
  const [targetLanguage, setTargetLanguage] = useState<Language>({
    code: 'en',
    name: 'English',
    nativeName: 'English',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] = useState(false);
  const [selectorType, setSelectorType] = useState<'source' | 'target'>('source');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');

  // 번역 히스토리 저장
  const saveToHistory = async (originalText: string, translatedText: string) => {
    try {
      const historyItem: TranslationHistory = {
        id: Date.now().toString(),
        originalText,
        translatedText,
        sourceLanguage: sourceLanguage.code,
        targetLanguage: targetLanguage.code,
        timestamp: Date.now(),
        isFavorite: false,
      };

      const existingHistory = await AsyncStorage.getItem('translationHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // 최대 100개까지만 저장
      const updatedHistory = [historyItem, ...history].slice(0, 100);
      
      await AsyncStorage.setItem('translationHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('히스토리 저장 오류:', error);
    }
  };

  // 언어 교체 함수
  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setInputText(translatedText);
    setTranslatedText('');
  };

  // 번역 함수 (비활성화)
  const performTranslation = async (text: string, from: string, to: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsLoading(true);
    try {
      // 번역 기능이 비활성화되었음을 알림
      setTranslatedText('번역 기능이 현재 비활성화되었습니다.');
      Alert.alert('알림', '번역 기능이 현재 비활성화되었습니다.');
    } catch (error) {
      console.error('번역 오류:', error);
      Alert.alert('번역 오류', '번역 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 입력 텍스트가 변경될 때 자동 번역 (비활성화)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputText.trim()) {
        // 번역 기능 비활성화
        setTranslatedText('번역 기능이 현재 비활성화되었습니다.');
      } else {
        setTranslatedText('');
        setDetectedLanguage('');
      }
    }, 1000); // 1초 딜레이

    return () => clearTimeout(timeoutId);
  }, [inputText, sourceLanguage.code, targetLanguage.code]);

  // 언어 자동 감지 (비활성화)
  const autoDetectLanguage = async (text: string) => {
    if (text.trim()) {
      try {
        // 언어 감지 기능 비활성화
        setDetectedLanguage('언어 감지 기능이 비활성화되었습니다.');
      } catch (error) {
        console.error('언어 감지 오류:', error);
      }
    }
  };

  // 언어 선택기 열기
  const openLanguageSelector = (type: 'source' | 'target') => {
    setSelectorType(type);
    setIsLanguageSelectorVisible(true);
  };

  // 언어 선택
  const selectLanguage = (language: Language) => {
    if (selectorType === 'source') {
      setSourceLanguage(language);
    } else {
      setTargetLanguage(language);
    }
    setIsLanguageSelectorVisible(false);
  };

  // 텍스트 복사
  const copyText = (text: string) => {
    if (text.trim()) {
      Clipboard.setString(text);
      Alert.alert('복사됨', '텍스트가 클립보드에 복사되었습니다.');
    }
  };

  // 클립보드에서 텍스트 붙여넣기
  const pasteText = async () => {
    try {
      const text = await Clipboard.getString();
      if (text.trim()) {
        setInputText(text);
      }
    } catch (error) {
      console.error('클립보드 읽기 오류:', error);
    }
  };

  // 음성 입력 (시뮬레이션)
  const startVoiceInput = () => {
    Alert.alert('음성 입력', '음성 입력 기능은 별도 구현이 필요합니다.');
  };

  // 빠른 재사용 기능
  const quickReuse = () => {
    Alert.alert(
      '빠른 재사용',
      '최근 번역 기록에서 텍스트를 선택하여 재사용할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '히스토리에서 선택', 
          onPress: () => navigation.navigate('TranslatorHistory')
        }
      ]
    );
  };

  // 재사용 텍스트 확인
  const checkReuseText = async () => {
    try {
      const reuseText = await AsyncStorage.getItem('reuseText');
      if (reuseText) {
        Alert.alert(
          '재사용 텍스트',
          `"${reuseText.substring(0, 30)}${reuseText.length > 30 ? '...' : ''}"\n이 텍스트를 입력하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '입력',
              onPress: () => {
                setInputText(reuseText);
                AsyncStorage.removeItem('reuseText'); // 사용 후 삭제
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('재사용 텍스트 확인 오류:', error);
    }
  };

  // 화면 포커스 시 재사용 텍스트 확인
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkReuseText();
    });

    return unsubscribe;
  }, [navigation]);

  // 언어 감지 버튼
  const handleLanguageDetection = () => {
    if (inputText.trim()) {
      autoDetectLanguage(inputText);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🌍 실시간 번역기</Text>
          <Text style={styles.headerSubtitle}>여행 중 언어 장벽을 없애보세요!</Text>
        </View>
        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('TranslatorHistory')}>
          <Icon name="history" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 언어 선택 영역 */}
        <View style={styles.languageSelector}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => openLanguageSelector('source')}
          >
            <Text style={styles.languageCode}>{sourceLanguage.code.toUpperCase()}</Text>
            <Text style={styles.languageName}>{sourceLanguage.nativeName}</Text>
            <Icon name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={swapLanguages}>
            <Icon name="swap-horiz" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => openLanguageSelector('target')}
          >
            <Text style={styles.languageCode}>{targetLanguage.code.toUpperCase()}</Text>
            <Text style={styles.languageName}>{targetLanguage.nativeName}</Text>
            <Icon name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 언어 감지 결과 표시 */}
        {detectedLanguage && detectedLanguage !== sourceLanguage.code && (
          <View style={styles.detectionContainer}>
            <Text style={styles.detectionText}>
              🔍 감지된 언어: {sourceLanguage.nativeName}
            </Text>
            <TouchableOpacity onPress={handleLanguageDetection}>
              <Text style={styles.detectionButton}>언어 감지</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>입력 텍스트</Text>
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.actionButton} onPress={quickReuse}>
                <Icon name="history" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={pasteText}>
                <Icon name="content-paste" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleLanguageDetection}>
                <Icon name="search" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setInputText('')}
              >
                <Icon name="clear" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="번역할 텍스트를 입력하세요..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 번역 결과 영역 */}
        <View style={styles.outputContainer}>
          <View style={styles.outputHeader}>
            <Text style={styles.outputLabel}>번역 결과</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyText(translatedText)}
            >
              <Icon name="content-copy" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.translatedTextContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>번역 중...</Text>
              </View>
            ) : (
              <Text style={styles.translatedText}>
                {translatedText || '번역 결과가 여기에 표시됩니다.'}
              </Text>
            )}
          </View>
        </View>

        {/* 여행 관련 번역 예시 */}
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>💡 여행에서 자주 쓰는 표현</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              '안녕하세요',
              '감사합니다',
              '화장실이 어디인가요?',
              '얼마인가요?',
              '맛있어요',
              '도와주세요',
              'Where is the nearest station?',
              'How much does this cost?',
              'Can you help me?',
            ].map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleButton}
                onPress={() => setInputText(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* 언어 선택 모달 */}
      {isLanguageSelectorVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectorType === 'source' ? '원본 언어' : '번역 언어'} 선택
              </Text>
              <TouchableOpacity
                onPress={() => setIsLanguageSelectorVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {[
                { code: 'ko', name: 'Korean', nativeName: '한국어' },
                { code: 'en', name: 'English', nativeName: 'English' },
                { code: 'ja', name: 'Japanese', nativeName: '日本語' },
                { code: 'zh', name: 'Chinese', nativeName: '中文' },
                { code: 'es', name: 'Spanish', nativeName: 'Español' },
                { code: 'fr', name: 'French', nativeName: 'Français' },
              ].map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={styles.languageItem}
                  onPress={() => selectLanguage(language)}
                >
                  <Text style={styles.languageItemCode}>{language.code.toUpperCase()}</Text>
                  <Text style={styles.languageItemName}>{language.nativeName}</Text>
                  <Text style={styles.languageItemEnglish}>({language.name})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  historyButton: {
    padding: 10,
    position: 'absolute',
    right: 0,
    top: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  languageName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  swapButton: {
    padding: 10,
    marginHorizontal: 10,
  },
  detectionContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectionText: {
    fontSize: 14,
    color: '#1976D2',
    flex: 1,
  },
  detectionButton: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  outputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  outputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  translatedTextContainer: {
    minHeight: 120,
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  translatedText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  examplesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  exampleButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  exampleText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageItemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 40,
  },
  languageItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  languageItemEnglish: {
    fontSize: 14,
    color: '#666',
  },
});

export default TranslatorScreen; 