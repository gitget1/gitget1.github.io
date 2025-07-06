import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import {useTranslation} from 'react-i18next';
import {translateText, supportedLanguages} from '../../api/translator';

// ✅ MBTI 목록 아이템 타입
interface MbtiItem {
  mbtiId: number;
  mbti: string;
}

// ✅ MBTI 상세 정보 타입 (해시태그, 추천 지역 포함)
interface MbtiDetail {
  mbti: string;
  hashtags: string[];
  regions: string[];
}

// ✅ 투어 프로그램 데이터 타입
interface TourProgram {
  id: number;
  title: string;
  region: string;
  likes: number;
  comments: number;
  thumbnailUrl?: string;
  description?: string;
  guidePrice?: number;
  hashtags?: string[];
  reviewCount?: number;
  wishlistCount?: number;
}

const TraitSelection1 = () => {
  const [mbtiList, setMbtiList] = useState<string[]>([]);
  const [hashtagList, setHashtagList] = useState<string[]>([]);
  const [regionList, setRegionList] = useState<string[]>([]);
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const navigation = useNavigation();

  // MBTI, 해시태그, 지역 목록 불러오기 (실제 API로 대체 가능)
  useEffect(() => {
    // 예시: 실제 API로 대체
    setMbtiList(['ENFP', 'ISTJ', 'INTP', 'ENTJ', 'ISFP', 'ESFJ', 'INFP', 'ESTJ']);
    setHashtagList(['맛집', '자연', '역사', '힐링여행', '계획여행']);
    setRegionList(['서울', '부산', '제주', '강릉', '남해', '아산']);
  }, []);

  // 선택값이 바뀔 때마다 프로그램 불러오기
  useEffect(() => {
    if (selectedMbti || selectedHashtag || selectedRegion) {
      axios.get('http://124.60.137.10:8083/api/tour-program', {
        params: {
          mbti: selectedMbti,
          hashtags: selectedHashtag,
          regions: selectedRegion,
        },
      })
      .then(res => {
        if (res.data && res.data.data) {
          setPrograms(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
        } else {
          setPrograms([]);
        }
      })
      .catch(() => setPrograms([]));
    } else {
      setPrograms([]);
    }
  }, [selectedMbti, selectedHashtag, selectedRegion]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>MBTI</Text>
      <View style={styles.buttonRow}>
        {mbtiList.map(mbti => (
          <TouchableOpacity
            key={mbti}
            style={[styles.button, selectedMbti === mbti && styles.selectedButton]}
            onPress={() => setSelectedMbti(mbti === selectedMbti ? null : mbti)}>
            <Text style={[styles.buttonText, selectedMbti === mbti && styles.selectedButtonText]}>{mbti}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.title}>해시태그</Text>
      <View style={styles.buttonRow}>
        {hashtagList.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[styles.button, selectedHashtag === tag && styles.selectedButton]}
            onPress={() => setSelectedHashtag(tag === selectedHashtag ? null : tag)}>
            <Text style={[styles.buttonText, selectedHashtag === tag && styles.selectedButtonText]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.title}>지역</Text>
      <View style={styles.buttonRow}>
        {regionList.map(region => (
          <TouchableOpacity
            key={region}
            style={[styles.button, selectedRegion === region && styles.selectedButton]}
            onPress={() => setSelectedRegion(region === selectedRegion ? null : region)}>
            <Text style={[styles.buttonText, selectedRegion === region && styles.selectedButtonText]}>{region}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.title}>프로그램 리스트</Text>
      {programs.length === 0 ? (
        <Text style={styles.noResult}>조건에 맞는 프로그램이 없습니다.</Text>
      ) : (
        programs.map((program, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.programCard}
            onPress={() => navigation.navigate('PracticeDetail', { tourProgramId: program.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.programTitle}>{program.title}</Text>
            <Text style={styles.programDesc}>{program.description}</Text>
            <Text style={styles.programMeta}>지역: {program.region} / MBTI: {program.mbti}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 12 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  button: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  selectedButton: { backgroundColor: '#2196F3' },
  buttonText: { color: '#333', fontSize: 15 },
  selectedButtonText: { color: '#fff', fontWeight: 'bold' },
  programCard: {
    backgroundColor: '#f7f7fa',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  programTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  programDesc: { fontSize: 14, color: '#555', marginBottom: 4 },
  programMeta: { fontSize: 13, color: '#888' },
  noResult: { color: '#888', textAlign: 'center', marginVertical: 20 },
});

export default TraitSelection1;
