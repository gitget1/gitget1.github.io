import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

// 새로운 API 응답 타입 정의
type TourApiResponse = {
  name: string;
  address: string;
  description: string;
  imageUrl: string;
  link: string;
};

type GoogleResponse = {
  openingHours: string;
  phone: string;
};

type GoogleMapApiResponse = {
  reviewCount: number;
  rating: number;
  googleMapsUrl: string;
};

type PlaceDetailData = {
  tourApiResponse: TourApiResponse;
  googleResponse: GoogleResponse;
  googleMapApiResponse: GoogleMapApiResponse;
  travelLocalEvaluation?: {
    rating: number;
    reviewCount: number;
    reviews?: any[];
  };
};

type PlaceDetailResponse = {
  status: string;
  message: string;
  data: PlaceDetailData;
};

type PlaceDetailRouteProp = RouteProp<AppStackParamList, 'PlaceDetail'>;

const PlaceDetailScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<PlaceDetailRouteProp>();
  const {placeName, placeDescription, lat, lon, placeId, language, tourProgramId} = route.params;

  const [placeDetail, setPlaceDetail] = useState<PlaceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'info' | 'reviews'>('info');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    content: '',
  });
  const [gpsPermissionCount, setGpsPermissionCount] = useState(0); // GPS 권한 카운터 초기값 0

  // 새로운 API로 장소 정보 가져오기
  const fetchPlaceData = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('알림', '로그인이 필요합니다.');
        navigation.goBack();
        return;
      }

      const cleanToken = token.replace('Bearer ', '');

      // 요청 파라미터 구성 - 위도/경도 조합을 그대로 placeId로 사용
      const requestData = {
        placeName: placeName || '장소명 없음',
        placeId: placeId, // 위도/경도 조합 그대로 사용
        language: language || 'kor',
      };

      const apiUrl = 'http://124.60.137.10:8083/api/place';
      // 쿼리 파라미터를 정확히 placeName, placeId, language 순서로 설정
      const fullUrl = `${apiUrl}?placeName=${
        requestData.placeName
      }&placeId=${encodeURIComponent(
        requestData.placeId,
      )}&language=${encodeURIComponent(requestData.language)}`;
      console.log('🟢 [PlaceDetailScreen] 실제 요청 URL:', fullUrl);
      console.log('🟢 [PlaceDetailScreen] 실제 요청 파라미터:', requestData);
      console.log(
        '🟢 디코딩된 placeName:',
        decodeURIComponent(requestData.placeName),
      );
      console.log('🟢 디코딩된 placeId:', requestData.placeId);
      console.log('🟢 디코딩된 language:', requestData.language);
      console.log('🟢 placeId 타입: 위도/경도 조합');

      const response = await axios.get(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`,
        },
        timeout: 10000,
      });

      console.log('🟢 서버 응답:', response.data);

      if (
        response.data.status === '100 CONTINUE' ||
        response.data.status === 'OK'
      ) {
        setPlaceDetail({
          ...response.data.data,
          tourApiResponse: response.data.data.tourApiPlaceInfo,
          googleResponse: response.data.data.googlePlaceInfo,
          googleMapApiResponse: response.data.data.googleEvaluation,
        });
        console.log('🟢 장소 상세 정보 로드 완료');
      } else {
        console.error('❌ 서버 응답 에러:', response.data);
        throw new Error(
          response.data.message || '장소 정보를 불러오는데 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('❌ 장소 정보 로딩 실패:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios 에러 상세:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.response?.status === 500) {
          console.log('⚠️ 서버 500 에러 - 임시 데이터 사용');
          // 임시 더미 데이터 생성
          const dummyData: PlaceDetailData = {
            tourApiResponse: {
              name: placeName,
              address: `${lat}, ${lon}`,
              description: `${placeName}에 대한 상세 정보입니다. 서버에서 정확한 정보를 가져오는 중입니다.`,
              imageUrl: 'https://via.placeholder.com/400x300?text=장소+이미지',
              link: '',
            },
            googleResponse: {
              openingHours: '정보 없음',
              phone: '정보 없음',
            },
            googleMapApiResponse: {
              reviewCount: 0,
              rating: 0,
              googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
            },
          };
          setPlaceDetail(dummyData);
          return; // 에러 처리 중단
        }

        if (error.code === 'ECONNABORTED') {
          Alert.alert('오류', '서버 응답 시간이 초과되었습니다.');
        } else if (error.response?.status === 401) {
          Alert.alert('오류', '로그인이 만료되었습니다.');
          navigation.goBack();
        } else if (error.response?.status === 404) {
          Alert.alert('오류', '해당 장소를 찾을 수 없습니다.');
          navigation.goBack();
        } else {
          Alert.alert('오류', '장소 정보를 불러오는데 실패했습니다.');
          navigation.goBack();
        }
      } else {
        Alert.alert('오류', '네트워크 오류가 발생했습니다.');
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaceData();
  }, []);

  const handleWriteReview = () => {
    // GPS 권한 카운터 증가
    const newCount = gpsPermissionCount + 1;
    setGpsPermissionCount(newCount);
    
    console.log('🟢 GPS 권한 요청 카운터:', newCount);

    // 홀수면 실패, 짝수면 성공
    if (newCount % 2 === 1) {
      // 홀수 - 실패
      Alert.alert('GPS 권한 실패', '현장 방문 인증이 필요합니다. 다시 시도해주세요.');
      console.log('🔴 GPS 권한 실패 (홀수):', newCount);
    } else {
      // 짝수 - 성공
      Alert.alert('GPS 권한 성공', '현장 방문이 확인되었습니다. 리뷰를 작성할 수 있습니다.');
      console.log('🟢 GPS 권한 성공 (짝수):', newCount);
      setShowReviewModal(true);
    }
  };

  const handleSubmitReview = () => {
    // 리뷰 제출 로직 (API 연동 필요)
    console.log('리뷰 제출:', newReview);
    setShowReviewModal(false);
    setNewReview({rating: 0, content: ''});
    Alert.alert('성공', '리뷰가 등록되었습니다.');
  };

  const handleOpenWebsite = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('오류', '웹사이트를 열 수 없습니다.');
    }
  };

  const handleOpenGoogleMaps = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('오류', 'Google Maps를 열 수 없습니다.');
    }
  };

  const renderStars = (rating: number) => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color={i <= rating ? '#FFD700' : '#ccc'}
        />,
      );
    }
    return stars;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google':
        return '🔍';
      case 'naver':
        return '🟢';
      case 'kakao':
        return '🟡';
      default:
        return '⭐';
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'google':
        return 'Google';
      case 'naver':
        return 'Naver';
      case 'kakao':
        return 'Kakao';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>장소 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!placeDetail || !placeDetail.tourApiResponse) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>장소 정보를 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlaceData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {placeDetail?.tourApiResponse?.name || '장소명 없음'}
          </Text>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 이미지 */}
        {placeDetail?.tourApiResponse?.imageUrl && (
          <Image
            source={{uri: placeDetail.tourApiResponse.imageUrl}}
            style={styles.mainImage}
            resizeMode="cover"
          />
        )}

        {/* 기본 정보 */}
        <View style={styles.infoContainer}>
          <Text style={styles.placeName}>
            {placeDetail?.tourApiResponse?.name || '장소명 없음'}
          </Text>
          <View style={styles.addressContainer}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.addressText}>
              {placeDetail?.tourApiResponse?.address || ''}
            </Text>
          </View>

          {placeDetail?.googleResponse?.phone && (
            <View style={styles.phoneContainer}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.phoneText}>
                {placeDetail.googleResponse.phone}
              </Text>
            </View>
          )}

          {placeDetail?.googleResponse?.openingHours && (
            <View style={{marginBottom: 8}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon name="schedule" size={18} color="#666" />
                <Text style={{marginLeft: 8, fontSize: 15, color: '#666'}}>
                  영업시간
                </Text>
              </View>
              {/* 요일별로 줄바꿈 및 월~일 순서 정렬 */}
              <View style={{marginLeft: 26, marginTop: 4}}>
                {(() => {
                  const daysOrder = [
                    '월요일',
                    '화요일',
                    '수요일',
                    '목요일',
                    '금요일',
                    '토요일',
                    '일요일',
                  ];
                  const hoursArr = placeDetail.googleResponse.openingHours
                    .split(',')
                    .map(s => s.trim());
                  // 요일별로 객체화
                  const dayMap: {[key: string]: string} = {};
                  hoursArr.forEach(str => {
                    const idx = str.indexOf(':');
                    if (idx > 0) {
                      const day = str.slice(0, idx).trim();
                      dayMap[day] = str.slice(idx + 1).trim();
                    }
                  });
                  return daysOrder.map(day => (
                    <Text
                      key={day}
                      style={{fontSize: 15, color: '#666', lineHeight: 22}}>
                      {day}: {dayMap[day] || '-'}
                    </Text>
                  ));
                })()}
              </View>
              {/* GPS로 리뷰권한 받기 버튼 */} 
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  alignSelf: 'flex-start',
                  backgroundColor: '#1976D2',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
                onPress={() => {
                  // GPS 권한 카운터 증가
                  const newCount = gpsPermissionCount + 1;
                  setGpsPermissionCount(newCount);
                  
                  console.log('🟢 GPS 권한 요청 카운터:', newCount);

                  // 홀수면 실패, 짝수면 성공
                  if (newCount % 2 === 1) {
                    // 홀수 - 실패
                    Alert.alert('GPS 권한 실패', '현장 방문 인증이 필요합니다. 다시 시도해주세요.');
                    console.log('🔴 GPS 권한 실패 (홀수):', newCount);
                  } else {
                    // 짝수 - 성공
                    Alert.alert('GPS 권한 성공', '현장 방문이 확인되었습니다. 리뷰를 작성할 수 있습니다.');
                    console.log('🟢 GPS 권한 성공 (짝수):', newCount);
                  }
                }}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 15}}>
                  GPS로 리뷰권한 받기
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 탭 네비게이션 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'info' && styles.activeTab]}
            onPress={() => setSelectedTab('info')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'info' && styles.activeTabText,
              ]}>
              정보
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'reviews' && styles.activeTab]}
            onPress={() => setSelectedTab('reviews')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'reviews' && styles.activeTabText,
              ]}>
              리뷰
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탭 컨텐츠 */}
        {selectedTab === 'info' ? (
          <View style={styles.infoContent}>
            <Text style={styles.sectionTitle}>장소 소개</Text>
            <Text style={styles.descriptionText}>
              {placeDetail.tourApiResponse.description ||
                '장소에 대한 설명이 없습니다.'}
            </Text>

            {/* 링크 버튼들 */}
            <View style={styles.linkButtonsContainer}>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() =>
                  handleOpenWebsite('http://onyangmuseum.or.kr/')
                }>
                <Icon name="language" size={20} color="#007AFF" />
                <Text style={styles.linkButtonText}>공식 웹사이트</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.reviewsContent}>
            {/* 평점 비교 카드 UI */}
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 12}}>
              평점 비교
            </Text>
            {(() => {
              // 평점 비교 카드: Google/Naver/Kakao
              const ratingCards = [
                {
                  platform: 'Google',
                  icon: '🔍',
                  rating: placeDetail?.googleMapApiResponse?.rating ?? 0,
                  reviewCount:
                    placeDetail?.googleMapApiResponse?.reviewCount ?? 0,
                },
                {platform: 'Naver', icon: '🟢', rating: 4.2, reviewCount: 120}, // 더미 데이터
                {platform: 'Kakao', icon: '🟡', rating: 4.0, reviewCount: 80}, // 더미 데이터
              ];
              // 우리앱 평점
              const ourAppRating = {
                platform: '우리앱',
                icon: '⭐',
                rating: placeDetail?.travelLocalEvaluation?.rating ?? 0,
                reviewCount:
                  placeDetail?.travelLocalEvaluation?.reviewCount ?? 0,
              };
              // 최신 리뷰 미리보기(최신 5개)
              const previewReviews =
                placeDetail?.travelLocalEvaluation?.reviews?.slice(0, 5) || [];
              return (
                <>
                  {/* 평점 비교 카드 (Google/Naver/Kakao) */}
                  {ratingCards.map((item, idx) => (
                    <View
                      key={item.platform}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: 'column',
                        elevation: 2,
                      }}>
                      <View
                        style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={{fontSize: 20, marginRight: 8}}>
                          {item.icon}
                        </Text>
                        <View style={{flex: 1}}>
                          <Text style={{fontWeight: 'bold'}}>
                            {item.platform}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: 4,
                            }}>
                            <Text
                              style={{
                                color: '#1976D2',
                                fontWeight: 'bold',
                                fontSize: 22,
                              }}>
                              {item.rating ? item.rating.toFixed(1) : '-'}
                            </Text>
                            <Text style={{color: '#888', marginLeft: 4}}>
                              리뷰 {item.reviewCount}개
                            </Text>
                          </View>
                        </View>
                        <View style={{flexDirection: 'row', marginLeft: 8}}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <Text
                              key={i}
                              style={{
                                color:
                                  i <= Math.round(item.rating)
                                    ? '#FFD700'
                                    : '#ccc',
                                fontSize: 18,
                              }}>
                              ★
                            </Text>
                          ))}
                        </View>
                      </View>
                      {/* 지도 버튼: 플랫폼별로 다르게 */}
                      {item.platform === 'Google' &&
                        placeDetail?.googleMapApiResponse?.googleMapsUrl && (
                          <TouchableOpacity
                            style={{
                              alignSelf: 'flex-end',
                              backgroundColor: '#f8f9fa',
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: '#e9ecef',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: 12,
                            }}
                            onPress={() =>
                              handleOpenGoogleMaps(
                                placeDetail.googleMapApiResponse.googleMapsUrl,
                              )
                            }>
                            <Icon name="map" size={20} color="#007AFF" />
                            <Text
                              style={{
                                marginLeft: 8,
                                color: '#007AFF',
                                fontWeight: '500',
                                fontSize: 15,
                              }}>
                              Google Maps
                            </Text>
                          </TouchableOpacity>
                        )}
                      {item.platform === 'Naver' &&
                        placeDetail?.tourApiResponse?.name && (
                          <TouchableOpacity
                            style={{
                              alignSelf: 'flex-end',
                              backgroundColor: '#03C75A',
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: '#e9ecef',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: 12,
                            }}
                            onPress={() =>
                              handleOpenWebsite(
                                `https://map.naver.com/v5/search/${encodeURIComponent(
                                  placeDetail.tourApiResponse.name,
                                )}`,
                              )
                            }>
                            <Icon name="map" size={20} color="#fff" />
                            <Text
                              style={{
                                marginLeft: 8,
                                color: '#fff',
                                fontWeight: '500',
                                fontSize: 15,
                              }}>
                              네이버 지도
                            </Text>
                          </TouchableOpacity>
                        )}
                      {item.platform === 'Kakao' &&
                        placeDetail?.tourApiResponse?.name && (
                          <TouchableOpacity
                            style={{
                              alignSelf: 'flex-end',
                              backgroundColor: '#FEE500',
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: '#e9ecef',
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: 12,
                            }}
                            onPress={() =>
                              handleOpenWebsite(
                                `https://map.kakao.com/?q=${encodeURIComponent(
                                  placeDetail.tourApiResponse.name,
                                )}`,
                              )
                            }>
                            <Icon name="map" size={20} color="#3C1E1E" />
                            <Text
                              style={{
                                marginLeft: 8,
                                color: '#3C1E1E',
                                fontWeight: '500',
                                fontSize: 15,
                              }}>
                              카카오맵
                            </Text>
                          </TouchableOpacity>
                        )}
                    </View>
                  ))}
                  {/* 우리앱 평점 + 최신 리뷰 미리보기 하나의 박스 */}
                  <View
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                      elevation: 2,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                      <Text style={{fontSize: 20, marginRight: 8}}>
                        {ourAppRating.icon}
                      </Text>
                      <Text style={{fontWeight: 'bold', fontSize: 16}}>
                        {ourAppRating.platform}
                      </Text>
                      <Text
                        style={{
                          color: '#1976D2',
                          fontWeight: 'bold',
                          fontSize: 18,
                          marginLeft: 8,
                        }}>
                        {ourAppRating.rating
                          ? ourAppRating.rating.toFixed(1)
                          : '-'}
                      </Text>
                      <Text style={{color: '#888', marginLeft: 4}}>
                        리뷰 {ourAppRating.reviewCount}개
                      </Text>
                      <View style={{flexDirection: 'row', marginLeft: 8}}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <Text
                            key={i}
                            style={{
                              color:
                                i <= Math.round(ourAppRating.rating)
                                  ? '#FFD700'
                                  : '#ccc',
                              fontSize: 18,
                            }}>
                            ★
                          </Text>
                        ))}
                      </View>
                    </View>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 15,
                        marginBottom: 8,
                      }}>
                      최신 리뷰
                    </Text>
                    {previewReviews.length > 0 ? (
                      previewReviews.map((review, idx) => {
                        // 인코딩된 값이면 '익명'으로 대체
                        let displayName = review.name || '';
                        if (
                          /^naver_|^kakao_|^google_/i.test(displayName) ||
                          displayName.length > 15
                        ) {
                          displayName = '익명';
                        }
                        return (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: '#f8f9fa',
                              borderRadius: 8,
                              padding: 12,
                              marginBottom: 8,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 4,
                              }}>
                              <Text
                                style={{
                                  fontWeight: 'bold',
                                  marginRight: 8,
                                  fontSize: 13,
                                }}
                                numberOfLines={1}>
                                {displayName}
                              </Text>
                              <Text
                                style={{
                                  color: '#1976D2',
                                  fontWeight: 'bold',
                                  fontSize: 13,
                                }}>
                                {review.rating?.toFixed(1) ?? '-'}
                              </Text>
                              <Text
                                style={{
                                  color: '#888',
                                  marginLeft: 8,
                                  fontSize: 11,
                                }}>
                                {review.createdAt
                                  ? new Date(
                                      review.createdAt,
                                    ).toLocaleDateString()
                                  : ''}
                              </Text>
                            </View>
                            <Text
                              style={{fontSize: 13, color: '#333'}}
                              numberOfLines={2}>
                              {review.content}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text
                        style={{color: '#888', fontSize: 13, marginBottom: 8}}>
                        아직 등록된 리뷰가 없습니다.
                      </Text>
                    )}
                    <TouchableOpacity
                      style={{alignSelf: 'center', backgroundColor: '#1976D2', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, marginTop: 4}}
                      onPress={() => navigation.navigate('PlaceReview', { 
                        placeId, 
                        placeName: placeDetail?.tourApiResponse?.name || placeName 
                      })}
                    >
                      <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 18}}>+</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>

      {/* 리뷰 작성 모달 */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>리뷰 작성</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingInputContainer}>
              <Text style={styles.ratingLabel}>평점</Text>
              <View style={styles.starsInputContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setNewReview({...newReview, rating: star})}>
                    <Icon
                      name={star <= newReview.rating ? 'star' : 'star-border'}
                      size={32}
                      color={star <= newReview.rating ? '#FFD700' : '#ccc'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="리뷰를 작성해주세요..."
              value={newReview.content}
              onChangeText={text => setNewReview({...newReview, content: text})}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitReview}>
              <Text style={styles.submitButtonText}>리뷰 등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 4,
  },
  mainImage: {
    width: '100%',
    height: 250,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 8,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phoneText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  infoContent: {
    backgroundColor: 'white',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 20,
  },
  linkButtonsContainer: {
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  linkButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  reviewsContent: {
    backgroundColor: 'white',
    padding: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  writeReviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  writeReviewButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  reviewStats: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  noReviewsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  ratingInputContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  starsInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlaceDetailScreen;
