import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import axios from 'axios';

interface WishlistItem {
  id: number;
  // 필요한 다른 필드들 추가
}

const WishlistScreen = () => {
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/wishlist', {
        params: {
          page: 0,
          size: 10,
          sortOption: 'priceAsc',
        },
      });
      setWishlistItems(response.data.content);
      setError(null);
    } catch (err) {
      setError('위시리스트를 불러오는데 실패했습니다.');
      console.error('위시리스트 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

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
    <View style={styles.container}>
      <Text style={styles.text}>위시리스트</Text>
      {wishlistItems.length === 0 ? (
        <Text style={styles.emptyText}>위시리스트가 비어있습니다.</Text>
      ) : (
        wishlistItems.map(item => (
          <View key={item.id} style={styles.itemContainer}>
            <Text>아이템 ID: {item.id}</Text>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default WishlistScreen;
