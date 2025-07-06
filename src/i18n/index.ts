// 🌍 다국어 지원 설정 파일
// 이 파일은 앱의 모든 텍스트를 4개 언어로 번역하여 관리합니다.

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 📚 번역 리소스 객체
 * 각 언어별로 키-값 쌍으로 번역 텍스트를 저장
 *
 * 구조: resources[언어코드].translation[키] = "번역된 텍스트"
 * 예시: resources.ko.translation.home = "홈"
 *       resources.en.translation.home = "Home"
 */
const resources = {
  // 🇰🇷 한국어 번역
  ko: {
    translation: {
      // 메인 화면
      popularRegions: '🔥 인기 지역',
      personalityTest: '성향 테스트',
      myTourism: '나의 성향 관광',
      calendar: '캘린더',
      chat: '채팅',
      realTimeTranslator: '실시간 번역기',
      currentLocation: '📍 현재 위치: 서울',
      weatherInfo: '☀️ 맑음, 22℃ | 한강 산책 어때요?',
      event: '📢 이벤트',
      eventDescription:
        '🎉 5월 한정! 성향 분석하면 굿즈 추첨 이벤트에 참여해보세요.',

      // 공통
      home: '홈',
      wishlist: '위시리스트',
      mypage: '마이페이지',
      login: '로그인',
      logout: '로그아웃',
      notification: '알림',
      close: '닫기',

      // 언어 선택
      language: '언어',
      korean: '한국어',
      english: 'English',
      japanese: '日本語',
      chinese: '中文',

      // 마이페이지
      welcome: '님 환영합니다! 🙌',
      personalityTestShort: '성향테스트',
      programWrite: '프로그램 작성',
      inquiry: '1:1 문의',
      myReview: '마이리뷰',
      buddyPass: '🎁 Buddy Pass',
      buddyPassDesc: '30일간 매일 만나는 30% 혜택',
      service: '서비스',
      recentViewed: '📍 최근 본 글',
      favorites: '⭐ 관심 목록',
      events: '🗓 이벤트',
      takePhoto: '📷 사진 찍기',
      selectFromGallery: '🖼 갤러리에서 선택',
      resetToDefault: '🔄 기본 이미지로 변경',
      cancel: '❌ 취소',
      loadingUserInfo: '사용자 정보 로딩 중...',
      defaultUser: '사용자',

      // 네비게이션 헤더
      mbtiTest: 'MBTI검사',
      mbtiResult: 'MBTI결과',
      traitSelection: '성향별 관광지',
      practiceDetail: '상세정보',
      placeDetail: '장소 상세',
      makeProgram: '프로그램 만들기',
      myReviewList: '나의 리뷰',
      calendarScreen: '캘린더',
      chatMain: '채팅',
      chatRoom: '채팅방',
      wishlistScreen: '위시리스트',
      payment: '결제',
      paymentComplete: '결제 완료',

      // MBTI 질문 화면
      travelPersonalityQuestion: '🌴 여행 성향 질문',
      questionProgress: '질문 {{current}} / {{total}}',
      previousQuestion: '⬅️ 이전 질문',
      analyzing: '분석 중입니다...',
      loadingQuestions: '질문을 불러오는 중...',
      loginRequired: '로그인이 필요한 서비스입니다.',
      questionLoadError: '질문을 불러오는 데 실패했어요.',
      analysisError: '분석 중 문제가 발생했어요.',

      // MBTI 결과 화면
      travelPersonalityResult: '✈️여행 스타일 분석 결과',
      predictedMbti: '🧳여행 스타일',
      noDescription: '설명 없음',
      travelPersonalityAnalysis: '💬 여행 스타일 분석',
      recommendedHashtags: '🏷️ 추천 해시태그',
      recommendedDestinations: '📍 추천 여행지',
      none: '없음',
      saveResult: '💾 결과 저장',
      retakeTest: '🔄 다시 검사하기',
      goToMain: '🏠 메인 화면',
      howAccurate: '😊 이 결과는 얼마나 잘 맞았나요?',
      veryAccurate: '매우 정확해요',
      quiteAccurate: '꽤 맞아요',
      neutral: '보통이에요',
      slightlyDifferent: '조금 달라요',
      notAccurate: '전혀 아니에요',
      submitSatisfaction: '📝 만족도 제출',
      saveSuccess: '✅ 저장 성공',
      saveSuccessMessage: 'MBTI 분석 결과가 성공적으로 저장되었습니다.',
      saveFailed: '⚠️ 저장 실패',
      serverResponseError: '서버 응답이 올바르지 않습니다.',
      saveError: '❌ 저장 실패',
      serverError: '서버 오류가 발생했습니다.',
      selectSatisfaction: '만족도를 선택해주세요.',
      submitComplete: '제출 완료',
      satisfactionSaved: '만족도가 성공적으로 저장되었습니다!',
      error: '에러',
      unknownError: '알 수 없는 오류',
      feedbackError: '피드백 전송 중 문제가 발생했습니다.',

      // 위시리스트 화면
      myWishlist: '나의 위시리스트',
      refresh: '새로고침',
      loading: '로딩중...',
      wishlistEmpty: '위시리스트가 비어있습니다.',
      wishlistEmptyDesc:
        '투어 상세 페이지에서 🤍 버튼을 눌러\n관심있는 투어를 찜해보세요!',
      retry: '다시 시도',
      noImage: '이미지 없음',
      noTitle: '제목 없음',
      noRegionInfo: '지역 정보 없음',
      perPerson: '/인',
      loginRequiredService: '로그인이 필요한 서비스입니다.',
      serverTimeout: '서버 응답 시간이 초과되었습니다.',
      serverTimeoutDesc: '서버 응답 시간이 초과되었습니다. 다시 시도해주세요.',
      wishlistLoadFailed: '위시리스트를 불러오는데 실패했습니다.',
      networkError: '네트워크 연결을 확인해주세요.',
      pageNavigationFailed: '페이지 이동에 실패했습니다.',

      // 성향 선택 화면
      selectPersonality: '클릭하여 성향 선택',
      hashtags: '해시태그',
      recommendedRegions: '추천 지역',
      search: '조회하기',
      posts: '게시글',
      latest: '최신순',
      priceLowToHigh: '가격 낮은순',
      priceHighToLow: '가격 높은순',
      reviewOrder: '리뷰순',
      wishlistOrder: '찜순',
      guidePrice: '가이드 가격',
      won: '원',
      noPostsFound: '선택한 조건에 맞는 게시물이 없습니다.',
      noPosts: '게시물이 없습니다.',
      loadingMore: '로딩 중…',

      // 바텀 탭
      homeTab: '홈',
      myPageTab: '마이페이지',

      // 캘린더 화면
      calendarLoading: '로딩 중...',
      dataLoadError: '데이터를 불러오지 못했습니다.',
      totalReservations: '총 예약',
      selectedDateReservations: '선택된 날짜 예약',
      reservationCount: '개',

      // 캘린더 날짜/요일
      year: '년',
      month: '월',
      sunday: '일',
      monday: '월',
      tuesday: '화',
      wednesday: '수',
      thursday: '목',
      friday: '금',
      saturday: '토',

      // 채팅 화면
      chatList: '채팅 목록',
      chatRoomTitle: '채팅방',
      recentMessageNotSupported: '최근 메시지 미지원',
      morningTime: '오전 10:00',
      chatRoomLoadError: '채팅방 목록 불러오기 실패:',
      newChat: '새 채팅',
      enterMessage: '메시지를 입력하세요',

      // 투어 상세 화면
      editTour: '수정',
      deleteTour: '삭제',
      reviewTour: '리뷰',
      likedTour: '찜함',
      likeTour: '찜',
      scheduleTour: '일정',
      mapTour: '지도',
      hostInfo: '호스트 정보',
      hostTour: '호스트',
      tourDescription: '투어 설명',
      totalDistance: '총 거리',
      perPersonTour: '/인',
      consultation: '상담하기',
      reservationTour: '예약하기',
      tourDelete: '투어 삭제',
      deleteConfirmTour:
        '정말로 이 투어를 삭제하시겠습니까?\n삭제된 투어는 복구할 수 없습니다.',
      cancelTour: '취소',
      deleteComplete: '삭제 완료',
      tourDeleted: '투어가 삭제되었습니다.',
      confirmTour: '확인',
      wishlistAdded:
        '위시리스트에 추가되었습니다.\n위시리스트를 확인하시겠습니까?',
      wishlistRemoved: '위시리스트에서 제거되었습니다.',
      successTour: '성공',
      errorTour: '오류',
      loginRequiredTour: '로그인이 필요한 서비스입니다.',
      networkErrorTour: '네트워크 연결을 확인해주세요.',

      // 리뷰 화면
      writeReview: '리뷰 작성',
      ratingReview: '별점',
      enterReviewContent: '리뷰 내용을 입력하세요',
      imageUrlOptional: '이미지 선택',
      submitReview: '리뷰 등록',
      submittingReview: '등록 중...',
      totalReviews: '총 리뷰',
      reviewsCount: '개',
      latestReview: '최신순',
      highRating: '별점 높은순',
      lowRating: '별점 낮은순',
      anonymousReview: '익명',
      reviewRegistered: '리뷰가 등록되었습니다!',
      reviewDeleted: '리뷰가 삭제되었습니다.',
      deleteReview: '리뷰 삭제',
      deleteReviewConfirm: '정말로 이 리뷰를 삭제하시겠습니까?',
      enterReviewContentAlert: '리뷰 내용을 입력해주세요.',

      // 별점 텍스트
      selectRating: '선택하세요',
      worstRating: '최악이에요',
      badRating: '별로예요',
      averageRating: '보통이에요',
      goodRating: '좋아요',
      excellentRating: '최고예요!',
    },
  },

  // 🇺🇸 영어 번역
  en: {
    translation: {
      // 메인 화면
      popularRegions: '🔥 Popular Regions',
      personalityTest: 'Personality Test',
      myTourism: 'My Tourism',
      calendar: 'Calendar',
      chat: 'Chat',
      realTimeTranslator: 'Real-Time Translator',
      currentLocation: '📍 Current Location: Seoul',
      weatherInfo: '☀️ Sunny, 22℃ | How about a walk along the Han River?',
      event: '📢 Event',
      eventDescription:
        '🎉 May Limited! Participate in the goods lottery event when you analyze your personality.',

      // 공통
      home: 'Home',
      wishlist: 'Wishlist',
      mypage: 'My Page',
      login: 'Login',
      logout: 'Logout',
      notification: 'Notification',
      close: 'Close',

      // 언어 선택
      language: 'Language',
      korean: '한국어',
      english: 'English',
      japanese: '日本語',
      chinese: '中文',

      // 마이페이지
      welcome: ' Welcome! 🙌',
      personalityTestShort: 'Personality Test',
      programWrite: 'Write Program',
      inquiry: '1:1 Inquiry',
      myReview: 'My Reviews',
      buddyPass: '🎁 Buddy Pass',
      buddyPassDesc: '30% benefits for 30 days',
      service: 'Service',
      recentViewed: '📍 Recently Viewed',
      favorites: '⭐ Favorites',
      events: '🗓 Events',
      takePhoto: '📷 Take Photo',
      selectFromGallery: '🖼 Select from Gallery',
      resetToDefault: '🔄 Reset to Default',
      cancel: '❌ Cancel',
      loadingUserInfo: 'Loading user information...',
      defaultUser: 'User',

      // 네비게이션 헤더
      mbtiTest: 'MBTI Test',
      mbtiResult: 'MBTI Result',
      traitSelection: 'Tourist Attractions by Personality',
      practiceDetail: 'Practice Detail',
      placeDetail: 'Place Detail',
      makeProgram: 'Make Program',
      myReviewList: 'My Reviews',
      calendarScreen: 'Calendar',
      chatMain: 'Chat',
      chatRoom: 'Chat Room',
      wishlistScreen: 'Wishlist',
      payment: 'Payment',
      paymentComplete: 'Payment Complete',

      // MBTI 질문 화면
      travelPersonalityQuestion: '🌴 Travel Personality Questions',
      questionProgress: 'Question {{current}} / {{total}}',
      previousQuestion: '⬅️ Previous Question',
      analyzing: 'Analyzing...',
      loadingQuestions: 'Loading questions...',
      loginRequired: 'Login is required for this service.',
      questionLoadError: 'Failed to load questions.',
      analysisError: 'An error occurred during analysis.',

      // MBTI 결과 화면
      travelPersonalityResult: 'Travel Personality Analysis Result',
      predictedMbti: '🧠 Predicted MBTI',
      noDescription: 'No description',
      travelPersonalityAnalysis: '💬 Travel Personality Analysis',
      recommendedHashtags: '🏷️ Recommended Hashtags',
      recommendedDestinations: '📍 Recommended Destinations',
      none: 'None',
      saveResult: '💾 Save Result',
      retakeTest: '🔄 Retake Test',
      goToMain: '🏠 Go to Main',
      howAccurate: '😊 How accurate was this MBTI result?',
      veryAccurate: 'Very accurate',
      quiteAccurate: 'Quite accurate',
      neutral: 'Neutral',
      slightlyDifferent: 'Slightly different',
      notAccurate: 'Not accurate at all',
      submitSatisfaction: '📝 Submit Satisfaction',
      saveSuccess: '✅ Save Success',
      saveSuccessMessage: 'MBTI analysis result has been successfully saved.',
      saveFailed: '⚠️ Save Failed',
      serverResponseError: 'Server response is not correct.',
      saveError: '❌ Save Error',
      serverError: 'A server error occurred.',
      selectSatisfaction: 'Please select your satisfaction level.',
      submitComplete: 'Submit Complete',
      satisfactionSaved: 'Satisfaction has been successfully saved!',
      error: 'Error',
      unknownError: 'Unknown error',
      feedbackError: 'An error occurred while sending feedback.',

      // 위시리스트 화면
      myWishlist: 'My Wishlist',
      refresh: 'Refresh',
      loading: 'Loading...',
      wishlistEmpty: 'Your wishlist is empty.',
      wishlistEmptyDesc:
        "Tap the 🤍 button on tour detail pages\nto save tours you're interested in!",
      retry: 'Retry',
      noImage: 'No Image',
      noTitle: 'No Title',
      noRegionInfo: 'No Region Info',
      perPerson: '/person',
      loginRequiredService: 'Login is required for this service.',
      serverTimeout: 'Server response timeout.',
      serverTimeoutDesc: 'Server response timeout. Please try again.',
      wishlistLoadFailed: 'Failed to load wishlist.',
      networkError: 'Please check your network connection.',
      pageNavigationFailed: 'Failed to navigate to page.',

      // 성향 선택 화면
      selectPersonality: 'Click to select personality',
      hashtags: 'Hashtags',
      recommendedRegions: 'Recommended Regions',
      search: 'Search',
      posts: 'Posts',
      latest: 'Latest',
      priceLowToHigh: 'Price: Low to High',
      priceHighToLow: 'Price: High to Low',
      reviewOrder: 'By Reviews',
      wishlistOrder: 'By Wishlist',
      guidePrice: 'Guide Price',
      won: '',
      noPostsFound: 'No posts found matching the selected criteria.',
      noPosts: 'No posts available.',
      loadingMore: 'Loading more…',

      // 바텀 탭
      homeTab: 'Home',
      myPageTab: 'My Page',

      // 캘린더 화면
      calendarLoading: 'Loading...',
      dataLoadError: 'Failed to load data.',
      totalReservations: 'Total reservations',
      selectedDateReservations: 'Selected date reservations',
      reservationCount: '',

      // 캘린더 날짜/요일
      year: '',
      month: '',
      sunday: 'Sun',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',

      // 채팅 화면
      chatList: 'Chat List',
      chatRoomTitle: 'Chat Room',
      recentMessageNotSupported: 'Recent message not supported',
      morningTime: '10:00 AM',
      chatRoomLoadError: 'Failed to load chat rooms:',
      newChat: 'New Chat',
      enterMessage: 'Enter a message',

      // 투어 상세 화면
      editTour: 'Edit',
      deleteTour: 'Delete',
      reviewTour: 'Review',
      likedTour: 'Liked',
      likeTour: 'Like',
      scheduleTour: 'Schedule',
      mapTour: 'Map',
      hostInfo: 'Host Information',
      hostTour: 'Host',
      tourDescription: 'Tour Description',
      totalDistance: 'Total Distance',
      perPersonTour: '/person',
      consultation: 'Consultation',
      reservationTour: 'Reserve',
      tourDelete: 'Delete Tour',
      deleteConfirmTour:
        'Are you sure you want to delete this tour?\nDeleted tours cannot be recovered.',
      cancelTour: 'Cancel',
      deleteComplete: 'Delete Complete',
      tourDeleted: 'Tour has been deleted.',
      confirmTour: 'Confirm',
      wishlistAdded:
        'Added to wishlist.\nWould you like to check your wishlist?',
      wishlistRemoved: 'Removed from wishlist.',
      successTour: 'Success',
      errorTour: 'Error',
      loginRequiredTour: 'Login is required for this service.',
      networkErrorTour: 'Please check your network connection.',

      // 리뷰 화면
      writeReview: 'Write Review',
      ratingReview: 'Rating',
      enterReviewContent: 'Enter review content',
      imageUrlOptional: 'Image URL (optional)',
      submitReview: 'Submit Review',
      submittingReview: 'Submitting...',
      totalReviews: 'Total Reviews',
      reviewsCount: '',
      latestReview: 'Latest',
      highRating: 'Highest Rating',
      lowRating: 'Lowest Rating',
      anonymousReview: 'Anonymous',
      reviewRegistered: 'Review has been registered!',
      reviewDeleted: 'Review has been deleted.',
      deleteReview: 'Delete Review',
      deleteReviewConfirm: 'Are you sure you want to delete this review?',
      enterReviewContentAlert: 'Please enter review content.',

      // 별점 텍스트
      selectRating: 'Select',
      worstRating: 'Terrible',
      badRating: 'Bad',
      averageRating: 'Average',
      goodRating: 'Good',
      excellentRating: 'Excellent!',
    },
  },

  // 🇯🇵 일본어 번역
  ja: {
    translation: {
      // 메인 화면
      popularRegions: '🔥 人気地域',
      personalityTest: '性格テスト',
      myTourism: '私の性格観光',
      calendar: 'カレンダー',
      chat: 'チャット',
      realTimeTranslator: 'リアルタイム翻訳機',
      currentLocation: '📍 現在地：ソウル',
      weatherInfo: '☀️ 晴れ、22℃ | 漢江散歩はいかがですか？',
      event: '📢 イベント',
      eventDescription:
        '🎉 5月限定！性格分析でグッズ抽選イベントに参加してみてください。',

      // 공통
      home: 'ホーム',
      wishlist: 'ウィッシュリスト',
      mypage: 'マイページ',
      login: 'ログイン',
      logout: 'ログアウト',
      notification: 'お知らせ',
      close: '閉じる',

      // 언어 선택
      language: '言語',
      korean: '한국어',
      english: 'English',
      japanese: '日本語',
      chinese: '中文',

      // 마이페이지
      welcome: 'さん、いらっしゃいませ！🙌',
      personalityTestShort: '性格テスト',
      programWrite: 'プログラム作成',
      inquiry: '1:1お問い合わせ',
      myReview: 'マイレビュー',
      buddyPass: '🎁 バディパス',
      buddyPassDesc: '30日間毎日30%の特典',
      service: 'サービス',
      recentViewed: '📍 最近見た記事',
      favorites: '⭐ お気に入り',
      events: '🗓 イベント',
      takePhoto: '📷 写真を撮る',
      selectFromGallery: '🖼 ギャラリーから選択',
      resetToDefault: '🔄 デフォルト画像に変更',
      cancel: '❌ キャンセル',
      loadingUserInfo: 'ユーザー情報のロード中...',
      defaultUser: 'ユーザー',

      // 네비게이션 헤더
      mbtiTest: 'MBTI検査',
      mbtiResult: 'MBTI結果',
      traitSelection: '性格別の観光地',
      practiceDetail: '詳細情報',
      placeDetail: '場所詳細',
      makeProgram: 'プログラム作成',
      myReviewList: 'レビュー',
      calendarScreen: 'カレンダー',
      chatMain: 'チャット',
      chatRoom: 'チャットルーム',
      wishlistScreen: 'ウィッシュリスト',
      payment: '決済',
      paymentComplete: '決済完了',

      // MBTI 질문 화면
      travelPersonalityQuestion: '🌴 旅行性格質問',
      questionProgress: '質問 {{current}} / {{total}}',
      previousQuestion: '⬅️ 前の質問',
      analyzing: '分析中です...',
      loadingQuestions: '質問を読み込み中...',
      loginRequired: 'ログインが必要なサービスです。',
      questionLoadError: '質問の読み込みに失敗しました。',
      analysisError: '分析中に問題が発生しました。',

      // MBTI 결과 화면
      travelPersonalityResult: '旅行性格分析結果',
      predictedMbti: '🧠 予測されたMBTI',
      noDescription: '説明なし',
      travelPersonalityAnalysis: '💬 旅行性格分析',
      recommendedHashtags: '🏷️ おすすめハッシュタグ',
      recommendedDestinations: '📍 おすすめ旅行先',
      none: 'なし',
      saveResult: '💾 結果保存',
      retakeTest: '🔄 再検査',
      goToMain: '🏠 メイン画面',
      howAccurate: '😊 このMBTI結果はどのくらい正確でしたか？',
      veryAccurate: 'とても正確',
      quiteAccurate: 'かなり正確',
      neutral: '普通',
      slightlyDifferent: '少し違う',
      notAccurate: '全く違う',
      submitSatisfaction: '📝 満足度提出',
      saveSuccess: '✅ 保存成功',
      saveSuccessMessage: 'MBTI分析結果が正常に保存されました。',
      saveFailed: '⚠️ 保存失敗',
      serverResponseError: 'サーバーの応答が正しくありません。',
      saveError: '❌ 保存エラー',
      serverError: 'サーバーエラーが発生しました。',
      selectSatisfaction: '満足度を選択してください。',
      submitComplete: '提出完了',
      satisfactionSaved: '満足度が正常に保存されました！',
      error: 'エラー',
      unknownError: '不明なエラー',
      feedbackError: 'フィードバック送信中に問題が発生しました。',

      // 위시리스트 화면
      myWishlist: 'マイウィッシュリスト',
      refresh: '更新',
      loading: '読み込み中...',
      wishlistEmpty: 'ウィッシュリストが空です。',
      wishlistEmptyDesc:
        'ツアー詳細ページで🤍ボタンを押して\n気になるツアーをお気に入りに追加してください！',
      retry: '再試行',
      noImage: '画像なし',
      noTitle: 'タイトルなし',
      noRegionInfo: '地域情報なし',
      perPerson: '/人',
      loginRequiredService: 'ログインが必要なサービスです。',
      serverTimeout: 'サーバー応答がタイムアウトしました。',
      serverTimeoutDesc:
        'サーバー応答がタイムアウトしました。再試行してください。',
      wishlistLoadFailed: 'ウィッシュリストの読み込みに失敗しました。',
      networkError: 'ネットワーク接続を確認してください。',
      pageNavigationFailed: 'ページ移動に失敗しました。',

      // 성향 선택 화면
      selectPersonality: 'クリックして性格を選択',
      hashtags: 'ハッシュタグ',
      recommendedRegions: 'おすすめ地域',
      search: '検索',
      posts: '投稿',
      latest: '最新順',
      priceLowToHigh: '価格：安い順',
      priceHighToLow: '価格：高い順',
      reviewOrder: 'レビュー順',
      wishlistOrder: 'お気に入り順',
      guidePrice: 'ガイド料金',
      won: '円',
      noPostsFound: '選択した条件に一致する投稿がありません。',
      noPosts: '投稿がありません。',
      loadingMore: '読み込み中…',

      // 바텀 탭
      homeTab: 'ホーム',
      myPageTab: 'マイページ',

      // 캘린더 화면
      calendarLoading: '読み込み中...',
      dataLoadError: 'データの読み込みに失敗しました。',
      totalReservations: '総予約',
      selectedDateReservations: '選択日の予約',
      reservationCount: '件',

      // 캘린더 날짜/요일
      year: '年',
      month: '月',
      sunday: '日',
      monday: '月',
      tuesday: '火',
      wednesday: '水',
      thursday: '木',
      friday: '金',
      saturday: '土',

      // 채팅 화면
      chatList: 'チャット一覧',
      chatRoomTitle: 'チャットルーム',
      recentMessageNotSupported: '最新メッセージ未対応',
      morningTime: '午前10:00',
      chatRoomLoadError: 'チャットルーム一覧の読み込みに失敗:',
      newChat: '新しいチャット',
      enterMessage: 'メッセージを入力してください',

      // 투어 상세 화면
      editTour: '編集',
      deleteTour: '削除',
      reviewTour: 'レビュー',
      likedTour: 'お気に入り済み',
      likeTour: 'お気に入り',
      scheduleTour: 'スケジュール',
      mapTour: 'マップ',
      hostInfo: 'ホスト情報',
      hostTour: 'ホスト',
      tourDescription: 'ツアー説明',
      totalDistance: '総距離',
      perPersonTour: '/人',
      consultation: '相談',
      reservationTour: '予約',
      tourDelete: 'ツアー削除',
      deleteConfirmTour:
        '本当にこのツアーを削除しますか？\n削除されたツアーは復元できません。',
      cancelTour: 'キャンセル',
      deleteComplete: '削除完了',
      tourDeleted: 'ツアーが削除されました。',
      confirmTour: '確認',
      wishlistAdded:
        'ウィッシュリストに追加されました。\nウィッシュリストを確認しますか？',
      wishlistRemoved: 'ウィッシュリストから削除されました。',
      successTour: '成功',
      errorTour: 'エラー',
      loginRequiredTour: 'このサービスにはログインが必要です。',
      networkErrorTour: 'ネットワーク接続を確認してください。',

      // 리뷰 화면
      writeReview: 'レビュー作成',
      ratingReview: '評価',
      enterReviewContent: 'レビュー内容を入力してください',
      imageUrlOptional: '画像URL（任意）',
      submitReview: 'レビュー投稿',
      submittingReview: '投稿中...',
      totalReviews: '総レビュー',
      reviewsCount: '件',
      latestReview: '最新順',
      highRating: '評価高い順',
      lowRating: '評価低い順',
      anonymousReview: '匿名',
      reviewRegistered: 'レビューが登録されました！',
      reviewDeleted: 'レビューが削除されました。',
      deleteReview: 'レビュー削除',
      deleteReviewConfirm: '本当にこのレビューを削除しますか？',
      enterReviewContentAlert: 'レビュー内容を入力してください。',

      // 별점 텍스트
      selectRating: '選択してください',
      worstRating: '最悪です',
      badRating: 'イマイチです',
      averageRating: '普通です',
      goodRating: '良いです',
      excellentRating: '最高です！',
    },
  },

  // 🇨🇳 중국어 번역
  zh: {
    translation: {
      // 메인 화면
      popularRegions: '🔥 热门地区',
      personalityTest: '性格测试',
      myTourism: '我的性格旅游',
      calendar: '日历',
      chat: '聊天',
      realTimeTranslator: '实时翻译机',
      currentLocation: '📍 当前位置：首尔',
      weatherInfo: '☀️ 晴天，22℃ | 汉江散步怎么样？',
      event: '📢 活动',
      eventDescription: '🎉 5月限定！分析性格即可参与商品抽奖活动。',

      // 공통
      home: '首页',
      wishlist: '愿望清单',
      mypage: '我的页面',
      login: '登录',
      logout: '登出',
      notification: '通知',
      close: '关闭',

      // 언어 선택
      language: '语言',
      korean: '한국어',
      english: 'English',
      japanese: '日本語',
      chinese: '中文',

      // 마이페이지
      welcome: '先生，欢迎您！🙌',
      personalityTestShort: '性格测试',
      programWrite: '编写程序',
      inquiry: '1:1咨询',
      myReview: '我的评论',
      buddyPass: '🎁 伙伴通行证',
      buddyPassDesc: '30天每天30%优惠',
      service: '服务',
      recentViewed: '📍 最近查看',
      favorites: '⭐ 收藏夹',
      events: '🗓 活动',
      takePhoto: '📷 拍照',
      selectFromGallery: '🖼 从相册选择',
      resetToDefault: '🔄 恢复默认图片',
      cancel: '❌ 取消',
      loadingUserInfo: '加载用户信息...',
      defaultUser: '用户',

      // 네비게이션 헤더
      mbtiTest: 'MBTI测试',
      mbtiResult: 'MBTI结果',
      traitSelection: '性格旅游目的地',
      practiceDetail: '详细信息',
      placeDetail: '地点详细',
      makeProgram: '制作程序',
      myReviewList: '我的评论',
      calendarScreen: '日历',
      chatMain: '聊天',
      chatRoom: '聊天室',
      wishlistScreen: '愿望清单',
      payment: '支付',
      paymentComplete: '支付完成',

      // MBTI 질문 화면
      travelPersonalityQuestion: '🌴 旅行性格问题',
      questionProgress: '问题 {{current}} / {{total}}',
      previousQuestion: '⬅️ 上一个问题',
      analyzing: '分析中...',
      loadingQuestions: '加载问题中...',
      loginRequired: '此服务需要登录。',
      questionLoadError: '加载问题失败。',
      analysisError: '分析过程中出现问题。',

      // MBTI 결과 화면
      travelPersonalityResult: '旅行性格分析结果',
      predictedMbti: '🧠 预测的MBTI',
      noDescription: '无描述',
      travelPersonalityAnalysis: '💬 旅行性格分析',
      recommendedHashtags: '🏷️ 推荐标签',
      recommendedDestinations: '📍 推荐目的地',
      none: '无',
      saveResult: '💾 保存结果',
      retakeTest: '🔄 重新测试',
      goToMain: '🏠 主页面',
      howAccurate: '😊 这个MBTI结果有多准确？',
      veryAccurate: '非常准确',
      quiteAccurate: '相当准确',
      neutral: '一般',
      slightlyDifferent: '稍有不同',
      notAccurate: '完全不准确',
      submitSatisfaction: '📝 提交满意度',
      saveSuccess: '✅ 保存成功',
      saveSuccessMessage: 'MBTI分析结果已成功保存。',
      saveFailed: '⚠️ 保存失败',
      serverResponseError: '服务器响应不正确。',
      saveError: '❌ 保存错误',
      serverError: '服务器发生错误。',
      selectSatisfaction: '请选择满意度。',
      submitComplete: '提交完成',
      satisfactionSaved: '满意度已成功保存！',
      error: '错误',
      unknownError: '未知错误',
      feedbackError: '发送反馈时出现问题。',

      // 위시리스트 화면
      myWishlist: '我的愿望清单',
      refresh: '刷新',
      loading: '加载中...',
      wishlistEmpty: '愿望清单为空。',
      wishlistEmptyDesc: '在旅游详情页面点击🤍按钮\n收藏您感兴趣的旅游！',
      retry: '重试',
      noImage: '无图片',
      noTitle: '无标题',
      noRegionInfo: '无地区信息',
      perPerson: '/人',
      loginRequiredService: '此服务需要登录。',
      serverTimeout: '服务器响应超时。',
      serverTimeoutDesc: '服务器响应超时。请重试。',
      wishlistLoadFailed: '加载愿望清单失败。',
      networkError: '请检查网络连接。',
      pageNavigationFailed: '页面导航失败。',

      // 성향 선택 화면
      selectPersonality: '点击选择性格',
      hashtags: '标签',
      recommendedRegions: '推荐地区',
      search: '搜索',
      posts: '帖子',
      latest: '最新',
      priceLowToHigh: '价格：低到高',
      priceHighToLow: '价格：高到低',
      reviewOrder: '按评论',
      wishlistOrder: '按收藏',
      guidePrice: '导游价格',
      won: '元',
      noPostsFound: '没有找到符合所选条件的帖子。',
      noPosts: '没有帖子。',
      loadingMore: '加载更多…',

      // 바텀 탭
      homeTab: '首页',
      myPageTab: '我的页面',

      // 캘린더 화면
      calendarLoading: '加载中...',
      dataLoadError: '数据加载失败。',
      totalReservations: '总预约',
      selectedDateReservations: '选定日期预约',
      reservationCount: '个',

      // 캘린더 날짜/요일
      year: '年',
      month: '月',
      sunday: '日',
      monday: '一',
      tuesday: '二',
      wednesday: '三',
      thursday: '四',
      friday: '五',
      saturday: '六',

      // 채팅 화면
      chatList: '聊天列表',
      chatRoomTitle: '聊天室',
      recentMessageNotSupported: '不支持最新消息',
      morningTime: '上午10:00',
      chatRoomLoadError: '聊天室列表加载失败:',
      newChat: '新聊天',
      enterMessage: '请输入消息',

      // 투어 상세 화면
      editTour: '编辑',
      deleteTour: '删除',
      reviewTour: '评论',
      likedTour: '已收藏',
      likeTour: '收藏',
      scheduleTour: '行程',
      mapTour: '地图',
      hostInfo: '主办方信息',
      hostTour: '主办方',
      tourDescription: '旅游描述',
      totalDistance: '总距离',
      perPersonTour: '/人',
      consultation: '咨询',
      reservationTour: '预订',
      tourDelete: '删除旅游',
      deleteConfirmTour: '确定要删除这个旅游吗？\n删除的旅游无法恢复。',
      cancelTour: '取消',
      deleteComplete: '删除完成',
      tourDeleted: '旅游已删除。',
      confirmTour: '确认',
      wishlistAdded: '已添加到收藏夹。\n要查看收藏夹吗？',
      wishlistRemoved: '已从收藏夹中删除。',
      successTour: '成功',
      errorTour: '错误',
      loginRequiredTour: '此服务需要登录。',
      networkErrorTour: '请检查网络连接。',

      // 리뷰 화면
      writeReview: '写评论',
      ratingReview: '评分',
      enterReviewContent: '请输入评论内容',
      imageUrlOptional: '图片URL（可选）',
      submitReview: '提交评论',
      submittingReview: '提交中...',
      totalReviews: '总评论',
      reviewsCount: '个',
      latestReview: '最新',
      highRating: '评分高',
      lowRating: '评分低',
      anonymousReview: '匿名',
      reviewRegistered: '评论已注册！',
      reviewDeleted: '评论已删除。',
      deleteReview: '删除评论',
      deleteReviewConfirm: '确定要删除这个评论吗？',
      enterReviewContentAlert: '请输入评论内容。',

      // 별점 텍스트
      selectRating: '请选择',
      worstRating: '最差',
      badRating: '不好',
      averageRating: '一般',
      goodRating: '好',
      excellentRating: '非常好！',
    },
  },
};

