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
import {useTranslation} from 'react-i18next';

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
  const {t} = useTranslation();
  const [data, setData] = useState<TourData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PracticeDetail'>>();
  const tourProgramId = route.params?.tourProgramId ?? 1;
  const refresh = route.params?.refresh;

  console.log('🟢 PracticeDetail 화면 - tourProgramId:', tourProgramId);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          Alert.alert(t('alert'), t('loginRequiredTour'));
          navigation.goBack();
          return;
        }

        const cleanToken = token.replace('Bearer ', '');
        console.log('🟢 투어 상세 정보 요청:', {
          tourProgramId,
          token: cleanToken.substring(0, 10) + '...',
        });

        const response = await axios.get(
<<<<<<< HEAD
          `http://124.60.137.10:8080/api/tour-program/${tourProgramId}`,
=======
          `http://124.60.137.10/api/tour-program/${tourProgramId}`,
>>>>>>> 67387e4 (졸작이후)
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
            Alert.alert(t('errorTour'), '서버 응답 시간이 초과되었습니다.');
          } else if (error.response?.status === 401) {
            Alert.alert(t('errorTour'), '로그인이 만료되었습니다.');
            navigation.goBack();
          } else if (error.response?.status === 404) {
            Alert.alert(t('errorTour'), '해당 투어를 찾을 수 없습니다.');
            navigation.goBack();
          } else if (error.response?.status === 500) {
            Alert.alert(
              t('errorTour'),
              '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
            navigation.goBack();
          } else {
            Alert.alert(t('errorTour'), '투어 정보를 불러오는데 실패했습니다.');
            navigation.goBack();
          }
        } else {
          Alert.alert(t('errorTour'), t('networkErrorTour'));
          navigation.goBack();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourProgramId, navigation, refresh, t]);

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
        Alert.alert(t('alert'), t('loginRequiredTour'));
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
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
        action: isLiked ? '찜하기 취소' : '찜하기 추가',
      });

      const response = await axios.post(
<<<<<<< HEAD
        `http://124.60.137.10:8080/api/wishlist/${tourProgramId}`,
=======
        `http://124.60.137.10/api/wishlist/${tourProgramId}`,
>>>>>>> 67387e4 (졸작이후)
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
          timeout: 10000,
        },
      );

      console.log('🟢 찜하기 응답:', response.data);

      if (response.data.status === 'OK') {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);

        if (data) {
          const newWishlistCount = newIsLiked
            ? data.wishlistCount + 1
            : Math.max(0, data.wishlistCount - 1);

          setData({
            ...data,
            wishlistCount: newWishlistCount,
            wishlisted: newIsLiked,
          });
        }

        Alert.alert(
          t('successTour'),
          newIsLiked ? t('wishlistAdded') : t('wishlistRemoved'),
        );
      } else {
        console.error('❌ 찜하기 실패:', response.data);
        Alert.alert('오류', '찜하기 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 찜하기 처리 중 오류:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert(
            t('errorTour'),
            '로그인이 만료되었습니다. 다시 로그인해주세요.',
          );
        } else if (error.response?.status === 404) {
          Alert.alert(t('errorTour'), '해당 투어를 찾을 수 없습니다.');
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
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userInfo = await AsyncStorage.getItem('userInfo');

      console.log('🔍 AsyncStorage 토큰 상태 확인:', {
        accessToken: accessToken
          ? accessToken.substring(0, 50) + '...'
          : 'null',
        refreshToken: refreshToken
          ? refreshToken.substring(0, 30) + '...'
          : 'null',
        userInfo: userInfo ? JSON.parse(userInfo) : 'null',
        accessTokenLength: accessToken?.length || 0,
      });

      if (!accessToken) {
        Alert.alert(t('alert'), t('loginRequiredTour'));
        return;
      }

      const cleanToken = accessToken.replace('Bearer ', '');
      const jwtPayload = decodeJWT(cleanToken);

      if (!jwtPayload) {
        Alert.alert('오류', '토큰이 유효하지 않습니다. 다시 로그인해주세요.');
        return;
      }

      // 토큰 만료 확인
      const currentTime = Math.floor(Date.now() / 1000);
      if (jwtPayload.exp && jwtPayload.exp < currentTime) {
        console.log('❌ JWT 토큰 만료됨:', {
          만료시간: new Date(jwtPayload.exp * 1000).toLocaleString(),
          현재시간: new Date(currentTime * 1000).toLocaleString(),
        });

        Alert.alert(
          '로그인 만료',
          '로그인이 만료되었습니다. 다시 로그인해주세요.',
          [
            {
              text: '확인',
              onPress: async () => {
                await AsyncStorage.multiRemove([
                  'accessToken',
                  'refreshToken',
                  'userInfo',
                ]);
                navigation.navigate('NaverLoginScreen');
              },
            },
          ],
        );
        return;
      }

      const currentUserId = parseInt(jwtPayload?.sub) || 1;
      const hostId = data?.user?.id || 2;

      console.log('🟢 채팅방 생성 요청:', {
        currentUserId: currentUserId + ' (관광객)',
        hostId: hostId + ' (가이드)',
        tourTitle: data?.title,
        guideName: data?.user?.name,
<<<<<<< HEAD
        requestUrl: `http://124.60.137.10:8080/api/chat/rooms?userId=${hostId}`,
      });

      const response = await axios.post(
        `http://124.60.137.10:8080/api/chat/rooms?userId=${hostId}`,
=======
        requestUrl: `http://124.60.137.10/api/chat/rooms?userId=${hostId}`,
      });

      const response = await axios.post(
        `http://124.60.137.10/api/chat/rooms?userId=${hostId}`,
>>>>>>> 67387e4 (졸작이후)
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
          timeout: 10000,
        },
      );

      console.log('🟢 채팅방 생성/입장 응답:', response.data);

      if (response.data && response.data.id) {
        const roomData = response.data;
        navigation.navigate('ChatRoom', {
          roomId: roomData.id.toString(),
          userId: currentUserId,
        });
      } else {
        throw new Error('채팅방 정보를 받을 수 없습니다.');
      }
    } catch (e) {
      console.error('채팅방 생성/입장 실패:', e);
      if (axios.isAxiosError(e)) {
        console.error('❌ Axios 에러 상세:', {
          status: e.response?.status,
          data: e.response?.data,
          message: e.message,
        });

        if (e.response?.status === 401) {
          Alert.alert(
            '인증 오류',
            '로그인이 만료되었습니다. 다시 로그인해주세요.',
            [
              {
                text: '확인',
                onPress: async () => {
                  await AsyncStorage.multiRemove([
                    'accessToken',
                    'refreshToken',
                    'userInfo',
                  ]);
                  navigation.navigate('NaverLoginScreen');
                },
              },
            ],
          );
        } else if (e.response?.status === 404) {
          Alert.alert('오류', '사용자를 찾을 수 없습니다.');
        } else {
          Alert.alert('오류', '채팅방 생성에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        Alert.alert('오류', '네트워크 연결을 확인해주세요.');
      }
    }
  };

  // 투어 수정
  const handleEdit = () => {
    if (!data) return;

    console.log('🟢 수정 모드로 이동:', {
      tourProgramId,
      editData: data,
    });

    navigation.navigate('Make_program', {
      editData: data,
      tourProgramId: tourProgramId,
    });
  };

  // 투어 삭제
  const handleDelete = async () => {
    if (!data) return;

    Alert.alert(t('tourDelete'), t('deleteConfirmTour'), [
      {
        text: t('cancelTour'),
        style: 'cancel',
      },
      {
        text: t('deleteTour'),
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
              Alert.alert(t('alert'), t('loginRequiredTour'));
              return;
            }

            const cleanToken = token.replace('Bearer ', '');

            const response = await axios.delete(
<<<<<<< HEAD
              `http://124.60.137.10:8080/api/tour-program/${tourProgramId}`,
=======
              `http://124.60.137.10/api/tour-program/${tourProgramId}`,
>>>>>>> 67387e4 (졸작이후)
              {
                headers: {
                  Authorization: `Bearer ${cleanToken}`,
                },
                timeout: 10000,
              },
            );

            if (response.data.status === 'OK') {
              Alert.alert(t('deleteComplete'), t('tourDeleted'), [
                {
                  text: t('confirmTour'),
                  onPress: () => {
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
                Alert.alert(t('errorTour'), '로그인이 만료되었습니다.');
              } else if (error.response?.status === 403) {
                Alert.alert('오류', '삭제 권한이 없습니다.');
              } else if (error.response?.status === 404) {
                Alert.alert(t('errorTour'), '해당 투어를 찾을 수 없습니다.');
              } else {
                Alert.alert(
                  t('errorTour'),
                  error.response?.data?.message || '투어 삭제에 실패했습니다.',
                );
              }
            } else {
              Alert.alert('삭제 실패', '네트워크 연결을 확인해주세요.');
            }
          }
        },
      },
    ]);
  };

  const handleReservation = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert(t('alert'), t('loginRequiredTour'));
        return;
      }

      navigation.navigate('PaymentScreen', {
        tourData: data,
      });
    } catch (error) {
      Alert.alert('오류', '예약 처리 중 문제가 발생했습니다.');
      console.error('❌ 예약 처리 실패:', error);
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
    <View style={{flex: 1}}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          {data.thumbnailUrl && (
            <Image source={{uri: data.thumbnailUrl}} style={styles.thumbnail} />
          )}
          <View style={styles.whiteBox}>
            <Text style={styles.title}>{data.title}</Text>

            <View style={styles.editDeleteRow}>
              <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
                <Text style={styles.editText}>{t('editTour')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>{t('deleteTour')}</Text>
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
                  <Text style={styles.review}>
                    {t('reviewTour')} {data.reviewCount}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleLike}>
                  <Text style={styles.like}>
                    {isLiked ? `💖 ${t('likedTour')}` : `🤍 ${t('likeTour')}`}{' '}
                    {data.wishlistCount}
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

            <Text style={styles.sectionTitle}>🗓️ {t('scheduleTour')}</Text>
<<<<<<< HEAD
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
=======
            {/* 일정 타임라인 UI 시작 */}
            {Object.entries(groupedSchedules).map(([day, items], i) => (
              <View key={i} style={{marginBottom: 40, backgroundColor: '#f7f7f7', borderRadius: 12, padding: 12}}>
                <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 10, color: '#0288d1'}}>{day}</Text>
                {items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {/* 장소 카드 */}
                    <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
                      <View style={{alignItems: 'center', width: 30}}>
                        <View style={{width: 12, height: 12, borderRadius: 6, backgroundColor: '#0288d1', marginTop: 8}} />
                        {/* 선 + 이동시간 */}
                        {idx < items.length - 1 && (
                          <View style={{alignItems: 'center'}}>
                            <View style={{width: 2, height: 30, backgroundColor: '#0288d1'}} />
                            <Text style={{
                              color: '#0288d1',
                              fontWeight: 'bold',
                              fontSize: 12,
                              marginVertical: 2,
                              backgroundColor: '#f7f7f7',
                              paddingHorizontal: 4,
                              borderRadius: 6,
                              textAlign: 'center',
                            }}>
                              이동시간: 정보 없음
                            </Text>
                            <View style={{width: 2, height: 30, backgroundColor: '#0288d1'}} />
                          </View>
                        )}
                      </View>
                      <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 10,
                        flex: 1,
                        shadowColor: '#000',
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2
                      }}>
                        <Text style={{fontWeight: 'bold', fontSize: 15, marginBottom: 4}}>
                          장소 {idx + 1}. {item.placeName}
                        </Text>
                        <Text style={{color: '#555', marginBottom: 4}}>{item.placeDescription}</Text>
                        <Text style={{color: '#888', fontSize: 13}}>소요시간: {item.travelTime}분</Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            ))}
            {/* 일정 타임라인 UI 끝 */}
>>>>>>> 67387e4 (졸작이후)

            <Text style={styles.sectionTitle}>🗺 {t('mapTour')}</Text>
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
                {t('totalDistance')}: {getTotalDistance(data.schedules)}km
              </Text>
            </View>

            <Text style={styles.sectionTitle}>🧑‍💼 {t('hostInfo')}</Text>
            <Text style={styles.description}>
              {t('hostTour')}: {data.user.name}
            </Text>

            <Text style={styles.sectionTitle}>📖 {t('tourDescription')}</Text>
            <Text style={styles.description}>{data.description}</Text>

            <View style={{height: 100}} />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Text style={styles.price}>
            ₩{data.guidePrice.toLocaleString()} {t('perPersonTour')}
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Text style={styles.chatText}>{t('consultation')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reserveBtn}
              onPress={handleReservation}>
              <Text style={styles.reserveText}>{t('reservationTour')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
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
<<<<<<< HEAD
  scheduleCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayTitle: {fontWeight: 'bold', marginBottom: 6},
  scheduleItem: {fontSize: 14, marginBottom: 4},
=======
  dayTitle: {fontWeight: 'bold', marginBottom: 6},
>>>>>>> 67387e4 (졸작이후)
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
