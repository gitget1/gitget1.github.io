// ✅ Practice.tsx - 개선된 전체 코드 (보안, 안정성, 시각화 향상)

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import axios from 'axios';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import haversine from 'haversine-distance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const dayColors = ['#0288d1', '#43a047', '#fbc02d', '#e64a19', '#8e24aa'];

type Schedule = {
  day: number;
  lat: number;
  lon: number;
  placeName: string;
  placeDescription: string;
  travelTime: number;
};

type TourData = {
  id: number;
  title: string;
  region: string;
  thumbnailUrl: string;
  reviewCount: number;
  wishlistCount: number;
  hashtags: string[];
  schedules: Schedule[];
  user: {id: number; name: string};
  description: string;
  guidePrice: number;
  tourProgramId: number;
  wishlisted: boolean;
};

const Practice = () => {
  const [data, setData] = useState<TourData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PracticeDetail'>>();
  const tourProgramId = route.params?.tourProgramId ?? 1;
  const refresh = route.params?.refresh;

  console.log('🟢 PracticeDetail 화면 - tourProgramId:', tourProgramId);

  // 더 이상 필요하지 않음 - 서버의 wishlisted 필드 사용
  // const checkWishlistStatus = useCallback(...);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          Alert.alert('알림', '로그인이 필요한 서비스입니다.');
          navigation.goBack();
          return;
        }

        const cleanToken = token.replace('Bearer ', '');
        console.log('🟢 투어 상세 정보 요청:', {
          tourProgramId,
          token: cleanToken.substring(0, 10) + '...',
        });

        const response = await axios.get(
          `http://124.60.137.10/api/tour-program/${tourProgramId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanToken}`,
            },
            timeout: 10000,
          },
        );

        console.log('🟢 서버 응답:', response.data);

        if (response.data.status === 'OK') {
          const tourData = response.data.data;
          setData(tourData);

          // 서버에서 받은 wishlisted 값으로 찜하기 상태 설정
          setIsLiked(tourData.wishlisted || false);

          console.log('🟢 투어 데이터 로드 완료:', {
            tourProgramId: tourData.tourProgramId || tourData.id,
            wishlisted: tourData.wishlisted,
            wishlistCount: tourData.wishlistCount,
          });
        } else {
          console.error('❌ 서버 응답 에러:', response.data);
          throw new Error(
            response.data.message || '투어 정보를 불러오는데 실패했습니다.',
          );
        }
      } catch (error) {
        console.error('❌ 투어 정보 로딩 실패:', error);
        if (axios.isAxiosError(error)) {
          console.error('❌ Axios 에러 상세:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });

          if (error.code === 'ECONNABORTED') {
            Alert.alert('오류', '서버 응답 시간이 초과되었습니다.');
          } else if (error.response?.status === 401) {
            Alert.alert('오류', '로그인이 만료되었습니다.');
            navigation.goBack();
          } else if (error.response?.status === 404) {
            Alert.alert('오류', '해당 투어를 찾을 수 없습니다.');
            navigation.goBack();
          } else if (error.response?.status === 500) {
            Alert.alert(
              '오류',
              '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
            navigation.goBack();
          } else {
            Alert.alert('오류', '투어 정보를 불러오는데 실패했습니다.');
            navigation.goBack();
          }
        } else {
          Alert.alert('오류', '네트워크 연결을 확인해주세요.');
          navigation.goBack();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourProgramId, navigation, refresh]);

  // JWT 토큰 디코딩 함수
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
      return null;
    }
  };

  const toggleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        return;
      }

      // 토큰에서 'Bearer ' 접두사 제거
      const cleanToken = token.replace('Bearer ', '');

      // JWT 토큰 정보 확인
      const jwtPayload = decodeJWT(cleanToken);
      console.log('🔍 JWT 토큰 정보:', {
        userId: jwtPayload?.sub,
        role: jwtPayload?.role,
        exp: jwtPayload?.exp,
        현재시간: Math.floor(Date.now() / 1000),
        만료여부: jwtPayload?.exp < Math.floor(Date.now() / 1000),
      });

      console.log('🟢 찜하기 토글 시작:', {
        currentState: isLiked ? '찜함' : '찜 안함',
        tourProgramId,
        tourProgramIdType: typeof tourProgramId,
        action: isLiked ? '찜하기 취소' : '찜하기 추가',
        userData: data?.user,
        tokenPreview: cleanToken.substring(0, 20) + '...',
      });

      if (!isLiked) {
        // 찜하기 추가
        console.log('🟢 찜하기 추가 요청 시작...', {
          url: `http://124.60.137.10:80/api/wishlist/${tourProgramId}`,
          tourProgramId: tourProgramId,
          tourProgramIdType: typeof tourProgramId,
          token: cleanToken.substring(0, 10) + '...',
        });

        const response = await axios.post(
          `http://124.60.137.10:80/api/wishlist/${tourProgramId}`,
          {}, // 빈 객체로 변경 (tourProgramId는 URL에 포함)
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanToken}`,
            },
            timeout: 10000,
          },
        );

        console.log('🟢 찜하기 추가 응답:', response.data);

        if (response.data.status === 'OK') {
          // 상태 즉시 업데이트
          setIsLiked(true);
          if (data) {
            const newWishlistCount = data.wishlistCount + 1;
            setData({
              ...data,
              wishlistCount: newWishlistCount,
              wishlisted: true,
            });
            console.log('✅ 찜하기 추가 성공:', {
              이전상태: '찜 안함 🤍',
              새상태: '찜함 💖',
              이전개수: data.wishlistCount,
              새개수: newWishlistCount,
              wishlisted: true,
            });
          }
          Alert.alert(
            '성공',
            '위시리스트에 추가되었습니다.\n위시리스트를 확인하시겠습니까?',
            [
              {
                text: '취소',
                style: 'cancel',
              },
              {
                text: '확인',
                onPress: () => {
                  navigation.navigate('WishlistScreen');
                },
              },
            ],
          );
        } else {
          console.error('❌ 찜하기 추가 실패:', response.data);
          Alert.alert('오류', '찜하기 추가에 실패했습니다.');
        }
      } else {
        // 찜하기 삭제
        console.log('🟢 찜하기 취소 요청 시작...', {
          url: `http://124.60.137.10:80/api/wishlist/${tourProgramId}`,
          tourProgramId: tourProgramId,
          tourProgramIdType: typeof tourProgramId,
          token: cleanToken.substring(0, 10) + '...',
          method: 'POST (찜하기 토글)',
        });

        // 찜하기는 토글 방식으로 작동 - 같은 엔드포인트에 POST 요청
        const response = await axios.post(
          `http://124.60.137.10:80/api/wishlist/${tourProgramId}`,
          {}, // 빈 객체
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanToken}`,
            },
            timeout: 10000,
          },
        );

        console.log('🟢 찜하기 취소 응답:', response.data);

        if (response.data.status === 'OK') {
          // 상태 즉시 업데이트
          setIsLiked(false);
          if (data) {
            const newWishlistCount = Math.max(0, data.wishlistCount - 1);
            setData({
              ...data,
              wishlistCount: newWishlistCount,
              wishlisted: false,
            });
            console.log('✅ 찜하기 취소 성공:', {
              이전상태: '찜함 💖',
              새상태: '찜 안함 🤍',
              이전개수: data.wishlistCount,
              새개수: newWishlistCount,
              wishlisted: false,
            });
          }
          Alert.alert('성공', '위시리스트에서 제거되었습니다.');
        } else {
          console.error('❌ 찜하기 취소 실패:', response.data);
          Alert.alert('오류', '찜하기 취소에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('❌ 찜하기 처리 중 오류:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios 에러 상세:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.code === 'ECONNABORTED') {
          Alert.alert(
            '오류',
            '서버 응답 시간이 초과되었습니다. 다시 시도해주세요.',
          );
        } else if (error.response?.status === 401) {
          Alert.alert('오류', '로그인이 만료되었습니다. 다시 로그인해주세요.');
        } else if (error.response?.status === 404) {
          Alert.alert('오류', '해당 투어를 찾을 수 없습니다.');
        } else if (error.response?.status === 500) {
          console.error('❌ 서버 내부 오류:', error.response?.data);
          Alert.alert(
            '서버 오류',
            `서버에서 오류가 발생했습니다.\n${
              error.response?.data?.message || '잠시 후 다시 시도해주세요.'
            }`,
          );
        } else if (error.response?.status === 409) {
          // 이미 찜한 상태에서 다시 찜하려고 할 때
          console.log('🔄 찜하기 상태 동기화 필요 - 페이지 새로고침 권장');
          Alert.alert(
            '알림',
            '찜하기 상태를 확인하기 위해 페이지를 새로고침해주세요.',
          );
        } else {
          Alert.alert('오류', '찜하기 처리에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        Alert.alert('오류', '네트워크 연결을 확인해주세요.');
      }
    }
  };

  const getTotalDistance = (schedules: Schedule[]) => {
    let total = 0;
    for (let i = 1; i < schedules.length; i++) {
      total += haversine(
        {latitude: schedules[i - 1].lat, longitude: schedules[i - 1].lon},
        {latitude: schedules[i].lat, longitude: schedules[i].lon},
      );
    }
    return (total / 1000).toFixed(1);
  };

  // 상담하기 버튼 클릭 시 채팅방 생성 및 입장
  const handleChat = async () => {
    try {
      const userId = 1; // 내 아이디(로그인 유저)
      const hostId = data?.user?.id || 2; // 상대방 아이디(호스트)
      const res = await axios.post('/api/chat/rooms', {
        user1Id: userId,
        user2Id: hostId,
      });
      const roomId = res.data.id;
      navigation.navigate('Main', {
        screen: '채팅',
        params: {
          screen: 'ChatRoomScreen',
          params: {roomId, userId},
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 투어 수정 - Make_program 화면으로 이동
  const handleEdit = () => {
    if (!data) return;

    console.log('🟢 수정 모드로 이동:', {
      tourProgramId,
      editData: data,
    });

    // Make_program 화면으로 이동하면서 편집할 데이터 전달
    navigation.navigate('Make_program', {
      editData: data,
      tourProgramId: tourProgramId,
    });
  };

  // 투어 삭제
  const handleDelete = async () => {
    if (!data) return;

    Alert.alert(
      '투어 삭제',
      '정말로 이 투어를 삭제하시겠습니까?\n삭제된 투어는 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) {
                Alert.alert('알림', '로그인이 필요한 서비스입니다.');
                return;
              }

              const cleanToken = token.replace('Bearer ', '');

              console.log('🟢 투어 삭제 요청:', {
                tourProgramId,
              });

              const response = await axios.delete(
                `http://124.60.137.10/api/tour-program/${tourProgramId}`,
                {
                  headers: {
                    Authorization: `Bearer ${cleanToken}`,
                  },
                  timeout: 10000,
                },
              );

              if (response.data.status === 'OK') {
                Alert.alert('삭제 완료', '투어가 삭제되었습니다.', [
                  {
                    text: '확인',
                    onPress: () => {
                      // TraitSelection 화면으로 이동
                      navigation.navigate('TraitSelection');
                    },
                  },
                ]);
              } else {
                throw new Error(
                  response.data.message || '투어 삭제에 실패했습니다.',
                );
              }
            } catch (error) {
              console.error('❌ 투어 삭제 실패:', error);
              if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                  Alert.alert('오류', '로그인이 만료되었습니다.');
                } else if (error.response?.status === 403) {
                  Alert.alert('오류', '삭제 권한이 없습니다.');
                } else if (error.response?.status === 404) {
                  Alert.alert('오류', '해당 투어를 찾을 수 없습니다.');
                } else {
                  Alert.alert(
                    '삭제 실패',
                    error.response?.data?.message ||
                      '투어 삭제에 실패했습니다.',
                  );
                }
              } else {
                Alert.alert('삭제 실패', '네트워크 연결을 확인해주세요.');
              }
            }
          },
        },
      ],
    );
  };

  const handleReservation = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('알림', '로그인이 필요한 서비스입니다.');
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      console.log('🟢 사용자 정보 요청:', {
        token: cleanToken.substring(0, 10) + '...',
      });

      const response = await axios.get('http://124.60.137.10:80/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanToken}`,
        },
        timeout: 10000,
      });

      console.log('🟢 사용자 정보 응답:', response.data);

      if (response.data.status === 'OK') {
        navigation.navigate('PaymentScreen', {
          tourData: data,
          userData: response.data.data,
        });
      } else {
        throw new Error(
          response.data.message || '사용자 정보를 불러오는데 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('❌ 사용자 정보 로딩 실패:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios 에러 상세:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.code === 'ECONNABORTED') {
          Alert.alert('오류', '서버 응답 시간이 초과되었습니다.');
        } else if (error.response?.status === 401) {
          Alert.alert('오류', '로그인이 만료되었습니다.');
        } else if (error.response?.status === 404) {
          Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        } else if (error.response?.status === 500) {
          Alert.alert(
            '오류',
            '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          );
        } else {
          Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
        }
      } else {
        Alert.alert('오류', '네트워크 연결을 확인해주세요.');
      }
    }
  };

  if (loading)
    return <ActivityIndicator style={{marginTop: 40}} size="large" />;
  if (!data) return null;

  const groupedSchedules = data.schedules.reduce((acc, cur) => {
    const key = `Day ${cur.day}`;
    acc[key] = acc[key] || [];
    acc[key].push(cur);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {data.thumbnailUrl && (
          <Image source={{uri: data.thumbnailUrl}} style={styles.map} />
        )}
        <View style={styles.whiteBox}>
          <Text style={styles.title}>{data.title}</Text>

          <View style={styles.editDeleteRow}>
            <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
              <Text style={styles.editText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightAlignRow}>
            <Text style={styles.region}>📍 {data.region}</Text>
            <View style={styles.rowRight}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Practice', {
                    tourProgramId: tourProgramId,
                  })
                }>
                <Text style={styles.review}>💬 리뷰 {data.reviewCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleLike}>
                <Text style={styles.like}>
                  {isLiked ? '💖 찜함' : '🤍 찜'} {data.wishlistCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tags}>
            {data.hashtags.map((tag, i) => (
              <Text key={i} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>

          <Text style={styles.sectionTitle}>🗓️ 일정</Text>
          {Object.entries(groupedSchedules).map(([day, items], i) => (
            <View key={i} style={styles.scheduleCard}>
              <Text style={styles.dayTitle}>{day}</Text>
              {items.map((item, idx) => (
                <Text key={idx} style={styles.scheduleItem}>
                  ⏱ {item.placeName} ({item.travelTime}분) -{' '}
                  {item.placeDescription}
                </Text>
              ))}
            </View>
          ))}

          <Text style={styles.sectionTitle}>🗺 지도</Text>
          <View
            style={{
              height: 300,
              marginBottom: 20,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
            <MapView
              style={{flex: 1}}
              provider={PROVIDER_GOOGLE}
              initialRegion={
                data.schedules.length > 0
                  ? {
                      latitude: data.schedules[0].lat,
                      longitude: data.schedules[0].lon,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }
                  : {
                      latitude: 37.5665,
                      longitude: 126.978,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }
              }>
              {data.schedules.map((s, idx) => (
                <Marker
                  key={idx}
                  coordinate={{latitude: s.lat, longitude: s.lon}}
                  title={`Day ${s.day} - ${s.placeName}`}
                  description={s.placeDescription}
                  pinColor={dayColors[(s.day - 1) % dayColors.length]}
                />
              ))}
              <Polyline
                coordinates={data.schedules.map(s => ({
                  latitude: s.lat,
                  longitude: s.lon,
                }))}
                strokeColor="#0288d1"
                strokeWidth={3}
              />
            </MapView>
            <Text style={{textAlign: 'right', marginTop: 6}}>
              총 거리: {getTotalDistance(data.schedules)}km
            </Text>
          </View>

          <Text style={styles.sectionTitle}>🧑‍💼 호스트 정보</Text>
          <Text style={styles.description}>호스트: {data.user.name}</Text>

          <Text style={styles.sectionTitle}>📖 투어 설명</Text>
          <Text style={styles.description}>{data.description}</Text>

          <View style={{height: 100}} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.price}>
          ₩{data.guidePrice.toLocaleString()} /인
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <Text style={styles.chatText}>상담하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reserveBtn}
            onPress={handleReservation}>
            <Text style={styles.reserveText}>예약하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  thumbnail: {width: '100%', height: 230},
  whiteBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  title: {fontSize: 22, fontWeight: 'bold'},
  region: {fontSize: 14, color: '#666', marginBottom: 6},
  review: {fontSize: 14},
  like: {fontSize: 14},
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
  },
  scheduleCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayTitle: {fontWeight: 'bold', marginBottom: 6},
  scheduleItem: {fontSize: 14, marginBottom: 4},
  map: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
  description: {fontSize: 14, color: '#333'},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reserveBtn: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reserveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  chatBtn: {
    backgroundColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chatText: {
    color: '#333',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rightAlignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editBtn: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 18,
    marginBottom: 12,
  },
});

export default Practice;
