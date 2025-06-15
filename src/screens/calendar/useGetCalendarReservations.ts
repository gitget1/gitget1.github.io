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
}

const fetchCalendarReservations = async (start: string, end: string) => {
  const token = await AsyncStorage.getItem('accessToken');

  console.log('🔍 API Request Debug:');
  console.log('- token:', token ? 'exists' : 'missing');
  console.log('- start:', start);
  console.log('- end:', end);

  try {
    // 1. 먼저 간단한 API 테스트
    console.log('🔄 Testing server connection...');

    // 2. 예약 상세 내역 조회 먼저 시도 (기존에 작동했던 API)
    console.log('📋 Fetching reservation details...');
    const reservationsResponse = await axios.get(
      'http://124.60.137.10:80/api/calendar/my-reservations',
      {
        params: {start, end},
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10초 타임아웃
      },
    );

    console.log('✅ Reservations API Success!');
    const reservationDetails: ReservationCalendarDTO[] =
      reservationsResponse.data || [];
    console.log('- Reservation details:', reservationDetails);
    console.log('- Reservations count:', reservationDetails.length);

    // 실제 API 데이터 구조 분석
    if (reservationDetails.length > 0) {
      console.log('🔍 Analyzing real API data structure:');
      console.log('- First item:', reservationDetails[0]);
      console.log('- First item keys:', Object.keys(reservationDetails[0]));
      console.log(
        '- guideStartDate type:',
        typeof reservationDetails[0].guideStartDate,
      );
      console.log(
        '- guideEndDate type:',
        typeof reservationDetails[0].guideEndDate,
      );
      console.log(
        '- requestStatus value:',
        reservationDetails[0].requestStatus,
      );
      console.log(
        '- requestStatus type:',
        typeof reservationDetails[0].requestStatus,
      );
    } else {
      console.log('⚠️ No real API data found');
      console.log('🔍 Raw API response structure:');
      console.log('- Response data:', reservationsResponse.data);
      console.log('- Response status:', reservationsResponse.status);
      console.log('- Response headers:', reservationsResponse.headers);
    }

    // 테스트용: 실제 데이터가 없으면 샘플 데이터 추가
    let finalReservationDetails = reservationDetails;
    if (reservationDetails.length === 0) {
      console.log('📝 No real data found, using empty array');
    }

    // 3. 달력 상태 조회 (선택적) - 서버에 엔드포인트가 있으므로 다시 시도
    let calendarStatus: CalendarStatusDTO[] = [];
    try {
      console.log('📅 Fetching calendar status...');
      const statusResponse = await axios.get(
        'http://124.60.137.10:80/api/calendar/status',
        {
          params: {
            start: start.split('T')[0], // LocalDate 형식 (YYYY-MM-DD)
            end: end.split('T')[0],
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      calendarStatus = statusResponse.data || [];
      console.log('✅ Status API Success!');
      console.log('- Calendar status:', calendarStatus);
      console.log('- Status count:', calendarStatus.length);
    } catch (statusError) {
      console.error('❌ Status API failed:', statusError);
      if (axios.isAxiosError(statusError)) {
        console.error('- Status error code:', statusError.response?.status);
        console.error('- Status error data:', statusError.response?.data);
        console.error('- Status error message:', statusError.message);
      }
      console.warn('⚠️ Continuing with reservations only');
    }

    // ReservationCalendarDTO 형식으로 통합하여 반환
    const combinedData = finalReservationDetails.map(reservation => ({
      id: reservation.id || 0,
      tourProgramTitle: reservation.tourProgramTitle || '',
      guideStartDate: reservation.guideStartDate || '',
      guideEndDate: reservation.guideEndDate || '',
      username: '', // 서버에서 제공하지 않음
      numOfPeople: reservation.numOfPeople || 0,
      requestStatus:
        (reservation.requestStatus as 'ACCEPTED' | 'PENDING' | 'REJECTED') ||
        'PENDING',
    }));

    console.log('✅ Combined data:', combinedData);
    console.log('✅ Combined data length:', combinedData.length);
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
          'http://124.60.137.10:80',
          'http://192.168.1.120:8080',
        ];

        for (const serverUrl of alternativeServers) {
          try {
            console.log(`🔄 Trying alternative server: ${serverUrl}`);
            const altResponse = await axios.get(
              `${serverUrl}/api/calendar/my-reservations`,
              {
                params: {start, end},
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                timeout: 5000,
              },
            );

            console.log(`✅ Alternative server success: ${serverUrl}`);
            const altData: ReservationCalendarDTO[] = altResponse.data || [];

            const combinedData = altData.map(reservation => ({
              id: reservation.id,
              tourProgramTitle: reservation.tourProgramTitle,
              guideStartDate: reservation.guideStartDate,
              guideEndDate: reservation.guideEndDate,
              username: '',
              numOfPeople: reservation.numOfPeople,
              requestStatus: reservation.requestStatus as
                | 'ACCEPTED'
                | 'PENDING'
                | 'REJECTED',
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

export default function useGetCalendarReservations(start: string, end: string) {
  return useQuery({
    queryKey: ['calendarReservations', start, end],
    queryFn: () => fetchCalendarReservations(start, end),
    refetchInterval: 50000000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
