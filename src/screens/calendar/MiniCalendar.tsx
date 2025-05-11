import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../../constants';
import { getMonthYearDetails, getNewMonthYear } from '../../utils/date';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface MiniCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const MiniCalendar = ({ visible, onClose, onSelectDate }: MiniCalendarProps) => {
  const currentDate = new Date();
  const [monthYear, setMonthYear] = useState(getMonthYearDetails(currentDate));
  const { month, year, lastDate, firstDOW } = monthYear;

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const handleChangeMonth = (increment: number) => {
    setMonthYear(prev => getNewMonthYear(prev, increment));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.calendarContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => handleChangeMonth(-1)}>
              <Ionicons name="arrow-back" size={24} color={colors.BLACK} />
            </TouchableOpacity>
            <Text style={styles.title}>{year}년 {month}월</Text>
            <TouchableOpacity onPress={() => handleChangeMonth(1)}>
              <Ionicons name="arrow-forward" size={24} color={colors.BLACK} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysContainer}>
            {days.map((day, index) => (
              <Text key={day} style={[styles.dayText, index === 0 && styles.sunday]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.datesContainer}>
            {Array.from({ length: lastDate + firstDOW }, (_, i) => {
              const date = i - firstDOW + 1;
              if (date < 1) {
                return <View key={i} style={styles.dateBox} />;
              }
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.dateBox}
                  onPress={() => {
                    onSelectDate(new Date(year, month - 1, date));
                    onClose();
                  }}
                >
                  <Text style={[
                    styles.dateText,
                    i % 7 === 0 && styles.sunday,
                    date === currentDate.getDate() &&
                    month === currentDate.getMonth() + 1 &&
                    year === currentDate.getFullYear() &&
                    styles.today
                  ]}>
                    {date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 350,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.BLACK,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: colors.GRAY_500,
  },
  sunday: {
    color: colors.RED_500,
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateBox: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: colors.BLACK,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
  },
  today: {
    backgroundColor: colors.BLUE_500,
    color: colors.WHITE,
  },
});

export default MiniCalendar; 