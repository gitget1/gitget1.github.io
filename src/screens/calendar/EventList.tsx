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
import {useQueryClient} from '@tanstack/react-query';
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
  numOfPeople: number;
  requestStatus: RequestStatus;
  role: string; // "GUIDE" or "USER"
  counterpartName: string;
  otherName: string; // 백엔드에서 추가된 필드
  // 상대방 이름 조회를 위한 필드들
  tourProgramId?: number | null;
  userId?: number | null;
  guideId?: number | null;
  userName?: string;
  guideName?: string;
  requesterName?: string;
  guideUserName?: string;
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

// ✅ 사용자 정보 가져오기 함수
const fetchUserInfo = async (userId: number) => {
  if (!userId || userId <= 0) {
    console.warn('⚠️ 유효하지 않은 사용자 ID:', userId);
    return null;
  }
  
  try {
    const headers = await getAuthHeader();
    if (!headers) {
      console.warn('⚠️ 인증 헤더를 가져올 수 없음');
      return null;
    }
    
    console.log(`🔍 사용자 ${userId} 정보 조회 중...`);
    const response = await axios.get(`${BE_server}/api/user/${userId}`, {
      headers,
      timeout: 5000,
    });
    
    const userData = response.data?.data || response.data;
    console.log(`✅ 사용자 ${userId} 정보 조회 성공:`, userData?.name || userData?.username);
    return userData;
  } catch (error) {
    console.error(`❌ 사용자 ${userId} 정보 가져오기 실패:`, error);
    return null;
  }
};


