import axios from 'axios';

// 공공데이터 포털 API 설정
const PUBLIC_DATA_API_KEY =
  'qwgLmaWsENhjGZRZ79lcIb9k/GRzTFPs5W4GZaOtqsHG7tdW6GNN5Og+APz5v1QjJvord7zbi8ZUQPM3SZYl+A==';
const BASE_URL =
  'https://api.visitkorea.or.kr/openapi/service/rest/KorService1';

// axios 인스턴스 생성 (타임아웃 설정)
const apiClient = axios.create({
  timeout: 10000, // 10초 타임아웃
});

// 관광지 정보 API
export const getTourismInfo = async (
  placeName: string,
  lat: number,
  lng: number,
) => {
  try {
    console.log('🔍 관광지 검색 시작:', placeName);

    const response = await apiClient.get(`${BASE_URL}/searchKeyword`, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        numOfRows: 10,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'TravelLocal',
        _type: 'json',
        keyword: placeName,
        arrange: 'A', // 정확도순
      },
    });

    console.log('📡 API 응답:', JSON.stringify(response.data, null, 2));

    // 안전한 응답 구조 검증
    if (
      !response.data ||
      !response.data.response ||
      !response.data.response.body ||
      !response.data.response.body.items
    ) {
      console.log('❌ 응답 구조가 올바르지 않음:', response.data);
      return null;
    }

    const items = response.data.response.body.items.item;

    if (!items) {
      console.log('❌ 검색 결과 없음');
      return null;
    }

    const itemArray = Array.isArray(items) ? items : [items];
    console.log('📍 검색된 장소들:', itemArray.length, '개');

    // 가장 가까운 위치의 장소 찾기
    const nearestPlace = findNearestPlace(itemArray, lat, lng);
    console.log('🎯 가장 가까운 장소:', nearestPlace);

    return nearestPlace;
  } catch (error) {
    console.error('❌ 관광지 정보 조회 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('📡 API 에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return null;
  }
};

// 관광지 상세 정보 API
export const getTourismDetail = async (
  contentId: string,
  contentTypeId: string,
) => {
  try {
    console.log('📋 상세 정보 조회:', contentId);

    const response = await apiClient.get(`${BASE_URL}/detailCommon`, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        numOfRows: 10,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'TravelLocal',
        _type: 'json',
        contentId: contentId,
        contentTypeId: contentTypeId,
        defaultYN: 'Y',
        firstImageYN: 'Y',
        areacodeYN: 'Y',
        catcodeYN: 'Y',
        addrinfoYN: 'Y',
        mapinfoYN: 'Y',
        overviewYN: 'Y',
      },
    });

    console.log('📋 상세 정보 응답:', JSON.stringify(response.data, null, 2));

    // 안전한 응답 구조 검증
    if (
      !response.data ||
      !response.data.response ||
      !response.data.response.body ||
      !response.data.response.body.items
    ) {
      console.log('❌ 상세 정보 응답 구조가 올바르지 않음:', response.data);
      return null;
    }

    const items = response.data.response.body.items.item;

    if (!items) {
      console.log('❌ 상세 정보 없음');
      return null;
    }

    return items;
  } catch (error) {
    console.error('❌ 관광지 상세 정보 조회 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('📡 상세 정보 API 에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return null;
  }
};

// 관광지 이미지 API
export const getTourismImages = async (contentId: string) => {
  try {
    console.log('🖼️ 이미지 조회:', contentId);

    const response = await apiClient.get(`${BASE_URL}/detailImage`, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        numOfRows: 10,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'TravelLocal',
        _type: 'json',
        contentId: contentId,
        imageYN: 'Y',
        subImageYN: 'Y',
      },
    });

    console.log('🖼️ 이미지 응답:', JSON.stringify(response.data, null, 2));

    // 안전한 응답 구조 검증
    if (
      !response.data ||
      !response.data.response ||
      !response.data.response.body ||
      !response.data.response.body.items
    ) {
      console.log('❌ 이미지 응답 구조가 올바르지 않음:', response.data);
      return [];
    }

    const items = response.data.response.body.items.item;

    if (!items) {
      console.log('❌ 이미지 없음');
      return [];
    }

    const itemArray = Array.isArray(items) ? items : [items];
    const images = itemArray
      .map((item: any) => item.originimgurl || item.smallimageurl)
      .filter(Boolean); // null/undefined 제거

    console.log('🖼️ 찾은 이미지들:', images.length, '개');

    return images;
  } catch (error) {
    console.error('❌ 관광지 이미지 조회 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('📡 이미지 API 에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return [];
  }
};

