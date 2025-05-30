import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import axios from 'axios';
import {useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ratingData = [
  {score: 5, count: 39},
  {score: 4, count: 2},
  {score: 3, count: 1},
  {score: 2, count: 0},
  {score: 1, count: 1},
];

// 별점 텍스트 매핑
const ratingTexts = [
  '선택하세요',
  '최악이에요',
  '별로예요',
  '보통이에요',
  '좋아요',
  '최고예요!',
];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

export default function ReviewScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'Practice'>>();
  const tourProgramId = route.params?.tourProgramId ?? 1;

  const maxCount = Math.max(...ratingData.map(r => r.count));

  const [sortOrder, setSortOrder] = useState<'latest' | 'rating' | 'lowRating'>(
    'latest',
  );
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortMap = React.useMemo(
    () => ({
      latest: 'addedDesc',
      rating: 'ratingDesc',
      lowRating: 'ratingAsc',
    }),
    [],
  );

  useEffect(() => {
    const fetchReviews = async () => {
      if (!tourProgramId) {
        console.error('tourProgramId가 없습니다.');
        return;
      }

      try {
        setLoading(true);
        console.log('리뷰 요청 tourProgramId:', tourProgramId);

        // 로컬 스토리지에서 토큰 가져오기
        const token = await AsyncStorage.getItem('userToken');

        const res = await axios.get(`http://124.60.137.10:80/api/review/{toruProgramId}}`, {
          params: {
            page: 0,
            size: 10,
            sortOption: sortMap[sortOrder],
            tourProgramId: tourProgramId,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });
        if (
          res.data.status === '100 CONTINUE' ||
          res.data.status === 'Success' ||
          res.data.status === 'OK'
        ) {
          const processedReviews = res.data.data.map((review: any) => ({
            ...review,
            imageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : [],
            rating: typeof review.rating === 'number' ? review.rating : 0,
            content: review.content || '',
            name: review.user?.name || '익명',
            createdAt: review.createdAt || new Date().toISOString(),
          }));
          setReviews(processedReviews);
        } else {
          console.error('API 응답 상태:', res.data.status);
          throw new Error(
            res.data.message || '리뷰를 불러오는데 실패했습니다.',
          );
        }
      } catch (error) {
        console.error('리뷰 불러오기 실패:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        } else {
          Alert.alert('오류', '리뷰를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sortOrder, sortMap, tourProgramId]);

  if (loading) {
    return <ActivityIndicator size="large" style={{marginTop: 50}} />;
  }

  // 별점 렌더링 함수
  const renderStarInput = () => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      // 0.5 단위로 두 개의 Pressable
      const leftValue = i - 0.5;
      const rightValue = i;
      stars.push(
        <Pressable
          key={leftValue}
          onPress={() => setNewRating(leftValue)}
          hitSlop={8}
          style={{marginRight: -8}}>
          <Text
            style={{
              fontSize: 32,
              color: newRating >= leftValue ? '#FFD700' : '#ccc',
            }}>
            {newRating >= rightValue ? '★' : newRating >= leftValue ? '⯨' : '☆'}
          </Text>
        </Pressable>,
      );
    }
    return (
      <View style={{flexDirection: 'row', alignItems: 'center'}}>{stars}</View>
    );
  };

  // 리뷰 작성 핸들러
  const handleSubmit = async () => {
    if (!newContent.trim()) {
      Alert.alert('알림', '리뷰 내용을 입력해주세요.');
      return;
    }

    // 로그인 상태 확인
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      Alert.alert('알림', '리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `http://10.0.2.2:8080/api/review`,
        {
          tourProgramId: tourProgramId,
          rating: newRating,
          content: newContent,
          imageUrls: newImageUrl ? [newImageUrl] : [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (
        response.data.status === '100 CONTINUE' ||
        response.data.status === 'Success' ||
        response.data.status === 'OK'
      ) {
        // 성공 시 프론트에 추가
        const newReview = {
          rating: newRating,
          content: newContent,
          createdAt: new Date().toISOString(),
          imageUrls: newImageUrl ? [newImageUrl] : [],
          name: '나',
          user: {name: '나'},
        };
        setReviews([newReview, ...reviews]);
        setNewContent('');
        setNewImageUrl('');
        setNewRating(5);
        Alert.alert('성공', '리뷰가 등록되었습니다!');
      } else {
        throw new Error(response.data.message || '리뷰 등록에 실패했습니다.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        } else {
          Alert.alert(
            '리뷰 등록 실패',
            error.response?.data?.message || '알 수 없는 오류가 발생했습니다.',
          );
        }
      } else {
        Alert.alert('리뷰 등록 실패', '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#fff'}}>
      {/* 리뷰 작성 폼 */}
      <View style={styles.writeBox}>
        <Text style={styles.writeTitle}>리뷰 작성</Text>
        <View style={styles.writeRow}>
          <Text style={{marginRight: 8}}>별점</Text>
          {renderStarInput()}
        </View>
        <Text style={{marginBottom: 8, color: '#1976d2', fontWeight: 'bold'}}>
          {ratingTexts[Math.round(newRating)]}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="리뷰 내용을 입력하세요"
          value={newContent}
          onChangeText={setNewContent}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="이미지 URL (선택)"
          value={newImageUrl}
          onChangeText={setNewImageUrl}
        />
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text style={styles.submitBtnText}>
            {isSubmitting ? '등록 중...' : '리뷰 등록'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ 평균 평점 영역 */}
      <View style={styles.ratingSummary}>
        <View style={{alignItems: 'center', marginRight: 24}}>
          <Text style={styles.bigScore}>4.8</Text>
          <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
        </View>
        <View style={{flex: 1}}>
          {ratingData.map(r => (
            <View key={r.score} style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{r.score}점</Text>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    {width: `${(r.count / maxCount) * 100}%`},
                  ]}
                />
              </View>
              <Text style={styles.countText}>{r.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ⬇️ 총 리뷰 수 + 정렬 드롭다운 */}
      <View style={styles.reviewHeaderRow}>
        <Text style={styles.totalReviewText}>총 리뷰 {reviews.length}개</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sortOrder}
            onValueChange={value => setSortOrder(value)}
            style={styles.picker}>
            <Picker.Item label="최신순" value="latest" />
            <Picker.Item label="별점 높은순" value="rating" />
            <Picker.Item label="별점 낮은순" value="lowRating" />
          </Picker>
        </View>
      </View>

      {/* 💬 리뷰 카드들 */}
      {reviews.map((review, i) => (
        <View key={i} style={styles.reviewCard}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri:
                  review.user?.avatar ||
                  `https://via.placeholder.com/36x36.png?text=${encodeURIComponent(
                    (review.name || '익명').charAt(0),
                  )}`,
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.nickname}>{review.name || '익명'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.smallText}>
                  {renderStars(review.rating || 0)}
                </Text>
                <Text style={styles.date}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.content}>{review.content}</Text>
          {review.imageUrls && review.imageUrls.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginTop: 10}}>
              {review.imageUrls.map((img: string, idx: number) => (
                <Image
                  key={idx}
                  source={{uri: img}}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 8,
                    marginRight: 10,
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  writeBox: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
  },
  writeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  writeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingSummary: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  bigScore: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stars: {
    fontSize: 20,
    textAlign: 'center',
    color: '#FFA500',
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreLabel: {
    width: 30,
    fontSize: 14,
  },
  barBackground: {
    height: 6,
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginHorizontal: 6,
  },
  barFill: {
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  countText: {
    width: 24,
    textAlign: 'right',
    fontSize: 13,
    color: '#333',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  totalReviewText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
    width: 150,
  },
  picker: {
    height: 40,
    width: '100%',
  },
  reviewCard: {
    padding: 16,
    marginTop: 12,
    borderColor: '#eee',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  nickname: {
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    minWidth: 240,
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 4,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
