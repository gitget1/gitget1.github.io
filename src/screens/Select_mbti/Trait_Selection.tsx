// ✅ TraitDropdown.tsx - 해시태그 선택 가능 + 추천지역 UI 개선
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';

interface MbtiItem {
  mbtiId: number;
  mbti: string;
}

interface MbtiDetail {
  mbti: string;
  hashtags: string[];
  regions: string[];
}

const TraitDropdown = () => {
  const [mbtiList, setMbtiList] = useState<MbtiItem[]>([]);
  const [selectedMbti, setSelectedMbti] = useState<MbtiDetail | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState('최신순');
  const [displayedPosts, setDisplayedPosts] = useState(7);
  const [loadingMore, setLoadingMore] = useState(false);

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
        setMbtiList(res.data.data);
      } catch (err) {
        console.error('MBTI 리스트 로딩 실패:', err);
      }
    };
    fetchMbtiList();
  }, []);

  const handleSelectMbti = async (item: MbtiItem) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🟢 MBTI 상세 요청용 토큰:', token);

      const res = await axios.get(
        `http://124.60.137.10:80/api/mbti/detail-mbti?mbtiId=${item.mbtiId}&mbti=${item.mbti}`,
        {headers: token ? {Authorization: `Bearer ${token}`} : {}},
      );

      setSelectedMbti(res.data.data);
      setSelectedHashtags([]); // 새로 선택 시 초기화
      setShowDropdown(false);
      setSelectedRegionName(null);
      setDisplayedPosts(7);
    } catch (err) {
      console.error('❌ MBTI 상세정보 로딩 실패:', err);
    }
  };

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const dummyPosts = [
    {
      title: '강릉 바다 옆 한옥카페 추천',
      region: '강릉',
      likes: 87,
      comments: 12,
    },
    {
      title: '부산 광안리 일몰 명소 3곳!',
      region: '부산',
      likes: 102,
      comments: 25,
    },
    {
      title: '전주 한옥마을 전통 체험 후기',
      region: '전주',
      likes: 56,
      comments: 8,
    },
    {
      title: '제주도 숨은 협재 해변 뷰 맛집',
      region: '제주',
      likes: 93,
      comments: 16,
    },
    {
      title: '강릉 당일치기 코스 총정리',
      region: '강릉',
      likes: 70,
      comments: 10,
    },
    {
      title: '부산 감천문화마을 사진 포인트',
      region: '부산',
      likes: 110,
      comments: 31,
    },
    {
      title: '전주에서 전통 찻집 데이트 해봤어요',
      region: '전주',
      likes: 43,
      comments: 6,
    },
    {
      title: '제주 동백꽃 필 무렵, 인생샷 스팟',
      region: '제주',
      likes: 85,
      comments: 19,
    },
  ];

  const handleOutsidePress = () => {
    setShowDropdown(false);
    setShowSortDropdown(false);
  };

  const handleSortSelect = (option: string): void => {
    setSelectedSort(option);
    setShowSortDropdown(false);
  };

  const loadMorePosts = () => {
    if (!loadingMore && displayedPosts < sortedPosts.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayedPosts(prev => prev + 7);
        setLoadingMore(false);
      }, 500);
    }
  };

  const filteredPosts = dummyPosts.filter(
    post => !selectedRegionName || post.region === selectedRegionName,
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (selectedSort === '인기순') return b.likes - a.likes;
    if (selectedSort === '댓글순') return b.comments - a.comments;
    return 0;
  });

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <FlatList
        data={selectedMbti ? sortedPosts.slice(0, displayedPosts) : []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <View style={styles.postCard}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postMeta}>
              ❤️ {item.likes} 💬 {item.comments}
            </Text>
          </View>
        )}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
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
                        selectedRegionName === region &&
                          styles.selectedRegionItem,
                      ]}
                      onPress={() => {
                        setSelectedRegionName(region);
                        setDisplayedPosts(7);
                      }}>
                      <Text style={styles.regionText}>{region}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                    {['최신순', '인기순', '댓글순'].map(option => (
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
  postMeta: {fontSize: 14, color: '#888'},
});

export default TraitDropdown;
