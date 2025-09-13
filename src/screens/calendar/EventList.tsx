import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {colors} from '../../constants';
import dayjs from 'dayjs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
const BE_server = 'http://124.60.137.10:8083';

// ✅ 백엔드 Enum 그대로 사용 (오타 FIX: CANCELLED)
type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_GUIDE'
  | 'COMPLETED';

interface Reservation {
  id: number;
  tourProgramTitle: string;
  guideStartDate: string;
  guideEndDate: string;
  username: string;
  numOfPeople: number;
  requestStatus: RequestStatus;
}

interface EventListProps {
  posts: Reservation[];
  onStatusChange?: (reservationId: number, newStatus: RequestStatus) => void;
  onRemoveFromList?: (reservationId: number) => void; // 목록에서 제거하는 콜백
}

// ✅ 토큰을 항상 올바른 형식으로 반환
const getAuthHeader = async () => {
  const raw = await AsyncStorage.getItem('accessToken');
  if (!raw) {
    return undefined;
  }
  const pure = raw.startsWith('Bearer ') ? raw.replace(/^Bearer\s+/i, '') : raw;
  return {Authorization: `Bearer ${pure}`};
};

// ✅ 상태별 색상 (더 선명한 색상으로 변경)
const getStatusColor = (status: RequestStatus) => {
  switch (status) {
    case 'ACCEPTED':
      return '#10b981'; // 더 진한 초록색
    case 'REJECTED':
      return '#dc2626'; // 더 진한 빨간색
    case 'PENDING':
      return '#f59e0b'; // 더 진한 노란색
    case 'CANCELLED_BY_USER':
      return '#2563eb'; // 더 진한 파란색
    case 'CANCELLED_BY_GUIDE':
      return '#7c3aed'; // 더 진한 보라색
    case 'COMPLETED':
      return '#6b7280'; // 더 진한 회색
    default:
      return '#9ca3af'; // 기본 회색
  }
};

// ✅ 상태별 한글 텍스트
const getStatusText = (status: RequestStatus) => {
  switch (status) {
    case 'ACCEPTED':
      return '가이드 승인';
    case 'REJECTED':
      return '가이드 거절';
    case 'PENDING':
      return '예약 대기';
    case 'CANCELLED_BY_USER':
      return '사용자 예약 취소';
    case 'CANCELLED_BY_GUIDE':
      return '가이드 예약 취소';
    case 'COMPLETED':
      return '예약 완료';
    default:
      return status;
  }
};

// ✅ API 호출
async function patchReservationStatus(
  reservationId: number,
  status: RequestStatus,
) {
  const rid = Math.random().toString(36).slice(2, 8);
  const url = `${BE_server}/api/reservations/${reservationId}/status`;

  try {
    const headers = await getAuthHeader();
    console.log(`[RESV][${rid}] → PATCH ${url}`, {params: {status}});

    const started = Date.now();
    const res = await axios.patch<string>(url, null, {
      params: {status},
      headers,
      timeout: 15000,
    });

    console.log(`[RESV][${rid}] ← ${res.status} (${Date.now() - started}ms)`, {
      data: res.data,
    });
    return {ok: true as const, message: res.data};
  } catch (err: any) {
    const statusCode = err?.response?.status;
    const data = err?.response?.data;
    console.log(`[RESV][${rid}] ✖ ERROR`, {
      statusCode,
      data,
      message: err?.message,
    });
    return {
      ok: false as const,
      message: data ?? err?.message ?? 'unknown error',
    };
  }
}

