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

const TraitDropdown = () => {
  // 다국어 지원
  const {t} = useTranslation();

  // 네비게이션 훅
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'TraitSelection'>>();

  // 상태 정의
  const [mbtiList, setMbtiList] = useState<MbtiItem[]>([]);
  const [selectedMbti, setSelectedMbti] = useState<MbtiDetail | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState('latest'); // 기본 정렬 옵션
  const [displayedPosts, setDisplayedPosts] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posts, setPosts] = useState<TourProgram[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ko');
  const [translatedPosts, setTranslatedPosts] = useState<TourProgram[]>([]);
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // ✅ 컴포넌트 마운트 시 MBTI 목록 불러오기
  useEffect(() => {
    const fetchMbtiList = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        console.log('🟢 MBTI 목록 요청용 토큰:', token);

        // 1. 먼저 사용자가 저장한 MBTI가 있는지 확인
        try {
          console.log('🟢 사용자 저장 MBTI 확인 중...');
          const userMbtiResponse = await axios.get('http://124.60.137.10:80/api/mbti/user-mbti', {
            headers: token ? {Authorization: `Bearer ${token}`} : {},
            timeout: 10000,
          });
          
          console.log('🟢 사용자 MBTI 응답:', userMbtiResponse.data);
          
          if (userMbtiResponse.data.status === 'OK' && userMbtiResponse.data.data) {
            // 사용자가 저장한 MBTI가 있으면 해당 MBTI를 선택
            const userMbti = userMbtiResponse.data.data;
            console.log('🟢 사용자 저장 MBTI 발견:', userMbti);
            
            // MBTI 상세 정보 가져오기
            const detailResponse = await axios.get(
              `http://124.60.137.10:80/api/mbti/detail-mbti?mbtiId=${userMbti.mbtiId}&mbti=${userMbti.mbti}`,
              {
                headers: token ? {Authorization: `Bearer ${token}`} : {},
                timeout: 10000,
              },
            );
            
            if (detailResponse.data.status === 'OK' && detailResponse.data.data) {
              console.log('🟢 사용자 MBTI 상세 정보:', detailResponse.data.data);
              setSelectedMbti(detailResponse.data.data);
            }
          }
        } catch (userMbtiError) {
          console.log('🟡 사용자 저장 MBTI 없음 또는 조회 실패:', userMbtiError);
          // 사용자 MBTI가 없으면 전체 목록을 가져옴
        }

        // 2. 전체 MBTI 목록 가져오기
        const res = await axios.get('http://124.60.137.10:80/api/mbti/all-mbti', {
          headers: token ? {Authorization: `Bearer ${token}`} : {},
        });

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
        // selectedSort를 API 파라미터로 변환
        let sortOption = 'addedDesc';
        switch (selectedSort) {
          case 'latest':
            sortOption = 'addedDesc';
            break;
          case 'priceLowToHigh':
            sortOption = 'priceAsc';
            break;
          case 'priceHighToLow':
            sortOption = 'priceDesc';
            break;
          case 'reviewOrder':
            sortOption = 'reviewDesc';
            break;
          case 'wishlistOrder':
            sortOption = 'wishlistDesc';
            break;
        }

        // GET 요청으로 복구하되 필수 파라미터 처리
        const queryParams = [
          `page=${currentPage}`,
          `size=${size}`,
          `sortOption=${sortOption.trim()}`,
        ];

        // 해시태그 처리 - 없으면 더미 값 추가
        if (selectedHashtags.length > 0) {
          const cleanHashtags = selectedHashtags
            .map(tag => (tag.startsWith('#') ? tag.substring(1) : tag).trim())
            .filter(tag => tag !== '');
          cleanHashtags.forEach(tag => {
            queryParams.push(`hashtags=${encodeURIComponent(tag)}`);
          });
        } else {
          queryParams.push(`hashtags=all`); // 더미 값으로 'all' 사용
        }

        // 지역 처리 - 없으면 더미 값 추가
        if (selectedRegions.length > 0) {
          const cleanRegions = selectedRegions
            .map(region => region.trim())
            .filter(region => region !== '');
          cleanRegions.forEach(region => {
            queryParams.push(`regions=${encodeURIComponent(region)}`);
          });
        } else {
          queryParams.push(`regions=all`); // 더미 값으로 'all' 사용
        }

        const apiUrl = `http://124.60.137.10/api/tour-program?${queryParams.join(
          '&',
        )}`;
        console.log('🟢 최종 요청 URL:', apiUrl);

        const headers = {
          'Content-Type': 'application/json',
          Authorization: authToken,
          Accept: 'application/json',
        };

        console.log('🟢 요청 헤더:', headers);
        console.log('🟢 GET 요청 시작');

        const response = await axios.get(apiUrl, {
          headers,
          timeout: 15000,
        });

        console.log('🟢 응답 받음 - 상태:', response.status);

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

  // ✅ 화면 포커스 시 새로고침 (Make_program에서 수정 완료 후 돌아올 때)
  useFocusEffect(
    useCallback(() => {
      const forceRefresh = route.params?.forceRefresh;
      if (selectedMbti || forceRefresh) {
        console.log('🟢 TraitSelection 화면 포커스 - 투어 목록 새로고침', {
          selectedMbti: !!selectedMbti,
          forceRefresh,
        });
        fetchTourPrograms(false); // 첫 페이지부터 다시 로드
      }
    }, [selectedMbti, fetchTourPrograms, route.params?.forceRefresh]),
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
    console.log('🟢 선택된 정렬 옵션:', option);

    setSelectedSort(option);
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
  };

  // 텍스트 번역 함수
  const translateTextContent = async (text: string, targetLang: string) => {
    if (!text || text.trim() === '' || targetLang === 'ko') return text || '';
    try {
      const result = await translateText(text, 'ko', targetLang);
      return result.translatedText || text;
    } catch (error) {
      return text;
    }
  };

  // 게시물 목록 번역
  const translatePosts = async (targetLang: string) => {
    if (!posts || posts.length === 0 || targetLang === 'ko') {
      setTranslatedPosts([]);
      return;
    }
    setTranslating(true);
    setTranslationProgress(0);
    try {
      const translatedPostsList: TourProgram[] = [];
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const textsToTranslate = [post.title || '', post.description || '', ...(post.hashtags || [])].filter(text => text.trim() !== '');
        const batchSize = 3;
        const translatedTexts: string[] = [];
        for (let j = 0; j < textsToTranslate.length; j += batchSize) {
          const batch = textsToTranslate.slice(j, j + batchSize);
          const batchPromises = batch.map(text => translateTextContent(text, targetLang));
          const batchResults = await Promise.all(batchPromises);
          translatedTexts.push(...batchResults);
        }
        let textIndex = 0;
        const translatedPost: TourProgram = {
          ...post,
          title: translatedTexts[textIndex++] || post.title,
          description: translatedTexts[textIndex++] || post.description,
          hashtags: (post.hashtags || []).map(() => translatedTexts[textIndex++] || ''),
        };
        translatedPostsList.push(translatedPost);
        const progress = ((i + 1) / posts.length) * 100;
        setTranslationProgress(progress);
      }
      setTranslatedPosts(translatedPostsList);
    } catch (error) {
      setTranslatedPosts([]);
    } finally {
      setTranslating(false);
      setTranslationProgress(0);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setShowLanguageModal(false);
    if (languageCode === 'ko') {
      setTranslatedPosts([]);
    } else {
      await translatePosts(languageCode);
    }
  };

  const displayPosts = translatedPosts.length > 0 ? translatedPosts : posts;

  // 바텀 탭 렌더링 함수
  const renderBottomTab = () => (
    <View style={styles.bottomTabContainer}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Main', {screen: 'Home'})}>
        <Ionicons name="home" size={24} color="#999" />
        <Text style={styles.tabLabel}>{t('homeTab')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => {
          navigation.navigate('WishlistScreen');
        }}>
        <Ionicons name="heart" size={24} color="gray" />
        <Text style={styles.tabLabel}>{t('wishlist')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Main', {screen: 'MyPage'})}>
        <Ionicons name="person" size={24} color="#999" />
        <Text style={styles.tabLabel}>{t('myPageTab')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{flex: 1}}>
      {/* 번역 중 표시 */}
      {translating && (
        <View style={{backgroundColor: '#e3f2fd', padding: 15, borderRadius: 10, margin: 20, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF'}}>
          <Text style={{fontWeight: 'bold', color: '#007AFF', marginBottom: 8}}>
            번역 중... {translationProgress.toFixed(0)}%
          </Text>
          <View style={{width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden'}}>
            <View style={{height: '100%', backgroundColor: '#007AFF', borderRadius: 4, width: `${translationProgress}%`}} />
          </View>
        </View>
      )}
      {/* 번역 버튼 */}
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 10}}>
        <TouchableOpacity
          style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, borderWidth: 2, borderColor: '#007AFF', minWidth: 150, justifyContent: 'center'}}
          onPress={() => setShowLanguageModal(true)}
          disabled={translating}
        >
          <Ionicons name="language" size={20} color="#fff" />
          <Text style={{fontSize: 16, fontWeight: 'bold', color: '#fff', marginHorizontal: 8}}>
            {supportedLanguages.find(lang => lang.code === selectedLanguage)?.flag}
            {selectedLanguage === 'ko' ? '한국어' : supportedLanguages.find(lang => lang.code === selectedLanguage)?.name}
          </Text>
        </TouchableOpacity>
      </View>
      {/* 언어 선택 모달 */}
      {showLanguageModal && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 20,
            borderRadius: 10,
            width: '80%',
            maxHeight: '80%',
            overflow: 'hidden',
            alignItems: 'center',
            paddingBottom: 20,
          }}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center'}}>🌍 언어 선택</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingVertical: 10, alignItems: 'center'}}
              style={{width: '100%'}}
            >
              {supportedLanguages.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: selectedLanguage === language.code ? '#e3f2fd' : '#fff',
                    borderColor: selectedLanguage === language.code ? '#007AFF' : '#eee',
                    borderWidth: selectedLanguage === language.code ? 1 : 0,
                    width: '100%',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Text style={{fontSize: 20, marginRight: 15}}>{language.flag}</Text>
                  <Text style={{fontSize: 16}}>{language.name}</Text>
                  {selectedLanguage === language.code && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{
                backgroundColor: '#007AFF',
                padding: 12,
                borderRadius: 8,
                marginTop: 15,
                width: '90%',
                alignItems: 'center',
                alignSelf: 'center',
                marginHorizontal: '5%',
              }}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <FlatList
          data={displayPosts.slice(0, displayedPosts)}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.postCard}
              onPress={() => {
                console.log('🟢 게시물 클릭 - tourProgramId:', item.id);
                navigation.navigate('PracticeDetail', {
                  tourProgramId: item.id,
                  selectedLanguage: selectedLanguage,
                });
              }}
              activeOpacity={0.8}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postDescription}>{item.description}</Text>
              <View style={styles.postMetaContainer}>
                <Text style={styles.postMeta}>
                  ❤️ {item.likes} 💬 {item.comments}
                </Text>
                <Text style={styles.postPrice}>
                  {t('guidePrice')}: {item.guidePrice?.toLocaleString()}
                  {t('won')}
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
            </TouchableOpacity>
          )}
          onEndReached={loadMorePosts}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedHashtags.length > 0 || selectedRegions.length > 0
                  ? t('noPostsFound')
                  : t('noPosts')}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <Text>{t('loadingMore')}</Text>
            ) : (
              <View style={{height: 30}} />
            )
          }
          ListHeaderComponent={
            <View style={styles.container}>
              <View style={styles.centeredRow}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDropdown(!showDropdown)}>
                  <Text style={styles.dropdownButtonText}>
                    {selectedMbti ? `${selectedMbti.mbti} (내 MBTI)` : t('selectPersonality')}
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
                  <Text style={styles.sectionTitle}>{t('hashtags')}</Text>
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

                  <Text style={styles.sectionTitle}>
                    {t('recommendedRegions')}
                  </Text>
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
                    <Text style={styles.searchButtonText}>{t('search')}</Text>
                  </TouchableOpacity>
                </>
              )}
              {selectedMbti && (
                <View style={styles.postContainer}>
                  <Text style={styles.postText}>{t('posts')}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.sortScrollView}
                    contentContainerStyle={styles.sortScrollContent}>
                    {[
                      'latest',
                      'priceLowToHigh',
                      'priceHighToLow',
                      'reviewOrder',
                      'wishlistOrder',
                    ].map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.sortOptionButton,
                          selectedSort === option && styles.selectedSortButton,
                        ]}
                        onPress={() => handleSortSelect(option)}>
                        <Text
                          style={[
                            styles.sortOptionText,
                            selectedSort === option && styles.selectedSortText,
                          ]}>
                          {t(option)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          }
        />
      </TouchableWithoutFeedback>
      {renderBottomTab()}
    </View>
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
  sortScrollView: {
    flex: 1,
    marginLeft: 10,
  },
  sortScrollContent: {
    alignItems: 'center',
    paddingRight: 10,
  },
  sortOptionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSortButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedSortText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
});

export default TraitDropdown;
