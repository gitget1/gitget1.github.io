import React, {useState, useMemo} from 'react';
import {StyleSheet, Text} from 'react-native';
import CalendarHome from './CalendarHome';
import {getMonthYearDetails, getNewMonthYear} from '../../utils/date';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../../constants';
import EventList from './EventList';
import useGetCalendarReservations from './useGetCalendarReservations';
import dayjs from 'dayjs';
import {useTranslation} from 'react-i18next';

function CalendarScreen() {
  const {t} = useTranslation();
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

  // 디버깅 로그 추가
  console.log('📅 CalendarScreen Debug:');
  console.log('- start:', start);
  console.log('- end:', end);
  console.log('- reservations:', reservations);
  console.log('- isLoading:', isLoading);
  console.log('- isError:', isError);

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

  console.log('- selectedDate:', selectedDate);
  console.log('- selectedDateObj:', selectedDateObj.format('YYYY-MM-DD'));
  console.log('- selectedDateReservations:', selectedDateReservations);

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
      {isLoading && <Text>{t('calendarLoading')}</Text>}
      {isError && <Text>{t('dataLoadError')}</Text>}
      {!isLoading && !isError && (
        <>
          <Text style={{padding: 10, fontSize: 12, color: 'gray'}}>
            {t('totalReservations')}: {reservations.length}
            {t('reservationCount')}, {t('selectedDateReservations')}:{' '}
            {selectedDateReservations.length}
            {t('reservationCount')}
          </Text>
          <EventList posts={selectedDateReservations} />
        </>
      )}
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
