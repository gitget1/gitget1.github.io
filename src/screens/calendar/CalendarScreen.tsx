import React, {useState, useMemo} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, ScrollView} from 'react-native';
import CalendarHome from './CalendarHome';
import {getMonthYearDetails, getNewMonthYear} from '../../utils/date';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../../constants';
import EventList from './EventList';
// import useGetCalendarReservations from './useGetCalendarReservations';
import dayjs from 'dayjs';
import {useTranslation} from 'react-i18next';

function CalendarScreen() {
  const {t} = useTranslation();
  const currentMonthYear = getMonthYearDetails(new Date());
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  const today = new Date().getDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStatus, setSelectedStatus] = useState<'rejected' | 'success' | 'consulting' | null>(null);

  const start = useMemo(
    () =>
      dayjs(`${monthYear.year}-${monthYear.month}-01`)
        .startOf('week')
        .format('YYYY-MM-DD[T]00:00:00'),
    [monthYear],
  );

  const end = useMemo(
    () =>
      dayjs(`${monthYear.year}-${monthYear.month}-01`)
        .endOf('month')
        .endOf('week')
        .format('YYYY-MM-DD[T]23:59:59'),
    [monthYear],
  );

  // API 요청 제거하고 더미 데이터만 사용
  const apiReservations: any[] = [];
  const isLoading = false;
  const isError = false;

  // 7월 중간에 더미 데이터 추가
  const [dummyReservations, setDummyReservations] = useState([
    {
      id: 1,
      tourProgramTitle: '아산과 함께 자연을',
      guideStartDate: '2025-07-15T09:00:00',
      guideEndDate: '2025-07-15T18:00:00',
      requestStatus: 'PENDING',
      username: '김민성',
      numOfPeople: 4,
    },
    {
      id: 2,
      tourProgramTitle: '아산과 함께 자연을',
      guideStartDate: '2025-07-22T10:00:00',
      guideEndDate: '2025-07-22T17:00:00',
      requestStatus: 'PENDING',
      username: '이영희',
      numOfPeople: 2,
    },
    {
      id: 3,
      tourProgramTitle: '아산과 함께 자연을',
      guideStartDate: '2025-07-08T14:00:00',
      guideEndDate: '2025-07-08T16:00:00',
      requestStatus: 'REJECTED',
      username: '박민수',
      numOfPeople: 6,
    },
  ]);

  // API 데이터와 더미 데이터 합치기
  const reservations = [...apiReservations, ...dummyReservations];

  // 디버깅 로그 제거
  // console.log('📅 CalendarScreen Debug:');
  // console.log('- start:', start);
  // console.log('- end:', end);
  // console.log('- reservations:', reservations);
  // console.log('- isLoading:', isLoading);
  // console.log('- isError:', isError);

  const handlePressDate = (date: number) => {
    setSelectedDate(date);
  };

  const handleUpdateMonth = (increment: number) => {
    setMonthYear(prev => getNewMonthYear(prev, increment));
  };

  const handleSetMonthYear = (date: Date) => {
    const newMonthYear = getMonthYearDetails(date);
    setMonthYear(newMonthYear);
  };

  // 예약 상태 변경 함수 (더미 데이터만 사용)
  const handleStatusChange = (reservationId: number, newStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED') => {
    // 더미 데이터 업데이트
    setDummyReservations(prev => 
      prev.map(reservation => 
        reservation.id === reservationId 
          ? {...reservation, requestStatus: newStatus}
          : reservation
      )
    );
    
    // 상태 변경 시 필터 해제 (모든 예약이 보이도록)
    setSelectedStatus(null);
  };

  const selectedDateObj = dayjs(
    `${monthYear.year}-${monthYear.month}-${selectedDate}`,
  );

  const selectedDateReservations = reservations.filter(item => {
    const isDateMatch = selectedDateObj.isBetween(
      item.guideStartDate,
      item.guideEndDate,
      'day',
      '[]',
    );
    
    // 상태 필터링
    if (selectedStatus === null) return isDateMatch;
    
    const statusMap = {
      'rejected': 'REJECTED',
      'success': 'ACCEPTED', 
      'consulting': 'PENDING'
    };
    
    return isDateMatch && item.requestStatus === statusMap[selectedStatus];
  });

  // console.log('- selectedDate:', selectedDate);
  // console.log('- selectedDateObj:', selectedDateObj.format('YYYY-MM-DD'));
  // console.log('- selectedDateReservations:', selectedDateReservations);

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHome
        monthYear={monthYear}
        onChangeMonth={handleUpdateMonth}
        onSetMonthYear={handleSetMonthYear}
        selectedDate={selectedDate}
        onPressDate={handlePressDate}
        reservations={reservations}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* 상태 필터 버튼들 */}
        <View style={styles.statusButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.rejectedButton,
              selectedStatus === 'rejected' && styles.selectedButton
            ]}
            onPress={() => setSelectedStatus(selectedStatus === 'rejected' ? null : 'rejected')}
          >
            <Text style={styles.statusButtonText}>예약 거절</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.successButton,
              selectedStatus === 'success' && styles.selectedButton
            ]}
            onPress={() => setSelectedStatus(selectedStatus === 'success' ? null : 'success')}
          >
            <Text style={styles.statusButtonText}>예약 성공</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              styles.consultingButton,
              selectedStatus === 'consulting' && styles.selectedButton
            ]}
            onPress={() => setSelectedStatus(selectedStatus === 'consulting' ? null : 'consulting')}
          >
            <Text style={styles.statusButtonText}>상담중</Text>
          </TouchableOpacity>
        </View>
        
        {!isLoading && !isError && (
          <>
            {/* 선택된 날짜 정보 */}
            <View style={styles.selectedDateInfo}>
              <Text style={styles.selectedDateTitle}>
                {monthYear.year}년 {monthYear.month}월 {selectedDate}일 예약 현황
              </Text>
              <Text style={styles.selectedDateSubtitle}>
                총 {selectedDateReservations.length}건의 예약
              </Text>
            </View>
            
            {/* 예약 목록 */}
            {selectedDateReservations.length > 0 ? (
              <EventList 
                posts={selectedDateReservations} 
                onStatusChange={handleStatusChange}
              />
            ) : (
              <View style={styles.noReservationContainer}>
                <Text style={styles.noReservationText}>
                  이 날짜에는 예약이 없습니다.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  scrollContainer: {
    flex: 1,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rejectedButton: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  successButton: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  consultingButton: {
    backgroundColor: '#fff8e1',
    borderColor: '#ff9800',
  },
  selectedButton: {
    borderWidth: 2,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectedDateInfo: {
    padding: 15,
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.BLACK,
    marginBottom: 4,
  },
  selectedDateSubtitle: {
    fontSize: 14,
    color: colors.GRAY_500,
  },
  noReservationContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  noReservationText: {
    fontSize: 16,
    color: colors.GRAY_500,
    textAlign: 'center',
  },
  loadingText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: colors.GRAY_500,
  },
  errorText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: colors.PINK_700,
  },
});

export default CalendarScreen;
