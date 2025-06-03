import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import haversine from 'haversine-distance';
import axios from 'axios';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
import polyline from '@mapbox/polyline';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DayPlan {
  place: string;
  memo: string;
  travelTime?: number;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
}

interface DaySchedule {
  plans: DayPlan[];
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface GeolocationError {
  code: number;
  message: string;
}

const GOOGLE_API_KEY = 'AIzaSyAP2enhwEyqTFgrpKiaRzneOfgdadldE9s'; // 여기에 본인의 API 키 입력

const dayColors = [
  '#0288d1', // Day 1 - 파랑
  '#43a047', // Day 2 - 초록
  '#fbc02d', // Day 3 - 노랑
  '#e64a19', // Day 4 - 주황
  '#8e24aa', // Day 5 - 보라
  '#d81b60', // Day 6 - 핑크
  '#3949ab', // Day 7 - 남색
  '#00897b', // Day 8 - 청록
];

function Make_program() {
  const route = useRoute<RouteProp<AppStackParamList, 'Make_program'>>();
  const editData = route.params?.editData;
  const tourProgramId = route.params?.tourProgramId;

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<DaySchedule[]>([{plans: []}]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [plan, setPlan] = useState<DayPlan>({
    place: '',
    memo: '',
    travelTime: 0,
  });
  const [regionInput, setRegionInput] = useState('');
  const [guidePrice, setGuidePrice] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [region, setRegion] = useState({
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const navigation = useNavigation();
  const [routes, setRoutes] = useState<{
    [key: string]: {latitude: number; longitude: number}[];
  }>({});

  useEffect(() => {
    if (editData) {
      setThumbnail(editData.thumbnailUrl);
      setTitle(editData.title);
      setDescription(editData.description);
      setRegionInput(editData.region);
      setGuidePrice(editData.guidePrice.toString());
      setHashtags(editData.hashtags.join(', '));

      // 일정 데이터 변환
      const convertedDays = [
        {
          plans: editData.schedules.map(schedule => ({
            place: schedule.placeName,
            memo: schedule.placeDescription,
            travelTime: schedule.travelTime,
            coordinate: {
              latitude: schedule.lat,
              longitude: schedule.lon,
            },
          })),
        },
      ];
      setDays(convertedDays);

      // 지도 위치 설정
      if (editData.schedules.length > 0) {
        setRegion({
          latitude: editData.schedules[0].lat,
          longitude: editData.schedules[0].lon,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    }
  }, [editData]);

  useEffect(() => {
    // 현재 위치 가져오기
    Geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      },
      (_error: GeolocationError) =>
        Alert.alert('위치 오류', '현재 위치를 가져오는데 실패했습니다.'),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000},
    );
  }, []);

  // 썸네일(사진) 추가
  const handlePickThumbnail = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
      });

      if (!result.assets || !result.assets[0]?.uri) {
        Alert.alert('오류', '이미지를 선택하지 않았습니다.');
        return;
      }

      const localUri = result.assets[0].uri;
      const fileType = result.assets[0].type || 'image/jpeg'; // fallback

      // ✅ MIME 타입 → 확장자 매핑
      const extensionMap: {[key: string]: string} = {
        'image/jpeg': 'jpeg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
      };
      const extension = extensionMap[fileType] || 'jpg';

      // ✅ 고정된 파일명 (timestamp 기반)
      const fileName = `thumbnail_${Date.now()}.${extension}`;

      console.log('📷 localUri:', localUri);
      console.log('🖼️ fileName:', fileName);
      console.log('🧾 fileType:', fileType);

      // ✅ Presigned URL 요청
      const presignedRes = await axios.get(
        `http://124.60.137.10:80/api/upload`,
        {
          params: {
            fileName,
            contentType: fileType,
          },
        },
      );

      const {presignedUrl, downloadUrl} = presignedRes.data.data;
      console.log('📡 presignedURL:', presignedUrl);
      console.log('📡 downloadUrl:', downloadUrl);

      // ✅ fetch 방식으로 Blob 가져오기 (iOS 대응 포함)
      const response = await fetch(localUri);
      const blob = await response.blob();

      // ✅ Presigned URL로 PUT 요청
      await fetch(presignedUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': fileType,
        },
      });

