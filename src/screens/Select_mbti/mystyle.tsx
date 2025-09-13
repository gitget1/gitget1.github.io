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
  SafeAreaView,
  Image,
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

/** 충청남도 시·군 좌표 (대략 중심) */
const CHUNGNAM_REGIONS: Array<{
  name: string;
  latitude: number;
  longitude: number;
}> = [
  {name: '천안시', latitude: 36.8151, longitude: 127.1139},
  {name: '아산시', latitude: 36.7899, longitude: 127.0019},
  {name: '공주시', latitude: 36.4468, longitude: 127.119},
  {name: '보령시', latitude: 36.3335, longitude: 126.6129},
  {name: '서산시', latitude: 36.7845, longitude: 126.45},
  {name: '논산시', latitude: 36.1872, longitude: 127.098},
  {name: '당진시', latitude: 36.8925, longitude: 126.629},
  {name: '계룡시', latitude: 36.2746, longitude: 127.2486},
  {name: '금산군', latitude: 36.1086, longitude: 127.4889},
  {name: '부여군', latitude: 36.2753, longitude: 126.9097},
  {name: '서천군', latitude: 36.0808, longitude: 126.6912},
  {name: '청양군', latitude: 36.4591, longitude: 126.8022},
  {name: '홍성군', latitude: 36.6011, longitude: 126.6608},
  {name: '예산군', latitude: 36.682, longitude: 126.8486},
  {name: '태안군', latitude: 36.7457, longitude: 126.2987},
];

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