// ✅ 사용자에게 알림 전송
async function sendNotificationToUser(
  reservationId: number,
  status: RequestStatus,
  username: string,
) {
  const rid = Math.random().toString(36).slice(2, 8);
  const url = `${BE_server}/api/notifications/reservation`;

  try {
    const headers = await getAuthHeader();
    const notificationData = {
      reservationId,
      status,
      message: getNotificationMessage(status, username),
    };

    console.log(`[NOTIF][${rid}] → POST ${url}`, notificationData);

    const started = Date.now();
    const res = await axios.post(url, notificationData, {
      headers,
      timeout: 10000,
    });

    console.log(`[NOTIF][${rid}] ← ${res.status} (${Date.now() - started}ms)`, {
      data: res.data,
    });
    return {ok: true as const};
  } catch (err: any) {
    console.log(`[NOTIF][${rid}] ✖ ERROR`, {
      statusCode: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    return {ok: false as const};
  }
}

// ✅ 알림 메시지 생성
function getNotificationMessage(status: RequestStatus, username: string): string {
  switch (status) {
    case 'ACCEPTED':
      return `${username}님의 예약이 승인되었습니다!`;
    case 'REJECTED':
      return `${username}님의 예약이 거절되었습니다.`;
    case 'CANCELLED_BY_GUIDE':
      return `${username}님의 예약이 가이드에 의해 취소되었습니다.`;
    case 'COMPLETED':
      return `${username}님의 예약이 완료되었습니다!`;
    default:
      return `${username}님의 예약 상태가 변경되었습니다.`;
  }
}

function EventList({posts, onStatusChange, onRemoveFromList}: EventListProps) {
  const handlePress = async (
    reservationId: number,
    newStatus: RequestStatus,
    reservation: Reservation,
  ) => {
    console.log('[UI] status change click', {reservationId, newStatus});

    const result = await patchReservationStatus(reservationId, newStatus);

    if (!result.ok) {
      Alert.alert(
        '상태 변경 실패',
        String(result.message ?? '다시 시도해 주세요.'),
      );
      return;
    }

    // 상태별 차별화된 처리
    switch (newStatus) {
      case 'ACCEPTED':
        // 승인: 사용자에게 알림 전송 후 목록에서 제거
        await sendNotificationToUser(reservationId, newStatus, reservation.username);
        Alert.alert(
          '예약 승인 완료',
          `${reservation.username}님의 예약이 승인되었습니다.\n예약자에게 알림이 전송되었습니다.`,
          [
            {
              text: '확인',
              onPress: () => {
                // 목록에서 제거
                onRemoveFromList?.(reservationId);
              },
            },
          ],
        );
        break;

      case 'REJECTED':
        // 거절: 사용자에게 알림 전송 후 목록에서 제거
        await sendNotificationToUser(reservationId, newStatus, reservation.username);
        Alert.alert(
          '예약 거절 완료',
          `${reservation.username}님의 예약이 거절되었습니다.\n예약자에게 알림이 전송되었습니다.`,
          [
            {
              text: '확인',
              onPress: () => {
                // 목록에서 제거
                onRemoveFromList?.(reservationId);
              },
            },
          ],
        );
        break;

      case 'CANCELLED_BY_GUIDE':
        // 가이드 취소: 사용자에게 알림 전송 후 목록에서 제거
        await sendNotificationToUser(reservationId, newStatus, reservation.username);
        Alert.alert(
          '예약 취소 완료',
          `${reservation.username}님의 예약이 취소되었습니다.\n예약자에게 알림이 전송되었습니다.`,
          [
            {
              text: '확인',
              onPress: () => {
                // 목록에서 제거
                onRemoveFromList?.(reservationId);
              },
            },
          ],
        );
        break;

      case 'COMPLETED':
        // 완료: 사용자에게 알림 전송 후 목록에서 제거
        await sendNotificationToUser(reservationId, newStatus, reservation.username);
        Alert.alert(
          '예약 완료',
          `${reservation.username}님의 예약이 완료되었습니다.\n예약자에게 완료 알림이 전송되었습니다.`,
          [
            {
              text: '확인',
              onPress: () => {
                // 목록에서 제거
                onRemoveFromList?.(reservationId);
              },
            },
          ],
        );
        break;

      case 'PENDING':
      case 'CANCELLED_BY_USER':
        // 대기/사용자 취소: 단순 상태 변경만 (목록에 유지)
        Alert.alert(
          '상태 변경 완료',
          `예약 상태가 "${getStatusText(newStatus)}"로 변경되었습니다.`,
        );
        onStatusChange?.(reservationId, newStatus);
        break;

      default:
        // 기본 처리
        onStatusChange?.(reservationId, newStatus);
        break;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        {posts.map(post => (
          <View key={post.id} style={styles.itemContainer}>
            {/* 상태 색상 표시 */}
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
                <Text style={styles.detailText}>
                  인원: {post.numOfPeople}명
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  시간: {dayjs(post.guideStartDate).format('HH:mm')} -{' '}
                  {dayjs(post.guideEndDate).format('HH:mm')}
                </Text>
              </View>

              {/* 상태 텍스트 */}
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  {getStatusText(post.requestStatus)}
                </Text>
              </View>

              {/* COMPLETED가 아닐 때만 버튼 */}
              {post.requestStatus !== 'COMPLETED' && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handlePress(post.id, 'ACCEPTED', post)}>
                    <Text style={styles.actionButtonText}>가이드 승인</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.PENDINGButton]}
                    onPress={() => handlePress(post.id, 'PENDING', post)}>
                    <Text style={styles.actionButtonText}>예약 대기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handlePress(post.id, 'REJECTED', post)}>
                    <Text style={styles.actionButtonText}>가이드 거절</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.userCancelButton]}
                    onPress={() => handlePress(post.id, 'CANCELLED_BY_USER', post)}>
                    <Text style={styles.actionButtonText}>
                      사용자 예약 취소
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.guideCancelButton]}
                    onPress={() => handlePress(post.id, 'CANCELLED_BY_GUIDE', post)}>
                    <Text style={styles.actionButtonText}>
                      가이드 예약 취소
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.COMPLETEDButton]}
                    onPress={() => handlePress(post.id, 'COMPLETED', post)}>
                    <Text style={styles.actionButtonText}>예약 완료</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: colors.WHITE},
  innerContainer: {padding: 20, gap: 20},
  itemContainer: {flexDirection: 'row'},
  itemHeader: {width: 8, height: '100%', marginRight: 12, borderRadius: 4},
  infoContainer: {flex: 1},
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
  detailText: {color: colors.GRAY_500, fontSize: 13},
  statusContainer: {marginTop: 4},
  statusText: {fontSize: 13, color: colors.BLACK, fontWeight: '600'},
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  acceptButton: {backgroundColor: '#10b981', borderColor: '#10b981'},
  PENDINGButton: {backgroundColor: '#f59e0b', borderColor: '#f59e0b'},
  rejectButton: {backgroundColor: '#dc2626', borderColor: '#dc2626'},
  userCancelButton: {backgroundColor: '#2563eb', borderColor: '#2563eb'},
  guideCancelButton: {backgroundColor: '#7c3aed', borderColor: '#7c3aed'},
  COMPLETEDButton: {backgroundColor: '#6b7280', borderColor: '#6b7280'},
  actionButtonText: {color: colors.WHITE, fontSize: 11, fontWeight: '600'},
});

export default EventList;
