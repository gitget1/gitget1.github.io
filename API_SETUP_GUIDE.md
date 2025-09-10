# API 설정 가이드

## 네이버와 카카오맵 API 연동을 위한 설정

### 1. 네이버 API 설정

1. [네이버 개발자 센터](https://developers.naver.com/)에 접속
2. 애플리케이션 등록
3. "웹 서비스" 선택
4. 서비스 환경에서 "Web" 추가
5. Client ID와 Client Secret 발급받기

### 2. 카카오 API 설정

1. [카카오 개발자 센터](https://developers.kakao.com/)에 접속
2. 애플리케이션 등록
3. "플랫폼" → "Web" 추가
4. "제품 설정" → "카카오 로그인" 활성화
5. REST API 키 발급받기

### 3. API 키 설정

`src/constants/keys.ts` 파일에서 다음 값들을 실제 API 키로 교체하세요:

```typescript
const apiKeys = {
  // 네이버 API 키
  NAVER_CLIENT_ID: '실제_네이버_클라이언트_ID',
  NAVER_CLIENT_SECRET: '실제_네이버_클라이언트_시크릿',

  // 카카오 API 키
  KAKAO_API_KEY: '실제_카카오_API_키',

  // Google Maps API 키
  GOOGLE_MAPS_API_KEY: '실제_구글_맵스_API_키',
} as const;
```

### 4. API 사용 방법

- API 키가 설정되면 실제 네이버와 카카오맵에서 리뷰 데이터를 가져옵니다
- API 키가 설정되지 않으면 더미 데이터를 사용합니다
- 실제 API 사용 시 해당 플랫폼의 실제 리뷰 수와 별점이 표시됩니다

### 5. 주의사항

- API 키는 보안상 중요하므로 공개 저장소에 올리지 마세요
- 각 플랫폼의 API 사용 정책을 확인하고 준수하세요
- API 호출 제한이 있을 수 있으니 적절한 캐싱을 고려하세요