// ✅ 상대방 이름 가져오기 함수 (otherName 필드 우선 사용)
const getCounterpartName = async (reservation: Reservation): Promise<string> => {
  console.log('🔍 예약 정보 분석:', {
    reservationId: reservation.id,
    role: reservation.role,
    userId: reservation.userId,
    guideId: reservation.guideId,
    tourProgramId: reservation.tourProgramId,
    tourProgramTitle: reservation.tourProgramTitle,
    counterpartName: reservation.counterpartName,
    otherName: reservation.otherName
  });
  
  // 백엔드에서 제공하는 otherName 필드를 최우선으로 사용
  if (reservation.otherName && reservation.otherName.trim() !== '') {
    console.log('✅ otherName 필드에서 이름 발견:', reservation.otherName);
    return reservation.otherName;
  }
  
  // 기존 필드들에서 찾기 (fallback)
  const possibleNames = [
    reservation.counterpartName,
    reservation.userName,
    reservation.requesterName,
    reservation.guideUserName,
    reservation.guideName
  ];
  
  const existingName = possibleNames.find(name => name && name.trim() !== '');
  if (existingName) {
    console.log('✅ 기존 필드에서 이름 발견:', existingName);
    return existingName;
  }
  
  // user_id와 guide_id를 사용해서 상대방 이름 조회
  if (reservation.role === 'USER') {
    // 예약자 입장: 가이드가 상대방
    if (reservation.guideId) {
      console.log('🔍 예약자 입장: 가이드 이름 조회 시도...', reservation.guideId);
      const guideInfo = await fetchUserInfo(reservation.guideId);
      if (guideInfo) {
        const guideName = guideInfo.name || guideInfo.username || '가이드';
        console.log('✅ 가이드 이름 조회 완료:', guideName);
        return guideName;
      }
    }
    
    // guideId가 없으면 투어 프로그램 작성자 정보로 대체
    if (reservation.tourProgramId) {
      console.log('🔍 예약자 입장: 투어 프로그램 작성자 조회 시도...', reservation.tourProgramId);
      try {
        const headers = await getAuthHeader();
        if (headers) {
          const response = await axios.get(`${BE_server}/api/tour-program/${reservation.tourProgramId}`, {
            headers,
            timeout: 5000,
          });
          
          const program = response.data?.data || response.data;
          if (program && program.userId) {
            console.log(`✅ 투어 프로그램 작성자 ID: ${program.userId}`);
            const authorInfo = await fetchUserInfo(program.userId);
            if (authorInfo) {
              const authorName = authorInfo.name || authorInfo.username || '가이드';
              console.log('✅ 투어 프로그램 작성자 이름 조회 완료:', authorName);
              return authorName;
            }
          }
        }
      } catch (error) {
        console.error('❌ 투어 프로그램 작성자 조회 실패:', error);
      }
    }
  } else if (reservation.role === 'GUIDE') {
    // 가이드 입장: 예약자가 상대방
    if (reservation.userId) {
      console.log('🔍 가이드 입장: 예약자 이름 조회 시도...', reservation.userId);
      const userInfo = await fetchUserInfo(reservation.userId);
      if (userInfo) {
        const userName = userInfo.name || userInfo.username || '예약자';
        console.log('✅ 예약자 이름 조회 완료:', userName);
        return userName;
      }
    }
    
    // userId가 없으면 기본값 사용 (서버에서 예약자 정보를 제공하지 않음)
    console.log('⚠️ 가이드 입장: 예약자 정보가 없어 기본값 사용');
  }
  
  console.log('⚠️ 이름을 찾을 수 없어 기본값 사용');
  return reservation.role === 'GUIDE' ? '예약자' : '가이드';
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

// ✅ 예약 데이터에서 역할 확인 함수 (새로운 DTO 구조 사용)
const getUserRoleFromReservation = (reservation: Reservation) => {
  return reservation.role || 'USER';
};

// ✅ 상태별 한글 텍스트 (역할 포함)
const getStatusText = (status: RequestStatus, role: string) => {
  const isGuide = role === 'GUIDE';
  
  switch (status) {
    case 'ACCEPTED':
      return isGuide ? '내가 승인한 예약' : '가이드가 승인한 예약';
    case 'REJECTED':
      return isGuide ? '내가 거절한 예약' : '가이드가 거절한 예약';
    case 'PENDING':
      return isGuide ? '내가 받은 예약 (대기중)' : '내가 한 예약 (대기중)';
    case 'CANCELLED_BY_USER':
      return isGuide ? '사용자가 취소한 예약' : '내가 취소한 예약';
    case 'CANCELLED_BY_GUIDE':
      return isGuide ? '내가 취소한 예약' : '가이드가 취소한 예약';
    case 'COMPLETED':
      return isGuide ? '내가 완료한 예약' : '내가 완료한 예약';
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


function EventList({posts, onStatusChange, onRemoveFromList}: EventListProps) {
  const [statusTexts, setStatusTexts] = React.useState<{[key: string]: string}>({});
  const [counterpartNames, setCounterpartNames] = React.useState<{[key: string]: string}>({});
  const [isLoadingNames, setIsLoadingNames] = React.useState(false);
  const queryClient = useQueryClient();

  // 상태 텍스트를 미리 로드
  React.useEffect(() => {
    const texts: {[key: string]: string} = {};
    for (const post of posts) {
      const text = getStatusText(post.requestStatus, post.role);
      texts[`${post.id}-${post.requestStatus}`] = text;
    }
    setStatusTexts(texts);
  }, [posts]);

  // 상대방 이름을 비동기로 가져오기
  React.useEffect(() => {
    const fetchCounterpartNames = async () => {
      if (isLoadingNames || posts.length === 0) return;
      
      setIsLoadingNames(true);
      const names: {[key: string]: string} = {};
      
      // 이미 로딩된 이름이 있으면 복사
      Object.assign(names, counterpartNames);
      
      // 아직 로딩되지 않은 예약들만 처리 (취소된 예약 제외)
      const postsToProcess = posts.filter(post => {
        const isCancelled = post.requestStatus === 'CANCELLED_BY_USER' || 
                           post.requestStatus === 'CANCELLED_BY_GUIDE';
        return !isCancelled && !counterpartNames[post.id];
      });
      
      console.log(`🔍 ${postsToProcess.length}개의 예약에 대해 이름 조회 시작`);
      
      for (const post of postsToProcess) {
        const key = `${post.id}`;
        try {
          const name = await getCounterpartName(post);
          
          // 유효하지 않은 예약인 경우 제거
          if (name === 'INVALID_RESERVATION') {
            console.log(`🗑️ 유효하지 않은 예약 제거: ${post.id} (${post.tourProgramTitle})`);
            // 부모 컴포넌트에 제거 요청
            onRemoveFromList?.(post.id);
            continue;
          }
          
          names[key] = name;
          console.log(`✅ 예약 ${post.id} 이름 조회 완료: ${name}`);
        } catch (error) {
          console.error(`❌ 예약 ${post.id} 이름 조회 실패:`, error);
          names[key] = post.role === 'GUIDE' ? '예약자' : '가이드';
        }
      }
      
      setCounterpartNames(names);
      setIsLoadingNames(false);
      console.log('✅ 모든 이름 조회 완료');
    };
    
    fetchCounterpartNames();
  }, [posts]); // posts가 변경될 때만 실행

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

    // 상태 변경 성공 후 캘린더 데이터 새로고침
    console.log('🔄 상태 변경 성공, 캘린더 데이터 새로고침 시작');
    try {
      // 모든 캘린더 관련 쿼리 무효화하여 새로고침
      await queryClient.invalidateQueries({
        queryKey: ['calendarReservations'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['myReservations'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['calendarStatus'],
      });
      console.log('✅ 캘린더 데이터 새로고침 완료');
    } catch (error) {
      console.error('❌ 캘린더 데이터 새로고침 실패:', error);
    }

    // 상태별 차별화된 처리 - 실제 상대방 이름 사용
    const counterpartName = counterpartNames[reservationId] || (reservation.role === 'GUIDE' ? '예약자' : '가이드');
    
    switch (newStatus) {
      case 'ACCEPTED':
        // 승인: 목록에서 제거
        Alert.alert(
          '예약 승인 완료',
          reservation.role === 'GUIDE' 
            ? `${counterpartName}님의 예약이 승인되었습니다.`
            : `${counterpartName}님께서 예약을 승인했습니다.`,
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
        // 거절: 목록에서 제거
        Alert.alert(
          '예약 거절 완료',
          reservation.role === 'GUIDE' 
            ? `${counterpartName}님의 예약이 거절되었습니다.`
            : `${counterpartName}님께서 예약을 거절했습니다.`,
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
        // 가이드 취소: 목록에서 제거
        Alert.alert(
          '예약 취소 완료',
          reservation.role === 'GUIDE' 
            ? `${counterpartName}님의 예약이 취소되었습니다.`
            : `${counterpartName}님께서 예약을 취소했습니다.`,
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
        // 완료: 목록에서 제거
        Alert.alert(
          '예약 완료',
          reservation.role === 'GUIDE' 
            ? `${counterpartName}님의 예약이 완료되었습니다.`
            : `${counterpartName}님과의 예약이 완료되었습니다.`,
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
        // 대기: 단순 상태 변경만 (목록에 유지)
        const statusText = getStatusText(newStatus, reservation.role);
        Alert.alert(
          '상태 변경 완료',
          `예약 상태가 "${statusText}"로 변경되었습니다.`,
        );
        onStatusChange?.(reservationId, newStatus);
        break;

      case 'CANCELLED_BY_USER':
        // 사용자 취소: 목록과 캘린더에서 제거
        console.log('🔄 사용자 예약취소: 예약 현황과 캘린더에서 제거');
        Alert.alert(
          '예약 취소 완료',
          reservation.role === 'GUIDE' 
            ? `${counterpartName}님께서 예약을 취소했습니다.`
            : '예약이 취소되었습니다.',
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

      default:
        // 기본 처리
        onStatusChange?.(reservationId, newStatus);
        break;
    }
  };

  // 취소된 예약 필터링
  const filteredPosts = posts.filter(post => {
    const isCancelled = post.requestStatus === 'CANCELLED_BY_USER' || 
                       post.requestStatus === 'CANCELLED_BY_GUIDE';
    if (isCancelled) {
      console.log(`🗑️ 취소된 예약 제외: ${post.id} (${post.requestStatus})`);
    }
    return !isCancelled;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        {filteredPosts.map(post => (
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
              
              {/* 사용자 역할 표시 */}
              <View style={styles.roleContainer}>
                <Text style={styles.roleText}>
                  {post.role === 'GUIDE' ? '👨‍🏫 가이드 입장' : '👤 예약자 입장'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  상대방: {counterpartNames[post.id] || (isLoadingNames ? '로딩 중...' : '정보 없음')}
                </Text>
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
                  {statusTexts[`${post.id}-${post.requestStatus}`] || '로딩 중...'}
                </Text>
              </View>

              {/* 역할과 상태에 따라 다른 버튼 표시 */}
              {post.requestStatus !== 'COMPLETED' && (
                <View style={styles.actionButtonsContainer}>
                  {post.role === 'GUIDE' ? (
                    // 가이드 입장: 상태에 따라 다른 버튼 표시
                    <>
                      {post.requestStatus === 'ACCEPTED' ? (
                        // 승인 상태: 가이드 예약취소 버튼만 표시
                        <TouchableOpacity
                          style={[styles.actionButton, styles.guideCancelButton]}
                          onPress={() => handlePress(post.id, 'CANCELLED_BY_GUIDE', post)}>
                          <Text style={styles.actionButtonText}>
                            가이드 예약 취소
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        // 승인되지 않은 상태: 승인, 거절 버튼 표시
                        <>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handlePress(post.id, 'ACCEPTED', post)}>
                            <Text style={styles.actionButtonText}>가이드 승인</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handlePress(post.id, 'REJECTED', post)}>
                            <Text style={styles.actionButtonText}>가이드 거절</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  ) : (
                    // 예약자 입장: 사용자 예약취소 버튼만 표시
                    <TouchableOpacity
                      style={[styles.actionButton, styles.userCancelButton]}
                      onPress={() => handlePress(post.id, 'CANCELLED_BY_USER', post)}>
                      <Text style={styles.actionButtonText}>
                        사용자 예약 취소
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* COMPLETED 상태일 때는 텍스트만 표시 */}
              {post.requestStatus === 'COMPLETED' && (
                <View style={styles.completedTextContainer}>
                  <Text style={styles.completedText}>✅ 예약 완료</Text>
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
  roleContainer: {
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    color: colors.BLUE_500,
    fontWeight: '600',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
  completedTextContainer: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  completedText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EventList;