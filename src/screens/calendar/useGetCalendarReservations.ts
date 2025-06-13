// hooks/queries/useGetCalendarReservations.ts
import {useQuery} from '@tanstack/react-query';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fetchCalendarReservations = async (start: string, end: string) => {
  const token = await AsyncStorage.getItem('accessToken'); // 비동기 토큰 로딩
  const {data} = await axios.get(
    'http://192.168.1.120:8080/api/calendar/my-reservations',
    {
      params: {start, end},
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
  return data;
};
export default function useGetCalendarReservations(start: string, end: string) {
  return useQuery({
    queryKey: ['calendarReservations', start, end],
    queryFn: () => fetchCalendarReservations(start, end),
    refetchInterval: 50000000, // ✅ 5초마다 자동 새로고침
    refetchOnWindowFocus: true, // 앱 복귀 시 refetch
    staleTime: 0, // ✅ 항상 최신 데이터 유지
  });
}

const userName = 'user1';
// const userId = generateUserId();
console.log('Generated User ID:', userName);
