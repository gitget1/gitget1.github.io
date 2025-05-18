// ✅ TraitDropdown.tsx - 정렬 드롭다운 zIndex 개선 + 드롭다운 외부 클릭 시 닫힘 + 스크롤 오류 해결

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

const TraitDropdown = () => {
  const [mbtiList, setMbtiList] = useState<MbtiItem[]>([]);
  const [selectedMbti, setSelectedMbti] = useState<MbtiItem | null>(null);
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedSort, setSelectedSort] = useState('최신순');
  const [displayedPosts, setDisplayedPosts] = useState(7);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    axios
      .get('http://10.0.2.2:8000/get_mbti_by_token')
      .then(res => setMbtiList(res.data))
      .catch(err => console.error('MBTI 불러오기 오류:', err));
  }, []);

  const dummyPosts = Array.from({length: 50}, (_, i) => ({
    title: `가상 게시글 제목 ${i + 1}`,
    region: ['제주', '부산', '전주'][i % 3],
    likes: 10 + i,
    comments: 5 + i,
  }));

  const handleOutsidePress = () => {
    setShowDropdown(false);
    setShowSortDropdown(false);
  };

  interface MbtiItem {
    mbti: string;
    tags: string[];
    recommended_regions: string[];
  }

  const handleSelectMbti = (item: MbtiItem): void => {
    setSelectedMbti(item);
    setShowDropdown(false);
    setSelectedRegionName(null);
    setDisplayedPosts(7);
  };

  interface SortOption {
    option: string;
  }

  const handleSortSelect = (option: SortOption['option']): void => {
    setSelectedSort(option);
    setShowSortDropdown(false);
  };

  const loadMorePosts = () => {
    if (!loadingMore && displayedPosts < filteredPosts.length) {
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

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <FlatList
        data={selectedMbti ? filteredPosts.slice(0, displayedPosts) : []}
        keyExtractor={(item, index) => index.toString()}
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
                <View style={styles.hashtagBox}>
                  <Text style={styles.hashtagTitle}>해시태그</Text>
                  <View style={styles.hashtagGrid}>
                    {selectedMbti.tags.map((tag, index) => (
                      <View key={index} style={styles.hashtagItem}>
                        <Text style={styles.hashtagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.regionContainer}>
                  <Text style={styles.regionTitle}>추천 지역</Text>
                  <View style={styles.regionGrid}>
                    {selectedMbti.recommended_regions.map((region, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.regionItem,
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
                </View>

                <View style={styles.postContainer}>
                  <Text style={styles.postText}>게시글</Text>
                  <View style={{position: 'relative', zIndex: 999}}>
                    <TouchableOpacity
                      style={styles.sortButton}
                      onPress={() => setShowSortDropdown(!showSortDropdown)}>
                      <Text style={styles.sortButtonText}>{selectedSort}</Text>
                    </TouchableOpacity>
                    {showSortDropdown && (
                      <View style={styles.sortDropdown}>
                        {['최신순', '인기순', '댓글순'].map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.sortDropdownItem}
                            onPress={() => handleSortSelect(option)}>
                            <Text style={styles.dropdownItemText}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {selectedRegionName && (
                  <View style={styles.selectedRegionBox}>
                    <Text style={styles.selectedRegionText}>
                      📍 선택된 지역: {selectedRegionName}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        }
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
          loadingMore ? (
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>더보기 로딩 중…</Text>
            </View>
          ) : (
            <View style={{height: 30}} />
          )
        }
      />
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7fa',
  },
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
  dropdownButtonText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  hashtagBox: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hashtagTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hashtagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hashtagItem: {
    width: '30%',
    marginBottom: 10,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  hashtagText: {
    fontSize: 16,
    color: '#555',
  },
  regionContainer: {
    marginTop: 10,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  regionItem: {
    width: '30%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedRegionItem: {
    backgroundColor: '#d0e0f0',
  },
  regionText: {
    fontSize: 16,
    color: '#000',
  },
  postContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  postText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sortButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    width: 100,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 16,
    color: '#000',
  },
  sortDropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  sortDropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    width: 100,
  },
  selectedRegionBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 5,
    alignItems: 'center',
  },
  selectedRegionText: {
    fontSize: 16,
    color: '#00796b',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  postCard: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  postMeta: {
    fontSize: 14,
    color: '#888',
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#777',
  },
});

export default TraitDropdown;