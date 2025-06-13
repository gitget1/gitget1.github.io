import React from 'react';
import {Dimensions, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../../constants';

interface Reservation {
  requestStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

interface DateBoxProps {
  date: number;
  selectedDate: number;
  onPressDate: (date: number) => void;
  isToday: boolean;
  schedules: Reservation[]; // 여러 예약
}

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;
const calendarHeight = deviceHeight * 0.6;

// ✅ 예약 상태별 색상
const getBarColor = (status: Reservation['requestStatus']) => {
  switch (status) {
    case 'ACCEPTED':
      return '#22c55e'; // 초록
    case 'PENDING':
      return '#facc15'; // 노랑
    case 'REJECTED':
      return '#ef4444'; // 빨강
    default:
      return colors.GRAY_200;
  }
};

function DateBox({
  date,
  selectedDate,
  onPressDate,
  isToday,
  schedules,
}: DateBoxProps) {
  return (
    <Pressable style={styles.Container} onPress={() => onPressDate(date)}>
      {date > 0 && (
        <>
          <View
            style={[
              styles.dateContainer,
              selectedDate === date && styles.selectedContainer,
              selectedDate === date && isToday && styles.selectedTodayContainer,
            ]}>
            <Text
              style={[
                styles.dateText,
                isToday && styles.todayText,
                selectedDate === date && styles.selectedDateText,
              ]}>
              {date}
            </Text>
          </View>

          {/* ✅ 예약 수만큼 bar 표시 (상태별 색상) */}
          <View style={styles.barsContainer}>
            {schedules.slice(0, 3).map((res, idx) => (
              <View
                key={idx}
                style={[
                  styles.bar,
                  {backgroundColor: getBarColor(res.requestStatus)},
                ]}
              />
            ))}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  Container: {
    width: deviceWidth / 7,
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
  barsContainer: {
    marginTop: 2,
    gap: 1,
  },
  bar: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});

export default DateBox;