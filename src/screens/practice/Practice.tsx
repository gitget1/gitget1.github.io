import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Image} from 'react-native';
import {Picker} from '@react-native-picker/picker';

const mockReviews = [
  {
    name: '하늘이',
    count: 12,
    avg: 4.9,
    avatar: 'https://via.placeholder.com/36x36.png?text=😀',
    date: '2024-06-20',
    text: '바다 전망이 정말 환상적이었어요! 사진으로는 담기지 않는 감동🥺🌊',
    tags: ['제주도', '오션뷰숙소', '힐링여행'],
    images: [
      'https://via.placeholder.com/120x120.png?text=🌊1',
      'https://via.placeholder.com/120x120.png?text=🌊2',
    ],
  },
  {
    name: '트래블러',
    count: 27,
    avg: 5.0,
    avatar: 'https://via.placeholder.com/36x36.png?text=😊',
    date: '2024-06-15',
    text: '한옥마을의 고즈넉한 분위기와 전통음식까지 완벽한 여행이었어요❤️',
    tags: ['한옥마을', '전통여행', '맛집투어'],
    images: [],
  },
];

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
  const totalCount = ratingData.reduce((sum, r) => sum + r.count, 0);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'rating'>(
    'latest',
  );

  const sortedReviews = [...mockReviews].sort((a, b) => {
    if (sortOrder === 'latest') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return b.avg - a.avg;
    }
  });

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
        <Text style={styles.totalReviewText}>총 리뷰 {totalCount}개</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sortOrder}
            onValueChange={value => setSortOrder(value)}
            style={styles.picker}>
            <Picker.Item label="최신순" value="latest" />
            <Picker.Item label="오래된순" value="oldest" />
            <Picker.Item label="별점순" value="rating" />
          </Picker>
        </View>
      </View>

      {/* 💬 리뷰 카드들 */}
      {sortedReviews.map((review, i) => (
        <View key={i} style={styles.reviewCard}>
          <View style={styles.profileRow}>
            <Image source={{uri: review.avatar}} style={styles.avatar} />
            <View>
              <Text style={styles.nickname}>{review.name}</Text>
              <Text style={styles.smallText}>{renderStars(review.avg)}</Text>
            </View>
          </View>
          <Text style={styles.date}>{review.date}</Text>
          <Text style={styles.content}>{review.text}</Text>
          <View style={styles.tagBox}>
            {review.tags.map((tag, j) => (
              <Text key={j} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
          {review.images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginTop: 10}}>
              {review.images.map((img, idx) => (
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
    borderBottomWidth: 1,
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
    marginBottom: 4,
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
});
