import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import axios from 'axios';

const ratingData = [
  {score: 5, count: 39},
  {score: 4, count: 2},
  {score: 3, count: 1},
  {score: 2, count: 0},
  {score: 1, count: 1},
];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

export default function ReviewScreen() {
  const maxCount = Math.max(...ratingData.map(r => r.count));
  // Removed unused totalCount variable

  const [sortOrder, setSortOrder] = useState<'latest' | 'rating' | 'lowRating'>(
    'latest',
  );
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sortMap = React.useMemo(
    () => ({
      latest: 'addedDesc',
      rating: 'ratingDesc',
      lowRating: 'ratingAsc', // ⭐ 별점 낮은 순
    }),
    [],
  );

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:8080/api/review?page=0&size=10&sortOption=${sortMap[sortOrder]}`,
          {
            headers: {
              Authorization: 'Bearer YOUR_ACCESS_TOKEN', // 여기에 토큰 입력
            },
          },
        );
        setReviews(res.data.data);
      } catch (error) {
        console.error('리뷰 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sortOrder, sortMap]);

  if (loading) {
    return <ActivityIndicator size="large" style={{marginTop: 50}} />;
  }

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#fff'}}>
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
                uri: `https://via.placeholder.com/36x36.png?text=${encodeURIComponent(
                  review.name.charAt(0),
                )}`,
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.nickname}>{review.name}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.smallText}>
                  {renderStars(review.rating)}
                </Text>
                <Text style={styles.date}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.content}>{review.content}</Text>
          {review.imageUrls.length > 0 && (
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
