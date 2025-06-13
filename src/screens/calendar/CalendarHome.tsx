import React, {useState} from 'react';
import {colors} from '../../constants';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DayOfWeeks from './DayOfWeeks';
import {
  isSameAsCurrentDate,
  MonthYear,
  getMonthYearDetails,
} from '../../utils/date';
import {FlatList} from 'react-native-gesture-handler';
import DateBox from './DateBox';
import MiniCalendar from './MiniCalendar';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

interface Reservation {
  guideStartDate: string;
  guideEndDate: string;
  requestStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

interface CalendarHomeProps {
  monthYear: MonthYear;
  selectedDate: number;
  onPressDate: (date: number) => void;
  onChangeMonth: (increment: number) => void;
  reservations: Reservation[];
}

function CalendarHome({
  monthYear,
  onChangeMonth,
  selectedDate,
  onPressDate,
  reservations,
}: CalendarHomeProps) {
  const {month, year, lastDate, firstDOW} = monthYear;
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);

  const handleSelectDate = (date: Date) => {
    const newMonthYear = getMonthYearDetails(date);
    onChangeMonth(newMonthYear.month - month);
    onPressDate(date.getDate());
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <Pressable
          onPress={() => onChangeMonth(-1)}
          style={styles.monthButtonContainer}>
          <Ionicons name="arrow-back" size={25} color={colors.BLACK} />
        </Pressable>
        <Pressable
          style={styles.monthYearContainer}
          onPress={() => setShowMiniCalendar(true)}>
          <Text style={styles.titleText}>
            {year}년 {month}월
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={20}
            color={colors.GRAY_500}
          />
        </Pressable>
        <Pressable
          onPress={() => onChangeMonth(1)}
          style={styles.monthButtonContainer}>
          <Ionicons name="arrow-forward" size={25} color={colors.BLACK} />
        </Pressable>
      </View>

      <DayOfWeeks />
      <View style={styles.bodyContainer}>
        <FlatList
          data={Array.from({length: lastDate + firstDOW}, (_, i) => {
            const day = i - firstDOW + 1;
            const date = new Date(year, month - 1, day);
            const schedules =
              day > 0
                ? reservations.filter(res =>
                    dayjs(date).isBetween(
                      dayjs(res.guideStartDate),
                      dayjs(res.guideEndDate),
                      'day',
                      '[]',
                    ),
                  )
                : [];

            return {
              id: i,
              date: day,
              schedules,
            };
          })}
          renderItem={({item}) => (
            <DateBox
              date={item.date}
              isToday={isSameAsCurrentDate(year, month, item.date)}
              selectedDate={selectedDate}
              onPressDate={onPressDate}
              schedules={item.schedules}
            />
          )}
          keyExtractor={item => String(item.id)}
          numColumns={7}
        />
      </View>

      <MiniCalendar
        visible={showMiniCalendar}
        onClose={() => setShowMiniCalendar(false)}
        onSelectDate={handleSelectDate}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 25,
    marginVertical: 16,
  },
  monthYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  monthButtonContainer: {
    padding: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.BLACK,
  },
  bodyContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.GRAY_500,
    backgroundColor: colors.GRAY_200,
  },
});

export default CalendarHome;
