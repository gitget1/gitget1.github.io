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
  Platform,
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
  placeId?: string;
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
    latitude: 36.7994, // 순천향대학교 위도
    longitude: 126.9306, // 순천향대학교 경도
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const navigation = useNavigation();
  const [routes, setRoutes] = useState<{
    [key: string]: {latitude: number; longitude: number}[];
  }>({});
  const [routeDistances, setRouteDistances] = useState<{
    [key: string]: number;
  }>({});
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (editData) {
      setThumbnail(editData.thumbnailUrl);
      setTitle(editData.title);
      setDescription(editData.description);
      setRegionInput(editData.region);
      setGuidePrice(editData.guidePrice.toString());
      setHashtags(editData.hashtags.join(', '));

      // 일정 데이터 변환 - day별로 그룹화
      const schedulesByDay: DayPlan[][] = editData.schedules.reduce(
        (acc: DayPlan[][], schedule) => {
          const dayIndex = schedule.day - 1; // day는 1부터 시작하므로 -1
          if (!acc[dayIndex]) {
            acc[dayIndex] = [];
          }
          acc[dayIndex].push({
            place: schedule.placeName,
            memo: schedule.placeDescription,
            travelTime: schedule.travelTime,
            coordinate: {
              latitude: schedule.lat,
              longitude: schedule.lon,
            },
            placeId: schedule.placeId,
          });
          return acc;
        },
        [],
      );

      // day별로 정렬된 일정을 days 배열에 설정
      const convertedDays: DaySchedule[] = [];
      const maxDay = Math.max(...editData.schedules.map(s => s.day));

      for (let i = 0; i < maxDay; i++) {
        convertedDays.push({
          plans: schedulesByDay[i] || [],
        });
      }

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
    } else {
      // 편집 모드가 아닐 때만 현재 위치 가져오기
      getCurrentLocation();
    }
  }, [editData]);

  // 현재 위치 가져오기 함수
  const getCurrentLocation = () => {
    setLocationLoading(true);

    // 개발 모드에서 에뮬레이터 감지 (실제 기기에서는 이 조건이 false)
    const isEmulator = __DEV__ && Platform.OS === 'android';

    if (isEmulator) {
      // 에뮬레이터에서는 순천향대학교 위치로 설정
      const soonchunhyangLocation = {
        latitude: 36.7994,
        longitude: 126.9306,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(soonchunhyangLocation);
      setCurrentLocation({
        latitude: 36.7994,
        longitude: 126.9306,
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion(soonchunhyangLocation, 1000);
      }

      setLocationLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const newRegion = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        // 지도를 현재 위치로 이동
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        setLocationLoading(false);
        Alert.alert('위치 확인', '현재 위치로 이동했습니다.');
      },
      (error: GeolocationError) => {
        setLocationLoading(false);
        console.error('위치 오류:', error);

        // 에러 발생 시 기본 위치로 설정
        const defaultLocation = {
          latitude: 36.7994,
          longitude: 126.9306,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(defaultLocation);
        setCurrentLocation({
          latitude: 36.7994,
          longitude: 126.9306,
        });

        if (mapRef.current) {
          mapRef.current.animateToRegion(defaultLocation, 1000);
        }

        Alert.alert(
          '위치 오류',
          `현재 위치를 가져올 수 없어 기본 위치(순천향대학교)로 설정합니다.\n\n실제 기기에서 테스트해주세요.`,
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

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
        `http://124.60.137.10:8083/api/upload`,
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
    if (!plan.placeId) {
      Alert.alert('오류', '장소 고유 ID(placeId)가 없습니다. 장소를 다시 선택해 주세요.');
      return;
    }
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
        // 경로 좌표 저장
        const points = polyline
          .decode(data.routes[0].overview_polyline.points)
          .map(([latitude, longitude]: [number, number]) => ({
            latitude,
            longitude,
          }));
        setRoutes(prev => ({...prev, [key]: points}));

        // 실제 도로 거리 저장 (미터 단위를 킬로미터로 변환)
        const distanceInKm = data.routes[0].legs[0].distance.value / 1000;
        setRouteDistances(prev => ({...prev, [key]: distanceInKm}));
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
            day: dayIdx + 1, // 1부터 시작
            scheduleSequence: seq,
            placeId: plan.placeId || '', // 반드시 구글 고유 id만 저장
            placeName: plan.place, // 장소명만 저장
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
            `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
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
              `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
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
                      'http://124.60.137.10:8083/api/tour-program',
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
          'http://124.60.137.10:8083/api/tour-program',
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
        if (tourProgramId) {
          // 수정 모드: 스택을 재구성하여 TraitSelection과 PracticeDetail 모두 새로고침
          Alert.alert('성공', '투어 프로그램이 수정되었습니다!', [
            {
              text: '확인',
              onPress: () => {
                // 스택을 완전히 재구성: TraitSelection → PracticeDetail
                navigation.reset({
                  index: 1, // PracticeDetail이 현재 화면 (index 1)
                  routes: [
                    {
                      name: 'TraitSelection',
                      params: {forceRefresh: true}, // TraitSelection 새로고침
                    },
                    {
                      name: 'PracticeDetail',
                      params: {
                        tourProgramId: tourProgramId,
                        refresh: true, // PracticeDetail 새로고침
                      },
                    },
                  ],
                });
              },
            },
          ]);
        } else {
          // 새로 등록 모드: 기존 로직 유지
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
              try {
                if (details && details.geometry && details.geometry.location) {
                  const {lat, lng} = details.geometry.location;
                  // 장소명에서 상세주소 제외, 쉼표 앞 첫 단어 또는 마지막 단어만 추출
                  let onlyPlaceName = data.description;
                  if (onlyPlaceName && onlyPlaceName.includes(',')) {
                    onlyPlaceName = onlyPlaceName.split(',')[0].trim();
                  } else if (onlyPlaceName) {
                    // 쉼표가 없으면 마지막 단어만 추출
                    const words = onlyPlaceName.trim().split(' ');
                    onlyPlaceName = words[words.length - 1];
                  }
                  setPlan(p => ({
                    ...p,
                    place: onlyPlaceName, // 장소명만 저장
                    coordinate: {latitude: lat, longitude: lng},
                    placeId: data.place_id, // 구글 고유 id만 저장
                  }));
                  setPlaceModalVisible(false);
                } else {
                  console.warn('⚠️ 장소 상세 정보를 가져올 수 없습니다:', details);
                  Alert.alert('알림', '장소 정보를 가져올 수 없습니다. 다시 시도해주세요.');
                }
              } catch (error) {
                console.error('❌ 장소 선택 중 오류 발생:', error);
                Alert.alert('오류', '장소 선택 중 문제가 발생했습니다.');
              }
            }}
            query={{
              key: GOOGLE_API_KEY,
              language: 'ko',
              types: 'establishment', // 장소 타입 제한
            }}
            styles={{
              textInput: styles.input,
              listView: {
                backgroundColor: 'white',
                zIndex: 2000,
              },
            }}
            enablePoweredByContainer={false}
            debounce={500} // 디바운스 시간 증가
            timeout={15000} // 타임아웃 설정
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
              onRegionChangeComplete={setRegion}
              showsUserLocation={true}
              showsMyLocationButton={false}>
              {/* 현재 위치 마커 */}
              {currentLocation && (
                <Marker
                  coordinate={currentLocation}
                  title="현재 위치"
                  description="내가 있는 곳"
                  pinColor="#FF0000">
                  <View style={styles.currentLocationMarker}>
                    <Text style={styles.currentLocationText}>📍</Text>
                  </View>
                </Marker>
              )}

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
                      const key = `${dayIdx}-${idx}-${idx + 1}`;
                      const roadDistance = routeDistances[key];

                      // 실제 도로 거리가 있으면 사용, 없으면 직선 거리 사용
                      let displayDistance;
                      if (roadDistance) {
                        displayDistance = roadDistance;
                      } else {
                        const prev = day.plans[idx].coordinate as {
                          latitude: number;
                          longitude: number;
                        };
                        const curr = p.coordinate as {
                          latitude: number;
                          longitude: number;
                        };
                        displayDistance = haversine(prev, curr) / 1000;
                      }

                      const prev = day.plans[idx].coordinate as {
                        latitude: number;
                        longitude: number;
                      };
                      const curr = p.coordinate as {
                        latitude: number;
                        longitude: number;
                      };
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
                              {displayDistance.toFixed(1)}km
                              {roadDistance && (
                                <Text style={{fontSize: 10}}> 🛣️</Text>
                              )}
                            </Text>
                          </View>
                        </Marker>
                      );
                    })}
                </React.Fragment>
              ))}
            </MapView>

            {/* 현재 위치 버튼 */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}>
              <Text style={styles.locationButtonText}>
                {locationLoading ? '📍' : '🎯'}
              </Text>
            </TouchableOpacity>

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

          {/* 본문 입력 */}
          <View style={styles.contentBox}>
            <TextInput
              style={styles.contentInput}
              placeholder="본문을 입력하세요"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
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
                            width: 3,
                            height: 30,
                            backgroundColor: dayColors[idx % dayColors.length],
                          }}
                        />
                        <Text
                          style={{
                            color: dayColors[idx % dayColors.length],
                            fontWeight: '900',
                            marginVertical: 2,
                            fontSize: 15,
                            textShadowColor: '#ffffff',
                            textShadowOffset: {width: 1, height: 1},
                            textShadowRadius: 2,
                            letterSpacing: 0.3,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: dayColors[idx % dayColors.length],
                          }}>
                          {(() => {
                            const key = `${idx}-${pIdx}-${pIdx + 1}`;
                            const roadDistance = routeDistances[key];

                            if (roadDistance) {
                              return `${roadDistance.toFixed(1)}km 🛣️`;
                            } else {
                              const directDistance =
                                haversine(
                                  p.coordinate as {
                                    latitude: number;
                                    longitude: number;
                                  },
                                  day.plans[pIdx + 1].coordinate as {
                                    latitude: number;
                                    longitude: number;
                                  },
                                ) / 1000;
                              return `${directDistance.toFixed(1)}km`;
                            }
                          })()}
                        </Text>
                        <View
                          style={{
                            width: 3,
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ff9800',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  distanceText: {
    color: '#ff6f00',
    fontWeight: '900',
    fontSize: 16,
    textShadowColor: '#ffffff',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
    letterSpacing: 0.5,
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
  contentBox: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  contentInput: {
    minHeight: 150,
    padding: 15,
    fontSize: 16,
    lineHeight: 24,
  },
  locationButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#0288d1',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentLocationMarker: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  currentLocationText: {
    fontSize: 18,
  },
});

export default Make_program;