const MyStyle = () => {
  const [mbtiList, setMbtiList] = useState<string[]>([]);
  const [hashtagList, setHashtagList] = useState<string[]>([]);
  const [regionList, setRegionList] = useState<string[]>([]);
  const [selectedMbti, setSelectedMbti] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();

  // MBTI, 해시태그, 지역 목록 불러오기 (실제 API로 대체 가능)
  useEffect(() => {
    // 예시: 실제 API로 대체
    setMbtiList(['ENFP', 'ISTJ', 'INTP', 'ENTJ', 'ISFP', 'ESFJ', 'INFP', 'ESTJ']);
    setHashtagList([
      '혼자여행',
      '커플여행',
      '가족여행',
      '우정여행',
      '여행버디',
      '즉흥여행',
      '계획여행',
      '자연여행',
      '도시탐방',
      '문화유산',
      '힐링여행',
      '액티비티',
      '맛집투어',
      '야경명소',
      '해수욕장',
      '산정상뷰',
      '계곡여행',
      '한옥마을',
      '전통시장',
      '한강산책',
      '감성숙소',
      '가성비숙소',
      '한적한여행',
      '혼산',
      '혼캠',
      '감성사진',
      '카페투어',
      '야경촬영',
      '자연과함께',
      '힐링산책',
      '산림욕',
      '한적한바닷가',
      '로컬푸드',
      '재충전',
      '계획없이떠나기',
      '사진맛집',
      '편한여행',
      '감성여행',
      '조용한여행',
      '감성가득',
      '쉼표여행',
      '마음정리',
      '트레킹',
      '일상탈출',
      '소확행',
      '걷기좋은길',
      '하늘풍경',
      '초록자연',
      '일몰명소',
      '바람쐬기',
    ]);
    setRegionList(CHUNGNAM_REGIONS.map(region => region.name));
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 헤더 섹션 */}
        <View style={styles.headerBox}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('Main')}
            >
              <Ionicons name="arrow-back" size={24} color="#1e7c3c" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>나만의 스타일 찾기</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.profileWrap}>
            <Image
              source={require('../../assets/default.png')}
              style={styles.profileCircle}
            />
            <Text style={styles.helloText}>맞춤형 여행 프로그램을 찾아보세요</Text>
          </View>
        </View>

        {/* 필터 섹션 */}
        <View style={styles.filterSection}>
          {/* 해시태그 섹션 */}
          <View style={styles.filterGroup}>
            <View style={styles.filterHeader}>
              <Text style={styles.sectionTitle}>해시태그</Text>
              <Text style={styles.filterCount}>{hashtagList.length}개</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {hashtagList.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.compactButton, selectedHashtag === tag && styles.selectedCompactButton]}
                  onPress={() => setSelectedHashtag(tag === selectedHashtag ? null : tag)}>
                  <Text style={[styles.compactButtonText, selectedHashtag === tag && styles.selectedCompactButtonText]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* 지역 섹션 */}
          <View style={styles.filterGroup}>
            <View style={styles.filterHeader}>
              <Text style={styles.sectionTitle}>지역</Text>
              <Text style={styles.filterCount}>{regionList.length}개</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {regionList.map(region => (
                <TouchableOpacity
                  key={region}
                  style={[styles.compactButton, selectedRegion === region && styles.selectedCompactButton]}
                  onPress={() => setSelectedRegion(region === selectedRegion ? null : region)}>
                  <Text style={[styles.compactButtonText, selectedRegion === region && styles.selectedCompactButtonText]}>
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 선택된 필터 표시 */}
          {(selectedHashtag || selectedRegion) && (
            <View style={styles.selectedFiltersContainer}>
              <Text style={styles.selectedFiltersTitle}>선택된 필터:</Text>
              <View style={styles.selectedFiltersRow}>
                {selectedHashtag && (
                  <View style={styles.selectedFilterTag}>
                    <Text style={styles.selectedFilterText}>#{selectedHashtag}</Text>
                    <TouchableOpacity onPress={() => setSelectedHashtag(null)}>
                      <Text style={styles.removeFilterText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {selectedRegion && (
                  <View style={styles.selectedFilterTag}>
                    <Text style={styles.selectedFilterText}>📍 {selectedRegion}</Text>
                    <TouchableOpacity onPress={() => setSelectedRegion(null)}>
                      <Text style={styles.removeFilterText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* 프로그램 리스트 섹션 */}
        <View style={styles.programSection}>
          <Text style={styles.sectionTitle}>추천 프로그램</Text>
          {programs.length === 0 ? (
            <View style={styles.noResultContainer}>
              <Text style={styles.noResultIcon}>🔍</Text>
              <Text style={styles.noResult}>조건에 맞는 프로그램이 없습니다.</Text>
            </View>
          ) : (
            <View style={styles.programGrid}>
              {programs.map((program, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.programCard}
                  onPress={() => navigation.navigate('PracticeDetail', { tourProgramId: program.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.programImageContainer}>
                    <Image
                      source={require('../../assets/default.png')}
                      style={styles.programImage}
                    />
                    {program.title !== '아산 여행' && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.programContent}>
                    <Text style={styles.programTitle} numberOfLines={2}>{program.title}</Text>
                    <Text style={styles.programDesc} numberOfLines={2}>{program.description}</Text>
                    <View style={styles.programMeta}>
                      <Text style={styles.programRegion}>📍 {program.region}</Text>
                      <Text style={styles.programLikes}>❤️ {program.likes || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBox: {
    paddingVertical: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e7c3c',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // 뒤로가기 버튼과 같은 너비로 균형 맞춤
  },
  profileWrap: {
    alignItems: 'center',
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  helloText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterCount: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  horizontalScroll: {
    maxHeight: 50,
  },
  scrollContent: {
    paddingRight: 16,
  },
  compactButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 60,
    alignItems: 'center',
  },
  selectedCompactButton: {
    backgroundColor: '#1e7c3c',
    borderColor: '#1e7c3c',
    shadowColor: '#1e7c3c',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  compactButtonText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCompactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedFiltersContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1e7c3c',
  },
  selectedFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  selectedFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e7c3c',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  removeFilterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  programSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  programCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  programImageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  programImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  programContent: {
    padding: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  programDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  programMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programRegion: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  programLikes: {
    fontSize: 12,
    color: '#e91e63',
    fontWeight: '500',
  },
  noResultContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResult: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MyStyle;
