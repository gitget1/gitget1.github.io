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
  FlatList,
  PermissionsAndroid,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
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
  googlePlaceId?: string;
}

interface DaySchedule {
  plans: DayPlan[];
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
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

/** 충청남도 시·군 좌표 (대략 중심) */
const CHUNGNAM_REGIONS: Array<{
  name: string;
  latitude: number;
  longitude: number;
}> = [
  {name: '천안시', latitude: 36.8151, longitude: 127.1139},
  {name: '아산시', latitude: 36.7899, longitude: 127.0019},
  {name: '공주시', latitude: 36.4468, longitude: 127.119},
  {name: '보령시', latitude: 36.3335, longitude: 126.6129},
  {name: '서산시', latitude: 36.7845, longitude: 126.45},
  {name: '논산시', latitude: 36.1872, longitude: 127.098},
  {name: '당진시', latitude: 36.8925, longitude: 126.629},
  {name: '계룡시', latitude: 36.2746, longitude: 127.2486},
  {name: '금산군', latitude: 36.1086, longitude: 127.4889},
  {name: '부여군', latitude: 36.2753, longitude: 126.9097},
  {name: '서천군', latitude: 36.0808, longitude: 126.6912},
  {name: '청양군', latitude: 36.4591, longitude: 126.8022},
  {name: '홍성군', latitude: 36.6011, longitude: 126.6608},
  {name: '예산군', latitude: 36.682, longitude: 126.8486},
  {name: '태안군', latitude: 36.7457, longitude: 126.2987},
];

/** 선택형 해시태그('#' 제거) */
const HASHTAG_OPTIONS = [
  '혼자여행',
  '커플여행',
  '가족여행',
  '우정여행',
  '여행버디',
  '즉흥여행',
  '계획여행',
  '자연여행',
  '도시탐방',
  '문화유산',
  '힐링여행',
  '액티비티',
  '맛집투어',
  '야경명소',
  '해수욕장',
  '산정상뷰',
  '계곡여행',
  '한옥마을',
  '전통시장',
  '한강산책',
  '감성숙소',
  '가성비숙소',
  '한적한여행',
  '혼산',
  '혼캠',
  '감성사진',
  '카페투어',
  '야경촬영',
  '자연과함께',
  '힐링산책',
  '산림욕',
  '한적한바닷가',
  '로컬푸드',
  '재충전',
  '계획없이떠나기',
  '사진맛집',
  '편한여행',
  '감성여행',
  '조용한여행',
  '감성가득',
  '쉼표여행',
  '마음정리',
  '트레킹',
  '일상탈출',
  '소확행',
  '걷기좋은길',
  '하늘풍경',
  '초록자연',
  '일몰명소',
  '바람쐬기',
];

function Make_program() {
  const route = useRoute<RouteProp<AppStackParamList, 'Make_program'>>();
  const editData = route.params?.editData;
  const tourProgramId = route.params?.tourProgramId;
  const isEdit = route.params?.isEdit || false;

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<DaySchedule[]>([{plans: []}]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [plan, setPlan] = useState<DayPlan>({
    place: '',
    memo: '',
    travelTime: undefined,
  });
  const [regionInput, setRegionInput] = useState('');
  const [guidePrice, setGuidePrice] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]); // ✅ 해시태그 다중 선택 상태
  const [region, setRegion] = useState<Region>({
    latitude: 36.7994, // 순천향대학교 위도
    longitude: 126.9306, // 순천향대학교 경도
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [regionSelectVisible, setRegionSelectVisible] = useState(false);
  const [hashtagModalVisible, setHashtagModalVisible] = useState(false);
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
  const [editingPlan, setEditingPlan] = useState<{
    dayIdx: number;
    planIdx: number;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false); // 지도 애니메이션 중인지 확인
  const [watchId, setWatchId] = useState<number | null>(null); // 위치 감시 ID

  useEffect(() => {
    if (editData) {
      setThumbnail(editData.thumbnailUrl);
      setTitle(editData.title);
      setDescription(editData.description);
      setRegionInput(editData.region);
      setGuidePrice(editData.guidePrice.toString());
      // ✅ 해시태그 초기화 ('#' 제거)
      const initialTags: string[] = Array.isArray(editData.hashtags)
        ? editData.hashtags.map((t: string) => t.replace(/^#/, ''))
        : [];
      setSelectedHashtags(initialTags);

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
            googlePlaceId: schedule.googlePlaceId || schedule.placeId, // googlePlaceId 우선, 없으면 placeId 사용
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
      // 편집 모드가 아닐 때만 현재 위치 가져오기 (메시지 없이)
      getCurrentLocationSilently();
    }
  }, [editData]);

  // 컴포넌트 언마운트 시 위치 감시 정리
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
        console.log('📍 위치 감시 정리됨');
      }
    };
  }, [watchId]);

