import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants';

interface DateBoxProps {
  date: number;
  selectedDate: number;
  onPressDate: (date: number) => void;
  isToday: boolean;
  hasSchedule: boolean;
}

const devicewidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;
const calendarHeight = deviceHeight * 0.6;

function DateBox({ date, selectedDate, hasSchedule, onPressDate, isToday }: DateBoxProps) {
  return (
    <Pressable style={styles.Container} onPress={() => onPressDate(date)}>
      {date > 0 && (
        <>
          <View
            style={[
              styles.dateContainer,
              selectedDate === date && styles.selectedContainer,
              selectedDate === date && isToday && styles.selectedTodayContainer,
            ]}
          >
            <Text
              style={[
                styles.dateText,
                isToday && styles.todayText,
                selectedDate === date && styles.selectedDateText,
              ]}
            >
              {date}
            </Text>
          </View>
          {/* {hasSchedule && <View style={styles.scheduleIndicator}/>} */}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  Container: {
    width: devicewidth / 7,
    height: calendarHeight / 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.GRAY_200,
    alignItems: 'center',
  },
  dateContainer: {
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedContainer: {
    backgroundColor: colors.BLACK,
  },
  dateText: {
    fontSize: 17,
    color: colors.BLACK,
    textAlign: 'center',
    lineHeight: 28,
  },
  selectedDateText: {
    color: colors.WHITE,
    fontWeight: 'bold',
  },
  todayText: {
    color: colors.PINK_700,
    fontWeight: 'bold',
  },
  selectedTodayContainer: {
    backgroundColor: colors.PINK_700,
  },
  scheduleIndicator: {
    marginTop: 2,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.GRAY_500,
  },
});

export default DateBox;
