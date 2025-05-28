import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import axios from 'axios';

const mockReviewsInit = [
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
];

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

interface ReviewScreenProps {
  tourProgramId: number;
}

export default function ReviewScreen({tourProgramId}: ReviewScreenProps) {
  const maxCount = Math.max(...ratingData.map(r => r.count));
  const totalCount = ratingData.reduce((sum, r) => sum + r.count, 0);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'rating'>(
    'latest',
  );
  const [mockReviews, setMockReviews] = useState(mockReviewsInit);

  // 리뷰 작성 상태
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedReviews = [...mockReviews].sort((a, b) => {
    if (sortOrder === 'latest') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return b.avg - a.avg;
    }
  });

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
      Alert.alert('리뷰 내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/review', {
        rating: `${newRating}!0`,
        content: newContent,
        tourProgramId,
        imageUrls: newImageUrl ? [newImageUrl] : [],
      });

      if (response.status === 200) {
        // 성공 시 프론트에 추가
        setMockReviews([
          {
            name: '나',
            count: 1,
            avg: newRating,
            avatar: 'https://via.placeholder.com/36x36.png?text=🧑',
            date: new Date().toISOString().slice(0, 10),
            text: newContent,
            tags: [],
            images: newImageUrl ? [newImageUrl] : [],
          },
          ...mockReviews,
        ]);
        setNewContent('');
        setNewImageUrl('');
        setNewRating(5);
        Alert.alert('리뷰가 등록되었습니다!');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Alert.alert(
          '리뷰 등록 실패',
          error.response?.data?.message || '알 수 없는 오류가 발생했습니다.',
        );
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
              <View style={styles.metaRow}>
                <Text style={styles.smallText}>{renderStars(review.avg)}</Text>
                <Text style={styles.date}>{review.date}</Text>
              </View>
            </View>
          </View>
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
    // borderBottomWidth: 1,
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
    minWidth: 240, // ← 필요시 고정 너비로 위치 안정
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
