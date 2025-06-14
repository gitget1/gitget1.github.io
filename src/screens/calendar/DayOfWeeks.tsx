import React from 'react';
import {StyleSheet, View, Text, Dimensions} from 'react-native';
import {colors} from '../../constants';
import {useTranslation} from 'react-i18next';

function DayOfWeeks() {
  const {t} = useTranslation();
  const dayOfWeekKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  return (
    <View style={styles.container}>
      {dayOfWeekKeys.map((dayKey, i) => {
        const dayOfWeek = t(dayKey);
        return (
          <View key={i} style={styles.item}>
            <Text
              style={[
                styles.text,
                dayKey === 'saturday' && styles.saturdayText,
                dayKey === 'sunday' && styles.sundayText,
              ]}>
              {dayOfWeek}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  item: {
    width: Dimensions.get('window').width / 7,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: colors.BLACK,
  },
  saturdayText: {
    color: colors.BLUE_500,
  },
  sundayText: {
    color: colors.RED_500,
  },
});

export default DayOfWeeks;
