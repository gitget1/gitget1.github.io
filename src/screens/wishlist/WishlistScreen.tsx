import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';

interface WishlistItem {
  id: number;
  tourProgramId?: number;
  title: string;
  thumbnailUrl: string | null;
  region: string;
  guidePrice: number;
  description: string;
  hashtags: string[];
}

const WISHLIST_API_URL = 'http://124.60.137.10:80/api/wishlist';

const WishlistScreen = () => {
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요한 서비스입니다.');
        return;
      }

      const cleanToken = token.replace('Bearer ', '');

      const response = await axios.get(WISHLIST_API_URL, {
        params: {
          page: 0,
          size: 10,
          sortOption: 'priceAsc',
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`,
        },
        timeout: 10000,
      });

      let items: any[] = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data.status === 'OK' && response.data.data) {
          if (Array.isArray(response.data.data)) {
            items = response.data.data;
          }
        } else if (
          response.data.content &&
          Array.isArray(response.data.content)
        ) {
          items = response.data.content;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          items = response.data.data;
        }
      }

      if (items.length > 0) {
        setWishlistItems(items);
        setError(null);
      } else {
        setWishlistItems([]);
        setError(null);
      }
    } catch (err) {
      setWishlistItems([]);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('로그인이 필요한 서비스입니다.');
          Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        } else if (err.code === 'ECONNABORTED') {
          setError('서버 응답 시간이 초과되었습니다.');
          Alert.alert(
            '오류',
            '서버 응답 시간이 초과되었습니다. 다시 시도해주세요.',
          );
        } else {
          setError('위시리스트를 불러오는데 실패했습니다.');
          Alert.alert('오류', '위시리스트를 불러오는데 실패했습니다.');
        }
      } else {
        setError('네트워크 연결을 확인해주세요.');
        Alert.alert('오류', '네트워크 연결을 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleItemPress = (item: WishlistItem) => {
    const actualTourProgramId =
      item.tourProgramId ||
      (item as any).tour_program_id ||
      (item as any).programId ||
      (item as any).program_id ||
      item.id;

    try {
      navigation.navigate('PracticeDetail', {
        tourProgramId: actualTourProgramId,
        refresh: false,
      });
    } catch (error) {
      Alert.alert('오류', '페이지 이동에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>나의 위시리스트</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchWishlist}
          disabled={loading}>
          <Text style={styles.refreshButtonText}>
            {loading ? '로딩중...' : '새로고침'}
          </Text>
        </TouchableOpacity>
      </View>

      {!wishlistItems || wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {error ? error : '위시리스트가 비어있습니다.'}
          </Text>
          {!error && (
            <Text style={styles.emptySubText}>
              투어 상세 페이지에서 🤍 버튼을 눌러{'\n'}
              관심있는 투어를 찜해보세요!
            </Text>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={fetchWishlist}>
            <Text style={styles.retryButtonText}>
              {error ? '다시 시도' : '새로고침'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        wishlistItems.map((item, index) => (
          <TouchableOpacity
            key={`wishlist-item-${item.id}-${index}`}
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}>
            {item.thumbnailUrl ? (
              <Image
                source={{uri: item.thumbnailUrl}}
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => {
                  const updatedItems = wishlistItems.map(wishItem => {
                    if (wishItem.id === item.id) {
                      return {...wishItem, thumbnailUrl: null};
                    }
                    return wishItem;
                  });
                  setWishlistItems(updatedItems);
                }}
              />
            ) : (
              <View style={[styles.thumbnail, {backgroundColor: '#e0e0e0'}]}>
                <Text style={styles.noImageText}>이미지 없음</Text>
              </View>
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title || '제목 없음'}</Text>
              <Text style={styles.itemRegion}>
                📍 {item.region || '지역 정보 없음'}
              </Text>
              <View style={styles.tagsContainer}>
                {(item.hashtags || []).map((tag, index) => (
                  <Text
                    key={`${item.id}-tag-${index}-${tag}`}
                    style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
              <Text style={styles.itemPrice}>
                ₩{(item.guidePrice || 0).toLocaleString()} /인
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    color: '#333',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginLeft: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemRegion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF385C',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrowContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: 'bold',
  },
  noImageText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default WishlistScreen;
