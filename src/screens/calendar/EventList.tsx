import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {colors} from '../../constants';
import dayjs from 'dayjs';

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
  onStatusChange?: (reservationId: number, newStatus: 'ACCEPTED' | 'PENDING' | 'REJECTED') => void;
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

// ✅ 상태에 따른 한글 텍스트 반환
const getStatusText = (status: Reservation['requestStatus']) => {
  switch (status) {
    case 'ACCEPTED':
      return '예약 성공';
    case 'REJECTED':
      return '예약 거절';
    case 'PENDING':
      return '상담중';
    default:
      return status;
  }
};

function EventList({posts, onStatusChange}: EventListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {posts.map(post => (
          <View key={post.id} style={styles.itemContainer}>
            {/* ✅ 상태에 따라 동적 색상 (왼쪽 세로 막대만) */}
            <View
              style={[
                styles.itemHeader,
                {backgroundColor: getStatusColor(post.requestStatus)},
              ]}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>{post.tourProgramTitle}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>예약자: {post.username}</Text>
                <Text style={styles.detailText}>인원: {post.numOfPeople}명</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  시간: {dayjs(post.guideStartDate).format('HH:mm')} - {dayjs(post.guideEndDate).format('HH:mm')}
                </Text>
              </View>
              {/* 상태 텍스트만 표시, 색상 배지/점 없음 */}
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{getStatusText(post.requestStatus)}</Text>
              </View>
              {/* 상태 변경 버튼 */}
              {onStatusChange && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => onStatusChange(post.id, 'ACCEPTED')}
                  >
                    <Text style={styles.actionButtonText}>승인</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.pendingButton]}
                    onPress={() => onStatusChange(post.id, 'PENDING')}
                  >
                    <Text style={styles.actionButtonText}>상담중</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => onStatusChange(post.id, 'REJECTED')}
                  >
                    <Text style={styles.actionButtonText}>거절</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
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
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailText: {
    color: colors.GRAY_500,
    fontSize: 13,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    color: colors.BLACK,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  pendingButton: {
    backgroundColor: '#facc15',
    borderColor: '#facc15',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    color: colors.WHITE,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default EventList;