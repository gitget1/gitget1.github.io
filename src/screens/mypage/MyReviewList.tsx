import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Review = {
  tourProgramId: number;
  title: string;
  content: string;
  createdAt: string;
};

const MyReviewList = () => {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        return;
      }

      // 토큰에서 'Bearer ' 접두사 제거
      const cleanToken = token.replace('Bearer ', '');

      const res = await axios.get('http://124.60.137.10/api/review', {
        params: {
          page: 0,
          size: 10,
          sortOption: 'ratingDesc',
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`,
        },
        timeout: 10000,
      });

      console.log('리뷰 리스트 응답:', res.data);

      if (res.data && Array.isArray(res.data)) {
        const mapped = res.data.map((r: any) => ({
          tourProgramId: r.tourProgramId,
          title: r.title,
          content: r.content,
          createdAt: r.createdAt.slice(0, 10),
        }));
        setReviews(mapped);
      } else if (res.data && res.data.content) {
        const mapped = res.data.content.map((r: any) => ({
          tourProgramId: r.tourProgramId,
          title: r.title,
          content: r.content,
          createdAt: r.createdAt.slice(0, 10),
        }));
        setReviews(mapped);
      } else if (res.data && res.data.data) {
        const mapped = res.data.data.map((r: any) => ({
          tourProgramId: r.tourProgramId,
          title: r.title,
          content: r.content,
          createdAt: r.createdAt.slice(0, 10),
        }));
        setReviews(mapped);
      } else {
        console.error('예상치 못한 응답 구조:', res.data);
        Alert.alert('오류', '리뷰 데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('리뷰 불러오기 실패:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        } else if (error.code === 'ECONNABORTED') {
          Alert.alert(
            '오류',
            '서버 응답 시간이 초과되었습니다. 다시 시도해주세요.',
          );
        } else {
          Alert.alert('오류', '리뷰를 불러오는데 실패했습니다.');
        }
      } else {
        Alert.alert('오류', '네트워크 연결을 확인해주세요.');
      }
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('리뷰 삭제', '정말 삭제하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
              Alert.alert('알림', '로그인이 필요한 서비스입니다.');
              return;
            }

            const cleanToken = token.replace('Bearer ', '');

            console.log('🗑️ 리뷰 삭제 요청:', {
              reviewId: id,
              url: `http://124.60.137.10/api/review/${id}`,
            });

            const response = await axios.delete(
              `http://124.60.137.10/api/review/${id}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${cleanToken}`,
                },
                timeout: 10000,
              },
            );

            console.log('✅ 리뷰 삭제 성공:', response.data);

            setReviews(prev => prev.filter(r => r.tourProgramId !== id));
            Alert.alert('완료', '리뷰가 삭제되었습니다.');
          } catch (error) {
            console.error('❌ 리뷰 삭제 실패:', error);
            if (axios.isAxiosError(error)) {
              if (error.response?.status === 401) {
                Alert.alert('오류', '로그인이 만료되었습니다.');
              } else if (error.response?.status === 403) {
                Alert.alert('오류', '삭제 권한이 없습니다.');
              } else if (error.response?.status === 404) {
                Alert.alert('오류', '해당 리뷰를 찾을 수 없습니다.');
              } else {
                Alert.alert(
                  '오류',
                  error.response?.data?.message || '리뷰 삭제에 실패했습니다.',
                );
              }
            } else {
              Alert.alert('오류', '네트워크 연결을 확인해주세요.');
            }
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEdit = (review: Review) => {
    // 해당 투어 프로그램의 상세 페이지로 이동
    navigation.navigate('Practice', {
      tourProgramId: review.tourProgramId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>내가 쓴 리뷰</Text>

      <FlatList
        data={reviews}
        keyExtractor={item => item.tourProgramId.toString()}
        renderItem={({item}) => (
          <View style={styles.reviewCard}>
            <View style={styles.cardTop}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={styles.actionText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.tourProgramId)}>
                  <Text style={[styles.actionText, {color: 'red'}]}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.date}>{item.createdAt}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>작성한 리뷰가 없습니다.</Text>
        }
        contentContainerStyle={
          reviews.length === 0 ? styles.emptyContainer : undefined
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f9f9f9', padding: 16},
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#0288d1',
    alignSelf: 'center',
  },
  reviewCard: {
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {fontWeight: 'bold', fontSize: 17, color: '#222'},
  actions: {flexDirection: 'row', gap: 12},
  actionText: {
    fontSize: 14,
    color: '#0288d1',
  },
  content: {
    fontSize: 15,
    color: '#444',
    marginVertical: 8,
  },
  date: {
    fontSize: 13,
    color: '#888',
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#aaa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default MyReviewList;
