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
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {getTourismInfo, getTourismDetail, getTourismImages, testApiConnection} from '../../api/publicData';

const {width} = Dimensions.get('window');

type PlaceDetail = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  openingHours: string;
  category: string;
  images: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  ourAppRating: number;
  ourAppReviewCount: number;
  platformRatings: {
    google: {rating: number; reviewCount: number};
    naver: {rating: number; reviewCount: number};
    kakao: {rating: number; reviewCount: number};
  };
  reviews: {
    id: string;
    author: string;
    rating: number;
    content: string;
    date: string;
    platform: 'our' | 'google' | 'naver' | 'kakao';
  }[];
};

type PlaceDetailRouteProp = RouteProp<AppStackParamList, 'PlaceDetail'>;

const PlaceDetailScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<PlaceDetailRouteProp>();
  const {placeName, placeDescription, lat, lon} = route.params;

  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'info' | 'reviews'>('info');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    content: '',
  });

  // 공공데이터 포털에서 장소 정보 가져오기
  const fetchPlaceData = async () => {
    try {
      setLoading(true);
      
      // 0. API 연결 테스트
      console.log('🧪 API 연결 테스트 시작');
      const apiTestResult = await testApiConnection();
      if (!apiTestResult) {
        console.log('⚠️ API 연결 실패, 기본 데이터 사용');
        // API 연결 실패 시 기본 데이터 사용
        const defaultPlaceData: PlaceDetail = {
          id: '1',
          name: placeName,
          description: placeDescription,
          address: '주소 정보 없음',
          phone: '전화번호 정보 없음',
          website: '웹사이트 정보 없음',
          openingHours: '영업시간 정보 없음',
          category: '카테고리 정보 없음',
          images: [
            'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=이미지+없음',
          ],
          coordinates: {lat, lng: lon},
          ourAppRating: 4.5,
          ourAppReviewCount: 127,
          platformRatings: {
            google: {rating: 4.3, reviewCount: 234},
            naver: {rating: 4.7, reviewCount: 156},
            kakao: {rating: 4.1, reviewCount: 89},
          },
          reviews: [
            {
              id: '1',
              author: '김여행자',
              rating: 5,
              content: '정말 멋진 곳이에요! 분위기도 좋고 음식도 맛있어요. 다음에 또 방문하고 싶어요.',
              date: '2024-01-15',
              platform: 'our',
            },
            {
              id: '2',
              author: 'TravelLover',
              rating: 4,
              content: '좋은 경험이었습니다. 다만 주말에는 사람이 많아서 조금 시끄러워요.',
              date: '2024-01-10',
              platform: 'our',
            },
          ],
        };
        setPlaceDetail(defaultPlaceData);
        return;
      }
      
      console.log('✅ API 연결 성공, 데이터 조회 시작');
      
      // 1. 장소 검색
      const tourismInfo: any = await getTourismInfo(placeName, lat, lon);
      
      if (tourismInfo) {
        console.log('✅ 장소 정보 조회 성공:', tourismInfo.title);
        
        // 2. 상세 정보 가져오기
        const detailInfo: any = await getTourismDetail(tourismInfo.contentid, tourismInfo.contenttypeid);
        
        // 3. 이미지 가져오기
        const images = await getTourismImages(tourismInfo.contentid);
        
        // 4. 데이터 구성
        const placeData: PlaceDetail = {
          id: tourismInfo.contentid || '1',
          name: tourismInfo.title || placeName,
          description: detailInfo?.overview || placeDescription,
          address: detailInfo?.addr1 || '주소 정보 없음',
          phone: detailInfo?.tel || '전화번호 정보 없음',
          website: detailInfo?.homepage || '웹사이트 정보 없음',
          openingHours: detailInfo?.usetime || '영업시간 정보 없음',
          category: detailInfo?.cat3 || '카테고리 정보 없음',
          images: images.length > 0 ? images : [
            'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=이미지+없음',
          ],
          coordinates: {lat, lng: lon},
          ourAppRating: 4.5,
          ourAppReviewCount: 127,
          platformRatings: {
            google: {rating: 4.3, reviewCount: 234},
            naver: {rating: 4.7, reviewCount: 156},
            kakao: {rating: 4.1, reviewCount: 89},
          },
          reviews: [
            {
              id: '1',
              author: '김여행자',
              rating: 5,
              content: '정말 멋진 곳이에요! 분위기도 좋고 음식도 맛있어요. 다음에 또 방문하고 싶어요.',
              date: '2024-01-15',
              platform: 'our',
            },
            {
              id: '2',
              author: 'TravelLover',
              rating: 4,
              content: '좋은 경험이었습니다. 다만 주말에는 사람이 많아서 조금 시끄러워요.',
              date: '2024-01-10',
              platform: 'our',
            },
          ],
        };
        
        setPlaceDetail(placeData);
      } else {
        console.log('⚠️ 공공데이터에서 정보를 찾지 못함, 기본 데이터 사용');
        // 공공데이터에서 정보를 찾지 못한 경우 기본 데이터 사용
        const defaultPlaceData: PlaceDetail = {
          id: '1',
          name: placeName,
          description: placeDescription,
          address: '주소 정보 없음',
          phone: '전화번호 정보 없음',
          website: '웹사이트 정보 없음',
          openingHours: '영업시간 정보 없음',
          category: '카테고리 정보 없음',
          images: [
            'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=이미지+없음',
          ],
          coordinates: {lat, lng: lon},
          ourAppRating: 4.5,
          ourAppReviewCount: 127,
          platformRatings: {
            google: {rating: 4.3, reviewCount: 234},
            naver: {rating: 4.7, reviewCount: 156},
            kakao: {rating: 4.1, reviewCount: 89},
          },
          reviews: [
            {
              id: '1',
              author: '김여행자',
              rating: 5,
              content: '정말 멋진 곳이에요! 분위기도 좋고 음식도 맛있어요. 다음에 또 방문하고 싶어요.',
              date: '2024-01-15',
              platform: 'our',
            },
            {
              id: '2',
              author: 'TravelLover',
              rating: 4,
              content: '좋은 경험이었습니다. 다만 주말에는 사람이 많아서 조금 시끄러워요.',
              date: '2024-01-10',
              platform: 'our',
            },
          ],
        };
        
        setPlaceDetail(defaultPlaceData);
      }
    } catch (error) {
      console.error('❌ 장소 정보 로딩 실패:', error);
      Alert.alert('오류', '장소 정보를 불러오는데 실패했습니다. 기본 정보로 표시됩니다.');
      
      // 에러 발생 시에도 기본 데이터 표시
      const defaultPlaceData: PlaceDetail = {
        id: '1',
        name: placeName,
        description: placeDescription,
        address: '주소 정보 없음',
        phone: '전화번호 정보 없음',
        website: '웹사이트 정보 없음',
        openingHours: '영업시간 정보 없음',
        category: '카테고리 정보 없음',
        images: [
          'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=이미지+없음',
        ],
        coordinates: {lat, lng: lon},
        ourAppRating: 4.5,
        ourAppReviewCount: 127,
        platformRatings: {
          google: {rating: 4.3, reviewCount: 234},
          naver: {rating: 4.7, reviewCount: 156},
          kakao: {rating: 4.1, reviewCount: 89},
        },
        reviews: [
          {
            id: '1',
            author: '김여행자',
            rating: 5,
            content: '정말 멋진 곳이에요! 분위기도 좋고 음식도 맛있어요. 다음에 또 방문하고 싶어요.',
            date: '2024-01-15',
            platform: 'our',
          },
          {
            id: '2',
            author: 'TravelLover',
            rating: 4,
            content: '좋은 경험이었습니다. 다만 주말에는 사람이 많아서 조금 시끄러워요.',
            date: '2024-01-10',
            platform: 'our',
          },
        ],
      };
      
      setPlaceDetail(defaultPlaceData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaceData();
  }, [placeName, lat, lon]);

  const renderStars = (rating: number) => {
    const stars: JSX.Element[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Icon
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color={i <= rating ? '#FFD700' : '#DDD'}
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
        return '우리앱';
    }
  };

  // 리뷰 작성 함수
  const handleWriteReview = () => {
    if (newReview.rating === 0) {
      Alert.alert('알림', '별점을 선택해주세요.');
      return;
    }
    if (newReview.content.trim() === '') {
      Alert.alert('알림', '리뷰 내용을 입력해주세요.');
      return;
    }

    // 실제로는 API 호출
    const review = {
      id: Date.now().toString(),
      author: '나',
      rating: newReview.rating,
      content: newReview.content,
      date: new Date().toISOString().split('T')[0],
      platform: 'our' as const,
    };

    setPlaceDetail(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        reviews: [review, ...prev.reviews],
        ourAppReviewCount: prev.ourAppReviewCount + 1,
        ourAppRating: (prev.ourAppRating * prev.ourAppReviewCount + newReview.rating) / (prev.ourAppReviewCount + 1),
      };
    });

    setNewReview({rating: 0, content: ''});
    setShowReviewModal(false);
    Alert.alert('성공', '리뷰가 등록되었습니다!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>장소 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!placeDetail) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>장소 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {placeDetail.name}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 이미지 슬라이더 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageSlider}>
          {placeDetail.images.map((image, index) => (
            <Image
              key={index}
              source={{uri: image}}
              style={styles.placeImage}
              resizeMode="cover"
              onError={() => {
                // 이미지 로딩 실패 시 기본 이미지로 교체
                setPlaceDetail(prev => {
                  if (!prev) return prev;
                  const newImages = [...prev.images];
                  newImages[index] = 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=이미지+로딩+실패';
                  return {...prev, images: newImages};
                });
              }}
            />
          ))}
        </ScrollView>

        {/* 탭 버튼 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'info' && styles.activeTab]}
            onPress={() => setSelectedTab('info')}>
            <Text style={[styles.tabText, selectedTab === 'info' && styles.activeTabText]}>
              장소 정보
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'reviews' && styles.activeTab]}
            onPress={() => setSelectedTab('reviews')}>
            <Text style={[styles.tabText, selectedTab === 'reviews' && styles.activeTabText]}>
              리뷰 & 평점
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탭 컨텐츠 */}
        {selectedTab === 'info' ? (
          <View style={styles.infoContainer}>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              <View style={styles.infoItem}>
                <Icon name="location-on" size={20} color="#007AFF" />
                <Text style={styles.infoText}>{placeDetail.address}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="phone" size={20} color="#007AFF" />
                <Text style={styles.infoText}>{placeDetail.phone}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="language" size={20} color="#007AFF" />
                <Text style={styles.infoText}>{placeDetail.website}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="schedule" size={20} color="#007AFF" />
                <Text style={styles.infoText}>{placeDetail.openingHours}</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="category" size={20} color="#007AFF" />
                <Text style={styles.infoText}>{placeDetail.category}</Text>
              </View>
            </View>

            {/* 설명 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>장소 설명</Text>
              <Text style={styles.descriptionText}>{placeDetail.description}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.reviewsContainer}>
            {/* 평점 비교 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>평점 비교</Text>
              
              {/* 우리앱 평점 */}
              <View style={styles.ratingCard}>
                <View style={styles.ratingHeader}>
                  <Text style={styles.platformName}>⭐ 우리앱</Text>
                  <View style={styles.ratingStars}>
                    {renderStars(placeDetail.ourAppRating)}
                  </View>
                </View>
                <View style={styles.ratingDetails}>
                  <Text style={styles.ratingScore}>{placeDetail.ourAppRating}</Text>
                  <Text style={styles.reviewCount}>
                    리뷰 {placeDetail.ourAppReviewCount}개
                  </Text>
                </View>
              </View>

              {/* 플랫폼별 평점 */}
              {Object.entries(placeDetail.platformRatings).map(([platform, data]) => (
                <View key={platform} style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <Text style={styles.platformName}>
                      {getPlatformIcon(platform)} {getPlatformName(platform)}
                    </Text>
                    <View style={styles.ratingStars}>
                      {renderStars(data.rating)}
                    </View>
                  </View>
                  <View style={styles.ratingDetails}>
                    <Text style={styles.ratingScore}>{data.rating}</Text>
                    <Text style={styles.reviewCount}>
                      리뷰 {data.reviewCount}개
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 리뷰 목록 */}
            <View style={styles.section}>
              <View style={styles.reviewHeader}>
                <Text style={styles.sectionTitle}>리뷰 목록</Text>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => setShowReviewModal(true)}>
                  <Icon name="edit" size={20} color="white" />
                  <Text style={styles.writeReviewText}>리뷰 작성</Text>
                </TouchableOpacity>
              </View>
              {placeDetail.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      <Text style={styles.authorName}>{review.author}</Text>
                      <Text style={styles.platformTag}>
                        {getPlatformIcon(review.platform)} {getPlatformName(review.platform)}
                      </Text>
                    </View>
                    <View style={styles.reviewRating}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  <Text style={styles.reviewContent}>{review.content}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              ))}
            </View>
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
          <View style={styles.reviewModalContainer}>
            <View style={styles.reviewModalHeader}>
              <Text style={styles.reviewModalTitle}>리뷰 작성</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewModalContent}>
              {/* 별점 선택 */}
              <View style={styles.ratingSelection}>
                <Text style={styles.ratingLabel}>별점 선택</Text>
                <View style={styles.starSelection}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setNewReview(prev => ({...prev, rating: star}))}>
                      <Icon
                        name={star <= newReview.rating ? 'star' : 'star-border'}
                        size={32}
                        color={star <= newReview.rating ? '#FFD700' : '#DDD'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 리뷰 내용 입력 */}
              <View style={styles.reviewInputContainer}>
                <Text style={styles.reviewInputLabel}>리뷰 내용</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="이 장소에 대한 리뷰를 작성해주세요..."
                  placeholderTextColor="#999"
                  value={newReview.content}
                  onChangeText={(text) => setNewReview(prev => ({...prev, content: text}))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* 버튼 */}
              <View style={styles.reviewModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReviewModal(false)}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleWriteReview}>
                  <Text style={styles.submitButtonText}>등록</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  imageSlider: {
    height: 200,
  },
  placeImage: {
    width: width,
    height: 200,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 16,
  },
  reviewsContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  ratingCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingStars: {
    flexDirection: 'row',
  },
  ratingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewAuthor: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  platformTag: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  writeReviewButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeReviewText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewModalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '80%',
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  reviewModalContent: {
    flex: 1,
  },
  ratingSelection: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  starSelection: {
    flexDirection: 'row',
  },
  reviewInputContainer: {
    marginBottom: 16,
  },
  reviewInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  reviewModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PlaceDetailScreen; 