  // 위치 권한 요청 (Android)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 요청',
            message: '현재 위치를 표시하기 위해 위치 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '취소',
            buttonPositive: '확인',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS는 자동으로 권한 요청
  };

  // 현재 위치 가져오기 함수 (메시지 없이, 페이지 진입 시 사용)
  const getCurrentLocationSilently = async () => {
    setLocationLoading(true);

    // 위치 권한 확인
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocationLoading(false);
      return;
    }

    // 개발 모드에서 에뮬레이터 감지 (실제 기기에서는 이 조건이 false)
    const isEmulator = __DEV__ && Platform.OS === 'android';

    if (isEmulator) {
      // 에뮬레이터에서는 순천향대학교 위치로 설정
      const soonchunhyangLocation = {
        latitude: 36.7994,
        longitude: 126.9306,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(soonchunhyangLocation);
      setCurrentLocation({
        latitude: 36.7994,
        longitude: 126.9306,
      });

      if (mapRef.current) {
        setIsAnimating(true);
        mapRef.current.animateToRegion(soonchunhyangLocation, 1000);
        setTimeout(() => setIsAnimating(false), 1200);
      }

      setLocationLoading(false);
      return;
    }

    // 더 정확한 위치를 위해 여러 번 시도
    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 2; // 페이지 진입 시에는 2번만 시도

    const tryGetLocation = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            console.log(`📍 GPS 시도 ${attempts + 1} (조용히):`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });

            // 정확도가 더 좋은 위치를 선택
            if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
              bestPosition = position;
            }

            // 정확도가 20m 이하이거나 최대 시도 횟수에 도달하면 완료
            if (position.coords.accuracy <= 20 || attempts >= maxAttempts - 1) {
              resolve(bestPosition!);
            } else {
              attempts++;
              // 1초 후 다시 시도
              setTimeout(() => {
                tryGetLocation().then(resolve).catch(reject);
              }, 1000);
            }
          },
          (error: GeolocationError) => {
            console.error(`위치 오류 (시도 ${attempts + 1}):`, error);
            attempts++;
            
            if (attempts >= maxAttempts) {
              reject(error);
            } else {
              // 1초 후 다시 시도
              setTimeout(() => {
                tryGetLocation().then(resolve).catch(reject);
              }, 1000);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // 각 시도마다 10초 타임아웃
            maximumAge: 0, // 캐시된 위치 사용하지 않음
            distanceFilter: 0, // 거리 필터 없음
          },
        );
      });
    };

    try {
      const position = await tryGetLocation();
      
      console.log('📍 최종 GPS 위치 (조용히):', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });

      const newRegion = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01, // 기본 줌 레벨
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      // 지도를 현재 위치로 이동
      if (mapRef.current) {
        setIsAnimating(true);
        mapRef.current.animateToRegion(newRegion, 1000);
        setTimeout(() => setIsAnimating(false), 1200);
      }

      setLocationLoading(false);
      
    } catch (error: any) {
      setLocationLoading(false);
      console.error('최종 위치 오류 (조용히):', error);

      // 에러 발생 시 기본 위치로 설정
      const defaultLocation = {
        latitude: 36.7994,
        longitude: 126.9306,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(defaultLocation);
      setCurrentLocation({
        latitude: 36.7994,
        longitude: 126.9306,
      });

      if (mapRef.current) {
        setIsAnimating(true);
        mapRef.current.animateToRegion(defaultLocation, 1000);
        setTimeout(() => setIsAnimating(false), 1200);
      }
    }
  };

  // 현재 위치 가져오기 함수 (더 정확한 GPS 설정, 버튼 클릭 시 사용)
  const getCurrentLocation = async () => {
    setLocationLoading(true);

    // 위치 권한 확인
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocationLoading(false);
      Alert.alert('권한 필요', '위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.');
      return;
    }

    // 개발 모드에서 에뮬레이터 감지 (실제 기기에서는 이 조건이 false)
    const isEmulator = __DEV__ && Platform.OS === 'android';

    if (isEmulator) {
      // 에뮬레이터에서는 순천향대학교 위치로 설정
      const soonchunhyangLocation = {
        latitude: 36.7994,
        longitude: 126.9306,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(soonchunhyangLocation);
      setCurrentLocation({
        latitude: 36.7994,
        longitude: 126.9306,
      });

      if (mapRef.current) {
        setIsAnimating(true);
        mapRef.current.animateToRegion(soonchunhyangLocation, 1000);
        setTimeout(() => setIsAnimating(false), 1200);
      }

      setLocationLoading(false);
      Alert.alert('위치 확인', '현재 위치로 이동했습니다.');
      return;
    }

    // 더 정확한 위치를 위해 여러 번 시도
    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    const tryGetLocation = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position: GeolocationPosition) => {
            console.log(`📍 GPS 시도 ${attempts + 1}:`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(position.timestamp).toLocaleString(),
            });

            // 정확도가 더 좋은 위치를 선택
            if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
              bestPosition = position;
            }

            // 정확도가 10m 이하이거나 최대 시도 횟수에 도달하면 완료
            if (position.coords.accuracy <= 10 || attempts >= maxAttempts - 1) {
              resolve(bestPosition!);
            } else {
              attempts++;
              // 2초 후 다시 시도
              setTimeout(() => {
                tryGetLocation().then(resolve).catch(reject);
              }, 2000);
            }
          },
          (error: GeolocationError) => {
            console.error(`위치 오류 (시도 ${attempts + 1}):`, error);
            attempts++;
            
            if (attempts >= maxAttempts) {
              reject(error);
            } else {
              // 2초 후 다시 시도
              setTimeout(() => {
                tryGetLocation().then(resolve).catch(reject);
              }, 2000);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // 각 시도마다 15초 타임아웃
            maximumAge: 0, // 캐시된 위치 사용하지 않음
            distanceFilter: 0, // 거리 필터 없음
          },
        );
      });
    };

    try {
      const position = await tryGetLocation();
      
      console.log('📍 최종 GPS 위치:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toLocaleString(),
      });

      const newRegion = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.005, // 더 가까운 줌 레벨
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      // 지도를 현재 위치로 이동
      if (mapRef.current) {
        setIsAnimating(true);
        mapRef.current.animateToRegion(newRegion, 1000);
        setTimeout(() => setIsAnimating(false), 1200);
      }

      // 정확도가 낮으면 위치 감시 시작
      if (position.coords.accuracy > 10) {
        console.log('📍 정확도가 낮아 위치 감시를 시작합니다...');
        
        // 기존 감시 중지
        if (watchId !== null) {
          Geolocation.clearWatch(watchId);
        }

        const newWatchId = Geolocation.watchPosition(
          (watchedPosition: GeolocationPosition) => {
            console.log('📍 위치 감시 업데이트:', {
              latitude: watchedPosition.coords.latitude,
              longitude: watchedPosition.coords.longitude,
              accuracy: watchedPosition.coords.accuracy,
            });

            // 정확도가 개선되면 위치 업데이트
            if (watchedPosition.coords.accuracy < position.coords.accuracy) {
              const updatedRegion = {
                latitude: watchedPosition.coords.latitude,
                longitude: watchedPosition.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              };
              setRegion(updatedRegion);
              setCurrentLocation({
                latitude: watchedPosition.coords.latitude,
                longitude: watchedPosition.coords.longitude,
              });

              if (mapRef.current) {
                setIsAnimating(true);
                mapRef.current.animateToRegion(updatedRegion, 1000);
                setTimeout(() => setIsAnimating(false), 1200);
              }

              // 정확도가 충분히 좋아지면 감시 중지
              if (watchedPosition.coords.accuracy <= 5) {
                Geolocation.clearWatch(newWatchId);
                setWatchId(null);
                console.log('📍 위치 감시 중지 (정확도 충분)');
              }
            }
          },
          (error: GeolocationError) => {
            console.error('위치 감시 오류:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000, // 1초마다 업데이트
            distanceFilter: 1, // 1미터 이상 이동시에만 업데이트
          }
        );

        setWatchId(newWatchId);
        
        // 30초 후 자동으로 감시 중지
        setTimeout(() => {
          if (newWatchId !== null) {
            Geolocation.clearWatch(newWatchId);
            setWatchId(null);
            console.log('📍 위치 감시 자동 중지 (30초 경과)');
          }
        }, 30000);
      }

      setLocationLoading(false);
      
      // 정확도에 따른 메시지
      let accuracyMessage = '';
      if (position.coords.accuracy <= 5) {
        accuracyMessage = '매우 정확한 위치입니다';
      } else if (position.coords.accuracy <= 10) {
        accuracyMessage = '정확한 위치입니다';
      } else if (position.coords.accuracy <= 20) {
        accuracyMessage = '적당한 정확도입니다. 위치를 더 정확하게 조정 중...';
      } else {
        accuracyMessage = '정확도가 낮습니다. 실외에서 다시 시도해보세요';
      }

      Alert.alert(
        '위치 확인', 
        `${accuracyMessage}\n정확도: ${Math.round(position.coords.accuracy)}m`
      );
      
    } catch (error: any) {
      setLocationLoading(false);
      console.error('최종 위치 오류:', error);

      // 에러 발생 시 기본 위치로 설정
      const defaultLocation = {
        latitude: 36.7994,
        longitude: 126.9306,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(defaultLocation);
      setCurrentLocation({
        latitude: 36.7994,
        longitude: 126.9306,
      });

      if (mapRef.current) {
        setIsAnimating(true);
        mapRef.current.animateToRegion(defaultLocation, 1000);
        setTimeout(() => setIsAnimating(false), 1200);
      }

      Alert.alert(
        '위치 오류',
        `현재 위치를 가져올 수 없습니다.\n\n오류: ${error.message}\n\n기본 위치로 이동합니다.\n\n실외에서 다시 시도해보세요.`,
      );
    }
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

  // Day별 일정 추가/수정
  const addPlan = (dayIdx: number) => {
    if (!plan.place || !plan.coordinate) return;
    if (!plan.googlePlaceId) {
      Alert.alert('오류', '장소 고유 ID(googlePlaceId)가 없습니다. 장소를 다시 선택해 주세요.');
      return;
    }
    
    const newDays = [...days];
    
    if (editingPlan && editingPlan.dayIdx === dayIdx && editingPlan.planIdx !== undefined) {
      // 수정 모드: 기존 일정 업데이트
      newDays[dayIdx].plans[editingPlan.planIdx] = {...plan};
      setEditingPlan(null); // 수정 모드 해제
    } else {
      // 추가 모드: 새 일정 추가
      newDays[dayIdx].plans.push({...plan});
    }
    
    setDays(newDays);
    
    
    setPlan({place: '', memo: '', travelTime: undefined});
  };

  // Day별 일정 삭제
  const removePlan = (dayIdx: number, planIdx: number) => {
    const newDays = [...days];
    newDays[dayIdx].plans.splice(planIdx, 1);
    setDays(newDays);
  };

  // Day별 일정 수정
  const editPlan = (dayIdx: number, planIdx: number) => {
    const planToEdit = days[dayIdx].plans[planIdx];
    setSelectedDay(dayIdx);
    setPlan({
      place: planToEdit.place,
      memo: planToEdit.memo,
      travelTime: planToEdit.travelTime || undefined,
      coordinate: planToEdit.coordinate,
      googlePlaceId: planToEdit.googlePlaceId,
    });
    
    // 수정 모드 활성화
    setEditingPlan({ dayIdx, planIdx });
    
    // 장소 검색 모달 열기
    setPlaceModalVisible(true);
  };

  /** 지역 선택 처리 */
  const handleSelectRegion = (
    name: string,
    latitude: number,
    longitude: number,
  ) => {
    setRegionInput(name);
    const newRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 600);
    setRegionSelectVisible(false);
  };

  /** 해시태그 토글 */
  const toggleHashtag = (tag: string) => {
    setSelectedHashtags(prev => {
      const exists = prev.includes(tag);
      if (exists) {
        return prev.filter(t => t !== tag);
      }
      if (prev.length >= 10) {
        Alert.alert('알림', '해시태그는 최대 10개까지 선택 가능합니다.');
        return prev;
      }
      return [...prev, tag];
    });
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
      
      const cleanToken = token.replace('Bearer ', '');
      console.log('🔍 토큰 정보:', {
        originalToken: token.substring(0, 20) + '...',
        cleanToken: cleanToken.substring(0, 20) + '...',
      });

      // 데이터 검증 및 구성
      if (!title.trim()) {
        Alert.alert('오류', '제목을 입력해주세요.');
        return;
      }
      
      if (!description.trim()) {
        Alert.alert('오류', '설명을 입력해주세요.');
        return;
      }
      
      if (!regionInput.trim()) {
        Alert.alert('오류', '지역을 입력해주세요.');
        return;
      }
      
      if (!guidePrice || Number(guidePrice) <= 0) {
        Alert.alert('오류', '올바른 가격을 입력해주세요.');
        return;
      }
      
      // 해시태그가 없으면 기본 해시태그 추가
      console.log('🔍 해시태그 상태 확인:', {
        selectedHashtags,
        selectedHashtagsLength: selectedHashtags.length
      });
      
      // 강제로 해시태그 설정 (임시 해결책)
      const finalHashtags = selectedHashtags.length > 0 
        ? selectedHashtags 
        : ['여행', '투어프로그램']; // 기본 해시태그
      
      // 추가 안전장치: 빈 배열이면 강제로 기본 해시태그 설정
      if (finalHashtags.length === 0) {
        finalHashtags.push('여행', '투어프로그램');
        console.log('⚠️ 빈 배열 감지! 강제로 기본 해시태그 추가:', finalHashtags);
      }
      
      console.log('🔍 최종 해시태그:', finalHashtags);
      
      // schedules 데이터 검증 및 정제
      const validSchedules = days.flatMap((day, dayIdx) =>
        day.plans.map((plan, seq) => {
          if (!plan.place || !plan.coordinate) {
            console.warn(`⚠️ Day ${dayIdx + 1}의 ${seq + 1}번째 일정에 좌표 정보가 없습니다.`);
            return null;
          }
          
          // placeDescription 길이 제한 (100자로 더 엄격하게)
          let cleanDescription = plan.memo || '';
          if (cleanDescription.length > 100) {
            cleanDescription = cleanDescription.substring(0, 100) + '...';
            console.warn(`⚠️ Day ${dayIdx + 1}의 ${seq + 1}번째 일정 설명이 100자를 초과하여 잘렸습니다.`);
          }
          
            // googlePlaceId 정제 (Google Places ID가 너무 길면 간단한 ID로 대체)
            let cleanGooglePlaceId = plan.googlePlaceId || '';
            if (cleanGooglePlaceId.length > 50) { // 50자로 원래대로 복원
              cleanGooglePlaceId = `place_${dayIdx + 1}_${seq + 1}_${Date.now()}`;
              console.warn(`⚠️ Day ${dayIdx + 1}의 ${seq + 1}번째 일정 googlePlaceId가 너무 길어 새로 생성했습니다.`);
            }
          
          // 좌표 유효성 검사
          if (isNaN(plan.coordinate.latitude) || isNaN(plan.coordinate.longitude)) {
            console.warn(`⚠️ Day ${dayIdx + 1}의 ${seq + 1}번째 일정에 유효하지 않은 좌표가 있습니다.`);
            return null;
          }
          
          return {
            day: dayIdx + 1,
            scheduleSequence: seq,
            googlePlaceId: cleanGooglePlaceId, // googlePlaceId로 통일
            placeName: plan.place.substring(0, 100), // 장소명도 100자로 원래대로 복원
            lat: Number(plan.coordinate.latitude.toFixed(6)), // 소수점 6자리로 제한
            lon: Number(plan.coordinate.longitude.toFixed(6)),
            placeDescription: cleanDescription,
            travelTime: Math.min(plan.travelTime || 0, 1440), // 최대 24시간(1440분) 제한
          };
        }).filter(Boolean) // null 값 제거
      );
      
      if (validSchedules.length === 0) {
        Alert.alert('오류', '최소 하나의 일정을 추가해주세요.');
        return;
      }
      
      const data = {
        title: title.trim(),
        description: description.trim(),
        guidePrice: Number(guidePrice),
        region: regionInput.trim(),
        thumbnailUrl: thumbnail || '',
        hashtags: finalHashtags.slice(0, 10), // ✅ 최종 해시태그 사용
        schedules: validSchedules,
      };
      
      // 최종 데이터 검증
      console.log('🔍 데이터 검증 결과:', {
        titleLength: data.title.length,
        descriptionLength: data.description.length,
        schedulesCount: data.schedules.length,
        hashtagsCount: data.hashtags.length,
        hashtags: data.hashtags,
        totalSchedulesDataSize: JSON.stringify(data.schedules).length,
        sampleSchedule: data.schedules[0] ? {
          googlePlaceId: data.schedules[0].googlePlaceId,
          placeName: data.schedules[0].placeName,
          googlePlaceIdLength: data.schedules[0].googlePlaceId?.length || 0
        } : null
      });
      
      // 데이터 크기 제한 확인
      const totalDataSize = JSON.stringify(data).length;
      if (totalDataSize > 100000) { // 100KB 제한
        Alert.alert('오류', '데이터가 너무 큽니다. 일정 설명을 줄이거나 일정 수를 줄여주세요.');
        return;
      }
      
      // 각 일정의 설명 길이 확인
      const longDescriptions = data.schedules.filter(s => s.placeDescription.length > 100);
      if (longDescriptions.length > 0) {
        console.warn('⚠️ 긴 설명이 있는 일정들:', longDescriptions.map(s => ({
          placeName: s.placeName,
          descriptionLength: s.placeDescription.length
        })));
      }

      console.log('📤 전송할 데이터 요약:', {
        title: data.title,
        description: data.description.substring(0, 50) + '...',
        guidePrice: data.guidePrice,
        region: data.region,
        hashtagsCount: data.hashtags.length,
        schedulesCount: data.schedules.length,
        tourProgramId: tourProgramId,
      });
      
      console.log('📤 전체 데이터:', JSON.stringify(data, null, 2));

      let response;
      if (tourProgramId) {
        try {
          // 먼저 프로그램 존재 여부 확인
          const cleanToken = token.replace('Bearer ', '');
          console.log('🔍 프로그램 확인 요청:', {
            tourProgramId,
            token: cleanToken.substring(0, 10) + '...',
          });
          
          const checkResponse = await axios.get(
            `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cleanToken}`,
              },
              timeout: 10000,
            },
          );

          if (checkResponse.data) {
            // 수정 요청
            console.log('🟢 수정 요청 시작:', {
              url: `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
              data: data,
              token: cleanToken.substring(0, 10) + '...',
            });
            
            response = await axios.put(
              `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
              data,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${cleanToken}`,
                },
                timeout: 15000,
              },
            );
            console.log('✅ 수정 응답:', response.data);
          }
        } catch (checkError) {
          console.error('❌ 프로그램 확인 중 오류:', checkError);
          if (axios.isAxiosError(checkError)) {
            console.error('❌ Axios 에러 상세:', {
              status: checkError.response?.status,
              data: checkError.response?.data,
              message: checkError.message,
            });
            
            if (checkError.response?.status === 403) {
              Alert.alert(
                '권한 오류',
                '해당 프로그램을 수정할 권한이 없습니다. 본인이 작성한 프로그램만 수정할 수 있습니다.',
                [
                  {text: '확인', style: 'default'},
                ]
              );
              return;
            }
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
                    console.log('🟢 새로 등록 요청:', {
                      url: 'http://124.60.137.10:8083/api/tour-program',
                      data: data,
                      token: cleanToken.substring(0, 10) + '...',
                    });
                    
                    response = await axios.post(
                      'http://124.60.137.10:8083/api/tour-program',
                      data,
                      {
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${cleanToken}`,
                        },
                        timeout: 15000,
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
        console.log('🟢 새로 등록 요청 시작:', {
          url: 'http://124.60.137.10:8083/api/tour-program',
          data: data,
          token: cleanToken.substring(0, 10) + '...',
        });
        
        response = await axios.post(
          'http://124.60.137.10:8083/api/tour-program',
          data,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cleanToken}`,
            },
            timeout: 15000,
          },
        );
        console.log('✅ 등록 응답:', response.data);
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
      console.error('❌ 에러 상세:', error.response?.data || error);
      console.error('❌ 요청 데이터:', error.config?.data);
      
      let errorMessage = '등록 중 오류가 발생했습니다.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500) {
          const serverError = error.response.data;
          console.error('🔍 서버 에러 상세:', serverError);
          
          // 서버 에러 메시지에 따라 다른 처리
          if (serverError?.code === 'S001') {
            errorMessage = '서버 내부 오류가 발생했습니다. 데이터를 확인하고 다시 시도해주세요.';
          } else {
            errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
          
          // 500 오류 시 재시도 옵션 제공
          Alert.alert(
            '서버 오류',
            errorMessage,
            [
              {text: '취소', style: 'cancel'},
              {
                text: '다시 시도',
                onPress: () => {
                  console.log('🔄 500 오류 재시도 중...');
                  setTimeout(() => handleSubmit(), 2000); // 2초 후 재시도
                }
              }
            ]
          );
          return;
        } else if (error.response?.status === 400) {
          errorMessage = '입력 데이터에 문제가 있습니다. 모든 필수 항목을 확인해주세요.';
        } else if (error.response?.status === 401) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response?.status === 403) {
          errorMessage = '권한이 없습니다. 본인이 작성한 프로그램만 수정할 수 있습니다.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('오류', errorMessage);
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
                    googlePlaceId: data.place_id, // 구글 고유 id만 저장
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

      {/* 지역 선택 모달 */}
      <Modal visible={regionSelectVisible} animationType="slide" transparent>
        <View style={styles.regionModalOverlay}>
          <View style={styles.regionModalCard}>
            <Text style={styles.regionModalTitle}>충청남도 지역 선택</Text>
            <ScrollView contentContainerStyle={styles.regionGrid}>
              {CHUNGNAM_REGIONS.map(regionItem => (
                <TouchableOpacity
                  key={regionItem.name}
                  style={styles.regionChip}
                  onPress={() => handleSelectRegion(regionItem.name, regionItem.latitude, regionItem.longitude)}
                >
                  <Text style={styles.regionChipText}>📍 {regionItem.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.regionFooter}>
              <Button
                title="닫기"
                onPress={() => setRegionSelectVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 해시태그 선택 모달 */}
      <Modal visible={hashtagModalVisible} animationType="slide" transparent>
        <View style={styles.hashtagModalOverlay}>
          <View style={styles.hashtagModalCard}>
            <Text style={styles.hashtagTitle}>해시태그 선택 (최대 10개)</Text>
            <ScrollView contentContainerStyle={styles.hashtagGrid}>
              {HASHTAG_OPTIONS.map(tag => {
                const active = selectedHashtags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleHashtag(tag)}
                    style={[styles.tagChip, active && styles.tagChipActive]}>
                    <Text
                      style={[
                        styles.tagChipText,
                        active && styles.tagChipTextActive,
                      ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.hashtagFooter}>
              <Text style={styles.selectedCount}>
                선택 {selectedHashtags.length}/10
              </Text>
              <Button
                title="완료"
                onPress={() => setHashtagModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
      {!placeModalVisible && (
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}>
          {/* 에어비엔비 스타일 헤더 */}
          <View style={styles.airbnbHeader}>
            <Text style={styles.airbnbTitle}>새로운 투어 프로그램 만들기</Text>
            <Text style={styles.airbnbSubtitle}>여행객들에게 특별한 경험을 제공하세요</Text>
          </View>

          {/* 썸네일 섹션 */}
          <View style={styles.thumbnailSection}>
            <Text style={styles.sectionLabel}>대표 사진</Text>
            <TouchableOpacity
              style={styles.airbnbThumbnailBox}
              onPress={handlePickThumbnail}>
              {thumbnail ? (
                <Image
                  source={{uri: thumbnail}}
                  style={styles.airbnbThumbnailImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.airbnbThumbnailPlaceholder}>
                  <Text style={styles.airbnbThumbnailIcon}>📷</Text>
                  <Text style={styles.airbnbThumbnailText}>사진 추가하기</Text>
                  <Text style={styles.airbnbThumbnailSubText}>클릭하여 이미지를 선택하세요</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 기본 정보 섹션 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>기본 정보</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>프로그램 제목</Text>
              <TextInput
                style={styles.airbnbInput}
                placeholder="매력적인 제목을 입력하세요"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>가이드 가격 (원)</Text>
              <TextInput
                style={styles.airbnbInput}
                placeholder="가격을 입력하세요"
                value={guidePrice}
                onChangeText={setGuidePrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 해시태그 섹션 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>해시태그</Text>
            <TouchableOpacity
              style={styles.airbnbButton}
              onPress={() => setHashtagModalVisible(true)}>
              <Text style={styles.airbnbButtonText}>해시태그 선택하기</Text>
            </TouchableOpacity>
            {selectedHashtags.length > 0 && (
              <View style={styles.selectedTagsWrap}>
                {selectedHashtags.map(tag => (
                  <View key={tag} style={styles.airbnbTagChip}>
                    <Text style={styles.airbnbTagText}>#{tag}</Text>
                    <TouchableOpacity
                      onPress={() => toggleHashtag(tag)}
                      style={styles.airbnbRemoveTagBtn}>
                      <Text style={styles.airbnbRemoveTagX}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 지역 선택 섹션 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>지역 선택</Text>
            <TouchableOpacity
              style={styles.airbnbButton}
              onPress={() => setRegionSelectVisible(true)}>
              <Text style={styles.airbnbButtonText}>지역 선택하기</Text>
            </TouchableOpacity>
            {regionInput && (
              <View style={styles.selectedRegionWrap}>
                <View style={styles.airbnbRegionChip}>
                  <Text style={styles.airbnbRegionText}>📍 {regionInput}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setRegionInput('');
                      setRegion({
                        latitude: 36.7994,
                        longitude: 126.9306,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                      });
                    }}
                    style={styles.airbnbRemoveRegionBtn}>
                    <Text style={styles.airbnbRemoveRegionX}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* 프로그램 설명 섹션 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>프로그램 설명</Text>
            <TextInput
              style={styles.airbnbDescriptionInput}
              placeholder="여행객들에게 전달하고 싶은 프로그램의 특징과 매력을 자유롭게 작성해주세요..."
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* 지도 섹션 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>여행 경로</Text>
            <View style={styles.airbnbMapBox}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.airbnbMap}
                region={region}
                onRegionChangeComplete={(newRegion) => {
                  if (!isAnimating) {
                    setRegion(newRegion);
                  }
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                userLocationAnnotationTitle="현재 위치">

                {days.map((day, dayIdx) => (
                  <React.Fragment key={dayIdx}>
                    {/* 마커 - 선택된 Day만 표시 */}
                    {selectedDay === dayIdx && day.plans.map(
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
                    {/* Directions API 경로 Polyline - 선택된 Day만 표시 */}
                    {selectedDay === dayIdx && day.plans.length > 1 &&
                      day.plans.slice(1).map((p, idx) => {
                        const key = `${dayIdx}-${idx}-${idx + 1}`;
                        const routeCoords = routes[key];
                        return (
                          routeCoords && (
                            <Polyline
                              key={`route-${key}`}
                              coordinates={routeCoords}
                              strokeColor={dayColors[dayIdx % dayColors.length]}
                              strokeWidth={4}
                            />
                          )
                        );
                      })}
                    {/* 거리 표시 - 선택된 Day만 표시 */}
                    {selectedDay === dayIdx && day.plans.length > 1 &&
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
                style={styles.airbnbLocationButton}
                onPress={getCurrentLocation}
                disabled={locationLoading}>
                <Text style={styles.airbnbLocationButtonText}>
                  {locationLoading ? '📍' : '🎯'}
                </Text>
              </TouchableOpacity>


              {/* 총 거리 표시 */}
              {days[selectedDay].plans.length > 1 && (
                <View style={styles.airbnbTotalDistanceBox}>
                  <Text style={styles.airbnbTotalDistanceText}>
                    총 거리: {getDayDistance(days[selectedDay].plans).toFixed(1)}km
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 일정 섹션 */}
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>여행 일정</Text>
              <TouchableOpacity 
                style={styles.addDayButton}
                onPress={addDay}
              >
                <Text style={styles.addDayButtonText}>+ 일정 추가</Text>
              </TouchableOpacity>
            </View>

            {days.map((day, idx) => (
              <View key={idx} style={styles.airbnbDayBox}>
                <TouchableOpacity 
                  style={styles.dayHeader}
                  onPress={() => {
                    setSelectedDay(idx);
                    // Day 선택 시 해당 Day의 첫 번째 장소로 지도 이동
                    if (day.plans.length > 0 && day.plans[0].coordinate) {
                      const firstPlace = day.plans[0];
                      const newRegion: Region = {
                        latitude: firstPlace.coordinate!.latitude,
                        longitude: firstPlace.coordinate!.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      };
                      setRegion(newRegion);
                      
                      // 지도 애니메이션으로 이동
                      setTimeout(() => {
                        setIsAnimating(true);
                        mapRef.current?.animateToRegion(newRegion, 1000);
                        setTimeout(() => setIsAnimating(false), 1200);
                      }, 100);
                    }
                  }}
                >
                  <View style={styles.dayHeaderLeft}>
                    <View style={[styles.dayNumber, {backgroundColor: dayColors[idx % dayColors.length]}]}>
                      <Text style={styles.dayNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.dayTitle}>Day {idx + 1}</Text>
                  </View>
                  <Text style={styles.dayToggle}>{selectedDay === idx ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {selectedDay === idx && (
                  <View style={styles.dayContent}>
                    {day.plans.map((p, pIdx) => (
                      <View key={pIdx} style={styles.airbnbPlanItem}>
                        <View style={styles.planInfo}>
                          <Text style={styles.planPlace}>{p.place}</Text>
                          {p.memo && <Text style={styles.planMemo}>{p.memo}</Text>}
                        </View>
                        <View style={styles.planActions}>
                          <TouchableOpacity 
                            style={styles.airbnbEditButton}
                            onPress={() => editPlan(idx, pIdx)}
                          >
                            <Text style={styles.airbnbEditButtonText}>수정</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.airbnbDeleteButton}
                            onPress={() => removePlan(idx, pIdx)}
                          >
                            <Text style={styles.airbnbDeleteButtonText}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    {/* 장소 추가 입력란 - 세로 배치 */}
                    <View style={styles.airbnbPlanInputColumn}>
                      {/* 장소 검색 */}
                      <View style={styles.inputRow}>
                        <TextInput
                          style={styles.airbnbPlanInputWide}
                          placeholder="장소 검색"
                          value={selectedDay === idx ? plan.place : ''}
                          onFocus={() => {
                            setSelectedDay(idx);
                            setPlaceModalVisible(true);
                          }}
                          editable={true}
                        />
                        <TextInput
                          style={styles.airbnbPlanInputSmall}
                          placeholder="소요시간(분)"
                          value={selectedDay === idx ? (plan.travelTime ? plan.travelTime.toString() : '') : ''}
                          onChangeText={text => {
                            setSelectedDay(idx);
                            setPlan(p => ({...p, travelTime: text ? parseInt(text) : undefined}));
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      {/* 장소 설명 */}
                      <TextInput
                        style={styles.airbnbPlanDescriptionInput}
                        placeholder="장소에 대한 설명을 자유롭게 작성해주세요..."
                        value={selectedDay === idx ? plan.memo : ''}
                        onChangeText={text => {
                          setSelectedDay(idx);
                          setPlan(p => ({...p, memo: text}));
                        }}
                        multiline
                        textAlignVertical="top"
                      />
                      
                      {/* 추가 버튼 */}
                      <TouchableOpacity 
                        style={styles.airbnbAddButtonWide}
                        onPress={() => addPlan(idx)}
                      >
                        <Text style={styles.airbnbAddButtonText}>
                          {editingPlan && editingPlan.dayIdx === idx ? "수정" : "추가"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 게시 버튼 */}
          <View style={styles.publishSection}>
            <TouchableOpacity 
              style={styles.publishButton}
              onPress={handleSubmit}
            >
              <Text style={styles.publishButtonText}>프로그램 게시하기</Text>
            </TouchableOpacity>
          </View>
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
  // 에어비엔비 스타일
  airbnbHeader: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  airbnbTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  airbnbSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  thumbnailSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  airbnbThumbnailBox: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  airbnbThumbnailImg: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  airbnbThumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  airbnbThumbnailIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  airbnbThumbnailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  airbnbThumbnailSubText: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  airbnbInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#222',
  },
  airbnbButton: {
    backgroundColor: '#90EE90',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  airbnbButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  airbnbTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1f5fe',
  },
  airbnbTagText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  airbnbRemoveTagBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#90EE90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airbnbRemoveTagX: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  airbnbDescriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#222',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  airbnbMapBox: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  airbnbMap: {
    flex: 1,
  },
  airbnbLocationButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  airbnbLocationButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  airbnbTotalDistanceBox: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  airbnbTotalDistanceText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 14,
  },
  markerNumberBox: {
    backgroundColor: '#90EE90',
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
  // 에어비엔비 일정 스타일
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addDayButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  addDayButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  airbnbDayBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  dayToggle: {
    fontSize: 16,
    color: '#666',
  },
  dayContent: {
    padding: 16,
  },
  airbnbPlanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  planInfo: {
    flex: 1,
  },
  planPlace: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  planMemo: {
    fontSize: 14,
    color: '#666',
  },
  airbnbPlanInputColumn: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  airbnbPlanInputWide: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  airbnbPlanInputSmall: {
    width: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  airbnbPlanDescriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 140,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  airbnbAddButtonWide: {
    backgroundColor: '#90EE90',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  airbnbAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  airbnbEditButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  airbnbEditButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  airbnbDeleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  airbnbDeleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  publishSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#f8f9fa',
    marginTop: 20,
  },
  publishButton: {
    backgroundColor: '#90EE90',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#90EE90',
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
  planActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },


  // 지역 모달 (해시태그 스타일과 동일)
  regionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionModalCard: {
    width: '92%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  regionModalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 12},
  regionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  regionChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  regionChipText: {fontSize: 14, color: '#333'},
  regionFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  
  // 선택된 지역 표시
  selectedRegionWrap: {
    marginTop: 12,
  },
  airbnbRegionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e1f5fe',
    alignSelf: 'flex-start',
  },
  airbnbRegionText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  airbnbRemoveRegionBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#90EE90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airbnbRemoveRegionX: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // 해시태그 모달/칩
  hashtagModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hashtagModalCard: {
    width: '92%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  hashtagTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 12},
  hashtagGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  tagChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  tagChipActive: {
    borderColor: '#0288d1',
    backgroundColor: '#e1f5fe',
  },
  tagChipText: {fontSize: 14, color: '#333'},
  tagChipTextActive: {color: '#0288d1', fontWeight: '700'},
  hashtagFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCount: {color: '#0288d1', fontWeight: '700'},

  // 선택된 해시태그 미리보기
  hashtagSelectBtn: {
    backgroundColor: '#90EE90',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  hashtagSelectBtnText: {color: '#fff', fontWeight: '700'},
  selectedTagsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e1f5fe',
    borderWidth: 1,
    borderColor: '#0288d1',
  },
  selectedTagText: {color: '#0288d1', fontWeight: '700'},
  removeTagBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#90EE90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTagX: {color: '#fff', fontWeight: '900', lineHeight: 18},
});

export default Make_program;
