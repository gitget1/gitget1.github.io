import React from 'react';
import {Pressable, ScrollView, StyleSheet, View, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors} from '../../constants';

interface Reservation {
  id: number;
  tourProgramTitle: string;
  guideStartDate: string;
  guideEndDate: string;
  username: string;
  numOfPeople: number;
  requestStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED';
}

interface EventListProps {
  posts: Reservation[];
}

// ✅ 상태에 따른 색상 반환
const getStatusColor = (status: Reservation['requestStatus']) => {
  switch (status) {
    case 'ACCEPTED':
      return '#22c55e'; // 초록
    case 'REJECTED':
      return '#ef4444'; // 빨강
    case 'PENDING':
      return '#facc15'; // 노랑
    default:
      return colors.GRAY_200;
  }
};

function EventList({posts}: EventListProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.container} scrollIndicatorInsets={{right: 1}}>
      <View style={[styles.innerContainer, {marginBottom: insets.bottom + 30}]}>
        {posts.map(post => (
          <Pressable key={post.id} style={styles.itemContainer}>
            {/* ✅ 상태에 따라 동적 색상 */}
            <View
              style={[
                styles.itemHeader,
                {backgroundColor: getStatusColor(post.requestStatus)},
              ]}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>{post.tourProgramTitle}</Text>
              <Text style={styles.addressText}>인원: {post.numOfPeople}</Text>
              <Text style={styles.addressText}>{post.requestStatus}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    padding: 20,
  },
  innerContainer: {
    gap: 20,
  },
  itemContainer: {
    flexDirection: 'row',
  },
  itemHeader: {
    width: 6,
    height: 50,
    marginRight: 8,
    borderRadius: 20,
  },
  infoContainer: {
    justifyContent: 'space-evenly',
  },
  addressText: {
    color: colors.GRAY_500,
    fontSize: 13,
  },
  titleText: {
    color: colors.BLACK,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventList;