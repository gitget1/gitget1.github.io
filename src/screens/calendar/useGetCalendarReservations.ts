// hooks/queries/useGetCalendarReservations.ts
import {useQuery} from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CalendarStatusDTO {
  reservationId: number;
  date: string; // LocalDate -> string
  status: string;
}

interface ReservationCalendarDTO {
  id: number;
  tourProgramTitle: string;
  guideStartDate: string; // LocalDateTime -> string
  guideEndDate: string;
  numOfPeople: number;
  requestStatus: string;
  role: string; // "GUIDE" or "USER"
  counterpartName: string;
  otherName: string; // 백엔드에서 추가된 필드
  // 상대방 이름 조회를 위한 필드들
  tourProgramId?: number;
  userId?: number;
  guideId?: number;
  userName?: string;
  guideName?: string;
  requesterName?: string;
  guideUserName?: string;
  // 중첩 객체 지원
  tourProgram?: {id: number; userId?: number};
  user?: {id: number; name?: string; username?: string};
  guide?: {id: number; name?: string; username?: string};
}

// 두 가지 API 엔드포인트를 지원하는 함수들
const fetchMyReservations = async (
  start: string,
  end: string,
  token: string,
) => {
  console.log('📋 Fetching my reservations...');
  console.log(
    '📋 API URL: http://124.60.137.10:8083/api/calendar/my-reservations',
  );
  console.log('📋 Params:', {start, end});
  console.log('📋 Date range:', {
    startDate: start,
    endDate: end,
    startFormatted: start ? new Date(start).toLocaleString() : 'N/A',
    endFormatted: end ? new Date(end).toLocaleString() : 'N/A',
  });
  console.log('📋 Token exists:', !!token);

  const response = await axios.get(
    'http://124.60.137.10:8083/api/calendar/my-reservations',
    {
      params: {start, end},
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    },
  );

  console.log('📋 Response status:', response.status);
  console.log('📋 Response data:', response.data);
  console.log('📋 Response data type:', typeof response.data);
  console.log(
    '📋 Response data length:',
    Array.isArray(response.data) ? response.data.length : 'not array',
  );

  // 첫 번째 예약의 상세 정보 로그
  if (Array.isArray(response.data) && response.data.length > 0) {
    console.log(
      '📋 첫 번째 예약 상세 정보:',
      JSON.stringify(response.data[0], null, 2),
    );
  }

  return response.data || [];
};

const fetchCalendarStatus = async (
  start: string,
  end: string,
  token: string,
) => {
  console.log('📅 Fetching calendar status...');
  const response = await axios.get(
    'http://124.60.137.10:8083/api/calendar/status',
    {
      params: {start, end},
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    },
  );
  return response.data || [];
};

const fetchCalendarReservations = async (start: string, end: string) => {
  const token = await AsyncStorage.getItem('accessToken');

  console.log('🔍 API Request Debug:');
  console.log('- token:', token ? 'exists' : 'missing');
  console.log('- start:', start);
  console.log('- end:', end);

  if (!token) {
    console.error('❌ No access token found');
    return [];
  }

  try {
    // 1. 내 예약 내역 조회
    const myReservations = await fetchMyReservations(start, end, token);
    console.log('✅ My Reservations API Success!');
    console.log('- My reservations:', myReservations);
    console.log('- My reservations count:', myReservations.length);

    // 2. 캘린더 상태 조회 (선택적)
    let calendarStatus: CalendarStatusDTO[] = [];
    try {
      calendarStatus = await fetchCalendarStatus(start, end, token);
      console.log('✅ Calendar Status API Success!');
      console.log('- Calendar status:', calendarStatus);
      console.log('- Status count:', calendarStatus.length);
    } catch (statusError) {
      console.error('❌ Calendar Status API failed:', statusError);
      if (axios.isAxiosError(statusError)) {
        console.error('- Status error code:', statusError.response?.status);
        console.error('- Status error data:', statusError.response?.data);
        console.error('- Status error message:', statusError.message);
      }
      console.warn('⚠️ Continuing without calendar status');
    }

    // 내 예약 내역을 기본으로 반환 (다른 API들은 로그만 출력)
    const combinedData = myReservations.map(reservation => ({
      id: reservation.id || 0,
      tourProgramTitle: reservation.tourProgramTitle || '',
      guideStartDate: reservation.guideStartDate || '',
      guideEndDate: reservation.guideEndDate || '',
      numOfPeople: reservation.numOfPeople || 0,
      requestStatus:
        (reservation.requestStatus as
          | 'ACCEPTED'
          | 'PENDING'
          | 'REJECTED'
          | 'CANCELLED_BY_USER'
          | 'CANCELLED_BY_GUIDE'
          | 'COMPLETED') || 'PENDING',
      role: reservation.role || 'USER', // 서버에서 제공하는 role 필드 사용
      counterpartName: reservation.counterpartName || '', // 서버에서 제공하는 counterpartName 필드 사용
      otherName: reservation.otherName || '', // 백엔드에서 추가된 otherName 필드 사용
      // 상대방 이름 조회를 위한 필드들 추가
      tourProgramId:
        reservation.tourProgramId || reservation.tourProgram?.id || null,
      userId: reservation.userId || reservation.user?.id || null,
      guideId: reservation.guideId || reservation.guide?.id || null,
      userName:
        reservation.userName ||
        reservation.user?.name ||
        reservation.user?.username ||
        '',
      guideName:
        reservation.guideName ||
        reservation.guide?.name ||
        reservation.guide?.username ||
        '',
      requesterName: reservation.requesterName || '',
      guideUserName: reservation.guideUserName || '',
    }));

    console.log('✅ Final combined data:', combinedData);
    console.log('✅ Final combined data length:', combinedData.length);
    console.log('📊 API Summary:');
    console.log('- My reservations:', myReservations.length);
    console.log('- Calendar status:', calendarStatus.length);

    return combinedData || [];
  } catch (error) {
    console.error('❌ API Error:', error);

    if (axios.isAxiosError(error)) {
      console.error('- Error type: Axios Error');
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Status:', error.response?.status);
      console.error('- Data:', error.response?.data);

      if (
        error.code === 'NETWORK_ERROR' ||
        error.message.includes('Network Error')
      ) {
        console.error('🌐 Network connectivity issue detected');
        console.error(
          '- Check if server is running on http://124.60.137.10:80',
        );
        console.error('- Check device network connection');

        // 다른 서버 주소들 시도
        const alternativeServers = [
          'http://124.60.137.10:8083',
          'http://192.168.1.120:808',
        ];

        for (const serverUrl of alternativeServers) {
          try {
            console.log(`🔄 Trying alternative server: ${serverUrl}`);
            const altData = await fetchMyReservations(start, end, token);
            console.log(`✅ Alternative server success: ${serverUrl}`);

            const combinedData = altData.map(reservation => ({
              id: reservation.id,
              tourProgramTitle: reservation.tourProgramTitle,
              guideStartDate: reservation.guideStartDate,
              guideEndDate: reservation.guideEndDate,
              numOfPeople: reservation.numOfPeople,
              requestStatus: reservation.requestStatus as
                | 'ACCEPTED'
                | 'PENDING'
                | 'REJECTED',
              role: reservation.role || 'USER',
              counterpartName: reservation.counterpartName || '',
            }));

            return combinedData;
          } catch (altError) {
            console.log(
              `❌ ${serverUrl} also failed:`,
              (altError as any).message,
            );
          }
        }
      }
    } else {
      console.error('- Error type: Unknown');
      console.error('- Error:', error);
    }

    // 에러가 발생해도 빈 배열 반환 (UI가 깨지지 않도록)
    return [];
  }
};

// 기본 훅 (내 예약 내역 조회)
export default function useGetCalendarReservations(start: string, end: string) {
  return useQuery({
    queryKey: ['calendarReservations', start, end],
    queryFn: () => fetchCalendarReservations(start, end),
    refetchInterval: 50000000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

// 내 예약 내역만 조회하는 훅
export function useGetMyReservations(start: string, end: string) {
  return useQuery({
    queryKey: ['myReservations', start, end],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token || !start || !end) {
        console.log(
          '🚫 API 요청 건너뜀 - token:',
          !!token,
          'start:',
          start,
          'end:',
          end,
        );
        return [];
      }
      console.log('📅 선택된 날짜 API 요청:', {start, end});
      const myReservations = await fetchMyReservations(start, end, token);

      // API 응답을 표준 형식으로 변환하고 취소된 예약 필터링
      return myReservations
        .filter(reservation => {
          // 취소된 예약은 제외
          const isCancelled =
            reservation.requestStatus === 'CANCELLED_BY_USER' ||
            reservation.requestStatus === 'CANCELLED_BY_GUIDE';
          if (isCancelled) {
            console.log(
              `🗑️ 취소된 예약 제외: ${reservation.id} (${reservation.requestStatus})`,
            );
          }
          return !isCancelled;
        })
        .map(reservation => ({
          id: reservation.id || 0,
          tourProgramTitle: reservation.tourProgramTitle || '',
          guideStartDate: reservation.guideStartDate || '',
          guideEndDate: reservation.guideEndDate || '',
          numOfPeople: reservation.numOfPeople || 0,
          requestStatus:
            (reservation.requestStatus as
              | 'ACCEPTED'
              | 'PENDING'
              | 'REJECTED'
              | 'CANCELLED_BY_USER'
              | 'CANCELLED_BY_GUIDE'
              | 'COMPLETED') || 'PENDING',
          role: reservation.role || 'USER',
          counterpartName: reservation.counterpartName || '',
          otherName: reservation.otherName || '', // 백엔드에서 추가된 otherName 필드 사용
          // 상대방 이름 조회를 위한 필드들 추가
          tourProgramId:
            reservation.tourProgramId || reservation.tourProgram?.id || null,
          userId: reservation.userId || reservation.user?.id || null,
          guideId: reservation.guideId || reservation.guide?.id || null,
          userName:
            reservation.userName ||
            reservation.user?.name ||
            reservation.user?.username ||
            '',
          guideName:
            reservation.guideName ||
            reservation.guide?.name ||
            reservation.guide?.username ||
            '',
          requesterName: reservation.requesterName || '',
          guideUserName: reservation.guideUserName || '',
        }));
    },
    enabled: !!(start && end), // start와 end가 있을 때만 쿼리 실행
    refetchInterval: 50000000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

// 캘린더 상태 조회 훅
export function useGetCalendarStatus(start: string, end: string) {
  return useQuery({
    queryKey: ['calendarStatus', start, end],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return [];
      return await fetchCalendarStatus(start, end, token);
    },
    refetchInterval: 50000000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