      setThumbnail(downloadUrl);
      Alert.alert('✅ 업로드 완료', '썸네일이 업로드되었습니다!');
    } catch (error: any) {
      console.error(
        '🛑 이미지 업로드 오류:',
        error.response?.data || error.message || error,
      );
      Alert.alert('오류', '썸네일 업로드에 실패했습니다.');
    }
  };

  // Day 추가
  const addDay = () => {
    setDays([...days, {plans: []}]);
  };

  // Day별 일정 추가
  const addPlan = (dayIdx: number) => {
    if (!plan.place || !plan.coordinate) return;
    const newDays = [...days];
    newDays[dayIdx].plans.push({...plan});
    setDays(newDays);
    setPlan({place: '', memo: '', travelTime: 0});
  };

  // Day별 일정 삭제
  const removePlan = (dayIdx: number, planIdx: number) => {
    const newDays = [...days];
    newDays[dayIdx].plans.splice(planIdx, 1);
    setDays(newDays);
  };

  // 거리 계산 (명시적 타입 캐스팅 추가)
  const getDayDistance = (plans: DayPlan[]) => {
    let total = 0;
    for (let i = 1; i < plans.length; i++) {
      if (plans[i - 1].coordinate && plans[i].coordinate) {
        total += haversine(
          plans[i - 1].coordinate as {latitude: number; longitude: number},
          plans[i].coordinate as {latitude: number; longitude: number},
        );
      }
    }
    return total / 1000; // km
  };

  // Directions API로 경로 가져오기
  const getRouteCoordinates = async (
    origin: {latitude: number; longitude: number},
    destination: {latitude: number; longitude: number},
    key: string,
  ) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_API_KEY}&mode=driving`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes.length) {
        const points = polyline
          .decode(data.routes[0].overview_polyline.points)
          .map(([latitude, longitude]: [number, number]) => ({
            latitude,
            longitude,
          }));
        setRoutes(prev => ({...prev, [key]: points}));
      }
    } catch (e) {
      console.error('경로 가져오기 실패:', e);
    }
  };

  // Day별 장소 쌍마다 경로 요청
  useEffect(() => {
    days.forEach((day, dayIdx) => {
      for (let i = 1; i < day.plans.length; i++) {
        const prev = day.plans[i - 1].coordinate;
        const curr = day.plans[i].coordinate;
        if (prev && curr) {
          const key = `${dayIdx}-${i - 1}-${i}`;
          getRouteCoordinates(prev, curr, key);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // 여행 일정 데이터 백엔드로 전송
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      // 데이터 구성
      const data = {
        title,
        description,
        guidePrice: Number(guidePrice),
        region: regionInput,
        thumbnailUrl: thumbnail || '',
        hashtags: hashtags
          ? hashtags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
          : [],
        schedules: days.flatMap((day, dayIdx) =>
          day.plans.map((plan, seq) => ({
            day: dayIdx + 1,
            scheduleSequence: seq,
            placeName: plan.place,
            lat: plan.coordinate?.latitude ?? 0,
            lon: plan.coordinate?.longitude ?? 0,
            placeDescription: plan.memo,
            travelTime: plan.travelTime ?? 0,
          })),
        ),
      };

      console.log('전송할 데이터:', JSON.stringify(data, null, 2));
      console.log('tourProgramId:', tourProgramId);

      let response;
      if (tourProgramId) {
        try {
          // 먼저 프로그램 존재 여부 확인
          const checkResponse = await axios.get(
            `http://124.60.137.10:80/api/tour-program/${tourProgramId}`,
            {
              headers: {
                Authorization: `Bearer ${token.replace('Bearer ', '')}`,
              },
            },
          );

          if (checkResponse.data) {
            // 수정 요청
            console.log('수정 요청 시작');
            response = await axios.put(
              `http://124.60.137.10:80/api/tour-program/${tourProgramId}`,
              data,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token.replace('Bearer ', '')}`,
                },
              },
            );
            console.log('수정 응답:', response.data);
          }
        } catch (checkError) {
          if (axios.isAxiosError(checkError)) {
            console.error('프로그램 확인 중 오류:', checkError.response?.data);
          } else {
            console.error('프로그램 확인 중 알 수 없는 오류:', checkError);
          }
          Alert.alert(
            '오류',
            '해당 프로그램을 찾을 수 없습니다. 새로운 프로그램으로 등록하시겠습니까?',
            [
              {
                text: '취소',
                style: 'cancel',
              },
              {
                text: '새로 등록',
                onPress: async () => {
                  try {
                    response = await axios.post(
                      'http://124.60.137.10:80/api/tour-program',
                      data,
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token.replace(
                            'Bearer ',
                            '',
                          )}`,
                        },
                      },
                    );
                    if (response.data.status === 'OK') {
                      Alert.alert('성공', '여행 일정이 등록되었습니다!', [
                        {
                          text: '확인',
                          onPress: () => {
                            navigation.navigate('TraitSelection', {
                              newPost: {
                                data: response.data.data,
                                tourProgramId: response.data.data.tourProgramId,
                              },
                            });
                          },
                        },
                      ]);
                    }
                  } catch (error) {
                    if (axios.isAxiosError(error)) {
                      console.error('새로 등록 중 오류:', error.response?.data);
                    } else {
                      console.error('새로 등록 중 알 수 없는 오류:', error);
                    }
                    Alert.alert('오류', '새로운 프로그램 등록에 실패했습니다.');
                  }
                },
              },
            ],
          );
          return;
        }
      } else {
        // 새로 등록
        console.log('새로 등록 요청 시작');
        response = await axios.post(
          'http://124.60.137.10:80/api/tour-program',
          data,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token.replace('Bearer ', '')}`,
            },
          },
        );
        console.log('등록 응답:', response.data);
      }

      if (response?.data.status === 'OK') {
        Alert.alert(
          '성공',
          tourProgramId
            ? '투어 프로그램이 수정되었습니다!'
            : '여행 일정이 등록되었습니다!',
          [
            {
              text: '확인',
              onPress: () => {
                navigation.navigate('TraitSelection', {
                  newPost: {
                    data: response.data.data,
                    tourProgramId:
                      tourProgramId || response.data.data.tourProgramId,
                  },
                });
              },
            },
          ],
        );
      }
    } catch (error: any) {
      console.error('에러 상세:', error.response?.data || error);
      console.error('요청 데이터:', error.config?.data);
      Alert.alert(
        '오류',
        `등록 중 오류가 발생했습니다.\n${
          error.response?.data?.message || error.message
        }`,
      );
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {/* 장소 자동완성 모달 */}
      <Modal
        visible={placeModalVisible}
        animationType="slide"
        transparent={false}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            zIndex: 1000,
            overflow: 'visible',
          }}>
          <GooglePlacesAutocomplete
            placeholder="장소 검색"
            minLength={2}
            fetchDetails={true}
            onPress={(data, details = null) => {
              if (details) {
                const {lat, lng} = details.geometry.location;
                setPlan(p => ({
                  ...p,
                  place: data.description,
                  coordinate: {latitude: lat, longitude: lng},
                }));
                setPlaceModalVisible(false);
              }
            }}
            query={{
              key: GOOGLE_API_KEY,
              language: 'ko',
            }}
            styles={{
              textInput: styles.input,
              listView: {
                backgroundColor: 'white',
                zIndex: 2000,
              },
            }}
            enablePoweredByContainer={false}
            debounce={300}
          />
          <Button title="닫기" onPress={() => setPlaceModalVisible(false)} />
        </View>
      </Modal>
      {!placeModalVisible && (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}>
          {/* 상단: 썸네일 + 제목/소개 + region/guidePrice/hashtags 입력란 */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.thumbnailBox}
              onPress={handlePickThumbnail}>
              {thumbnail ? (
                <Image
                  source={{uri: thumbnail}}
                  style={styles.thumbnailImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbnailText}>사진추가</Text>
                  <Text style={styles.thumbnailSubText}>클릭하여 선택</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.titleBox}>
              <TextInput
                style={styles.titleInput}
                placeholder="제목"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.descInput}
                placeholder="소개"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="지역"
                value={regionInput}
                onChangeText={setRegionInput}
              />
              <TextInput
                style={styles.input}
                placeholder="가이드 가격"
                value={guidePrice}
                onChangeText={setGuidePrice}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="해시태그 (쉼표로 구분)"
                value={hashtags}
                onChangeText={setHashtags}
              />
            </View>
          </View>

          {/* 지도 */}
          <View style={styles.mapBox}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}>
              {days.map((day, dayIdx) => (
                <React.Fragment key={dayIdx}>
                  {/* 마커 */}
                  {day.plans.map(
                    (p, planIdx) =>
                      p.coordinate && (
                        <Marker
                          key={`${dayIdx}-${planIdx}`}
                          coordinate={p.coordinate}
                          title={p.place}
                          description={p.memo}
                          pinColor={dayColors[dayIdx % dayColors.length]}
                        />
                      ),
                  )}
                  {/* Directions API 경로 Polyline */}
                  {day.plans.length > 1 &&
                    day.plans.slice(1).map((p, idx) => {
                      const key = `${dayIdx}-${idx}-${idx + 1}`;
                      const routeCoords = routes[key];
                      return (
                        routeCoords && (
                          <Polyline
                            key={`route-${key}`}
                            coordinates={routeCoords}
                            strokeColor={dayColors[dayIdx % dayColors.length]}
                            strokeWidth={3}
                          />
                        )
                      );
                    })}
                  {/* 거리 표시 */}
                  {day.plans.length > 1 &&
                    day.plans.slice(1).map((p, idx) => {
                      const prev = day.plans[idx].coordinate as {
                        latitude: number;
                        longitude: number;
                      };
                      const curr = p.coordinate as {
                        latitude: number;
                        longitude: number;
                      };
                      const dist = haversine(prev, curr) / 1000;
                      const mid = {
                        latitude: (prev.latitude + curr.latitude) / 2,
                        longitude: (prev.longitude + curr.longitude) / 2,
                      };
                      return (
                        <Marker
                          key={`dist-${dayIdx}-${idx}`}
                          coordinate={mid}
                          anchor={{x: 0.5, y: 0.5}}>
                          <View
                            style={[
                              styles.distanceBox,
                              {
                                borderColor:
                                  dayColors[dayIdx % dayColors.length],
                              },
                            ]}>
                            <Text
                              style={[
                                styles.distanceText,
                                {color: dayColors[dayIdx % dayColors.length]},
                              ]}>
                              {dist.toFixed(1)}km
                            </Text>
                          </View>
                        </Marker>
                      );
                    })}
                </React.Fragment>
              ))}
            </MapView>
            {/* 총 거리 표시 */}
            {days[selectedDay].plans.length > 1 && (
              <View style={styles.totalDistanceBox}>
                <Text style={styles.totalDistanceText}>
                  총 거리: {getDayDistance(days[selectedDay].plans).toFixed(1)}
                  km
                </Text>
              </View>
            )}
          </View>

          {/* Day별 일정 */}
          {days.map((day, idx) => (
            <View key={idx} style={styles.dayBox}>
              <TouchableOpacity onPress={() => setSelectedDay(idx)}>
                <Text
                  style={[
                    styles.dayTitle,
                    selectedDay === idx && {
                      fontWeight: 'bold',
                      textDecorationLine: 'underline',
                      color: dayColors[idx % dayColors.length],
                    },
                  ]}>
                  Day {idx + 1}
                </Text>
              </TouchableOpacity>
              {day.plans.map((p, pIdx) => (
                <View key={pIdx}>
                  <View style={styles.planItem}>
                    <Text style={{flex: 1}}>
                      {p.place} {p.memo ? `- ${p.memo}` : ''}
                    </Text>
                    <TouchableOpacity onPress={() => removePlan(idx, pIdx)}>
                      <Text style={{color: 'red'}}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                  {/* 다음 장소가 있다면 거리와 세로선 표시 */}
                  {pIdx < day.plans.length - 1 &&
                    day.plans[pIdx + 1].coordinate &&
                    p.coordinate && (
                      <View
                        style={{
                          alignItems: 'center',
                          marginVertical: 0,
                          flexDirection: 'column',
                          height: 50,
                          justifyContent: 'center',
                        }}>
                        <View
                          style={{
                            width: 2,
                            height: 30,
                            backgroundColor: dayColors[idx % dayColors.length],
                          }}
                        />
                        <Text
                          style={{
                            color: dayColors[idx % dayColors.length],
                            fontWeight: 'bold',
                            marginVertical: 2,
                            fontSize: 13,
                          }}>
                          {(
                            haversine(
                              p.coordinate as {
                                latitude: number;
                                longitude: number;
                              },
                              day.plans[pIdx + 1].coordinate as {
                                latitude: number;
                                longitude: number;
                              },
                            ) / 1000
                          ).toFixed(1)}
                          km
                        </Text>
                        <View
                          style={{
                            width: 2,
                            height: 10,
                            backgroundColor: dayColors[idx % dayColors.length],
                          }}
                        />
                      </View>
                    )}
                </View>
              ))}
              {/* 장소 입력란, 메모, 추가 버튼 등 기존 코드 유지 */}
              <View style={styles.planInputRow}>
                <TextInput
                  style={[styles.input, {flex: 2}]}
                  placeholder="장소"
                  value={selectedDay === idx ? plan.place : ''}
                  onFocus={() => {
                    setSelectedDay(idx);
                    setPlaceModalVisible(true);
                  }}
                  editable={true}
                />
                <TextInput
                  style={[styles.input, {flex: 2}]}
                  placeholder="메모"
                  value={selectedDay === idx ? plan.memo : ''}
                  onChangeText={text => {
                    setSelectedDay(idx);
                    setPlan(p => ({...p, memo: text}));
                  }}
                />
                <TextInput
                  style={[styles.input, {flex: 1}]}
                  placeholder="소요시간(분)"
                  value={selectedDay === idx ? plan.travelTime?.toString() : ''}
                  onChangeText={text => {
                    setSelectedDay(idx);
                    setPlan(p => ({...p, travelTime: parseInt(text) || 0}));
                  }}
                  keyboardType="numeric"
                />
                <Button title="추가" onPress={() => addPlan(idx)} />
              </View>
            </View>
          ))}
          <Button title="일정 추가" onPress={addDay} />
          <View style={{height: 20}} />
          <Button title="게시하기" onPress={handleSubmit} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  thumbnailBox: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 4,
  },
  thumbnailSubText: {
    color: '#999',
    fontSize: 12,
  },
  titleBox: {
    flex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    padding: 4,
  },
  descInput: {
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  mapBox: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    flex: 1,
  },
  markerNumberBox: {
    backgroundColor: '#0288d1',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  distanceBox: {
    backgroundColor: '#fffbe6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff9800',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  distanceText: {
    color: '#ff9800',
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: '#fff',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  totalDistanceBox: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0288d1',
    zIndex: 10,
  },
  totalDistanceText: {
    color: '#0288d1',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dayBox: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  planInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 5,
    fontSize: 15,
    backgroundColor: '#fff',
  },
});

export default Make_program;
