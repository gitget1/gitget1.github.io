// JWT 토큰 디코딩 유틸리티
export const decodeJWT = (token: string) => {
  try {
    const cleanToken = token.replace('Bearer ', '');
    const base64Url = cleanToken.split('.')[1];
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

// 네이버 사용자 ID에서 해시코드 생성하여 숫자 ID로 변환
export const extractUserIdFromNaverJWT = (token: string): number => {
  const jwtPayload = decodeJWT(token);
  if (jwtPayload?.sub && jwtPayload.sub.startsWith('naver_')) {
    // naver_1jL8_4m2ktMEa__1I4cFBml9dGi4e8j5MC1V7KhfxBE 형태에서 해시코드 생성
    const naverUserId = jwtPayload.sub;

    // 문자열을 해시코드로 변환하여 숫자 ID 생성
    let hash = 0;
    for (let i = 0; i < naverUserId.length; i++) {
      const char = naverUserId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit 정수로 변환
    }

    // 양수로 변환하고 적절한 범위로 조정
    const userId = (Math.abs(hash) % 1000000) + 1; // 1~1000000 범위

    console.log('🔍 네이버 사용자 ID 변환:', {
      originalSub: naverUserId,
      generatedUserId: userId,
    });

    return userId;
  }
  return 1; // 기본값
};

// JWT 토큰 만료 확인
export const isJWTExpired = (token: string): boolean => {
  const jwtPayload = decodeJWT(token);
  if (!jwtPayload || !jwtPayload.exp) {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return jwtPayload.exp < currentTime;
};

// JWT에서 사용자 정보 추출
export const getUserInfoFromJWT = (token: string) => {
  const jwtPayload = decodeJWT(token);
  if (!jwtPayload) {
    return null;
  }

  return {
    userId: jwtPayload.sub,
    role: jwtPayload.role,
    exp: jwtPayload.exp,
    iat: jwtPayload.iat,
    category: jwtPayload.category,
  };
};
