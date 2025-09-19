// 환경 변수 및 설정 상수
export const Config = {
  // API 서버 설정
  API_BASE_URL: 'http://124.60.137.10:8083',
  API_TIMEOUT: 10000,

  // Google API 설정
  GOOGLE_API_KEY: 'AIzaSyAP2enhwEyqTFgrpKiaRzneOfgdadldE9s',

  // Iamport 설정
  IAMPORT_USER_CODE: 'imp33770537',

  // 앱 설정
  APP_SCHEME: 'tourapps',
  APP_NAME: 'Tourapps',

  // 개발/프로덕션 환경
  NODE_ENV: 'development',

  // API 엔드포인트
  ENDPOINTS: {
    // 사용자 관련
    USER: '/api/user',
    USER_ME: '/api/users/me',

    // 투어 프로그램 관련
    TOUR_PROGRAM: '/api/tour-program',
    TOUR_PROGRAM_DETAIL: (id: number) => `/api/tour-program/${id}`,
    TOUR_PROGRAM_WISHLIST: (id: number) => `/api/tour-program/wishlist/${id}`,
    TOUR_PROGRAM_UNLOCK_STATUS: (id: number) =>
      `/api/tour-program/${id}/unlock-status`,
    TOUR_PROGRAM_UNLOCK: (id: number) => `/api/tour-program/${id}/unlock`,

    // 리뷰 관련
    REVIEW: '/api/tour-program/review',
    REVIEW_BY_TOUR: (tourId: number) => `/api/tour-program/review/${tourId}`,

    // 채팅 관련
    CHAT_ROOMS: '/api/chat/rooms',

    // 포인트 관련
    POINTS_BALANCE: '/api/points/balance',
    POINTS_USE: '/api/points/use',

    // 이미지 업로드
    UPLOAD: '/api/upload',

    // 인증 관련
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
  },

  // Google Places API 설정
  GOOGLE_PLACES: {
    API_KEY: 'AIzaSyAP2enhwEyqTFgrpKiaRzneOfgdadldE9s',
    LANGUAGE: 'ko',
    TYPES: 'establishment',
  },

  // 결제 설정
  PAYMENT: {
    PG: 'html5_inicis',
    PAY_METHOD: 'card',
    TEST_MODE: false,
  },

  // 일정 해제 비용
  SCHEDULE_UNLOCK_COST: 100,

  // 기본값들
  DEFAULTS: {
    GUIDE_PRICE: 50000,
    PEOPLE_COUNT: 1,
    USER_ID: 1,
    GUIDE_ID: 1,
  },
};

// 환경별 설정
export const getApiUrl = (endpoint: string): string => {
  return `${Config.API_BASE_URL}${endpoint}`;
};

// 개발 환경 확인
export const isDevelopment = (): boolean => {
  return Config.NODE_ENV === 'development';
};

// 프로덕션 환경 확인
export const isProduction = (): boolean => {
  return Config.NODE_ENV === 'production';
};
