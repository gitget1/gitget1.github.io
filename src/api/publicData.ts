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
