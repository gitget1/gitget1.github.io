import React, {useState, useMemo, useEffect} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, ScrollView} from 'react-native';
import CalendarHome from './CalendarHome';
import {getMonthYearDetails, getNewMonthYear} from '../../utils/date';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../../constants';
import EventList from './EventList';
import { 
  useGetMyReservations
} from './useGetCalendarReservations';
import dayjs from 'dayjs';
import {useTranslation} from 'react-i18next';

function CalendarScreen() {
  const {t} = useTranslation();
  const currentMonthYear = getMonthYearDetails(new Date());
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  const today = new Date().getDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStatus, setSelectedStatus] = useState<'rejected' | 'success' | 'consulting' | null>(null);
  const [selectedDateString, setSelectedDateString] = useState<string>('');

  // 초기 로딩 시 오늘 날짜를 자동으로 선택
  useEffect(() => {
    const todayStr = `${currentMonthYear.year}-${String(currentMonthYear.month).padStart(2, '0')}-${String(today).padStart(2, '0')}`;
    setSelectedDateString(todayStr);
    console.log('📅 초기 날짜 설정:', todayStr);
  }, []);

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

  // 선택된 날짜의 예약 데이터 조회
  const selectedDateStart = useMemo(() => {
    if (!selectedDateString) return '';
    return dayjs(selectedDateString).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
  }, [selectedDateString]);

  const selectedDateEnd = useMemo(() => {
    if (!selectedDateString) return '';
    return dayjs(selectedDateString).endOf('day').format('YYYY-MM-DDTHH:mm:ss');
  }, [selectedDateString]);

  // 선택된 날짜의 예약 데이터 조회 (날짜가 선택되었을 때만)
  const { 
    data: selectedDateReservations = [], 
    isLoading: isSelectedDateLoading, 
    isError: isSelectedDateError,
    refetch: refetchSelectedDate
  } = useGetMyReservations(selectedDateStart, selectedDateEnd);

  // 디버깅을 위한 로그
  useEffect(() => {
    if (selectedDateString) {
      console.log('📊 선택된 날짜 예약 데이터:', {
        selectedDateString,
        selectedDateStart,
        selectedDateEnd,
        reservations: selectedDateReservations,
        reservationsCount: selectedDateReservations.length,
        isLoading: isSelectedDateLoading,
        isError: isSelectedDateError
      });
      
      // 각 예약의 날짜 정보도 로그로 출력
      selectedDateReservations.forEach((reservation, index) => {
        console.log(`📅 예약 ${index + 1}:`, {
          id: reservation.id,
          title: reservation.tourProgramTitle,
          startDate: reservation.guideStartDate,
          endDate: reservation.guideEndDate,
          role: reservation.role,
          counterpartName: reservation.counterpartName
        });
      });
    }
  }, [selectedDateString, selectedDateReservations, isSelectedDateLoading, isSelectedDateError]);

  // 월별 예약 데이터는 캘린더 표시용으로만 사용 (실제 예약 목록에는 사용하지 않음)
  const { 
    data: monthlyReservations = [], 
    isLoading: isMonthlyLoading, 
    isError: isMonthlyError,
    refetch: refetchMonthly
  } = useGetMyReservations(start, end);

  // 월별 예약 데이터 디버깅 로그
  useEffect(() => {
    console.log('📅 월별 예약 데이터 디버깅 (캘린더 표시용):', {
      start,
      end,
      monthlyReservations,
      monthlyReservationsCount: monthlyReservations.length,
      isLoading: isMonthlyLoading,
      isError: isMonthlyError
    });
  }, [start, end, monthlyReservations, isMonthlyLoading, isMonthlyError]);

  // 캘린더 표시용 예약 데이터 (실제 예약 목록에는 사용하지 않음)
  const reservations = monthlyReservations;

  // 디버깅 로그 제거
  // console.log('📅 CalendarScreen Debug:');
  // console.log('- start:', start);
  // console.log('- end:', end);
  // console.log('- reservations:', reservations);
  // console.log('- isLoading:', isLoading);
  // console.log('- isError:', isError);

  const handlePressDate = (date: number) => {
    setSelectedDate(date);
    // 선택된 날짜를 문자열로 변환하여 API 요청용으로 설정
    const selectedDateStr = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    setSelectedDateString(selectedDateStr);
    console.log('📅 날짜 선택됨:', selectedDateStr);
    console.log('📅 API 요청 파라미터:', {
      start: selectedDateStart,
      end: selectedDateEnd
    });
  };

  const handleUpdateMonth = (increment: number) => {
    setMonthYear(prev => {
      const newMonthYear = getNewMonthYear(prev, increment);
      // 월이 변경되면 선택된 날짜도 업데이트
      const newSelectedDateStr = `${newMonthYear.year}-${String(newMonthYear.month).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      setSelectedDateString(newSelectedDateStr);
      console.log('📅 월 변경으로 인한 날짜 업데이트:', newSelectedDateStr);
      return newMonthYear;
    });
  };

  const handleSetMonthYear = (date: Date) => {
    const newMonthYear = getMonthYearDetails(date);
    setMonthYear(newMonthYear);
    // 미니 캘린더에서 날짜 선택 시에도 업데이트
    const newSelectedDateStr = `${newMonthYear.year}-${String(newMonthYear.month).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    setSelectedDateString(newSelectedDateStr);
    console.log('📅 미니 캘린더에서 날짜 업데이트:', newSelectedDateStr);
  };

  // 예약 상태 변경 함수
  const handleStatusChange = async (reservationId: number, newStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'CANCELLED_BY_USER' | 'CANCELLED_BY_GUIDE' | 'COMPLETED') => {
    // 상태 변경 시 필터 해제 (모든 예약이 보이도록)
    setSelectedStatus(null);
    
    // 즉시 데이터 새로고침
    console.log('🔄 예약 상태 변경 후 데이터 새로고침 시작');
    try {
      await Promise.all([
        refetchSelectedDate(), // 선택된 날짜 데이터 새로고침
        refetchMonthly()       // 월별 데이터 새로고침 (캘린더 막대기 바 업데이트)
      ]);
      console.log('✅ 데이터 새로고침 완료');
    } catch (error) {
      console.error('❌ 데이터 새로고침 실패:', error);
    }
  };

  // 선택된 날짜의 예약 데이터 필터링
  const filteredSelectedDateReservations = selectedDateReservations.filter(item => {
    // 날짜 필터링 (클라이언트에서 추가 필터링)
    if (selectedDateString) {
      const selectedDate = dayjs(selectedDateString);
      const itemStartDate = dayjs(item.guideStartDate);
      const itemEndDate = dayjs(item.guideEndDate);
      
      // 예약이 선택된 날짜와 겹치는지 확인
      const isOnSelectedDate = itemStartDate.isSame(selectedDate, 'day') || 
                               itemEndDate.isSame(selectedDate, 'day') ||
                               (itemStartDate.isBefore(selectedDate, 'day') && itemEndDate.isAfter(selectedDate, 'day'));
      
      if (!isOnSelectedDate) {
        console.log(`❌ 예약 ${item.id} 필터링됨:`, {
          selectedDate: selectedDate.format('YYYY-MM-DD'),
          itemStartDate: itemStartDate.format('YYYY-MM-DD'),
          itemEndDate: itemEndDate.format('YYYY-MM-DD'),
          isOnSelectedDate
        });
        return false;
      }
      
      console.log(`✅ 예약 ${item.id} 포함됨:`, {
        selectedDate: selectedDate.format('YYYY-MM-DD'),
        itemStartDate: itemStartDate.format('YYYY-MM-DD'),
        itemEndDate: itemEndDate.format('YYYY-MM-DD'),
        title: item.tourProgramTitle
      });
    }
    
    // 상태 필터링
    if (selectedStatus === null) return true;
    
    const statusMap = {
      'rejected': 'REJECTED',
      'success': 'ACCEPTED', 
      'consulting': 'PENDING'
    };
    
    return item.requestStatus === statusMap[selectedStatus];
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
        
        {/* 선택된 날짜 정보 */}
        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateTitle}>
            {monthYear.year}년 {monthYear.month}월 {selectedDate}일 예약 현황
          </Text>
          <Text style={styles.selectedDateSubtitle}>
            {selectedDateString ? `선택된 날짜: ${selectedDateString} (총 ${filteredSelectedDateReservations.length}건의 예약)` : '날짜를 선택해주세요'}
          </Text>
        </View>
        
        {/* 로딩 상태 */}
        {isSelectedDateLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>예약 데이터를 불러오는 중...</Text>
          </View>
        )}
        
        {/* 에러 상태 */}
        {isSelectedDateError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>예약 데이터를 불러오는데 실패했습니다.</Text>
          </View>
        )}
        
        {/* 예약 목록 */}
        {!isSelectedDateLoading && !isSelectedDateError && selectedDateString && (
          <>
            {filteredSelectedDateReservations.length > 0 ? (
              <>
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>
                    📅 선택된 날짜: {selectedDateString}
                  </Text>
                  <Text style={styles.debugText}>
                    📊 서버에서 받은 예약 수: {selectedDateReservations.length}건
                  </Text>
                  <Text style={styles.debugText}>
                    📊 필터링 후 표시할 예약 수: {filteredSelectedDateReservations.length}건
                  </Text>
                </View>
                <EventList 
                  posts={filteredSelectedDateReservations} 
                  onStatusChange={handleStatusChange}
                />
              </>
            ) : (
              <View style={styles.noReservationContainer}>
                <Text style={styles.noReservationText}>
                  📅 {selectedDateString}에는 예약이 없습니다.
                </Text>
                <Text style={styles.noReservationSubText}>
                  다른 날짜를 선택해보세요.
                </Text>
              </View>
            )}
          </>
        )}
        
        {/* 날짜 미선택 상태 */}
        {!selectedDateString && (
          <View style={styles.noReservationContainer}>
            <Text style={styles.noReservationText}>
              캘린더에서 날짜를 선택하면 해당 날짜의 예약을 확인할 수 있습니다.
            </Text>
          </View>
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
    backgroundColor: '#90EE90',
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
    color: '#000000',
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
    color: '#000000',
    marginBottom: 4,
  },
  selectedDateSubtitle: {
    fontSize: 14,
    color: '#000000',
  },
  noReservationContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  noReservationText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  errorText: {
    fontSize: 16,
    color: colors.PINK_700,
    textAlign: 'center',
  },
  debugInfo: {
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#228B22',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 2,
  },
  noReservationSubText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CalendarScreen;