/**
 * 🚀 i18n 초기화 함수
 * 앱 시작 시 저장된 언어 설정을 불러와서 i18n을 초기화합니다.
 *
 * 동작 과정:
 * 1. AsyncStorage에서 이전에 선택한 언어 불러오기
 * 2. 저장된 언어가 없으면 기본값(한국어) 사용
 * 3. i18n 라이브러리 초기화
 */
const initI18n = async () => {
  try {
    // 이전에 선택한 언어 불러오기
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    const initialLanguage = savedLanguage || 'ko'; // 기본값: 한국어

    // i18n 초기화
    i18n.use(initReactI18next).init({
      resources, // 번역 리소스
      lng: initialLanguage, // 초기 언어 설정
      fallbackLng: 'ko', // 번역이 없을 때 사용할 기본 언어
      interpolation: {
        escapeValue: false, // React에서는 XSS 보호가 기본 제공되므로 false
      },
    });
  } catch (error) {
    console.error('언어 설정 불러오기 실패:', error);
    // 오류 발생 시 기본 설정으로 초기화
    i18n.use(initReactI18next).init({
      resources,
      lng: 'ko',
      fallbackLng: 'ko',
      interpolation: {
        escapeValue: false,
      },
    });
  }
};

/**
 * 💾 언어 변경 이벤트 리스너
 * 사용자가 언어를 변경할 때마다 자동으로 AsyncStorage에 저장
 * 이렇게 하면 앱을 다시 시작해도 선택한 언어가 유지됩니다.
 */
i18n.on('languageChanged', async lng => {
  try {
    await AsyncStorage.setItem('selectedLanguage', lng);
    console.log(`언어가 ${lng}로 변경되고 저장되었습니다.`);
  } catch (error) {
    console.error('언어 설정 저장 실패:', error);
  }
});

// 🎯 i18n 초기화 실행
initI18n();

// 🌍 설정된 i18n 객체를 내보내기
// 다른 컴포넌트에서 useTranslation() 훅을 통해 사용됩니다.
export default i18n;
