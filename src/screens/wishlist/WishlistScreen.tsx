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
  title: string;
  thumbnailUrl: string;
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

      console.log('위시리스트 응답:', response.data);

      if (response.data && Array.isArray(response.data)) {
        setWishlistItems(response.data);
        setError(null);
      } else if (
        response.data &&
        response.data.content &&
        Array.isArray(response.data.content)
      ) {
        setWishlistItems(response.data.content);
        setError(null);
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        setWishlistItems(response.data.data);
        setError(null);
      } else {
        console.error('예상치 못한 응답 구조:', response.data);
        setError('위시리스트 데이터 형식이 올바르지 않습니다.');
        setWishlistItems([]);
      }
    } catch (err) {
      console.error('위시리스트 에러:', err);
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
    navigation.navigate('Practice', {tourProgramId: item.id});
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
      <Text style={styles.header}>나의 위시리스트</Text>
      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>위시리스트가 비어있습니다.</Text>
        </View>
      ) : (
        wishlistItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)}>
            <Image
              source={{uri: item.thumbnailUrl}}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemRegion}>📍 {item.region}</Text>
              <View style={styles.tagsContainer}>
                {item.hashtags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
              <Text style={styles.itemPrice}>
                ₩{item.guidePrice.toLocaleString()} /인
              </Text>
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
    borderBottomColor: '#eee',
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
  },
});

export default WishlistScreen;
