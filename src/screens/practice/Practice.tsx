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
import {useTranslation} from 'react-i18next';

// JWT 토큰 디코딩 함수
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 디코딩 실패:', error);
    return null;
  }
};

// 별점 텍스트 매핑 함수
const getRatingTexts = (t: any) => [
  t('selectRating'),
  t('worstRating'),
  t('badRating'),
  t('averageRating'),
  t('goodRating'),
  t('excellentRating'),
];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

export default function ReviewScreen() {
  const {t} = useTranslation();
  const route = useRoute<RouteProp<AppStackParamList, 'Practice'>>();
  const tourProgramId = route.params?.tourProgramId;

  console.log('🟢 Practice 화면 - route.params:', route.params);
  console.log('🟢 Practice 화면 - 받은 tourProgramId:', tourProgramId);
  console.log('🟢 Practice 화면 - tourProgramId 타입:', typeof tourProgramId);

  // 투어 정보 state 추가
  const [tourInfo, setTourInfo] = useState<any>(null);
  const [tourLoading, setTourLoading] = useState(true);

  // 평균 별점과 별점 분포 계산 함수
  const calculateRatingStats = (reviews: any[]) => {
    if (reviews.length === 0) return {average: 0, distribution: []};

    const distribution = Array(5)
      .fill(0)
      .map((_, i) => ({
        score: 5 - i,
        count: 0,
      }));

    let totalRating = 0;
    reviews.forEach(review => {
      const rating = Math.floor(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[5 - rating].count++;
        totalRating += review.rating;
      }
    });

    return {
      average: totalRating / reviews.length,
      distribution,
    };
  };

  const [sortOrder, setSortOrder] = useState<'latest' | 'rating' | 'lowRating'>(
    'latest',
  );
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const sortMap = React.useMemo(
    () => ({
      latest: 'addedDesc',
      rating: 'ratingDesc',
      lowRating: 'ratingAsc',
    }),
    [],
  );

  // 현재 사용자 정보 가져오기 (JWT 토큰에서 추출)
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          // JWT 토큰에서 사용자 ID 추출
          const decoded = decodeJWT(token);
          if (decoded && decoded.sub) {
            console.log('🟢 JWT에서 추출한 사용자 ID:', decoded.sub);
            setCurrentUserId(decoded.sub); // naver_YgO-xSMXKaCip8Z-7vMrGxhYgZiVE06qJ6_7lPJS6hg 형태
          }
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    };
    getCurrentUser();
  }, []);

  // 투어 정보 가져오기
  useEffect(() => {
    const fetchTourInfo = async () => {
      if (!tourProgramId) {
        setTourLoading(false);
        return;
      }

      try {
        setTourLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        
        const response = await axios.get(
          `http://124.60.137.10/api/tour-program/${tourProgramId}`,
          {
            headers: token ? {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            } : undefined,
            timeout: 10000,
          },
        );

        if (response.data.status === 'OK') {
          setTourInfo(response.data.data);
        }
      } catch (error) {
        console.error('투어 정보 로딩 실패:', error);
      } finally {
        setTourLoading(false);
      }
    };

    fetchTourInfo();
  }, [tourProgramId]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!tourProgramId) {
        console.log('tourProgramId가 없습니다. 리뷰를 로드하지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('리뷰 요청 tourProgramId:', tourProgramId);

        // 로컬 스토리지에서 토큰 가져오기
        const token = await AsyncStorage.getItem('accessToken');

        const res = await axios.get(
          `http://124.60.137.10/api/review/${tourProgramId}`,
          {
            params: {
              page: 0,
              size: 10,
              sortOption: sortMap[sortOrder],
            },
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : undefined,
          },
        );
        if (
          res.data.status === '100 CONTINUE' ||
          res.data.status === 'Success' ||
          res.data.status === 'OK'
        ) {
          // 원본 서버 응답 데이터 확인
          console.log('🔍 원본 서버 응답:', res.data);
          console.log('🔍 원본 데이터 배열:', res.data.data);

          // 각 원본 리뷰 데이터 확인
          res.data.data.forEach((review: any, index: number) => {
            console.log(`🔍 원본 리뷰 ${index} 전체:`, review);
            console.log(`🔍 원본 리뷰 ${index} 필드들:`, {
              id: review.id,
              reviewId: review.reviewId,
              review_id: review.review_id,
              Id: review.Id,
              ID: review.ID,
              user_id: review.user_id,
              userId: review.userId,
              name: review.name,
              rating: review.rating,
              content: review.content,
              모든키: Object.keys(review),
            });

            // 모든 필드 중 숫자인 것들을 찾기
            const numericFields = Object.keys(review).filter(
              key => typeof review[key] === 'number' && review[key] > 0,
            );
            console.log(
              `🔍 숫자 필드들 (ID 후보):`,
              numericFields.map(key => `${key}: ${review[key]}`),
            );

            // ID 관련 필드들만 따로 출력
            const idRelatedFields = Object.entries(review).filter(
              ([key, _value]) =>
                key.toLowerCase().includes('id') ||
                key.toLowerCase().includes('review') ||
                key.toLowerCase().includes('program'),
            );
            console.log('🆔 ID 관련 필드들:', idRelatedFields);
          });

          const processedReviews = res.data.data.map(
            (review: any, index: number) => {
              // 실제 서버의 리뷰 ID 사용 (서버에서 받은 원본 ID)
              const actualId = review.id || review.reviewId || index + 1000;

              console.log(`🔍 리뷰 ${index} ID 매핑:`, {
                원본id: review.id,
                reviewId: review.reviewId,
                review_id: review.review_id,
                선택된ID: actualId,
                임시ID여부: !actualId,
                모든숫자필드: Object.entries(review)
                  .filter(
                    ([_key, value]) => typeof value === 'number' && value > 0,
                  )
                  .map(([key, value]) => `${key}: ${value}`),
                ID가능필드들: Object.entries(review)
                  .filter(
                    ([_key, value]) =>
                      typeof value === 'number' &&
                      value > 0 &&
                      value < 1000 &&
                      !_key.toLowerCase().includes('user') &&
                      !_key.toLowerCase().includes('rating'),
                  )
                  .map(([key, value]) => `${key}: ${value}`),
              });

              return {
                ...review,
                id: actualId || index + 1000, // 임시 ID로 인덱스 + 1000 사용
                imageUrls: Array.isArray(review.imageUrls)
                  ? review.imageUrls
                  : [],
                rating: typeof review.rating === 'number' ? review.rating : 0,
                content: review.content || '',
                name: review.user?.name || review.name || '익명',
                user_id: review.user_id || review.userId, // 사용자 ID 추가
                createdAt:
                  review.createdAt ||
                  review.created_at ||
                  new Date().toISOString(),
              };
            },
          );
          setReviews(processedReviews);
          console.log('🟢 처리된 리뷰 데이터:', processedReviews);
          console.log('🟢 현재 사용자 ID:', currentUserId);

          // 각 리뷰의 ID와 user_id 확인
          processedReviews.forEach((review, index) => {
            console.log(`🟢 처리된 리뷰 ${index}:`, {
              id: review.id,
              user_id: review.user_id,
              name: review.name,
              content: review.content?.substring(0, 20) + '...',
            });
          });
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
  }, [sortOrder, sortMap, tourProgramId, currentUserId]);

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
    console.log('🟢 리뷰 작성 시도 - tourProgramId:', tourProgramId);
    console.log(
      '🟢 리뷰 작성 시도 - tourProgramId 타입:',
      typeof tourProgramId,
    );

    if (!tourProgramId) {
      Alert.alert('알림', 'tourProgramId가 없습니다. 다시 시도해주세요.');
      return;
    }

    if (!newContent.trim()) {
      Alert.alert(t('alert'), t('enterReviewContentAlert'));
      return;
    }

    // 로그인 상태 확인
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      Alert.alert(t('alert'), t('loginRequiredTour'));
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingString = newRating.toFixed(1); // 5.0 형식으로 변환

      console.log('🟢 리뷰 등록 요청 데이터:', {
        tourProgramId: tourProgramId,
        rating: ratingString,
        content: newContent,
        imageUrls: newImageUrl ? [newImageUrl] : [],
      });

      const response = await axios.post(
        `http://124.60.137.10/api/review`,
        {
          tourProgramId: tourProgramId,
          rating: ratingString,
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
        console.log('🟢 리뷰 작성 성공 응답:', response.data);

        // 성공 시 서버에서 반환된 리뷰 ID와 사용자 정보 확인
        const createdReview = response.data.data || {};
        console.log('🟢 생성된 리뷰 정보:', createdReview);

        // 실제 사용자 ID 업데이트 (서버 응답에서 확인)
        if (createdReview.user_id) {
          console.log('🟢 실제 사용자 ID:', createdReview.user_id);
          setCurrentUserId(createdReview.user_id);
        }

        // 성공 시 프론트에 추가
        const newReview = {
          id: createdReview.id || Date.now(), // 임시 ID
          rating: newRating,
          content: newContent,
          createdAt: new Date().toISOString(),
          imageUrls: newImageUrl ? [newImageUrl] : [],
          name: '나',
          user: {name: '나'},
          user_id: currentUserId, // 현재 사용자 ID를 명시적으로 설정
        };
        
        console.log('🟢 새로 추가되는 리뷰 정보:', newReview);
        console.log('🟢 현재 사용자 ID:', currentUserId);
        
        setReviews([newReview, ...reviews]);
        setNewContent('');
        setNewImageUrl('');
        setNewRating(5);
        Alert.alert(t('successTour'), t('reviewRegistered'));
      } else {
        throw new Error(response.data.message || '리뷰 등록에 실패했습니다.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert(t('alert'), t('loginRequiredTour'));
        } else {
          Alert.alert(
            t('errorTour'),
            error.response?.data?.message || '알 수 없는 오류가 발생했습니다.',
          );
        }
      } else {
        Alert.alert(t('errorTour'), '알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 리뷰 삭제 함수
  const handleDeleteReview = async (reviewId: number, reviewIndex: number) => {
    console.log('🟢 삭제 시도 - 전체 리뷰 정보:', reviews[reviewIndex]);

    // 실제 서버의 리뷰 ID 사용
    const actualReviewId = reviewId;

    console.log('🟢 사용할 리뷰 ID:', {
      reviewId: actualReviewId,
      currentUserId,
      reviewData: reviews[reviewIndex],
      JWT사용자ID: currentUserId,
    });

    Alert.alert(t('deleteReview'), t('deleteReviewConfirm'), [
      {
        text: t('cancelTour'),
        style: 'cancel',
      },
      {
        text: t('deleteTour'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🟢 리뷰 삭제 요청:', {
              actualReviewId,
              reviewIndex,
              currentUserId,
              reviewId타입: typeof actualReviewId,
              리뷰객체: reviews[reviewIndex],
            });

            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
              Alert.alert(t('alert'), t('loginRequiredTour'));
              return;
            }

            // tourProgramId를 사용하여 삭제 요청
            console.log('🔍 삭제 시도할 리뷰 정보:', {
              reviewId: actualReviewId,
              tourProgramId: tourProgramId,
              reviewUserId: reviews[reviewIndex].user_id,
              currentUserId: currentUserId,
            });

            // tourProgramId를 리뷰 ID 대신 사용
            const deleteUrl = `http://124.60.137.10/api/review/${tourProgramId}`;
            console.log('🟢 tourProgramId로 삭제 요청:', deleteUrl);
            console.log(
              '🟢 전체 리뷰 목록:',
              reviews.map(r => ({
                id: r.id,
                content: r.content?.substring(0, 10),
              })),
            );

            const response = await axios.delete(deleteUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (
              response.data.status === 'OK' ||
              response.data.status === 'Success'
            ) {
              console.log('🟢 리뷰 삭제 성공');

              // 삭제 성공 후 리뷰 목록 새로고침
              try {
                const token = await AsyncStorage.getItem('accessToken');
                const refreshRes = await axios.get(
                  `http://124.60.137.10/api/review/${tourProgramId}`,
                  {
                    params: {
                      page: 0,
                      size: 10,
                      sortOption: sortMap[sortOrder],
                    },
                    headers: token
                      ? {
                          Authorization: `Bearer ${token}`,
                        }
                      : undefined,
                  },
                );

                if (
                  refreshRes.data.status === '100 CONTINUE' ||
                  refreshRes.data.status === 'Success' ||
                  refreshRes.data.status === 'OK'
                ) {
                  const processedReviews = refreshRes.data.data.map(
                    (review: any, index: number) => ({
                      ...review,
                      id:
                        review.user_id ||
                        review.userId ||
                        currentUserId ||
                        index + 1000, // user_id를 리뷰 ID로 사용
                      imageUrls: Array.isArray(review.imageUrls)
                        ? review.imageUrls
                        : [],
                      rating:
                        typeof review.rating === 'number' ? review.rating : 0,
                      content: review.content || '',
                      name: review.user?.name || review.name || '익명',
                      user_id: review.user_id || review.userId,
                      createdAt:
                        review.createdAt ||
                        review.created_at ||
                        new Date().toISOString(),
                    }),
                  );
                  setReviews(processedReviews);
                  console.log('🟢 리뷰 목록 새로고침 완료');
                }
              } catch (refreshError) {
                console.error('🔴 리뷰 목록 새로고침 실패:', refreshError);
                // 새로고침 실패 시 기존 방식으로 해당 리뷰만 제거
                setReviews(prev =>
                  prev.filter((_, index) => index !== reviewIndex),
                );
              }

              Alert.alert(t('successTour'), t('reviewDeleted'));
            } else {
              throw new Error(
                response.data.message || '리뷰 삭제에 실패했습니다.',
              );
            }
          } catch (error) {
            console.error('리뷰 삭제 실패:', error);
            if (axios.isAxiosError(error)) {
              Alert.alert(
                t('errorTour'),
                error.response?.data?.message || '리뷰 삭제에 실패했습니다.',
              );
            } else {
              Alert.alert(t('errorTour'), '리뷰 삭제에 실패했습니다.');
            }
          }
        },
      },
    ]);
  };

  // 번역 키 매핑
  const getTranslatedText = (key: string): string => {
    const translations: {[key: string]: string} = {
      'wishlist': '찜',
      'totalReviews': '리뷰',
    };
    return translations[key] || key;
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#fff'}}>
      {/* 투어 정보 헤더 */}
      {!tourLoading && tourInfo && (
        <View style={styles.tourHeader}>
          <View style={styles.tourInfo}>
            <Text style={styles.tourTitle} numberOfLines={2}>
              {tourInfo.title || '제목 없음'}
            </Text>
            <Text style={styles.tourRegion}>
              📍 {tourInfo.region || '지역 정보 없음'}
            </Text>
          </View>
          <View style={styles.tourStats}>
            <Text style={styles.reviewCount}>
              💬 {getTranslatedText('totalReviews')} {reviews.length}
            </Text>
            <Text style={styles.wishlistCount}>
              🤍 {getTranslatedText('wishlist')} {tourInfo.wishlistCount || 0}
            </Text>
          </View>
        </View>
      )}

      {/* 리뷰 작성 폼 */}
      <View style={styles.writeBox}>
        <Text style={styles.writeTitle}>{t('writeReview')}</Text>
        <View style={styles.writeRow}>
          <Text style={{marginRight: 8}}>{t('ratingReview')}</Text>
          {renderStarInput()}
        </View>
        <Text style={{marginBottom: 8, color: '#1976d2', fontWeight: 'bold'}}>
          {getRatingTexts(t)[Math.round(newRating)]}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={t('enterReviewContent')}
          value={newContent}
          onChangeText={setNewContent}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder={t('imageUrlOptional')}
          value={newImageUrl}
          onChangeText={setNewImageUrl}
        />
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text style={styles.submitBtnText}>
            {isSubmitting ? t('submittingReview') : t('submitReview')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⭐ 평균 평점 영역 */}
      <View style={styles.ratingSummary}>
        {(() => {
          const {average, distribution} = calculateRatingStats(reviews);
          const maxCount = Math.max(...distribution.map(r => r.count));

          return (
            <>
              <View style={{alignItems: 'center', marginRight: 24}}>
                <Text style={styles.bigScore}>{average.toFixed(1)}</Text>
                <Text style={styles.stars}>{renderStars(average)}</Text>
              </View>
              <View style={{flex: 1}}>
                {distribution.map(r => (
                  <View key={r.score} style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>{r.score}점</Text>
                    <View style={styles.barBackground}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width:
                              maxCount > 0
                                ? `${(r.count / maxCount) * 100}%`
                                : '0%',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.countText}>{r.count}</Text>
                  </View>
                ))}
              </View>
            </>
          );
        })()}
      </View>

      {/* ⬇️ 총 리뷰 수 + 정렬 드롭다운 */}
      <View style={styles.reviewHeaderRow}>
        <Text style={styles.totalReviewText}>
          {getTranslatedText('totalReviews')} {reviews.length}
          {t('reviewsCount')}
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sortOrder}
            onValueChange={value => setSortOrder(value)}
            style={styles.picker}>
            <Picker.Item label={t('latestReview')} value="latest" />
            <Picker.Item label={t('highRating')} value="rating" />
            <Picker.Item label={t('lowRating')} value="lowRating" />
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
            <View style={styles.flex1}>
              <Text style={styles.nickname}>
                {review.name || t('anonymousReview')}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.smallText}>
                  {renderStars(review.rating || 0)}
                </Text>
                <Text style={styles.date}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {/* 본인이 작성한 리뷰인 경우만 삭제 버튼 표시 */}
            {(() => {
              // 디버깅을 위한 로그
              console.log(`🔍 리뷰 ${i} 삭제 버튼 조건 확인:`, {
                reviewUserId: review.user_id,
                currentUserId: currentUserId,
                reviewName: review.name,
                reviewUserName: review.user?.name,
                reviewId: review.id,
                reviewContent: review.content?.substring(0, 20),
              });

              // 임시로 모든 리뷰에 삭제 버튼 표시 (테스트용)
              const isMyReview = true;

              console.log(`🔍 리뷰 ${i} 삭제 버튼 표시 여부:`, isMyReview);

              return isMyReview ? (
                <TouchableOpacity
                  style={styles.tempDeleteButton}
                  onPress={() => handleDeleteReview(review.id, i)}>
                  <Text style={styles.tempDeleteButtonText}>삭제</Text>
                </TouchableOpacity>
              ) : null;
            })()}
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
  flex1: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4444',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#ff4444',
  },
  tempDeleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  tempDeleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tourInfo: {
    flex: 1,
  },
  tourTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tourRegion: {
    fontSize: 14,
    color: '#666',
  },
  tourStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 16,
  },
  wishlistCount: {
    fontSize: 14,
    color: '#666',
  },
});
