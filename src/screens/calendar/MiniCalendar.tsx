import React, {useState, useMemo, useEffect} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import {colors} from '../../constants';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface MiniCalendarProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const MiniCalendar = ({visible, onClose, onSelectDate}: MiniCalendarProps) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());

  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);

  // 연도 목록 (현재 연도 기준 ±10년)
  const years = Array.from(
    {length: 21},
    (_, i) => currentDate.getFullYear() - 10 + i,
  );

  // 월 목록
  const months = Array.from({length: 12}, (_, i) => i + 1);

  // 선택된 연도/월에 따른 일 목록
  const getDaysInMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => i + 1);
  };

  const days = useMemo(() => {
    return getDaysInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // 디버깅용 - 상태 변경 감지
  useEffect(() => {
    console.log(
      '📅 상태 변경 - 연도:',
      selectedYear,
      '월:',
      selectedMonth,
      '일:',
      selectedDay,
    );
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    onSelectDate(selectedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.calendarContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>날짜 선택</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.BLACK} />
            </TouchableOpacity>
          </View>

          <View style={styles.dropdownContainer}>
            {/* 연도 선택 */}
            <View style={styles.dropdownSection}>
              <Text style={styles.label}>연도</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowYearDropdown(!showYearDropdown)}>
                <Text style={styles.dropdownText} key={selectedYear}>
                  {selectedYear}년
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.GRAY_500}
                />
              </TouchableOpacity>
              {showYearDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={styles.dropdownItem}
                      onPress={() => {
                        console.log(
                          '🗓️ 연도 선택:',
                          year,
                          '현재 연도:',
                          selectedYear,
                        );
                        setShowYearDropdown(false);
                        // 상태 업데이트를 다음 렌더 사이클에서 실행
                        setTimeout(() => {
                          setSelectedYear(year);
                          // 연도가 바뀌면 일도 해당 연도/월의 범위로 조정
                          const maxDays = getDaysInMonth(year, selectedMonth);
                          if (selectedDay > maxDays.length) {
                            setSelectedDay(maxDays.length);
                          }
                        }, 0);
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          year === selectedYear && styles.selectedText,
                        ]}>
                        {year}년
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* 월 선택 */}
            <View style={styles.dropdownSection}>
              <Text style={styles.label}>월</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowMonthDropdown(!showMonthDropdown)}>
                <Text style={styles.dropdownText}>{selectedMonth}월</Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.GRAY_500}
                />
              </TouchableOpacity>
              {showMonthDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {months.map(month => (
                    <TouchableOpacity
                      key={month}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedMonth(month);
                        setShowMonthDropdown(false);
                        // 월이 바뀌면 일도 해당 월의 범위로 조정
                        const maxDay = getDaysInMonth(selectedYear, month);
                        if (selectedDay > maxDay.length) {
                          setSelectedDay(maxDay.length);
                        }
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          month === selectedMonth && styles.selectedText,
                        ]}>
                        {month}월
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* 일 선택 */}
            <View style={styles.dropdownSection}>
              <Text style={styles.label}>일</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDayDropdown(!showDayDropdown)}>
                <Text style={styles.dropdownText}>{selectedDay}일</Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.GRAY_500}
                />
              </TouchableOpacity>
              {showDayDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {days.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedDay(day);
                        setShowDayDropdown(false);
                      }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          day === selectedDay && styles.selectedText,
                        ]}>
                        {day}일
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
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
    padding: 20,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.BLACK,
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.BLACK,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.GRAY_500,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.WHITE,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.BLACK,
  },
  dropdownList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: colors.GRAY_500,
    borderRadius: 8,
    backgroundColor: colors.WHITE,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_200,
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.BLACK,
  },
  selectedText: {
    color: colors.BLUE_500,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.GRAY_500,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.GRAY_700,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.BLUE_500,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.WHITE,
    fontWeight: '600',
  },
});

export default MiniCalendar;
