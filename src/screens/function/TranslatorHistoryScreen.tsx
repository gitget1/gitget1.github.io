import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';

interface TranslationHistory {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
  isFavorite: boolean;
}

const TranslatorHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  // 히스토리 불러오기
  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('translationHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('히스토리 불러오기 오류:', error);
    }
  };

  // 히스토리 저장
  const saveHistory = async (newHistory: TranslationHistory[]) => {
    try {
      await AsyncStorage.setItem('translationHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('히스토리 저장 오류:', error);
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = (id: string) => {
    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  // 히스토리 삭제
  const deleteHistory = (id: string) => {
    Alert.alert(
      '삭제 확인',
      '이 번역 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            const updatedHistory = history.filter(item => item.id !== id);
            setHistory(updatedHistory);
            saveHistory(updatedHistory);
          },
        },
      ]
    );
  };

  // 전체 히스토리 삭제
  const clearAllHistory = () => {
    Alert.alert(
      '전체 삭제 확인',
      '모든 번역 기록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setHistory([]);
            saveHistory([]);
          },
        },
      ]
    );
  };

  // 텍스트 복사
  const copyText = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('복사됨', '텍스트가 클립보드에 복사되었습니다.');
  };

  // 텍스트 재사용
  const reuseText = async (text: string) => {
    Alert.alert(
      '텍스트 재사용',
      '이 텍스트를 번역기에 입력하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '재사용',
          onPress: async () => {
            try {
              // AsyncStorage에 재사용할 텍스트 저장
              await AsyncStorage.setItem('reuseText', text);
              navigation.navigate('Translator');
            } catch (error) {
              console.error('텍스트 저장 오류:', error);
              Alert.alert('오류', '텍스트 저장 중 문제가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  // 언어 코드를 언어 이름으로 변환
  const getLanguageName = (code: string) => {
    const languageMap: { [key: string]: string } = {
      ko: '한국어',
      en: 'English',
      ja: '日本語',
      zh: '中文',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
    };
    return languageMap[code] || code.toUpperCase();
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = filter === 'favorites' 
    ? history.filter(item => item.isFavorite)
    : history;

  const renderHistoryItem = ({ item }: { item: TranslationHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.languageInfo}>
          <Text style={styles.languageText}>
            {getLanguageName(item.sourceLanguage)} → {getLanguageName(item.targetLanguage)}
          </Text>
          <Text style={styles.timestampText}>{formatDate(item.timestamp)}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Icon
              name={item.isFavorite ? 'favorite' : 'favorite-border'}
              size={20}
              color={item.isFavorite ? '#FF3B30' : '#666'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteHistory(item.id)}
          >
            <Icon name="delete" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.textContainer}
        onPress={() => copyText(item.originalText)}
        onLongPress={() => reuseText(item.originalText)}
      >
        <Text style={styles.originalText}>{item.originalText}</Text>
        <Icon name="content-copy" size={16} color="#999" style={styles.copyIcon} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.textContainer}
        onPress={() => copyText(item.translatedText)}
        onLongPress={() => reuseText(item.translatedText)}
      >
        <Text style={styles.translatedText}>{item.translatedText}</Text>
        <Icon name="content-copy" size={16} color="#999" style={styles.copyIcon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 번역 히스토리</Text>
        <Text style={styles.headerSubtitle}>이전 번역 기록을 확인하세요</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            전체 ({history.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'favorites' && styles.activeFilter]}
          onPress={() => setFilter('favorites')}
        >
          <Text style={[styles.filterText, filter === 'favorites' && styles.activeFilterText]}>
            즐겨찾기 ({history.filter(item => item.isFavorite).length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="history" size={64} color="#CCC" />
          <Text style={styles.emptyText}>
            {filter === 'favorites' ? '즐겨찾기한 번역이 없습니다.' : '번역 기록이 없습니다.'}
          </Text>
          <Text style={styles.emptySubtext}>
            번역기를 사용하면 여기에 기록이 저장됩니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          style={styles.historyList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {history.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearAllHistory}>
          <Icon name="delete-sweep" size={20} color="#FF3B30" />
          <Text style={styles.clearButtonText}>전체 삭제</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  originalText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  translatedText: {
    fontSize: 16,
    color: '#007AFF',
    flex: 1,
    lineHeight: 22,
    fontWeight: '500',
  },
  copyIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
});

export default TranslatorHistoryScreen; 