// 가장 가까운 장소 찾기 함수
const findNearestPlace = (
  places: any[],
  targetLat: number,
  targetLng: number,
) => {
  let nearestPlace = null;
  let minDistance = Infinity;

  places.forEach(place => {
    if (place.mapx && place.mapy) {
      const distance = calculateDistance(
        targetLat,
        targetLng,
        parseFloat(place.mapy),
        parseFloat(place.mapx),
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPlace = place;
      }
    }
  });

  return nearestPlace;
};

// 두 지점 간의 거리 계산 (Haversine formula)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 카테고리별 관광지 검색
export const searchPlacesByCategory = async (
  category: string,
  areaCode?: string,
) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/searchKeyword`, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        numOfRows: 20,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'TravelLocal',
        _type: 'json',
        keyword: category,
        arrange: 'A',
        areaCode: areaCode || '',
      },
    });

    if (response.data.response.body.items.item) {
      return Array.isArray(response.data.response.body.items.item)
        ? response.data.response.body.items.item
        : [response.data.response.body.items.item];
    }

    return [];
  } catch (error) {
    console.error('❌ 카테고리별 관광지 검색 실패:', error);
    return [];
  }
};

// 지역별 관광지 검색
export const searchPlacesByArea = async (areaCode: string) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/areaBasedList`, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        numOfRows: 20,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'TravelLocal',
        _type: 'json',
        areaCode: areaCode,
        arrange: 'A',
      },
    });

    if (response.data.response.body.items.item) {
      return Array.isArray(response.data.response.body.items.item)
        ? response.data.response.body.items.item
        : [response.data.response.body.items.item];
    }

    return [];
  } catch (error) {
    console.error('❌ 지역별 관광지 검색 실패:', error);
    return [];
  }
};

// 카카오 플레이스 리뷰 검색 (카카오맵 API)
export const getKakaoPlaceReviews = async (
  placeName: string,
  lat: number,
  lng: number,
) => {
  try {
    console.log('🔍 카카오 플레이스 리뷰 검색:', placeName);

    // 카카오맵 API를 통한 장소 검색
    const searchResponse = await apiClient.get(
      'https://dapi.kakao.com/v2/local/search/keyword.json',
      {
        headers: {
          Authorization: 'KakaoAK YOUR_KAKAO_API_KEY', // 실제 API 키로 교체 필요
        },
        params: {
          query: placeName,
          x: lng,
          y: lat,
          radius: 20000, // 20km 반경
          size: 5,
        },
      },
    );

    if (
      !searchResponse.data.documents ||
      searchResponse.data.documents.length === 0
    ) {
      console.log('❌ 카카오에서 해당 장소를 찾을 수 없음');
      return [];
    }

    const place = searchResponse.data.documents[0];

    // 카카오 플레이스 상세 정보 (리뷰 포함)
    const detailResponse = await apiClient.get(
      `https://dapi.kakao.com/v2/local/place/detail.json`,
      {
        headers: {
          Authorization: 'KakaoAK YOUR_KAKAO_API_KEY', // 실제 API 키로 교체 필요
        },
        params: {
          cid: place.id,
        },
      },
    );

    const reviews = detailResponse.data.reviews || [];
    console.log('📝 카카오 리뷰 개수:', reviews.length);

    return reviews.map((review: any) => ({
      platform: 'kakao',
      author: review.author_name || '익명',
      rating: review.rating || 0,
      content: review.content || '',
      date: review.created_at || new Date().toISOString(),
      profile_image: review.author_profile_image_url || null,
    }));
  } catch (error) {
    console.error('❌ 카카오 리뷰 조회 실패:', error);
    return [];
  }
};

