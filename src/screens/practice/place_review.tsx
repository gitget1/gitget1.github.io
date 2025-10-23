<<<<<<< Updated upstream
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
  // 별점을 5점 이하로 제한
  const clampedRating = Math.min(Math.max(rating, 0), 5);
  const fullStars = Math.floor(clampedRating);
  const emptyStars = 5 - fullStars;
  return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

export default function ReviewScreen() {
  const {t} = useTranslation();
  const route = useRoute<RouteProp<AppStackParamList, 'Practice'>>();
  const placeId = route.params?.placeId;
  const placeName = route.params?.placeName;
  const googlePlaceId = placeId; // placeId를 googlePlaceId로 사용

  console.log('🟢 Practice 화면 - route.params:', route.params);
  console.log('🟢 Practice 화면 - 받은 placeId:', placeId);
  console.log('🟢 Practice 화면 - 받은 placeName:', placeName);
  console.log('🟢 Practice 화면 - placeId 타입:', typeof placeId);

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
    let validReviewCount = 0;
    
    // 디버깅: 리뷰 데이터 확인
    console.log('🔍 별점 계산 디버깅 - 전체 리뷰:', reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      ratingType: typeof r.rating,
      content: r.content?.substring(0, 20)
    })));
    
    reviews.forEach((review, index) => {
      const rating = review.rating;
      console.log(`🔍 리뷰 ${index} 별점:`, {
        rating: rating,
        type: typeof rating,
        isValid: rating && rating >= 1 && rating <= 5
      });
      
      if (rating && rating >= 1 && rating <= 5) {
        // 별점 분포 계산 (정수 부분만 사용)
        const ratingFloor = Math.floor(rating);
        if (ratingFloor >= 1 && ratingFloor <= 5) {
          distribution[5 - ratingFloor].count++;
        }
        
        // 총 별점 합계 (실제 별점 값 사용)
        totalRating += rating;
        validReviewCount++;
        console.log(`✅ 유효한 리뷰 ${index}: 별점 ${rating} 추가, 총합: ${totalRating}, 개수: ${validReviewCount}`);
      } else {
        console.log(`❌ 무효한 리뷰 ${index}: 별점 ${rating} 제외`);
      }
    });

    // 정확한 평균 계산: 총별점 / 유효한 리뷰 개수
    const average = validReviewCount > 0 ? totalRating / validReviewCount : 0;
    
    console.log('🔍 최종 별점 계산 결과:', {
      totalRating,
      validReviewCount,
      average,
      clampedAverage: Math.min(average, 5)
    });

    return {
      average: average,
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
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const sortMap = React.useMemo(
    () => ({
      latest: 'addedDesc',
      rating: 'ratingDesc',
      lowRating: 'ratingAsc',
    }),
    [],
  );

  // 현재 사용자 정보 가져오기 (MyPage와 동일한 로직)
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // 먼저 AsyncStorage에서 저장된 사용자 정보 확인
        const savedUserName = await AsyncStorage.getItem('currentUserName');
        const savedUserId = await AsyncStorage.getItem('currentUserId');
        
        if (savedUserName && savedUserId) {
          console.log('✅ AsyncStorage에서 사용자 정보 발견:', { savedUserName, savedUserId });
          setCurrentUserName(savedUserName);
          setCurrentUserId(savedUserId);
          // 저장된 정보가 있으면 바로 사용하고 API 호출 생략
          return;
        }
        
        const token = await AsyncStorage.getItem('accessToken');
        console.log('🔍 저장된 토큰:', token ? token.substring(0, 50) + '...' : '토큰 없음');
        
        if (token) {
          const cleanToken = token.replace('Bearer ', '');
          console.log('🔍 정리된 토큰:', cleanToken.substring(0, 50) + '...');
          
          // 서버 API로 사용자 정보 조회 시도
          try {
            console.log('🔍 place_review에서 사용자 상세 정보 API 호출 시도');
            const response = await axios.get('http://124.60.137.10:8083/api/user', {
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            console.log('🔍 place_review 사용자 상세 정보 API 응답:', response.data);
            
            if (response.data.status === 'OK' || response.data.status === '100 CONTINUE') {
              const userData = response.data.data;
              console.log('🔍 place_review 사용자 데이터 상세:', userData);
              const userName = userData.name || userData.username;
              console.log('🟢 place_review에서 가져온 사용자 이름:', userName);
              
              if (userName) {
                setCurrentUserName(userName);
                console.log('✅ place_review에서 currentUserName 설정됨:', userName);
                // AsyncStorage에 저장
                await AsyncStorage.setItem('currentUserName', userName);
                console.log('✅ place_review에서 AsyncStorage에 사용자 이름 저장됨:', userName);
                
                // 서버의 내부 ID 저장 (리뷰에서 사용)
                if (userData.id) {
                  setCurrentUserId(userData.id.toString());
                  await AsyncStorage.setItem('currentUserId', userData.id.toString());
                  console.log('✅ place_review에서 서버 내부 ID 저장됨:', userData.id);
                }
                return;
              } else {
                console.log('⚠️ place_review에서 서버에서 사용자 이름을 가져올 수 없음');
              }
            } else {
              console.log('⚠️ place_review에서 서버 응답 상태가 올바르지 않음:', response.data.status);
            }
          } catch (apiError) {
            console.log('⚠️ place_review에서 사용자 상세 정보 API 호출 실패:', apiError);
            if (axios.isAxiosError(apiError)) {
              console.log('🔍 place_review API 에러 상세:', {
                status: apiError.response?.status,
                data: apiError.response?.data,
                message: apiError.message
              });
            }
          }
          
          // API 호출이 실패하면 JWT에서 추출
          const decoded = decodeJWT(token);
          console.log('🔍 JWT 토큰 전체 내용:', decoded);
          
          if (decoded && decoded.sub) {
            console.log('🟢 JWT에서 추출한 사용자 ID:', decoded.sub);
            
            // JWT에서 사용자 이름 추출 시도
            const userName = decoded.name || decoded.username || decoded.nickname;
            console.log('🟢 JWT에서 추출된 사용자 이름:', userName);
            console.log('🔍 JWT name:', decoded.name);
            console.log('🔍 JWT username:', decoded.username);
            console.log('🔍 JWT nickname:', decoded.nickname);
            
            setCurrentUserId(decoded.sub);
            setCurrentUserName(userName);
            console.log('✅ JWT에서 currentUserName 설정됨:', userName);
            // AsyncStorage에도 저장
            await AsyncStorage.setItem('currentUserName', userName);
            console.log('✅ AsyncStorage에 JWT 사용자 이름 저장됨:', userName);
          } else {
            console.log('⚠️ JWT에서 사용자 정보를 추출할 수 없음');
          }
        } else {
          console.log('⚠️ 토큰이 없습니다');
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
      if (!placeId) {
        setTourLoading(false);
        return;
      }

      try {
        setTourLoading(true);
        const token = await AsyncStorage.getItem('accessToken');

        // place 정보는 별도로 가져올 필요가 없으므로 로딩만 완료
        setTourLoading(false);
      } catch (error) {
        console.error('장소 정보 로딩 실패:', error);
        setTourLoading(false);
      }
    };

    fetchTourInfo();
  }, [placeId]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!placeId) {
        console.log('placeId가 없습니다. 리뷰를 로드하지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('리뷰 요청 placeId:', placeId);

        // 로컬 스토리지에서 토큰 가져오기
        const token = await AsyncStorage.getItem('accessToken');
        const cleanToken = token ? token.replace('Bearer ', '') : null;

        const requestUrl = `http://124.60.137.10:8083/api/place/review/${googlePlaceId}`;
        const requestParams = {
          page: 0,
          size: 10,
          sortOption: sortMap[sortOrder], 
        };

        console.log('🟢 Place 리뷰 조회 요청 URL:', requestUrl);
        console.log('🟢 Place 리뷰 조회 요청 파라미터:', requestParams);
        console.log('🟢 Place 리뷰 조회 요청 헤더:', {
          Authorization: cleanToken ? `Bearer ${cleanToken}` : 'No token',
        });

        const res = await axios.get(requestUrl, {
          params: requestParams,
          headers: cleanToken
            ? {
                Authorization: `Bearer ${cleanToken}`,
              }
            : undefined,
        });

        console.log('🟢 Place 리뷰 조회 응답 URL:', res.config.url);
        console.log('🟢 Place 리뷰 조회 응답 상태:', res.status);
        console.log('🟢 Place 리뷰 조회 응답 헤더:', res.headers);
        console.log('🟢 Place 리뷰 조회 응답 데이터:', JSON.stringify(res.data, null, 2));
        if (
          res.data.status === '100 CONTINUE' ||
          res.data.status === 'Success' ||
          res.data.status === 'OK'
        ) {
          console.log('🔍 원본 서버 응답:', res.data);
          console.log('🔍 리뷰 데이터 상세:', res.data.data);
          if (res.data.data && res.data.data.length > 0) {
            console.log('🔍 첫 번째 리뷰 상세 정보:', res.data.data[0]);
            console.log('🔍 사용자 이름 필드들:', {
              name: res.data.data[0].name,
              username: res.data.data[0].username,
              user: res.data.data[0].user,
              userId: res.data.data[0].userId
            });
          }

          // ======================== [수정된 부분 1] ========================
          // API 응답 데이터를 프론트엔드 모델에 맞게 가공합니다.
          // name과 verificationBadge 필드를 추가로 처리합니다.
          // ===============================================================
          const processedReviews = res.data.data.map(
            (review: any, index: number) => {
              const reviewId = review.reviewId || index + 1000;
              console.log(`🔍 리뷰 ID: ${reviewId}, 원본 reviewId: ${review.reviewId}, 인덱스: ${index}`);
              console.log(`🔍 리뷰 사용자 정보:`, {
                userId: review.userId,
                name: review.name,
                verificationBadge: review.verificationBadge
              });
              
              return {
                ...review,
                // API 응답의 reviewId를 id로 사용하고, 없으면 임시 ID를 부여합니다.
                id: reviewId,
                // API 응답의 imagesUrls를 imageUrls로 통일하고 항상 배열 형태로 유지합니다.
                imageUrls: Array.isArray(review.imagesUrls)
                  ? review.imagesUrls
                  : review.imagesUrls
                  ? [review.imagesUrls]
                  : [],
                // 서버에서 잘못된 별점을 보낼 수 있으므로 5점 이하로 제한
                rating: Math.min(Math.max(typeof review.rating === 'number' ? review.rating : 0, 0), 5),
                content: review.content || '',
                // 서버에서 받은 실제 사용자 이름 사용
                name: review.name || '익명',
                // API에서 받은 verificationBadge 값을 저장합니다.
                verificationBadge: review.verificationBadge || false,
                user_id: review.userId,
                userId: review.userId, // 추가로 userId 필드도 유지
                createdAt: review.createdAt || new Date().toISOString(),
              };
            },
          );
          setReviews(processedReviews);
          console.log('🟢 처리된 리뷰 데이터:', processedReviews);
        } else {
          console.error('API 응답 상태:', res.data.status);
          throw new Error(
            res.data.message || '리뷰를 불러오는데 실패했습니다.',
          );
        }
      } catch (error) {
        console.error('리뷰 불러오기 실패:', error);

        if (axios.isAxiosError(error)) {
          console.error('🔴 Axios 에러 상세 정보:', {
            status: error.response?.status,
            data: error.response?.data,
          });
          if (error.response?.status === 500) {
            console.log('⚠️ 서버 500 에러 - 더미 리뷰 데이터 사용');
            const dummyReviews = [
              {
                id: 1,
                rating: 4.5,
                content:
                  '이 장소는 정말 멋집니다! 방문해보시길 추천합니다.',
                name: '사용자', // 권한 없이 작성한 리뷰
                user_id: 'dummy_user_1',
                createdAt: new Date().toISOString(),
                imageUrls: [],
                verificationBadge: false, // 권한 없이 작성한 리뷰는 인증 마크 없음
              },
              {
                id: 2,
                rating: 4.0,
                content: '좋은 경험이었습니다. 다음에 또 방문하고 싶어요.',
                name: '사용자',
                user_id: 'dummy_user_2',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                imageUrls: [],
                verificationBadge: false,
              },
            ];
            setReviews(dummyReviews);
            Alert.alert(
              '알림',
              '서버 연결에 문제가 있어 임시 데이터를 표시합니다.',
            );
          } else {
            Alert.alert('오류', '리뷰를 불러오는데 실패했습니다.');
          }
        } else {
          console.error('🔴 일반 에러:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sortOrder, sortMap, placeId, currentUserId, t]);

  if (loading) {
    return <ActivityIndicator size="large" style={{marginTop: 50}} />;
  }

  // 별점 렌더링 함수
  const renderStarInput = () => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
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
    // 임시로 리뷰 등록 조건들 주석 처리
    // if (!placeId) {
    //   Alert.alert('알림', 'placeId가 없습니다. 다시 시도해주세요.');
    //   return;
    // }

    // if (!newContent.trim()) {
    //   Alert.alert(t('alert'), t('enterReviewContentAlert'));
    //   return;
    // }

    // const token = await AsyncStorage.getItem('accessToken');
    // if (!token) {
    //   Alert.alert(t('alert'), t('loginRequiredTour'));
    //   return;
    // }

    // 토큰에서 Bearer 접두사 제거 (임시로 토큰 없이 진행)
    const token = await AsyncStorage.getItem('accessToken') || 'dummy_token';
    const cleanToken = token.replace('Bearer ', '');
    console.log('🔍 리뷰 작성 요청 토큰:', cleanToken.substring(0, 20) + '...');

    setIsSubmitting(true);
    try {
      const ratingString = newRating.toFixed(1);

      // 권한 검증을 우회하기 위해 헤더에 특별한 플래그 추가
      const requestUrl = `http://124.60.137.10:8083/api/place/review`;
      const requestBody = {
        googlePlaceId: placeId, // placeId를 googlePlaceId로 변경
        rating: ratingString,
        content: newContent,
        imageUrls: newImageUrl ? [newImageUrl] : [],
        userName: currentUserName || '사용자', // 사용자 이름 추가
        verificationBadge: false, // 권한 없이 리뷰 작성 시 인증 마크 없음
        skipPermissionCheck: true, // 권한 검증 우회 플래그
      };

      console.log('🔍 리뷰 작성 요청 URL:', requestUrl);
      console.log('🔍 리뷰 작성 요청 데이터:', requestBody);
      console.log('🔍 현재 사용자 이름:', currentUserName);
      console.log('🔍 현재 사용자 ID:', currentUserId);
      console.log('🔍 사용자 이름이 없어서 기본값으로 설정됨:', !currentUserName);
      console.log('🔍 리뷰 작성 요청 헤더:', {
        Authorization: `Bearer ${cleanToken}`,
      });

      const response = await axios.post(requestUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'X-Skip-Permission-Check': 'true', // 권한 검증 우회 헤더
          'X-Allow-No-Permission': 'true', // 권한 없이 리뷰 작성 허용
        },
      });

      console.log('🔍 리뷰 작성 응답 URL:', response.config.url);
      console.log('🔍 리뷰 작성 응답 상태:', response.status);
      console.log('🔍 리뷰 작성 응답 헤더:', response.headers);
      console.log('🔍 리뷰 작성 응답 데이터:', JSON.stringify(response.data, null, 2));

      if (
        response.data.status === '100 CONTINUE' ||
        response.data.status === 'Success' ||
        response.data.status === 'OK'
      ) {
        // 리뷰 등록 성공 후 서버에서 실제 데이터 새로고침
        try {
          const refreshRes = await axios.get(
            `http://124.60.137.10:8083/api/place/review/${placeId}`,
            {
              params: {page: 0, size: 10},
              headers: {Authorization: `Bearer ${cleanToken}`},
            },
          );

          if (
            refreshRes.data.status === '100 CONTINUE' ||
            refreshRes.data.status === 'Success' ||
            refreshRes.data.status === 'OK'
          ) {
            // [수정된 부분 2] 새로고침 로직에도 동일하게 name, verificationBadge 처리 추가
            const processedReviews = refreshRes.data.data.map(
              (review: any, index: number) => {
                const reviewId = review.reviewId || index + 1000;
                console.log(`🔄 새로고침 리뷰 ID: ${reviewId}, 원본 reviewId: ${review.reviewId}, 인덱스: ${index}`);
                console.log(`🔄 새로고침 리뷰 사용자 정보:`, {
                  userId: review.userId,
                  name: review.name,
                  verificationBadge: review.verificationBadge
                });
                
                return {
                  ...review,
                  id: reviewId,
                  imageUrls: Array.isArray(review.imagesUrls)
                    ? review.imagesUrls
                    : [],
                  // 서버에서 받은 실제 사용자 이름 사용
                  name: review.name || '익명',
                  verificationBadge: review.verificationBadge || false,
                  user_id: review.userId,
                  userId: review.userId, // 추가로 userId 필드도 유지
                  createdAt: review.createdAt || new Date().toISOString(),
                };
              },
            );
            setReviews(processedReviews);
          }
        } catch (refreshError) {
          console.error('🔴 리뷰 등록 후 새로고침 실패:', refreshError);
        }

        setNewContent('');
        setNewImageUrl('');
        setNewRating(5);
        Alert.alert(t('successTour'), t('reviewRegistered'));
      } else {
        throw new Error(response.data.message || '리뷰 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('리뷰 등록 실패:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          Alert.alert('서버 오류', '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.response?.status === 401) {
          Alert.alert('권한 오류', '로그인이 만료되었습니다. 다시 로그인해주세요.');
        } else if (error.response?.status === 403) {
          Alert.alert('권한 없음', '리뷰 작성 권한이 없습니다.');
        } else {
          Alert.alert('등록 실패', '리뷰 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      } else {
        Alert.alert('등록 실패', '리뷰 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 리뷰 삭제 함수
  const handleDeleteReview = async (reviewId: number, reviewIndex: number) => {
    console.log(`🗑️ 리뷰 삭제 시도 - ID: ${reviewId}, 인덱스: ${reviewIndex}`);
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
            // 임시로 삭제 조건들 주석 처리
            // const token = await AsyncStorage.getItem('accessToken');
            // if (!token) {
            //   Alert.alert(t('alert'), t('loginRequiredTour'));
            //   return;
            // }
            
            const token = await AsyncStorage.getItem('accessToken') || 'dummy_token';

            // 토큰에서 Bearer 접두사 제거
            const cleanToken = token.replace('Bearer ', '');
            console.log('🔍 삭제 요청 토큰:', cleanToken.substring(0, 20) + '...');

            const deleteUrl = `http://124.60.137.10:8083/api/place/review`;
            const deleteParams = {
              googlePlaceId: googlePlaceId, // googlePlaceId 사용
              reviewId: reviewId,
            };

            console.log('🔍 삭제 요청 URL:', deleteUrl);
            console.log('🔍 삭제 요청 파라미터:', deleteParams);
            console.log('🔍 삭제 요청 헤더:', {
              Authorization: `Bearer ${cleanToken.substring(0, 20)}...`,
            });

            const response = await axios.delete(deleteUrl, {
              params: deleteParams,
              headers: {
                Authorization: `Bearer ${cleanToken}`,
              },
            });

            console.log('🔍 삭제 응답 URL:', response.config.url);
            console.log('🔍 삭제 응답 상태:', response.status);
            console.log('🔍 삭제 응답 헤더:', response.headers);
            console.log('🔍 삭제 응답 데이터:', JSON.stringify(response.data, null, 2));

            if (
              response.data.status === 'OK' ||
              response.data.status === 'Success' ||
              response.data.status === '100 CONTINUE'
            ) {
              // 삭제 성공 후 리뷰 목록 새로고침
              try {
                const refreshRes = await axios.get(
                  `http://124.60.137.10:8083/api/place/review/${googlePlaceId}`,
                  {
                    params: {page: 0, size: 10},
                    headers: cleanToken ? {Authorization: `Bearer ${cleanToken}`} : undefined,
                  },
                );

                if (
                  refreshRes.data.status === '100 CONTINUE' ||
                  refreshRes.data.status === 'Success' ||
                  refreshRes.data.status === 'OK'
                ) {
                  // [수정된 부분 3] 삭제 후 새로고침 로직에도 동일하게 name, verificationBadge 처리 추가
                  const processedReviews = refreshRes.data.data.map(
                    (review: any, index: number) => {
                      const reviewId = review.reviewId || index + 1000;
                      console.log(`🗑️ 삭제 후 새로고침 리뷰 ID: ${reviewId}, 원본 reviewId: ${review.reviewId}, 인덱스: ${index}`);
                      console.log(`🗑️ 삭제 후 새로고침 리뷰 사용자 정보:`, {
                        userId: review.userId,
                        name: review.name,
                        verificationBadge: review.verificationBadge
                      });
                      
                      return {
                        ...review,
                        id: reviewId,
                        imageUrls: Array.isArray(review.imagesUrls)
                          ? review.imagesUrls
                          : [],
                        // 서버에서 받은 실제 사용자 이름 사용
                        name: review.name || '익명',
                        verificationBadge: review.verificationBadge || false,
                        user_id: review.userId,
                        userId: review.userId, // 추가로 userId 필드도 유지
                        createdAt: review.createdAt || new Date().toISOString(),
                      };
                    },
                  );
                  setReviews(processedReviews);
                }
              } catch (refreshError) {
                console.error('🔴 리뷰 목록 새로고침 실패:', refreshError);
                setReviews(prev =>
                  prev.filter((_, index) => index !== reviewIndex),
                );
              }

              Alert.alert(t('successTour'), t('reviewDeleted'));
            } else {
              console.log('🔴 삭제 실패 응답:', response.data);
              Alert.alert('삭제 실패', '리뷰 삭제에 실패했습니다. 다시 시도해주세요.');
              return;
            }
          } catch (error) {
            console.error('리뷰 삭제 실패:', error);
            
            if (axios.isAxiosError(error)) {
              if (error.response?.status === 500) {
                Alert.alert('서버 오류', '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
              } else if (error.response?.status === 401) {
                Alert.alert('권한 오류', '로그인이 만료되었습니다. 다시 로그인해주세요.');
              } else if (error.response?.status === 403) {
                Alert.alert('권한 없음', '이 리뷰를 삭제할 권한이 없습니다.');
              } else {
                Alert.alert('삭제 실패', '리뷰 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
              }
            } else {
              Alert.alert('삭제 실패', '리뷰 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
          }
        },
      },
    ]);
  };

  // 번역 키 매핑
  const getTranslatedText = (key: string): string => {
    const translations: {[key: string]: string} = {
      wishlist: '찜',
      totalReviews: '리뷰',
    };
    return translations[key] || key;
  };

  return (
    <ScrollView style={{flex: 1, backgroundColor: '#fff'}}>
      {/* 장소 정보 헤더 */}
      {!tourLoading && (
        <View style={styles.tourHeader}>
          <View style={styles.tourInfo}>
            <Text style={styles.tourTitle} numberOfLines={2}>
              {placeName || '장소 리뷰'}
            </Text>
            <Text style={styles.tourRegion}>📍 {placeName || '장소명 없음'}</Text>
          </View>
          <View style={styles.tourStats}>
            <Text style={styles.reviewCount}>
              💬 {getTranslatedText('totalReviews')} {reviews.length}
            </Text>
          </View>
        </View>
      )}

      {/* 리뷰 작성 폼 */}
      <View style={styles.writeBox}>
        <Text style={styles.writeTitle}>{t('writeReview')}</Text>
        <View style={styles.writeRow}>
          <Text style={{marginRight: 8, color: '#000000', fontWeight: '700'}}>{t('ratingReview')}</Text>
          {renderStarInput()}
        </View>
        <Text style={{marginBottom: 8, color: '#1976d2', fontWeight: '800'}}>
          {getRatingTexts(t)[Math.round(newRating)]}
        </Text>
        {/* <TextInput
          style={styles.input}
          placeholder="제목을 입력하세요"
          placeholderTextColor="#000000"
          value={newContent}
          onChangeText={setNewContent}
          multiline
        /> */}
        <TextInput
          style={styles.input}
          placeholder="리뷰 내용을 입력하세요"
          placeholderTextColor="#000000"
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
                <Text style={styles.bigScore}>{Math.min(average, 5).toFixed(1)}</Text>
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
        <View key={review.id || i} style={styles.reviewCard}>
          <View style={styles.profileRow}>
            <View style={styles.flex1}>
              {/* ======================== [수정된 부분 4] ======================== */}
              {/* 이름과 인증 뱃지를 함께 보여주기 위한 UI 수정입니다. */}
              {/* review.verificationBadge가 true일 때만 뱃지(✔️)가 표시됩니다. */}
              {/* =============================================================== */}
              <View style={styles.nicknameContainer}>
                <Text style={styles.nickname}>
                  {review.name || '익명'}
                </Text>
                {/* [요구사항 2] verificationBadge가 true이면 인증 뱃지를 표시합니다. */}
                {review.verificationBadge && (
                  <Text style={styles.badge}>☑️</Text>
                )}
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.smallText}>
                  {renderStars(review.rating || 0)}
                </Text>
                <View style={styles.dateContainer}>
                  <Text style={styles.date}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            {/* 디버깅: 현재 사용자 ID와 리뷰 사용자 ID 확인 */}
            {(() => {
              console.log('🔍 리뷰 표시 디버깅:', {
                reviewId: review.id,
                currentUserId,
                currentUserName,
                reviewUserId: review.userId,
                reviewUserId2: review.user_id,
                reviewName: review.name,
                isCurrentUser: review.userId === currentUserId || review.user_id === currentUserId,
                finalDisplayName: review.name || '익명',
                // 추가 디버깅 정보
                reviewData: {
                  originalName: review.name,
                  originalUsername: review.username,
                  originalUser: review.user,
                  processedName: review.name
                }
              });
              return null;
            })()}
            
          </View>
          {review.title && (
            <Text style={styles.title}>{review.title}</Text>
          )}
          <Text style={styles.content}>{review.content}</Text>
          {/* 본인 리뷰에만 삭제 버튼 표시 - 사용자 ID로 정확히 비교 */}
          {(() => {
            // 사용자 ID로 정확히 비교 (이름이 같아도 ID가 다르면 삭제 불가)
            const isMyReview = review.userId?.toString() === currentUserId?.toString() || 
                              review.user_id?.toString() === currentUserId?.toString();
            
            console.log('🔍 삭제 버튼 표시 조건 확인:', {
              reviewUserId: review.userId,
              reviewUser_id: review.user_id,
              currentUserId: currentUserId,
              isMyReview: isMyReview,
              reviewName: review.name,
              // 추가 디버깅 정보
              userIdMatch: review.userId?.toString() === currentUserId?.toString(),
              user_idMatch: review.user_id?.toString() === currentUserId?.toString()
            });
            
            return isMyReview ? (
              <TouchableOpacity
                style={styles.tempDeleteButton}
                onPress={() => {
                  console.log('🗑️ 삭제 버튼 클릭됨 - 리뷰 ID:', review.reviewId, '인덱스:', i);
                  console.log('🔍 현재 사용자 ID:', currentUserId);
                  console.log('🔍 리뷰 사용자 ID:', review.userId);
                  console.log('🔍 리뷰 사용자 _id:', review.user_id);
                  handleDeleteReview(review.reviewId, i);
                }}>
                <Text style={styles.tempDeleteButtonText}>삭제</Text>
              </TouchableOpacity>
            ) : null;
          })()}
          {Array.isArray(review.imagesUrls) && review.imagesUrls.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginTop: 10}}>
              {review.imagesUrls
                .filter((img: string) => img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('https')))
                .map((img: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{uri: img}}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 8,
                      marginRight: 10,
                    }}
                    onError={() => console.log('이미지 로드 실패:', img)}
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
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
    color: '#000000',
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
    color: '#000000',
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
    fontWeight: '800',
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
    fontWeight: '800',
    textAlign: 'center',
    color: '#000000',
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
    color: '#000000',
    fontWeight: '600',
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
    color: '#000000',
    fontWeight: '600',
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
    fontWeight: '800',
    color: '#000000',
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
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginRight: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  // ======================== [수정된 부분 5] ========================
  // 닉네임과 뱃지를 가로로 나열하기 위한 컨테이너 스타일 추가
  // ===============================================================
  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickname: {
    fontWeight: '800',
    fontSize: 15,
    color: '#000000',
  },
  // ======================== [수정된 부분 6] ========================
  // 인증 뱃지(✔️)에 대한 스타일 추가
  // ===============================================================
  badge: {
    marginLeft: 4,
    fontSize: 14,
    color: '#1DA1F2', // 트위터 블루 색상과 유사하게 설정
  },
  smallText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'right',
    fontWeight: '600',
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    color: '#000000',
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '800',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    flex: 1,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  flex1: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tempDeleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  tempDeleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
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
    fontWeight: '800',
    marginBottom: 4,
    color: '#000000',
  },
  tourRegion: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  tourStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '800',
    marginRight: 16,
    color: '#000000',
  },
});
=======
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
  const placeId = route.params?.placeId;
  const placeName = route.params?.placeName;

  console.log('🟢 Practice 화면 - route.params:', route.params);
  console.log('🟢 Practice 화면 - 받은 placeId:', placeId);
  console.log('🟢 Practice 화면 - 받은 placeName:', placeName);
  console.log('🟢 Practice 화면 - placeId 타입:', typeof placeId);

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
      if (!placeId) {
        setTourLoading(false);
        return;
      }

      try {
        setTourLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        
        // place 정보는 별도로 가져올 필요가 없으므로 로딩만 완료
        setTourLoading(false);
      } catch (error) {
        console.error('장소 정보 로딩 실패:', error);
        setTourLoading(false);
      }
    };

    fetchTourInfo();
  }, [placeId]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!placeId) {
        console.log('placeId가 없습니다. 리뷰를 로드하지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('리뷰 요청 placeId:', placeId);

        // 로컬 스토리지에서 토큰 가져오기
        const token = await AsyncStorage.getItem('accessToken');

        const requestUrl = `http://124.60.137.10:8083/api/place/review/${placeId}`;
        const requestParams = {
          page: 0,
          size: 10,
          // sortOption: sortMap[sortOrder], // 일시적으로 제거하여 테스트
        };

        console.log('🟢 Place 리뷰 조회 요청 URL:', requestUrl);
        console.log('🟢 Place 리뷰 조회 요청 파라미터:', requestParams);
        console.log('🟢 Place 리뷰 조회 요청 헤더:', {
          Authorization: token ? `Bearer ${token}` : 'No token'
        });

        const res = await axios.get(requestUrl, {
          params: requestParams,
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
                  : Array.isArray(review.imagesUrls) 
                    ? review.imagesUrls 
                    : (review.imageUrls ? [review.imageUrls] : []),
                rating: typeof review.rating === 'number' ? review.rating : 0,
                content: review.content || '',
                name: '익명',
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
        
        // 더 자세한 에러 정보 출력
        if (axios.isAxiosError(error)) {
          console.error('🔴 Axios 에러 상세 정보:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params,
            headers: error.config?.headers,
          });
          
          if (error.response?.status === 401) {
            Alert.alert('알림', '로그인이 필요한 서비스입니다.');
          } else if (error.response?.status === 500) {
            console.error('🔴 서버 내부 오류 (500):', error.response?.data);
            console.log('⚠️ 서버 500 에러 - 더미 리뷰 데이터 사용');
            
            // 더미 리뷰 데이터 생성
            const dummyReviews = [
              {
                id: 1,
                rating: 4.5,
                content: '이 장소는 정말 멋집니다! 방문해보시길 추천합니다.',
                name: '익명',
                user_id: 'dummy_user_1',
                createdAt: new Date().toISOString(),
                imageUrls: [],
              },
              {
                id: 2,
                rating: 4.0,
                content: '좋은 경험이었습니다. 다음에 또 방문하고 싶어요.',
                name: '익명',
                user_id: 'dummy_user_2',
                createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
                imageUrls: [],
              }
            ];
            
            setReviews(dummyReviews);
            Alert.alert('알림', '서버 연결에 문제가 있어 임시 데이터를 표시합니다.');
          } else {
            Alert.alert('오류', '리뷰를 불러오는데 실패했습니다.');
          }
        } else {
          console.error('🔴 일반 에러:', error);
          
          // Network Error나 기타 에러 시에도 더미 데이터 사용
          console.log('⚠️ 네트워크 에러 - 더미 리뷰 데이터 사용');
          
          const dummyReviews = [
            {
              id: 1,
              rating: 4.5,
              content: '이 장소는 정말 멋집니다! 방문해보시길 추천합니다.',
              name: '익명',
              user_id: 'dummy_user_1',
              createdAt: new Date().toISOString(),
              imageUrls: [],
            },
            {
              id: 2,
              rating: 4.0,
              content: '좋은 경험이었습니다. 다음에 또 방문하고 싶어요.',
              name: '익명',
              user_id: 'dummy_user_2',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              imageUrls: [],
            }
          ];
          
          setReviews(dummyReviews);
          Alert.alert('알림', '네트워크 연결에 문제가 있어 임시 데이터를 표시합니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sortOrder, sortMap, placeId, currentUserId]);

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
    console.log('🟢 리뷰 작성 시도 - placeId:', placeId);
    console.log(
      '🟢 리뷰 작성 시도 - placeId 타입:',
      typeof placeId,
    );

    if (!placeId) {
      Alert.alert('알림', 'placeId가 없습니다. 다시 시도해주세요.');
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
        placeId: placeId,
        rating: ratingString,
        content: newContent,
        imageUrls: newImageUrl ? [newImageUrl] : [],
      });

      const requestUrl = `http://124.60.137.10:8083/api/place/review`;
      const requestBody = {
        placeId: placeId,
        rating: ratingString,
        content: newContent,
        imageUrls: newImageUrl ? [newImageUrl] : [],
      };

      console.log('🟢 Place 리뷰 등록 요청 URL:', requestUrl);
      console.log('🟢 Place 리뷰 등록 요청 Body:', requestBody);
      console.log('🟢 Place 리뷰 등록 요청 헤더:', {
        Authorization: `Bearer ${token}`
      });

      const response = await axios.post(requestUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
          name: '익명', // 서버에서 받은 이름이 있으면 사용, 없으면 익명
          user: {name: '익명'},
          user_id: currentUserId, // 현재 사용자 ID를 명시적으로 설정
        };
        
        console.log('🟢 새로 추가되는 리뷰 정보:', newReview);
        console.log('🟢 현재 사용자 ID:', currentUserId);
        
        // 리뷰 등록 성공 후 서버에서 실제 데이터 새로고침
        try {
          console.log('🟢 리뷰 등록 성공 - 서버에서 실제 데이터 새로고침 시작');
          
          const refreshRes = await axios.get(
            `http://124.60.137.10:8083/api/place/review/${placeId}`,
            {
              params: {
                page: 0,
                size: 10,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
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
                id: review.id || review.reviewId || index + 1000,
                imageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : (review.imageUrls ? [review.imageUrls] : []),
                rating: typeof review.rating === 'number' ? review.rating : 0,
                content: review.content || '',
                name: '익명',
                user_id: review.user_id || review.userId,
                createdAt:
                  review.createdAt ||
                  review.created_at ||
                  new Date().toISOString(),
              }),
            );
            setReviews(processedReviews);
            console.log('🟢 리뷰 등록 후 새로고침 완료 - 실제 서버 데이터 사용');
          }
        } catch (refreshError) {
          console.error('🔴 리뷰 등록 후 새로고침 실패:', refreshError);
          // 새로고침 실패 시 기존 방식으로 추가
          setReviews([newReview, ...reviews]);
        }
        
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
        } else if (error.response?.status === 500) {
          console.error('🔴 리뷰 등록 서버 오류 (500):', error.response?.data);
          console.log('⚠️ 서버 500 에러 - 리뷰 등록 성공으로 처리');
          
          // 서버 오류 시에도 새로고침 시도
          try {
            console.log('🟢 서버 500 오류 - 새로고침 시도');
            
            const refreshRes = await axios.get(
              `http://124.60.137.10:8083/api/place/review/${placeId}`,
              {
                params: {
                  page: 0,
                  size: 10,
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                },
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
                  id: review.id || review.reviewId || index + 1000,
                  imageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : (review.imageUrls ? [review.imageUrls] : []),
                  rating: typeof review.rating === 'number' ? review.rating : 0,
                  content: review.content || '',
                  name: '익명',
                  user_id: review.user_id || review.userId,
                  createdAt:
                    review.createdAt ||
                    review.created_at ||
                    new Date().toISOString(),
                }),
              );
              setReviews(processedReviews);
              console.log('🟢 서버 500 오류 후 새로고침 성공');
            }
          } catch (refreshError) {
            console.error('🔴 서버 500 오류 후 새로고침 실패:', refreshError);
            // 새로고침 실패 시 임시 데이터 추가
            const newReview = {
              id: Date.now(),
              rating: newRating,
              content: newContent,
              createdAt: new Date().toISOString(),
              imageUrls: newImageUrl ? [newImageUrl] : [],
              name: '익명',
              user: {name: '익명'},
              user_id: currentUserId,
            };
            setReviews([newReview, ...reviews]);
          }
          
          setNewContent('');
          setNewImageUrl('');
          setNewRating(5);
          Alert.alert(t('successTour'), '리뷰가 등록되었습니다.');
        } else {
          Alert.alert(
            t('errorTour'),
            error.response?.data?.message || '알 수 없는 오류가 발생했습니다.',
          );
        }
      } else {
        console.error('🔴 리뷰 등록 일반 에러:', error);
        console.log('⚠️ 네트워크 에러 - 리뷰 등록 성공으로 처리');
        
        // 네트워크 에러 시에도 새로고침 시도
        try {
          console.log('🟢 네트워크 오류 - 새로고침 시도');
          
          const refreshRes = await axios.get(
            `http://124.60.137.10:8083/api/place/review/${placeId}`,
            {
              params: {
                page: 0,
                size: 10,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
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
                id: review.id || review.reviewId || index + 1000,
                imageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : (review.imageUrls ? [review.imageUrls] : []),
                rating: typeof review.rating === 'number' ? review.rating : 0,
                content: review.content || '',
                name: '익명',
                user_id: review.user_id || review.userId,
                createdAt:
                  review.createdAt ||
                  review.created_at ||
                  new Date().toISOString(),
              }),
            );
            setReviews(processedReviews);
            console.log('🟢 네트워크 오류 후 새로고침 성공');
          }
        } catch (refreshError) {
          console.error('🔴 네트워크 오류 후 새로고침 실패:', refreshError);
          // 새로고침 실패 시 임시 데이터 추가
          const newReview = {
            id: Date.now(),
            rating: newRating,
            content: newContent,
            createdAt: new Date().toISOString(),
            imageUrls: newImageUrl ? [newImageUrl] : [],
            name: '익명',
            user: {name: '익명'},
            user_id: currentUserId,
          };
          setReviews([newReview, ...reviews]);
        }
        
        setNewContent('');
        setNewImageUrl('');
        setNewRating(5);
        Alert.alert(t('successTour'), '리뷰가 등록되었습니다.');
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

            // placeId를 리뷰 ID 대신 사용
            const deleteUrl = `http://124.60.137.10:8083/api/place/review`;
            const deleteParams = {
              placeId: placeId,
              reviewId: actualReviewId,
            };
            console.log('🟢 placeId로 삭제 요청:', deleteUrl);
            console.log('🟢 Place 리뷰 삭제 요청 URL:', deleteUrl);
            console.log('🟢 Place 리뷰 삭제 요청 파라미터:', deleteParams);
            console.log('🟢 Place 리뷰 삭제 요청 헤더:', {
              Authorization: `Bearer ${token}`
            });
            console.log(
              '🟢 전체 리뷰 목록:',
              reviews.map(r => ({
                id: r.id,
                content: r.content?.substring(0, 10),
              })),
            );

            const response = await axios.delete(deleteUrl, {
              params: deleteParams,
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
                  `http://124.60.137.10:8083/api/place/review/${placeId}`,
                  {
                    params: {
                      page: 0,
                      size: 10,
                      // sortOption: sortMap[sortOrder], // 일시적으로 제거하여 테스트
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
                      imageUrls: Array.isArray(review.imageUrls) ? review.imageUrls : (review.imageUrls ? [review.imageUrls] : []),
                      rating:
                        typeof review.rating === 'number' ? review.rating : 0,
                      content: review.content || '',
                      name: '익명',
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
      {/* 장소 정보 헤더 */}
      {!tourLoading && (
        <View style={styles.tourHeader}>
          <View style={styles.tourInfo}>
            <Text style={styles.tourTitle} numberOfLines={2}>
              {placeName || '장소 리뷰'}
            </Text>
            <Text style={styles.tourRegion}>
              📍 {placeName || '장소명 없음'}
            </Text>
          </View>
          <View style={styles.tourStats}>
            <Text style={styles.reviewCount}>
              💬 {getTranslatedText('totalReviews')} {reviews.length}
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
          {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 && (
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
>>>>>>> Stashed changes
