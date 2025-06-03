import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';

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

// ✅ 투어 프로그램 API 요청 시 사용할 파라미터 구조
interface TourProgramListParams {
  hashtags?: string[];
  regions?: string[];
  page: string | number;
  size: string | number;
  sortOption: string;
}

const TraitDropdown = () => {
  // 상태 정의
  const [mbtiList, setMbtiList] = useState<MbtiItem[]>([]);
  const [selectedMbti, setSelectedMbti] = useState<MbtiDetail | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState('addedDesc'); // 기본 정렬 옵션
  const [displayedPosts, setDisplayedPosts] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posts, setPosts] = useState<TourProgram[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  // ✅ 컴포넌트 마운트 시 MBTI 목록 불러오기
  useEffect(() => {
    const fetchMbtiList = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        console.log('🟢 MBTI 목록 요청용 토큰:', token);

        const res = await axios.get(
          'http://124.60.137.10:80/api/mbti/all-mbti',
          {
            headers: token ? {Authorization: `Bearer ${token}`} : {},
          },
        );

        console.log('🟢 MBTI 목록 응답:', res.data);
        setMbtiList(res.data.data);
      } catch (err) {
        console.error('🔴 MBTI 리스트 로딩 실패:', err);
      }
    };
    fetchMbtiList();
  }, []);

  // ✅ 게시물 목록 조회 함수
  const fetchTourPrograms = useCallback(
    async (isLoadMore = false) => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.error('🔴 토큰이 없습니다. 로그인이 필요합니다.');
          return;
        }

        const cleanToken = token.replace(/\s+/g, '');
        const authToken = cleanToken.startsWith('Bearer')
          ? cleanToken
          : `Bearer ${cleanToken}`;

        const currentPage = isLoadMore ? page + 1 : 0;

        // 파라미터 생성
        const params: TourProgramListParams = {
          page: currentPage,
          size: size,
          sortOption: selectedSort,
        };

        if (selectedHashtags.length > 0) {
          params.hashtags = selectedHashtags
            .map(tag => (tag.startsWith('#') ? tag.substring(1) : tag).trim())
            .filter(tag => tag !== '');
        }

        if (selectedRegions.length > 0) {
          params.regions = selectedRegions
            .map(region => region.trim())
            .filter(region => region !== '');
        }

        // URLSearchParams 생성
        const searchParams = new URLSearchParams();

        // 기본 파라미터 추가
        searchParams.append('page', String(currentPage));
        searchParams.append('size', String(size));
        searchParams.append('sortOption', selectedSort.trim());

        // 해시태그 추가
        if (params.hashtags) {
          params.hashtags.forEach(tag => {
            searchParams.append('hashtags', tag.trim());
          });
        }

        // 지역 추가
        if (params.regions) {
          params.regions.forEach(region => {
            searchParams.append('regions', region.trim());
          });
        }

        const apiUrl = `http://124.60.137.10:80/api/tour-program?${searchParams.toString()}`;
        console.log('🟢 최종 요청 URL:', apiUrl);

        const headers = {
          'Content-Type': 'application/json',
          Authorization: authToken,
          Accept: 'application/json',
        };

        const response = await axios.get(apiUrl, {
          headers,
          timeout: 30000,
        });

        console.log('🟢 응답 상태 코드:', response.status);
        console.log('🟢 응답 데이터:', response.data);

        if (response.status === 200 && response.data.status === 'OK') {
          const newPosts = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data];

          setPosts(prev => (isLoadMore ? [...prev, ...newPosts] : newPosts));
          setPage(currentPage);
        } else {
          console.error('🔴 서버 응답 실패:', response.data);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('🔴 투어 프로그램 목록 로딩 실패:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
              params: error.config?.params,
            },
          });
        } else {
          console.error('🔴 투어 프로그램 목록 로딩 실패:', error);
        }
      }
    },
    [page, size, selectedSort, selectedHashtags, selectedRegions],
  );

  // ✅ MBTI 선택 시 초기 게시물 조회
  useEffect(() => {
    if (selectedMbti) {
      console.log('🟢 MBTI 선택됨 → 게시물 조회 실행');
      fetchTourPrograms();
    }
  }, [selectedMbti, fetchTourPrograms]);

  // ✅ MBTI 선택 시 상세정보 조회
  const handleSelectMbti = async (item: MbtiItem) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🟢 MBTI 상세 요청용 토큰:', token);

      const res = await axios.get(
        `http://124.60.137.10:80/api/mbti/detail-mbti?mbtiId=${item.mbtiId}&mbti=${item.mbti}`,
        {
          headers: token ? {Authorization: `Bearer ${token}`} : {},
        },
      );

      console.log('🟢 MBTI 상세 응답:', res.data);
      setSelectedMbti(res.data.data);
      setSelectedHashtags([]);
      setSelectedRegions([]);
      setShowDropdown(false);
      setDisplayedPosts(10);
    } catch (err) {
      console.error('🔴 MBTI 상세정보 로딩 실패:', err);
    }
  };

  // ✅ 해시태그 클릭 시 선택/해제
  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => {
      const updated = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag];

      console.log('🟢 선택된 해시태그:', updated);
      return updated;
    });
  };

  // ✅ 지역 클릭 시 선택/해제
  const handleRegionSelect = (region: string) => {
    setSelectedRegions(prev => {
      const updated = prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region];

      console.log('🟢 선택된 지역:', updated);
      return updated;
    });
  };

  // ✅ 조회하기 버튼 클릭 시 게시물 조회
  const handleSearch = () => {
    setPage(0);
    setDisplayedPosts(10);
    fetchTourPrograms();
  };

  // ✅ 정렬 옵션 선택 시 적용 후 게시물 조회
  const handleSortSelect = (option: string) => {
    let sortOption = 'addedDesc';

    switch (option) {
      case '최신순':
        sortOption = 'addedDesc';
        break;
      case '가격 낮은순':
        sortOption = 'priceAsc';
        break;
      case '가격 높은순':
        sortOption = 'priceDesc';
        break;
      case '리뷰순':
        sortOption = 'reviewDesc';
        break;
      case '찜순':
        sortOption = 'wishlistDesc';
        break;
    }

    console.log('🟢 선택된 정렬 옵션:', sortOption);

    setSelectedSort(sortOption);
    setShowSortDropdown(false);
    setPage(0);
    setTimeout(() => fetchTourPrograms(), 100);
  };

  // ✅ 스크롤 하단 도달 시 더 불러오기
  const loadMorePosts = () => {
    if (!loadingMore && posts.length > displayedPosts) {
      console.log('🟢 추가 게시물 로딩 시작');
      setLoadingMore(true);
      fetchTourPrograms(true);
      setLoadingMore(false);
    }
  };

  // ✅ 외부 클릭 시 드롭다운 닫기
  const handleOutsidePress = () => {
    setShowDropdown(false);
    setShowSortDropdown(false);
  };

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <FlatList
        data={posts.slice(0, displayedPosts)}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postDescription}>{item.description}</Text>
            <View style={styles.postMetaContainer}>
              <Text style={styles.postMeta}>
                ❤️ {item.likes} 💬 {item.comments}
              </Text>
              <Text style={styles.postPrice}>
                가이드 가격: {item.guidePrice?.toLocaleString()}원
              </Text>
            </View>
            {item.hashtags && (
              <View style={styles.hashtagContainer}>
                {item.hashtags.map((tag, index) => (
                  <Text key={index} style={styles.postHashtag}>
                    {tag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedHashtags.length > 0 || selectedRegions.length > 0
                ? '선택한 조건에 맞는 게시물이 없습니다.'
                : '게시물이 없습니다.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? <Text>로딩 중…</Text> : <View style={{height: 30}} />
        }
        ListHeaderComponent={
          <View style={styles.container}>
            <View style={styles.centeredRow}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDropdown(!showDropdown)}>
                <Text style={styles.dropdownButtonText}>
                  {selectedMbti ? selectedMbti.mbti : '클릭하여 성향 선택'}
                </Text>
              </TouchableOpacity>
            </View>
            {showDropdown && (
              <View style={styles.dropdownList}>
                <FlatList
                  data={mbtiList}
                  keyExtractor={(item, index) => `${item.mbti}-${index}`}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleSelectMbti(item)}>
                      <Text style={styles.dropdownItemText}>{item.mbti}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
            {selectedMbti && (
              <>
                <Text style={styles.sectionTitle}>해시태그</Text>
                <View style={styles.hashtagWrapper}>
                  {selectedMbti.hashtags.map((tag, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.hashtagBox,
                        selectedHashtags.includes(tag) &&
                          styles.selectedHashtagBox,
                      ]}
                      onPress={() => toggleHashtag(tag)}>
                      <Text
                        style={[
                          styles.hashtagText,
                          selectedHashtags.includes(tag) &&
                            styles.selectedHashtagText,
                        ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>추천 지역</Text>
                <View style={styles.regionGridCentered}>
                  {selectedMbti.regions.map((region, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.regionItemFixed,
                        selectedRegions.includes(region) &&
                          styles.selectedRegionItem,
                      ]}
                      onPress={() => handleRegionSelect(region)}>
                      <Text style={styles.regionText}>{region}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearch}>
                  <Text style={styles.searchButtonText}>조회하기</Text>
                </TouchableOpacity>
              </>
            )}
            {selectedMbti && (
              <View style={styles.postContainer}>
                <Text style={styles.postText}>게시글</Text>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => setShowSortDropdown(!showSortDropdown)}>
                  <Text style={styles.sortButtonText}>{selectedSort}</Text>
                </TouchableOpacity>
                {showSortDropdown && (
                  <View style={styles.sortDropdown}>
                    {[
                      '최신순',
                      '가격 낮은순',
                      '가격 높은순',
                      '리뷰순',
                      '찜순',
                    ].map(option => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => handleSortSelect(option)}>
                        <Text style={styles.sortDropdownItem}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        }
      />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#f7f7fa'},
  centeredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dropdownButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  dropdownButtonText: {fontSize: 16, color: '#000'},
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 5,
  },
  dropdownItem: {padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd'},
  dropdownItemText: {fontSize: 16, color: '#000'},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  hashtagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  hashtagBox: {
    width: '30%',
    margin: '1.5%',
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedHashtagBox: {backgroundColor: '#4fc3f7'},
  hashtagText: {fontSize: 14, color: '#444'},
  selectedHashtagText: {color: '#fff', fontWeight: 'bold'},
  regionGridCentered: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  regionItemFixed: {
    width: '28%',
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedRegionItem: {backgroundColor: '#d0e0f0'},
  regionText: {fontSize: 14, color: '#000'},
  postContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postText: {fontSize: 18, fontWeight: 'bold'},
  sortButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  sortButtonText: {fontSize: 14},
  sortDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 100,
  },
  sortDropdownItem: {padding: 10, fontSize: 14},
  postCard: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  postTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 5},
  postMeta: {
    fontSize: 14,
    color: '#888',
  },
  postDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  postMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postPrice: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  postHashtag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TraitDropdown;
