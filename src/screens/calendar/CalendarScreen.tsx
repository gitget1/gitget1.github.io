import React, {useState, useMemo} from 'react';
import {StyleSheet, Text} from 'react-native';
import CalendarHome from './CalendarHome';
import {getMonthYearDetails, getNewMonthYear} from '../../utils/date';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../../constants';
import EventList from './EventList';
import useGetCalendarReservations from './useGetCalendarReservations';
import dayjs from 'dayjs';

function CalendarScreen() {
  const currentMonthYear = getMonthYearDetails(new Date());
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  const today = new Date().getDate();
  const [selectedDate, setSelectedDate] = useState(today);

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

  const {
    data: reservations = [],
    isLoading,
    isError,
  } = useGetCalendarReservations(start, end);

  const handlePressDate = (date: number) => {
    setSelectedDate(date);
  };

  const handleUpdateMonth = (increment: number) => {
    setMonthYear(prev => getNewMonthYear(prev, increment));
  };

  const selectedDateObj = dayjs(
    `${monthYear.year}-${monthYear.month}-${selectedDate}`,
  );

  const selectedDateReservations = reservations.filter(item =>
    selectedDateObj.isBetween(
      item.guideStartDate,
      item.guideEndDate,
      'day',
      '[]',
    ),
  );

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHome
        monthYear={monthYear}
        onChangeMonth={handleUpdateMonth}
        selectedDate={selectedDate}
        onPressDate={handlePressDate}
        reservations={reservations}
      />
      {isLoading && <Text>로딩 중...</Text>}
      {isError && <Text>데이터를 불러오지 못했습니다.</Text>}
      {!isLoading && !isError && <EventList posts={selectedDateReservations} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
});

export default CalendarScreen;
