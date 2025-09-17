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
  Modal,
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
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [hashtagSelectVisible, setHashtagSelectVisible] = useState(false);
  const [regionSelectVisible, setRegionSelectVisible] = useState(false);
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
    if (selectedMbti || selectedHashtags.length > 0 || selectedRegion) {
      axios.get('http://124.60.137.10:8083/api/tour-program', {
        params: {
          mbti: selectedMbti,
          hashtags: selectedHashtags.join(','),
          regions: selectedRegion,
        },
      })
      .then(async res => {
        console.log('🟢 mystyle API 응답:', res.data);
        if (res.data && res.data.data) {
          const programsData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          console.log('🟢 프로그램 데이터:', programsData);
          
          // 각 프로그램의 상세 정보를 가져와서 wishlistCount 업데이트
          const updatedPrograms = await Promise.all(
            programsData.map(async (program) => {
              try {
                const token = await AsyncStorage.getItem('accessToken');
                const cleanToken = token?.replace('Bearer ', '') || '';
                
                const detailResponse = await axios.get(
                  `http://124.60.137.10:8083/api/tour-program/${program.id}`,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${cleanToken}`,
                    },
                    timeout: 5000,
                  }
                );
                
                if (detailResponse.data && detailResponse.data.data) {
                  return {
                    ...program,
                    wishlistCount: detailResponse.data.data.wishlistCount || 0,
                  };
                }
                return program;
              } catch (error) {
                console.log(`❌ 프로그램 ${program.id} 상세 정보 가져오기 실패:`, error);
                return program;
              }
            })
          );
          
          setPrograms(updatedPrograms);
        } else {
          setPrograms([]);
        }
      })
      .catch(err => {
        setPrograms([]);
      });
    } else {
      setPrograms([]);
    }
  }, [selectedMbti, selectedHashtags, selectedRegion]);

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
              <Ionicons name="arrow-back" size={24} color="#228B22" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>나만의 스타일 찾기</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.profileWrap}>
            <Text style={styles.helloText}>맞춤형 여행 프로그램을 찾아보세요</Text>
          </View>
        </View>

        {/* 필터 섹션 */}
        <View style={styles.filterSection}>
          {/* 해시태그 섹션 */}
          <View style={styles.filterGroup}>
            <Text style={styles.sectionTitle}>해시태그</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setHashtagSelectVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {selectedHashtags.length > 0 
                  ? `${selectedHashtags.length}개 선택됨` 
                  : '해시태그 선택하기'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#228B22" />
            </TouchableOpacity>
            
            {/* 선택된 해시태그 표시 */}
            {selectedHashtags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                {selectedHashtags.map(tag => (
                  <View key={tag} style={styles.selectedTag}>
                    <Text style={styles.selectedTagText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => setSelectedHashtags(prev => prev.filter(t => t !== tag))}>
                      <Text style={styles.removeTagText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* 지역 섹션 */}
          <View style={styles.filterGroup}>
            <Text style={styles.sectionTitle}>지역</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setRegionSelectVisible(true)}
            >
              <Text style={styles.selectButtonText}>
                {selectedRegion ? selectedRegion : '지역 선택하기'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#228B22" />
            </TouchableOpacity>
            
            {/* 선택된 지역 표시 */}
            {selectedRegion && (
              <View style={styles.selectedTagsContainer}>
                <View style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>📍 {selectedRegion}</Text>
                  <TouchableOpacity onPress={() => setSelectedRegion(null)}>
                    <Text style={styles.removeTagText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

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
                    {program.thumbnailUrl ? (
                      <Image
                        source={{uri: program.thumbnailUrl}}
                        style={styles.programImage}
                        resizeMode="cover"
                        onError={() => {
                          // 이미지 로드 실패 시 기본 이미지로 대체
                          console.log('썸네일 이미지 로드 실패:', program.thumbnailUrl);
                        }}
                      />
                    ) : (
                      <Image
                        source={require('../../assets/default.png')}
                        style={styles.programImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <View style={styles.programContent}>
                    <Text style={styles.programTitle} numberOfLines={2}>{program.title}</Text>
                    <Text style={styles.programDesc} numberOfLines={2}>{program.description || '설명이 없습니다.'}</Text>
                    
                    {/* 해시태그 표시 */}
                    {program.hashtags && program.hashtags.length > 0 && (
                      <View style={styles.programHashtags}>
                        {program.hashtags.slice(0, 3).map((tag, tagIdx) => (
                          <Text key={tagIdx} style={styles.programHashtag}>
                            #{tag}
                          </Text>
                        ))}
                        {program.hashtags.length > 3 && (
                          <Text style={styles.programHashtagMore}>
                            +{program.hashtags.length - 3}
                          </Text>
                        )}
                      </View>
                    )}
                    
                    <View style={styles.programMeta}>
                      <Text style={styles.programRegion}>📍 {program.region}</Text>
                      <View style={styles.programStats}>
                        <Text style={styles.programWishlist}>💖 {program.wishlistCount || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 해시태그 선택 모달 */}
      <Modal visible={hashtagSelectVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>해시태그 선택</Text>
            <Text style={styles.modalSubtitle}>최대 5개까지 선택할 수 있습니다</Text>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalGrid}>
                {hashtagList.map(tag => {
                  const isSelected = selectedHashtags.includes(tag);
                  const canSelect = selectedHashtags.length < 5 || isSelected;
                  
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.modalTag,
                        isSelected && styles.modalTagSelected,
                        !canSelect && styles.modalTagDisabled
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedHashtags(prev => prev.filter(t => t !== tag));
                        } else if (canSelect) {
                          setSelectedHashtags(prev => [...prev, tag]);
                        }
                      }}
                      disabled={!canSelect}
                    >
                      <Text style={[
                        styles.modalTagText,
                        isSelected && styles.modalTagTextSelected,
                        !canSelect && styles.modalTagTextDisabled
                      ]}>
                        #{tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setHashtagSelectVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setHashtagSelectVisible(false)}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 지역 선택 모달 */}
      <Modal visible={regionSelectVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>지역 선택</Text>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalGrid}>
                {regionList.map(region => (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.modalTag,
                      selectedRegion === region && styles.modalTagSelected
                    ]}
                    onPress={() => {
                      setSelectedRegion(region === selectedRegion ? null : region);
                    }}
                  >
                    <Text style={[
                      styles.modalTagText,
                      selectedRegion === region && styles.modalTagTextSelected
                    ]}>
                      📍 {region}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRegionSelectVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setRegionSelectVisible(false)}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  programLikes: {
    fontSize: 12,
    color: '#e91e63',
    fontWeight: '500',
  },
  programWishlist: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  programHashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 8,
  },
  programHashtag: {
    fontSize: 10,
    color: '#1e7c3c',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
    fontWeight: '500',
  },
  programHashtagMore: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
  // 새로운 모달 스타일들
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 8,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#90EE90',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedTagText: {
    color: '#228B22',
    fontSize: 12,
    fontWeight: '500',
  },
  removeTagText: {
    color: '#228B22',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  // 모달 스타일들
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '92%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#228B22',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalTag: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: '30%',
    alignItems: 'center',
  },
  modalTagSelected: {
    backgroundColor: '#90EE90',
    borderColor: '#228B22',
  },
  modalTagDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.5,
  },
  modalTagText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalTagTextSelected: {
    color: '#228B22',
    fontWeight: 'bold',
  },
  modalTagTextDisabled: {
    color: '#ccc',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#90EE90',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#228B22',
  },
});

export default MyStyle;
