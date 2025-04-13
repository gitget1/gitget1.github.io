import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import CalendarHome from './CalendarHome';
import { getMonthYearDetails, getNewMonthYear } from '../../utils/date';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants';
import useGetCalendarPosts from '../../hooks/queries/useGetCalendarPost';
import { CalendarPost, ResponseCalendarPost } from '../../api/post';
import EventList from './EventList';

function CalendarScreen() {
  const currentMonthYear = getMonthYearDetails(new Date());
  const [monthYear, setMonthYear] = useState(currentMonthYear); 
  const today = new Date().getDate();
  const [selectedDate, setSeltectedDate] = useState(today);
  const { data: posts = {} as ResponseCalendarPost, isPending, isError } = useGetCalendarPosts(monthYear.year, monthYear.month);

  if (isPending) return <View style={styles.container}><Text>로딩 중...</Text></View>;
  if (isError) return <View style={styles.container}><Text>에러 발생</Text></View>;

  const groupedSchedules: ResponseCalendarPost = posts;

  const handlePressDate = (date: number) => {
    setSeltectedDate(date);
  };

  const handleUpdateMonth = (increment: number) => {
    setMonthYear(prev => getNewMonthYear(prev, increment));
  };

  return (
    <SafeAreaView style={styles.container}>
      <CalendarHome 
        monthYear={monthYear} 
        onChangeMonth={handleUpdateMonth} 
        selectedDate={selectedDate}
        onPressDate={handlePressDate} 
        schedules={groupedSchedules}
      />
      <EventList posts={groupedSchedules[selectedDate] || []} />
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