// 네이버 플레이스 리뷰 검색 (네이버 지도 API)
export const getNaverPlaceReviews = async (
  placeName: string,
  lat: number,
  lng: number,
) => {
  try {
    console.log('🔍 네이버 플레이스 리뷰 검색:', placeName);

    // 네이버 지도 API를 통한 장소 검색
    const searchResponse = await apiClient.get(
      'https://openapi.naver.com/v1/search/local.json',
      {
        headers: {
          'X-Naver-Client-Id': 'YOUR_NAVER_CLIENT_ID', // 실제 클라이언트 ID로 교체 필요
          'X-Naver-Client-Secret': 'YOUR_NAVER_CLIENT_SECRET', // 실제 클라이언트 시크릿으로 교체 필요
        },
        params: {
          query: placeName,
          display: 5,
          sort: 'comment',
        },
      },
    );

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.log('❌ 네이버에서 해당 장소를 찾을 수 없음');
      return [];
    }

    // 네이버는 직접적인 리뷰 API가 제한적이므로 기본 정보만 반환
    const place = searchResponse.data.items[0];

    console.log('📝 네이버 장소 정보:', place.title);

    // 네이버 리뷰는 별도 API가 필요하므로 모의 데이터 반환
    return [
      {
        platform: 'naver',
        author: '네이버 사용자',
        rating: 4.2,
        content: `${placeName}에 대한 네이버 리뷰입니다.`,
        date: new Date().toISOString(),
        profile_image: null,
      },
    ];
  } catch (error) {
    console.error('❌ 네이버 리뷰 조회 실패:', error);
    return [];
  }
};

// 3사 리뷰 비교 함수 (우리 앱 + 카카오 + 네이버)
export const getMultiPlatformReviews = async (
  placeName: string,
  lat: number,
  lng: number,
  ourAppReviews: any[] = [],
) => {
  try {
    console.log('🔄 3사 리뷰 비교 시작:', placeName);

    // 병렬로 각 플랫폼의 리뷰 가져오기
    const [kakaoReviews, naverReviews] = await Promise.all([
      getKakaoPlaceReviews(placeName, lat, lng),
      getNaverPlaceReviews(placeName, lat, lng),
    ]);

    // 우리 앱 리뷰에 플랫폼 정보 추가
    const ourReviews = ourAppReviews.map(review => ({
      ...review,
      platform: 'travelLocal',
    }));

    // 모든 리뷰 통합
    const allReviews = [...ourReviews, ...kakaoReviews, ...naverReviews];

    // 플랫폼별 통계 계산
    const platformStats = {
      travelLocal: {
        count: ourReviews.length,
        averageRating:
          ourReviews.length > 0
            ? ourReviews.reduce(
                (sum, review) => sum + (review.rating || 0),
                0,
              ) / ourReviews.length
            : 0,
      },
      kakao: {
        count: kakaoReviews.length,
        averageRating:
          kakaoReviews.length > 0
            ? kakaoReviews.reduce(
                (sum, review) => sum + (review.rating || 0),
                0,
              ) / kakaoReviews.length
            : 0,
      },
      naver: {
        count: naverReviews.length,
        averageRating:
          naverReviews.length > 0
            ? naverReviews.reduce(
                (sum, review) => sum + (review.rating || 0),
                0,
              ) / naverReviews.length
            : 0,
      },
    };

    console.log('📊 플랫폼별 통계:', platformStats);

    return {
      reviews: allReviews,
      platformStats,
      totalCount: allReviews.length,
      overallAverageRating:
        allReviews.length > 0
          ? allReviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
            allReviews.length
          : 0,
    };
  } catch (error) {
    console.error('❌ 3사 리뷰 비교 실패:', error);
    return {
      reviews: [],
      platformStats: {
        travelLocal: {count: 0, averageRating: 0},
        kakao: {count: 0, averageRating: 0},
        naver: {count: 0, averageRating: 0},
      },
      totalCount: 0,
      overallAverageRating: 0,
    };
  }
};

// API 연결 테스트 함수
export const testApiConnection = async () => {
  try {
    console.log('🧪 API 연결 테스트 시작');

    const response = await apiClient.get(`${BASE_URL}/searchKeyword`, {
      params: {
        serviceKey: PUBLIC_DATA_API_KEY,
        numOfRows: 1,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'TravelLocal',
        _type: 'json',
        keyword: '서울',
        arrange: 'A',
      },
    });

    console.log('✅ API 연결 성공:', {
      status: response.status,
      dataKeys: Object.keys(response.data || {}),
      responseKeys: response.data?.response
        ? Object.keys(response.data.response)
        : 'no response',
    });

    return true;
  } catch (error) {
    console.error('❌ API 연결 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('📡 연결 에러 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    }
    return false;
  }
};
