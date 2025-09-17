import React, {useEffect, useState, useCallback} from 'react';
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
import {useTranslation} from 'react-i18next';
import {checkLoginAndShowAlert} from '../../utils/auth';

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

const WISHLIST_API_URL = 'http://124.60.137.10:8083/api/tour-program/wishlist';

const WishlistScreen = () => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다');
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      console.log('🟢 찜함 목록 요청 시작');

      // Program_detail과 동일한 API 사용
      const response = await axios.get(
        'http://124.60.137.10:8083/api/tour-program/wishlist',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
          timeout: 10000,
        },
      );

      console.log('🟢 찜함 목록 응답:', response.data);

      let items: any[] = [];

      if (response.data) {
        if (response.data.status === 'OK' && response.data.data) {
          if (Array.isArray(response.data.data)) {
            items = response.data.data;
          } else if (response.data.data.content && Array.isArray(response.data.data.content)) {
            items = response.data.data.content;
          }
        } else if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          items = response.data.content;
        }
      }

      console.log('🟢 파싱된 찜함 아이템:', items);

      if (items.length > 0) {
        // 데이터 구조 정규화
        const normalizedItems = items.map((item: any) => ({
          id: item.tourProgramId || item.id || item.tour_program_id,
          tourProgramId: item.tourProgramId || item.id || item.tour_program_id,
          title: item.title || item.programTitle || '제목 없음',
          thumbnailUrl: item.thumbnailUrl || item.thumbnail_url || null,
          region: item.region || item.programRegion || '지역 정보 없음',
          guidePrice: item.guidePrice || item.guide_price || 0,
          description: item.description || item.programDescription || '',
          hashtags: item.hashtags || item.programHashtags || [],
        }));

        setWishlistItems(normalizedItems);
        setError(null);
        console.log('🟢 찜함 목록 설정 완료:', normalizedItems.length, '개');
      } else {
        setWishlistItems([]);
        setError(null);
        console.log('🟢 찜함 목록이 비어있음');
      }
    } catch (err) {
      console.error('❌ 찜함 목록 로딩 실패:', err);
      setWishlistItems([]);
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('로그인이 필요합니다');
          Alert.alert('알림', '로그인이 필요합니다');
        } else if (err.response?.status === 404) {
          setError('찜한 프로그램이 없습니다');
        } else {
          setError('찜함 목록을 불러올 수 없습니다');
          Alert.alert('오류', '찜함 목록을 불러올 수 없습니다');
        }
      } else {
        setError('네트워크 오류가 발생했습니다');
        Alert.alert('오류', '네트워크 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // 로그인 상태 확인 후 위시리스트 불러오기
    const checkLoginAndFetch = async () => {
      const isLoggedIn = await checkLoginAndShowAlert(navigation, '위시리스트는 로그인이 필요한 기능입니다.');
      if (isLoggedIn) {
        fetchWishlist();
      }
    };
    
    checkLoginAndFetch();
  }, [fetchWishlist, navigation]);

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
      Alert.alert('오류', '페이지 이동에 실패했습니다');
    }
  };

  const handleItemLongPress = (item: WishlistItem) => {
    Alert.alert(
      '찜하기 해제',
      `"${item.title}"을(를) 찜함에서 제거하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '제거',
          style: 'destructive',
          onPress: () => removeFromWishlist(item),
        },
      ],
    );
  };

  const removeFromWishlist = async (item: WishlistItem) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('알림', '로그인이 필요합니다');
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const tourProgramId = item.tourProgramId || item.id;

      console.log('🟢 찜하기 해제 요청:', tourProgramId);

      const response = await axios.post(
        `http://124.60.137.10:8083/api/tour-program/wishlist/${tourProgramId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
        },
      );

      if (response.data.status === 'OK') {
        // 찜함 목록에서 제거
        setWishlistItems(prev => prev.filter(wishItem => wishItem.id !== item.id));
        Alert.alert('완료', '찜함에서 제거되었습니다');
        console.log('🟢 찜하기 해제 성공');
      }
    } catch (error) {
      console.error('❌ 찜하기 해제 실패:', error);
      Alert.alert('오류', '찜하기 해제에 실패했습니다');
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
        <View style={styles.headerLeft}>
          <Text style={styles.header}>내 찜함</Text>
          <Text style={styles.wishlistCount}>
            총 {wishlistItems.length}개
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchWishlist}
          disabled={loading}>
          <Text style={styles.refreshButtonText}>
            {loading ? '새로고침 중...' : '새로고침'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {wishlistItems.length > 0 && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            💡 아이템을 길게 누르면 찜하기 해제할 수 있습니다
          </Text>
        </View>
      )}

      {!wishlistItems || wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyText}>
            {error ? error : '찜한 프로그램이 없습니다'}
          </Text>
          {!error && (
            <Text style={styles.emptySubText}>
              마음에 드는 프로그램을 찜해보세요!
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
            onLongPress={() => handleItemLongPress(item)}
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
                <Text style={styles.noImageText}>{t('noImage')}</Text>
              </View>
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title || t('noTitle')}</Text>
              <Text style={styles.itemRegion}>
                📍 {item.region || t('noRegionInfo')}
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
                ₩{(item.guidePrice || 0).toLocaleString()} {t('perPerson')}
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
    color: '#000000',
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
    color: '#000000',
  },
  itemRegion: {
    fontSize: 14,
    color: '#000000',
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
  headerLeft: {
    flex: 1,
  },
  wishlistCount: {
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#90EE90',
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
    color: '#000000',
    fontWeight: 'bold',
  },
  noImageText: {
    color: '#000000',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
  instructionContainer: {
    backgroundColor: '#e6ffe6',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#228B22',
    fontWeight: '500',
  },
  emptyIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default WishlistScreen;
