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
  Modal,
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {translateText, supportedLanguages} from '../../api/translator';

const dayColors = ['#0288d1', '#43a047', '#fbc02d', '#e64a19', '#8e24aa'];

type Schedule = {
  day: number;
  lat: number;
  lon: number;
  placeName: string;
  placeDescription: string;
  travelTime: number;
  placeId: string;
  googlePlaceId?: string; // googlePlaceId 추가 (선택적)
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
  pointPaid: boolean; // 포인트 결제 여부 추가
};

const Program_detail = () => {
  const {t} = useTranslation();
  const [data, setData] = useState<TourData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PracticeDetail'>>();
  const tourProgramId = route.params?.tourProgramId ?? 1;
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 번역 관련 state
  const [selectedLanguage, setSelectedLanguage] = useState('ko');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [translatedData, setTranslatedData] = useState<TourData | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // 모자이크 처리 관련 state
  const [isScheduleMasked, setIsScheduleMasked] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [scheduleUnlocked, setScheduleUnlocked] = useState(false);

  // ✅ [Points] 더미 제거. 실제 잔액은 GET 호출 시점에 받아와 계산만 사용
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [scheduleUnlockCost] = useState(100); // 일정 해제 비용(100 고정)

  const [maskType, setMaskType] = useState<
    'dots' | 'stars' | 'squares' | 'blur'
  >('dots');

  console.log('🟢 PracticeDetail 화면 - tourProgramId:', tourProgramId);

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const cleanToken = token.replace('Bearer ', '');
          const jwtPayload = decodeJWT(cleanToken);
          if (jwtPayload?.sub) {
            setCurrentUserId(parseInt(jwtPayload.sub));
            console.log('🟢 현재 사용자 ID:', jwtPayload.sub);
          }
        }
      } catch (error) {
        console.error('❌ 사용자 ID 가져오기 실패:', error);
      }
    };
    getCurrentUserId();
  }, []);

  // 일정 해제 상태 확인 함수
  const checkScheduleUnlockStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return false;

      const cleanToken = token.replace('Bearer ', '');
      const response = await axios.get(
        `http://124.60.137.10:8083/api/tour-program/${tourProgramId}/unlock-status`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
        },
      );

      if (response.data.status === 'OK') {
        const isUnlocked = response.data.data?.unlocked || false;
        console.log('🟢 일정 해제 상태 확인:', isUnlocked);
        
        // 서버에서 확인된 상태를 로컬 스토리지에 저장
        await AsyncStorage.setItem(
          `schedule_unlocked_${tourProgramId}`,
          isUnlocked.toString()
        );
        
        return isUnlocked;
      }
      return false;
    } catch (error) {
      console.log('⚠️ 일정 해제 상태 확인 실패:', error);
      
      // 서버 확인 실패 시 로컬 스토리지에서 확인
      try {
        const localStatus = await AsyncStorage.getItem(`schedule_unlocked_${tourProgramId}`);
        const isUnlocked = localStatus === 'true';
        console.log('🟡 로컬 스토리지에서 일정 해제 상태 확인:', isUnlocked);
        return isUnlocked;
      } catch (localError) {
        console.log('⚠️ 로컬 스토리지 확인도 실패:', localError);
        return false;
      }
    }
  };

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          Alert.alert('알림', '로그인이 필요합니다.');
          navigation.goBack();
          return;
        }

        const cleanToken = token.replace('Bearer ', '');
        console.log('🟢 투어 상세 정보 요청:', {
          tourProgramId,
          token: cleanToken.substring(0, 10) + '...',
        });

        // 투어 데이터와 일정 해제 상태를 병렬로 가져오기
        const [tourResponse, isUnlocked] = await Promise.all([
          axios.get(
            `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cleanToken}`,
              },
              timeout: 10000,
            },
          ),
          checkScheduleUnlockStatus(),
        ]);

        console.log('🟢 서버 응답:', tourResponse.data);

        if (tourResponse.data.status === 'OK' || tourResponse.data.status === '100 CONTINUE') {
          const tourData = tourResponse.data.data;

          // schedules 데이터 구조 확인
          console.log(
            '🟢 서버에서 받은 tourData:',
            JSON.stringify(tourData, null, 2),
          );
          console.log('🟢 schedules 배열:', tourData.schedules);
          if (tourData.schedules && tourData.schedules.length > 0) {
            console.log(
              '🟢 첫 번째 schedule:',
              JSON.stringify(tourData.schedules[0], null, 2),
            );
            console.log(
              '🟢 첫 번째 schedule의 placeId:',
              tourData.schedules[0].placeId,
            );
            console.log(
              '🟢 첫 번째 schedule의 placeId 타입:',
              typeof tourData.schedules[0].placeId,
            );
          }

          setData({
            ...tourData,
            wishlistCount: tourData.wishlistCount,
          });
          setIsLiked(tourData.wishlisted || false);
          
          // ✅ pointPaid 값에 따라 모자이크 상태 설정
          const isPointPaid = tourData.pointPaid || false;
          setScheduleUnlocked(isPointPaid);
          setIsScheduleMasked(!isPointPaid);

          console.log('🟢 투어 데이터 로드 완료:', {
            tourProgramId: tourData.tourProgramId || tourData.id,
            wishlisted: tourData.wishlisted,
            wishlistCount: tourData.wishlistCount,
            schedulesCount: tourData.schedules?.length || 0,
            pointPaid: isPointPaid,
            scheduleUnlocked: isPointPaid,
          });
        } else {
          console.error('❌ 서버 응답 에러:', tourResponse.data);
          throw new Error(
            tourResponse.data.message || '투어 정보를 불러오는데 실패했습니다.',
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
          Alert.alert('오류', '네트워크 오류가 발생했습니다.');
          navigation.goBack();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourProgramId, navigation]);

  // JWT 토큰 디코딩 함수
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 디코딩 오류:', error);
      return null;
    }
  };

  // 번역 함수들
  const translateTextContent = async (
    text: string,
    targetLang: string,
  ): Promise<string> => {
    if (!text || text.trim() === '' || targetLang === 'ko') {
      return text;
    }

    try {
      const result = await translateText(text, 'ko', targetLang);
      return result.translatedText || text;
    } catch (error) {
      console.error('번역 오류:', error);
      return text;
    }
  };

  // UI 텍스트 번역 매핑
  const getTranslatedUIText = (key: string, targetLang: string): string => {
    const translations: {[key: string]: {[key: string]: string}} = {
      리뷰: {
        en: 'Review',
        ja: 'レビュー',
        zh: '评论',
        es: 'Reseña',
        fr: 'Avis',
      },
      찜함: {
        en: 'Liked',
        ja: 'いいね済み',
        zh: '已喜欢',
        es: 'Me Gustó',
        fr: 'Aimé',
      },
      찜: {en: 'Like', ja: 'いいね', zh: '喜欢', es: 'Me Gusta', fr: "J'aime"},
      장소: {en: 'Place', ja: '場所', zh: '地点', es: 'Lugar', fr: 'Lieu'},
      소요시간: {
        en: 'Duration',
        ja: '所要時間',
        zh: '所需时间',
        es: 'Duración',
        fr: 'Durée',
      },
      분: {en: 'min', ja: '分', zh: '分钟', es: 'min', fr: 'min'},
      이동시간: {
        en: 'Travel Time',
        ja: '移動時間',
        zh: '移动时间',
        es: 'Tiempo de Viaje',
        fr: 'Temps de Voyage',
      },
      '총 거리': {
        en: 'Total Distance',
        ja: '総距離',
        zh: '总距离',
        es: 'Distancia Totale',
        fr: 'Distance Totale',
      },
      km: {en: 'km', ja: 'km', zh: '公里', es: 'km', fr: 'km'},
      호스트: {
        en: 'Host',
        ja: 'ホスト',
        zh: '主人',
        es: 'Anfitrión',
        fr: 'Hôte',
      },
      '투어 설명': {
        en: 'Tour Description',
        ja: 'ツアー説明',
        zh: '旅游说明',
        es: 'Descripción del Tour',
        fr: 'Description du Tour',
      },
      인당: {
        en: 'per person',
        ja: '一人当たり',
        zh: '每人',
        es: 'por persona',
        fr: 'par personne',
      },
      상담하기: {
        en: 'Consult',
        ja: '相談する',
        zh: '咨询',
        es: 'Consultar',
        fr: 'Consulter',
      },
      예약하기: {
        en: 'Reserve',
        ja: '予約する',
        zh: '预订',
        es: 'Reservar',
        fr: 'Réserver',
      },
      '제목 없음': {
        en: 'No Title',
        ja: 'タイトルなし',
        zh: '无标题',
        es: 'Sin Título',
        fr: 'Sans Titre',
      },
      '지역 정보 없음': {
        en: 'No Region Info',
        ja: '地域情報なし',
        zh: '无地区信息',
        es: 'Sin Información de Región',
        fr: 'Aucune Information de Région',
      },
      태그: {en: 'Tag', ja: 'タグ', zh: '标签', es: 'Etiqueta', fr: 'Tag'},
      '장소명 없음': {
        en: 'No Place Name',
        ja: '場所名なし',
        zh: '无地点名称',
        es: 'Sin Nombre de Lugar',
        fr: 'Aucun Nom de Lieu',
      },
      '설명 없음': {
        en: 'No Description',
        ja: '説明なし',
        zh: '无说明',
        es: 'Sin Descripción',
        fr: 'Aucune Description',
      },
      '정보 없음': {
        en: 'No Information',
        ja: '情報なし',
        zh: '无信息',
        es: 'Sin Información',
        fr: 'Aucune Information',
      },
      '설명이 없습니다': {
        en: 'No description available',
        ja: '説明がありません',
        zh: '暂无说明',
        es: 'No hay descripción disponible',
        fr: 'Aucune description disponible',
      },
      '이동시간 정보 없음': {
        en: 'No travel time information',
        ja: '移動時間情報なし',
        zh: '无移动时间信息',
        es: 'Sin información de tiempo de viaje',
        fr: 'Aucune information sur le temps de voyage',
      },
      일정: {
        en: 'Schedule',
        ja: 'スケジュール',
        zh: '行程',
        es: 'Horario',
        fr: 'Horaire',
      },
      지도: {en: 'Map', ja: '地図', zh: '地图', es: 'Mapa', fr: 'Carte'},
      '호스트 정보': {
        en: 'Host Information',
        ja: 'ホ스트情報',
        zh: '主人信息',
        es: 'Información del Anfitrión',
        fr: "Informations sur l'Hôte",
      },
      수정: {en: 'Edit', ja: '編集', zh: '编辑', es: 'Editar', fr: 'Modifier'},
      삭제: {
        en: 'Delete',
        ja: '削除',
        zh: '删除',
        es: 'Eliminar',
        fr: 'Supprimer',
      },
      '언어 선택': {
        en: 'Language Selection',
        ja: '言語選択',
        zh: '语言选择',
        es: 'Selección de Idioma',
        fr: 'Sélection de Langue',
      },
      '삭제 확인': {
        en: 'Delete Confirmation',
        ja: '削除確認',
        zh: '删除确认',
        es: 'Confirmación de Eliminación',
        fr: 'Confirmation de Suppression',
      },
      성공: {en: 'Success', ja: '成功', zh: '成功', es: 'Éxito', fr: 'Succès'},
      오류: {en: 'Error', ja: 'エラー', zh: '错误', es: 'Error', fr: 'Erreur'},
      '번역 중': {
        en: 'Translating',
        ja: '翻訳中',
        zh: '翻译中',
        es: 'Traduciendo',
        fr: 'Traduction',
      },
      '정말로 이 투어를 삭제하시겠습니까?': {
        en: 'Are you sure you want to delete this tour?',
        ja: 'このツアーを削除してもよろしいですか？',
        zh: '确定要删除这个旅游项目吗？',
        es: '¿Estás seguro de que quieres eliminar este tour?',
        fr: 'Êtes-vous sûr de vouloir supprimer cette tournée ?',
      },
      취소: {
        en: 'Cancel',
        ja: 'キャンセル',
        zh: '取消',
        es: 'Cancelar',
        fr: 'Annuler',
      },
      알림: {en: 'Notice', ja: 'お知らせ', zh: '通知', es: 'Aviso', fr: 'Avis'},
      '로그인이 필요합니다': {
        en: 'Login required',
        ja: 'ログインが必要です',
        zh: '需要登录',
        es: 'Se requiere inicio de sesión',
        fr: 'Connexion requise',
      },
      '투어가 삭제되었습니다': {
        en: 'Tour has been deleted',
        ja: 'ツアーが削除されました',
        zh: '旅游项目已删除',
        es: 'El tour ha sido eliminado',
        fr: 'La tournée a été supprimée',
      },
      확인: {en: 'OK', ja: '確認', zh: '确认', es: 'OK', fr: 'OK'},
      '투어 삭제에 실패했습니다': {
        en: 'Failed to delete tour',
        ja: 'ツアーの削除に失敗しました',
        zh: '删除旅游项目失败',
        es: 'Error al eliminar el tour',
        fr: 'Échec de la suppression de la tournée',
      },
      '투어 삭제 중 오류가 발생했습니다': {
        en: 'An error occurred while deleting the tour',
        ja: 'ツアー削除中にエラーが発生しました',
        zh: '删除旅游项目时发生错误',
        es: 'Ocurrió un error al eliminar el tour',
        fr: "Une erreur s'est produite lors de la suppression de la tournée",
      },
      '찜하기 기능을 사용할 수 없습니다': {
        en: 'Cannot use like function',
        ja: 'いいね機能を使用できません',
        zh: '无法使用喜欢功能',
        es: 'No se puede usar la función de me gusta',
        fr: "Impossible d'utiliser la fonction j'aime",
      },
      '채팅방을 생성할 수 없습니다': {
        en: 'Cannot create chat room',
        ja: 'チャットルームを作成できません',
        zh: '无法创建聊天室',
        es: 'No se puede crear la sala de chat',
        fr: 'Impossible de créer la salle de chat',
      },
      '네트워크 오류가 발생했습니다': {
        en: 'Network error occurred',
        ja: 'ネットワークエラーが発生しました',
        zh: '发生网络错误',
        es: 'Ocurrió un error de red',
        fr: "Une erreur réseau s'est produite",
      },
      '예약을 생성할 수 없습니다': {
        en: 'Cannot create reservation',
        ja: '予約を作成できません',
        zh: '无法创建预订',
        es: 'No se puede crear la reserva',
        fr: 'Impossible de créer la réservation',
      },
      '예약 중 오류가 발생했습니다': {
        en: 'An error occurred during reservation',
        ja: '予約中にエラーが発生しました',
        zh: '预订时发生错误',
        es: 'Ocurrió un error durante la reserva',
        fr: "Une erreur s'est produite lors de la réservation",
      },
      '로딩 중': {
        en: 'Loading',
        ja: '読み込み中',
        zh: '加载中',
        es: 'Cargando',
        fr: 'Chargement',
      },
      '데이터를 불러올 수 없습니다': {
        en: 'Cannot load data',
        ja: 'データを読み込めません',
        zh: '无法加载数据',
        es: 'No se pueden cargar los datos',
        fr: 'Impossible de charger les données',
      },
      '일정 숨기기': {
        en: 'Hide Schedule',
        ja: 'スケジュール非表示',
        zh: '隐藏行程',
        es: 'Ocultar Horario',
        fr: 'Masquer Horaire',
      },
      '포인트로 보기': {
        en: 'View with Points',
        ja: 'ポイントで表示',
        zh: '用积分查看',
        es: 'Ver con Puntos',
        fr: 'Voir avec Points',
      },
      '결제로 보기': {
        en: 'View with Payment',
        ja: '決済で表示',
        zh: '付费查看',
        es: 'Ver con Pago',
        fr: 'Voir avec Paiement',
      },
      '포인트 부족': {
        en: 'Insufficient Points',
        ja: 'ポイント不足',
        zh: '积分不足',
        es: 'Puntos Insuficientes',
        fr: 'Points Insuffisants',
      },
      '포인트가 부족합니다': {
        en: "You don't have enough points",
        ja: 'ポイントが不足しています',
        zh: '您的积分不足',
        es: 'No tienes suficientes puntos',
        fr: "Vous n'avez pas assez de points",
      },
      '포인트 충전': {
        en: 'Charge Points',
        ja: 'ポイントチャージ',
        zh: '充值积分',
        es: 'Cargar Puntos',
        fr: 'Recharger Points',
      },
      '일정 해제': {
        en: 'Unlock Schedule',
        ja: 'スケジュール解除',
        zh: '解锁行程',
        es: 'Desbloquear Horario',
        fr: 'Débloquer Horaire',
      },
      '포인트로 일정을 해제하시겠습니까?': {
        en: 'Do you want to unlock the schedule with points?',
        ja: 'ポイントでスケジュールを解除しますか？',
        zh: '是否要用积分解锁行程？',
        es: '¿Quieres desbloquear el horario con puntos?',
        fr: "Voulez-vous débloquer l'horaire avec des points ?",
      },
      '결제로 일정을 해제하시겠습니까?': {
        en: 'Do you want to unlock the schedule with payment?',
        ja: '決済でスケジュールを解除しますか？',
        zh: '是否要付费解锁行程？',
        es: '¿Quieres desbloquear el horario con pago?',
        fr: "Voulez-vous débloquer l'horaire avec un paiement ?",
      },
      '필요 포인트': {
        en: 'Required Points',
        ja: '必要ポイント',
        zh: '所需积分',
        es: 'Puntos Requeridos',
        fr: 'Points Requis',
      },
      '보유 포인트': {
        en: 'Available Points',
        ja: '保有ポイント',
        zh: '可用积分',
        es: 'Puntos Disponibles',
        fr: 'Points Disponibles',
      },
      '결제 금액': {
        en: 'Payment Amount',
        ja: '決済金額',
        zh: '支付金额',
        es: 'Monto de Pago',
        fr: 'Montant du Paiement',
      },
      '₩': {en: '₩', ja: '₩', zh: '₩', es: '₩', fr: '₩'},
      해제: {
        en: 'Unlock',
        ja: '解除',
        zh: '解锁',
        es: 'Desbloquear',
        fr: 'Débloquer',
      },
      '일정이 해제되었습니다': {
        en: 'Schedule has been unlocked',
        ja: 'スケジュールが解除されました',
        zh: '行程已解锁',
        es: 'El horario ha sido desbloqueado',
        fr: "L'horaire a été débloqué",
      },
      '포인트가 차감되었습니다': {
        en: 'Points have been deducted',
        ja: 'ポイントが差し引かれました',
        zh: '积分已扣除',
        es: 'Los puntos han sido deducidos',
        fr: 'Les points ont été déduits',
      },
      '결제가 완료되었습니다': {
        en: 'Payment completed',
        ja: '決済が完了しました',
        zh: '支付完成',
        es: 'Pago completado',
        fr: 'Paiement terminé',
      },
    };

    if (targetLang === 'ko') {
      return key;
    }

    return translations[key]?.[targetLang] || key;
  };

  const translateTourData = async (tourData: TourData, targetLang: string) => {
    if (!tourData || targetLang === 'ko') {
      setTranslatedData(null);
      return;
    }

    setTranslating(true);
    setTranslationProgress(0);

    try {
      const textsToTranslate = [
        tourData.title || '',
        tourData.description || '',
        tourData.region || '',
        ...(tourData.hashtags || []),
        ...(tourData.schedules || []).map(s => s.placeName || ''),
        ...(tourData.schedules || []).map(s => s.placeDescription || ''),
        tourData.user?.name || '',
      ].filter(text => text.trim() !== '');

      const batchSize = 3;
      const translatedTexts: string[] = [];

      for (let i = 0; i < textsToTranslate.length; i += batchSize) {
        const batch = textsToTranslate.slice(i, i + batchSize);
        const batchPromises = batch.map(text =>
          translateTextContent(text, targetLang),
        );
        const batchResults = await Promise.all(batchPromises);
        translatedTexts.push(...batchResults);

        const progress = ((i + batchSize) / textsToTranslate.length) * 100;
        setTranslationProgress(Math.min(progress, 100));
      }

      let textIndex = 0;
      const translatedTourData: TourData = {
        ...tourData,
        title: translatedTexts[textIndex++] || tourData.title,
        description: translatedTexts[textIndex++] || tourData.description,
        region: translatedTexts[textIndex++] || tourData.region,
        hashtags: (tourData.hashtags || []).map(
          () => translatedTexts[textIndex++] || '',
        ),
        schedules: (tourData.schedules || []).map(schedule => ({
          ...schedule,
          placeName: translatedTexts[textIndex++] || schedule.placeName,
          placeDescription:
            translatedTexts[textIndex++] || schedule.placeDescription,
        })),
        user: {
          ...tourData.user,
          name: translatedTexts[textIndex++] || tourData.user?.name,
        },
      };

      setTranslatedData(translatedTourData);
    } catch (error) {
      console.error('투어 데이터 번역 오류:', error);
      setTranslatedData(null);
    } finally {
      setTranslating(false);
      setTranslationProgress(0);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setShowLanguageModal(false);

    if (languageCode === 'ko') {
      setTranslatedData(null);
    } else if (data) {
      await translateTourData(data, languageCode);
    }
  };

  const toggleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert(
          getTranslatedUIText('알림', selectedLanguage),
          getTranslatedUIText('로그인이 필요합니다', selectedLanguage),
        );
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const response = await axios.post(
        `http://124.60.137.10:8083/api/tour-program/wishlist/${tourProgramId}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
        },
      );

      if (response.data.status === 'OK') {
        setIsLiked(!isLiked);
        setData(prev => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            wishlistCount: isLiked
              ? prev.wishlistCount - 1
              : prev.wishlistCount + 1,
          };
        });
        console.log('🟢 찜하기 토글 성공:', !isLiked);
      }
    } catch (error) {
      console.error('❌ 찜하기 토글 실패:', error);
      Alert.alert(
        getTranslatedUIText('오류', selectedLanguage),
        getTranslatedUIText(
          '찜하기 기능을 사용할 수 없습니다',
          selectedLanguage,
        ),
      );
    }
  };

  const getTotalDistance = (schedules: Schedule[]) => {
    if (schedules.length < 2) {
      return 0;
    }
    let totalDistance = 0;
    for (let i = 0; i < schedules.length - 1; i++) {
      const distance = haversine(
        {lat: schedules[i].lat, lng: schedules[i].lon},
        {lat: schedules[i + 1].lat, lng: schedules[i + 1].lon},
      );
      totalDistance += distance;
    }
    return Math.round(totalDistance / 1000);
  };

  const handleChat = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert(
          getTranslatedUIText('알림', selectedLanguage),
          getTranslatedUIText('로그인이 필요합니다', selectedLanguage),
        );
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const response = await axios.post(
        'http://124.60.137.10:8083/api/chat/rooms',
        {
          tourProgramId: tourProgramId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanToken}`,
          },
        },
      );

      if (response.data.status === 'OK') {
        const chatRoomId = response.data.data.chatRoomId;
        console.log('🟢 채팅방 생성 성공:', chatRoomId);
        navigation.navigate('ChatRoom', {
          chatRoomId: chatRoomId,
          tourProgramId: tourProgramId,
        });
      } else {
        console.error('❌ 채팅방 생성 실패:', response.data);
        Alert.alert(
          getTranslatedUIText('오류', selectedLanguage),
          getTranslatedUIText('채팅방을 생성할 수 없습니다', selectedLanguage),
        );
      }
    } catch (error) {
      console.error('❌ 채팅방 생성 오류:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          const chatRoomId = error.response.data.data.chatRoomId;
          console.log('🟢 기존 채팅방으로 이동:', chatRoomId);
          navigation.navigate('ChatRoom', {
            chatRoomId: chatRoomId,
            tourProgramId: tourProgramId,
          });
        } else {
          Alert.alert(
            getTranslatedUIText('오류', selectedLanguage),
            getTranslatedUIText(
              '채팅방을 생성할 수 없습니다',
              selectedLanguage,
            ),
          );
        }
      } else {
        Alert.alert(
          getTranslatedUIText('오류', selectedLanguage),
          getTranslatedUIText('네트워크 오류가 발생했습니다', selectedLanguage),
        );
      }
    }
  };

  const handleEdit = () => {
    if (!data) {
      return;
    }

    // 기존 투어 데이터를 editData로 전달
    const editData = {
      title: data.title || '',
      description: data.description || '',
      guidePrice: data.guidePrice || 0,
      region: data.region || '',
      thumbnailUrl: data.thumbnailUrl || '',
      hashtags: data.hashtags || [],
      schedules: (data.schedules || []).map(schedule => ({
        day: schedule.day,
        scheduleSequence: schedule.day, // day를 sequence로 사용
        placeName: schedule.placeName || '',
        lat: schedule.lat,
        lon: schedule.lon,
        placeDescription: schedule.placeDescription || '',
        travelTime: schedule.travelTime || 0,
      })),
    };

    navigation.navigate('Make_program', {
      tourProgramId: tourProgramId,
      editData: editData,
      isEdit: true,
    });
  };

  const handleDelete = async () => {
    Alert.alert(
      getTranslatedUIText('삭제 확인', selectedLanguage),
      getTranslatedUIText(
        '정말로 이 투어를 삭제하시겠습니까?',
        selectedLanguage,
      ),
      [
        {text: getTranslatedUIText('취소', selectedLanguage), style: 'cancel'},
        {
          text: getTranslatedUIText('삭제', selectedLanguage),
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              if (!token) {
                Alert.alert(
                  getTranslatedUIText('알림', selectedLanguage),
                  getTranslatedUIText('로그인이 필요합니다', selectedLanguage),
                );
                return;
              }

              const cleanToken = token.replace('Bearer ', '');
              const response = await axios.delete(
                `http://124.60.137.10:8083/api/tour-program/${tourProgramId}`,
                {
                  headers: {
                    Authorization: `Bearer ${cleanToken}`,
                  },
                },
              );

              if (response.data.status === 'OK') {
                console.log('🟢 투어 삭제 성공');
                Alert.alert(
                  getTranslatedUIText('성공', selectedLanguage),
                  getTranslatedUIText(
                    '투어가 삭제되었습니다',
                    selectedLanguage,
                  ),
                  [
                    {
                      text: getTranslatedUIText('확인', selectedLanguage),
                      onPress: () => navigation.goBack(),
                    },
                  ],
                );
              } else {
                console.error('❌ 투어 삭제 실패:', response.data);
                Alert.alert(
                  getTranslatedUIText('오류', selectedLanguage),
                  getTranslatedUIText(
                    '투어 삭제에 실패했습니다',
                    selectedLanguage,
                  ),
                );
              }
            } catch (error) {
              console.error('❌ 투어 삭제 오류:', error);
              Alert.alert(
                getTranslatedUIText('오류', selectedLanguage),
                getTranslatedUIText(
                  '투어 삭제 중 오류가 발생했습니다',
                  selectedLanguage,
                ),
              );
            }
          },
        },
      ],
    );
  };

  const handleReservation = async () => {
    // 즉시 결제 페이지로 이동 (예약 생성은 결제 완료 후 처리)
    console.log('🚀 결제 페이지로 즉시 이동');
    handleGoToPayment();
  };

  const handleGoToPayment = () => {
    navigation.navigate('PaymentScreen', {
      tourData: data,
      tourProgramId: tourProgramId,
    });
  };

  const handlePlacePress = (item: Schedule) => {
    let onlyPlaceName = item.placeName;
    if (onlyPlaceName && onlyPlaceName.includes(',')) {
      onlyPlaceName = onlyPlaceName.split(',')[0].trim();
    }

    let googlePlaceId = item.googlePlaceId || item.placeId;
    if (
      !googlePlaceId ||
      googlePlaceId === 'null' ||
      googlePlaceId === 'undefined'
    ) {
      googlePlaceId = `${item.lat},${item.lon}`;
      console.log('⚠️ googlePlaceId가 없어서 좌표로 대체:', googlePlaceId);
    } else if (googlePlaceId.includes(',')) {
      console.log('📍 좌표 형식 googlePlaceId 사용:', googlePlaceId);
    } else {
      console.log('🏢 Google Place ID 사용:', googlePlaceId);
    }

    const encodedPlaceName = encodeURIComponent(onlyPlaceName);
    const logObj = {
      placeName: encodedPlaceName,
      googlePlaceId: googlePlaceId,
      language: 'kor',
    };
    console.log('장소 상세 요청 파라미터:', JSON.stringify(logObj, null, 2));
    navigation.navigate('PlaceDetail', {
      placeName: encodedPlaceName,
      placeDescription: item.placeDescription,
      lat: item.lat,
      lon: item.lon,
      placeId: googlePlaceId,
      language: 'kor',
      tourProgramId: tourProgramId,
    });
  };

  // 모자이크 처리 함수들
  const maskText = (text: string): string => {
    if (!text || text.trim() === '') {
      return text;
    }

    switch (maskType) {
      case 'dots':
        return text.replace(/./g, '●');
      case 'stars':
        return text.replace(/./g, '★');
      case 'squares':
        return text.replace(/./g, '■');
      case 'blur':
        return text;
      default:
        return text.replace(/./g, '●');
    }
  };

  const getMaskStyle = () => {
    switch (maskType) {
      case 'dots':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        };
      case 'stars':
        return {
          backgroundColor: 'rgba(255, 215, 0, 0.9)',
          color: '#333',
        };
      case 'squares':
        return {
          backgroundColor: 'rgba(128, 128, 128, 0.9)',
          color: 'white',
        };
      case 'blur':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        };
      default:
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        };
    }
  };

  const getMaskIcon = () => {
    switch (maskType) {
      case 'dots':
        return '●';
      case 'stars':
        return '★';
      case 'squares':
        return '■';
      case 'blur':
        return '🔍';
      default:
        return '●';
    }
  };

  const toggleScheduleMask = () => {
    setIsScheduleMasked(!isScheduleMasked);
  };

  // ✅ [Points] 포인트로 결제하기 (API 연동)
  const handleUnlockWithPoints = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert(
          getTranslatedUIText('알림', selectedLanguage),
          getTranslatedUIText('로그인이 필요합니다', selectedLanguage),
        );
        return;
      }
      const cleanToken = token.replace('Bearer ', '');

      // 1) 잔여 포인트 조회
      const balanceUrl = 'http://124.60.137.10:8083/api/points/balance';
      console.log('🟦 [POINTS][GET] →', balanceUrl, {
        headers: {Authorization: `Bearer ${cleanToken.substring(0, 10)}...`},
      });
      const balanceRes = await axios.get(balanceUrl, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(
        '🟩 [POINTS][GET] ← status:',
        balanceRes.status,
        'data:',
        JSON.stringify(balanceRes.data, null, 2),
      );

      const current = balanceRes?.data?.data?.balance ?? 0;
      setUserPoints(current);

      // 2) 안내/확인 팝업
      const after = current - scheduleUnlockCost;
      if (current < scheduleUnlockCost) {
        Alert.alert(
          getTranslatedUIText('포인트 부족', selectedLanguage),
          getTranslatedUIText('포인트가 부족합니다', selectedLanguage),
          [
            {
              text: getTranslatedUIText('취소', selectedLanguage),
              style: 'cancel',
            },
            {
              text: getTranslatedUIText('포인트 충전', selectedLanguage),
              onPress: () =>
                console.log('🔔 포인트 충전 페이지로 이동 (미구현)'),
            },
          ],
        );
        return;
      }

      Alert.alert(
        '포인트 결제',
        `현재 포인트: ${current}\n결제 금액: ${scheduleUnlockCost}\n잔여 포인트: ${after}`,
        [
          {
            text: getTranslatedUIText('취소', selectedLanguage),
            style: 'cancel',
          }, // 3-2) 취소는 아무 일도 안 함
          {
            text: getTranslatedUIText('해제', selectedLanguage),
            onPress: async () => {
              try {
                // 3-1) 포인트 사용 요청
                const useUrl = 'http://124.60.137.10:8083/api/points/use';
                const body = {
                  amount: scheduleUnlockCost,
                  actionType: 'USE',
                  actionSubject: 'CONTENT',
                  targetId: tourProgramId,
                };
                console.log('🟦 [POINTS][POST] →', useUrl, 'body:', body, {
                  headers: {
                    Authorization: `Bearer ${cleanToken.substring(0, 10)}...`,
                  },
                });

                const useRes = await axios.post(useUrl, body, {
                  headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    'Content-Type': 'application/json',
                  },
                });

                console.log(
                  '🟩 [POINTS][POST] ← status:',
                  useRes.status,
                  'data:',
                  JSON.stringify(useRes.data, null, 2),
                );

                const remain = useRes?.data?.data?.balance ?? after;

                // 3-2) 일정 해제 상태를 서버에 저장
                try {
                  const unlockUrl = `http://124.60.137.10:8083/api/tour-program/${tourProgramId}/unlock`;
                  const unlockBody = {
                    unlocked: true,
                    unlockMethod: 'POINTS',
                    unlockCost: scheduleUnlockCost,
                  };
                  
                  console.log('🟦 [UNLOCK][POST] →', unlockUrl, 'body:', unlockBody);
                  
                  const unlockRes = await axios.post(unlockUrl, unlockBody, {
                    headers: {
                      Authorization: `Bearer ${cleanToken}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  console.log('🟩 [UNLOCK][POST] ← status:', unlockRes.status, 'data:', unlockRes.data);
                } catch (unlockError) {
                  console.log('⚠️ 일정 해제 상태 저장 실패:', unlockError);
                  // 일정 해제 상태 저장 실패해도 포인트는 이미 차감되었으므로 계속 진행
                }

                // 성공 처리: 일정 해제 + 알림
                setScheduleUnlocked(true);
                setIsScheduleMasked(false);
                setShowUnlockModal(false);
                setUserPoints(remain);
                
                // 로컬 스토리지에도 해제 상태 저장
                await AsyncStorage.setItem(
                  `schedule_unlocked_${tourProgramId}`,
                  'true'
                );
                
                Alert.alert(
                  getTranslatedUIText('성공', selectedLanguage),
                  `${getTranslatedUIText(
                    '일정이 해제되었습니다',
                    selectedLanguage,
                  )}\n잔여 포인트: ${remain}`,
                );
              } catch (err: any) {
                console.log(
                  '🟥 [POINTS][POST] ERROR:',
                  err?.response?.status,
                  err?.response?.data || err?.message,
                );
                Alert.alert(
                  getTranslatedUIText('오류', selectedLanguage),
                  err?.response?.data?.message || '포인트 사용에 실패했습니다.',
                );
              }
            },
          },
        ],
      );
    } catch (err: any) {
      console.log(
        '🟥 [POINTS][GET] ERROR:',
        err?.response?.status,
        err?.response?.data || err?.message,
      );
      Alert.alert(
        getTranslatedUIText('오류', selectedLanguage),
        '포인트 정보를 불러오지 못했습니다.',
      );
    }
  };

  const handleUnlockWithPayment = () => {
    Alert.alert(
      getTranslatedUIText('일정 해제', selectedLanguage),
      getTranslatedUIText('결제로 일정을 해제하시겠습니까?', selectedLanguage),
      [
        {text: getTranslatedUIText('취소', selectedLanguage), style: 'cancel'},
        {
          text: getTranslatedUIText('해제', selectedLanguage),
          onPress: () => {
            navigation.navigate('PaymentScreen', {
              tourData: data,
              tourProgramId: tourProgramId,
              unlockSchedule: true,
            });
          },
        },
      ],
    );
  };

  const showUnlockOptions = () => {
    setShowUnlockModal(true);
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
        <Text style={{marginTop: 10, color: '#228B22'}}>
          {getTranslatedUIText('로딩 중', selectedLanguage)}
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>
          {getTranslatedUIText('데이터를 불러올 수 없습니다', selectedLanguage)}
        </Text>
      </View>
    );
  }

  const groupedSchedules = (data.schedules || []).reduce((acc, cur) => {
    const key = `Day ${cur.day}`;
    acc[key] = acc[key] || [];
    acc[key].push(cur);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const getGroupedSchedules = () => {
    const schedules = (translatedData || data)?.schedules || [];
    return schedules.reduce((acc, cur) => {
      const key = `Day ${cur.day}`;
      acc[key] = acc[key] || [];
      acc[key].push(cur);
      return acc;
    }, {} as Record<string, Schedule[]>);
  };

  const currentGroupedSchedules = getGroupedSchedules();

  return (
    <View style={{flex: 1}}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          {data.thumbnailUrl ? (
            <Image source={{uri: data.thumbnailUrl}} style={styles.thumbnail} />
          ) : null}

          {/* 번역 진행 상태 표시 */}
          {translating && (
            <View style={styles.translationProgressContainer}>
              <Text style={styles.translationProgressText}>
                {getTranslatedUIText('번역 중', selectedLanguage)}...{' '}
                {translationProgress.toFixed(0)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${translationProgress}%`},
                  ]}
                />
              </View>
            </View>
          )}

          {/* 번역 버튼 */}
          <View style={styles.translationButtonContainer}>
            <TouchableOpacity
              style={styles.translationButton}
              onPress={() => setShowLanguageModal(true)}
              disabled={translating}>
              <Ionicons name="language" size={20} color="#fff" />
              <Text style={styles.translationButtonText}>
                {
                  supportedLanguages.find(
                    lang => lang.code === selectedLanguage,
                  )?.flag
                }
                {selectedLanguage === 'ko'
                  ? '한국어'
                  : supportedLanguages.find(
                      lang => lang.code === selectedLanguage,
                    )?.name}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.whiteBox}>
            <Text style={styles.title} selectable={true}>
              {(translatedData || data)?.title ||
                getTranslatedUIText('제목 없음', selectedLanguage)}
            </Text>

            <View style={styles.editDeleteRow}>
              {/* 수정 버튼 임시로 항상 표시 */}
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>
                  {getTranslatedUIText('수정', selectedLanguage)}
                </Text>
              </TouchableOpacity>

              {/* 삭제 버튼 임시로 활성화 */}
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>
                  {getTranslatedUIText('삭제', selectedLanguage)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rightAlignRow}>
              <Text style={styles.region} selectable={true}>
                📍{' '}
                {(translatedData || data)?.region ||
                  getTranslatedUIText('지역 정보 없음', selectedLanguage)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Practice', {
                    tourProgramId: tourProgramId,
                  });
                }}>
                <Text style={styles.review}>
                  {getTranslatedUIText('리뷰', selectedLanguage)}{' '}
                  {data.reviewCount || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleLike}>
                <Text style={styles.like}>
                  {isLiked
                    ? `💖 ${getTranslatedUIText('찜함', selectedLanguage)}`
                    : `🤍 ${getTranslatedUIText('찜', selectedLanguage)}`}{' '}
                  {data.wishlistCount || 0}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tags}>
              {(translatedData || data)?.hashtags
                ? (translatedData || data)?.hashtags?.map((tag, i) => (
                    <Text key={i} style={styles.tag} selectable={true}>
                      #{tag || getTranslatedUIText('태그', selectedLanguage)}
                    </Text>
                  ))
                : null}
            </View>

            <Text style={styles.sectionTitle}>
              🗓️ {getTranslatedUIText('일정', selectedLanguage)}
            </Text>
            <View style={styles.scheduleContainer}>
              {isScheduleMasked ? (
                // 잠금 스타일 일정
                <View style={styles.lockedScheduleContainer}>
                  {/* 첫 번째 일정만 미리보기 */}
                  <View style={styles.lockedPreviewBox}>
                    {Object.keys(currentGroupedSchedules)
                      .slice(0, 1)
                      .map((day, i) => {
                        const items = currentGroupedSchedules[day];
                        return (
                          <View key={i} style={styles.lockedPreviewDay}>
                            <Text style={styles.lockedPreviewDayTitle}>
                              {day}
                            </Text>
                            {items.slice(0, 2).map((item, idx) => (
                              <View key={idx} style={styles.lockedPreviewPlace}>
                                <Text style={styles.lockedPreviewPlaceName}>
                                  {item.placeName ||
                                    getTranslatedUIText(
                                      '장소명 없음',
                                      selectedLanguage,
                                    )}
                                </Text>
                                <Text style={styles.lockedPreviewPlaceDesc}>
                                  {item.placeDescription ||
                                    getTranslatedUIText(
                                      '설명 없음',
                                      selectedLanguage,
                                    )}
                                </Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                  </View>
                  <View style={styles.lockedCenterBox}>
                    {scheduleUnlocked ? (
                      // 이미 해제된 상태 (pointPaid: true)
                      <>
                        <Text style={styles.lockIcon}>🔓</Text>
                        <Text style={styles.lockedTitle}>
                          일정이 해제되었습니다
                        </Text>
                        <Text style={styles.lockedSub}>
                          모든 일정을 확인할 수 있습니다
                        </Text>
                      </>
                    ) : (
                      // 잠금 상태 (pointPaid: false)
                      <>
                        <Text style={styles.lockIcon}>🔒</Text>
                        <Text style={styles.lockedTitle}>
                          상세 일정은 포인트 결제 후 확인 가능합니다
                        </Text>
                        <Text style={styles.lockedSub}>
                          첫 번째 일정만 미리보기 가능
                        </Text>
                        <TouchableOpacity
                          style={styles.lockedPayBtn}
                          onPress={handleUnlockWithPoints}>
                          {/* ✅ [Points] 버튼 동작은 API 연동된 handleUnlockWithPoints */}
                          <Text style={styles.lockedPayBtnText}>
                            포인트로 결제하기
                          </Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={styles.lockedCardBtn} onPress={handleUnlockWithPayment}>
                          <Text style={styles.lockedCardBtnText}>카드로 결제하기</Text>
                        </TouchableOpacity> */}
                      </>
                    )}
                  </View>
                </View>
              ) : (
                // 해제된 일정 표시
                <>
                  {Object.keys(currentGroupedSchedules).map((day, i) => {
                    const items = currentGroupedSchedules[day];
                    return (
                      <View key={i} style={styles.scheduleCard}>
                        <Text style={styles.dayTitle} selectable={true}>
                          {day}
                        </Text>
                        {items.map((item, idx) => (
                          <React.Fragment key={idx}>
                            <TouchableOpacity
                              style={styles.placeBox}
                              onPress={() => handlePlacePress(item)}>
                              <Text
                                style={{fontSize: 15, lineHeight: 22, color: '#000000'}}
                                selectable={true}>
                                {getTranslatedUIText('장소', selectedLanguage)}{' '}
                                {String(idx + 1)}.{' '}
                                {item.placeName && item.placeName.includes(',')
                                  ? item.placeName.split(',')[0].trim()
                                  : item.placeName ||
                                    getTranslatedUIText(
                                      '장소명 없음',
                                      selectedLanguage,
                                    )}
                                {'\n'}
                                {item.placeDescription ||
                                  getTranslatedUIText(
                                    '설명 없음',
                                    selectedLanguage,
                                  )}
                                {'\n'}
                                {getTranslatedUIText(
                                  '소요시간',
                                  selectedLanguage,
                                )}
                                : {String(item.travelTime || 0)}
                                {getTranslatedUIText('분', selectedLanguage)}
                              </Text>
                              <View style={styles.placeArrow}>
                                <Icon
                                  name="chevron-right"
                                  size={20}
                                  color="#228B22"
                                />
                              </View>
                            </TouchableOpacity>
                            {idx < items.length - 1 ? (
                              <View style={styles.verticalLineContainer}>
                                <View
                                  style={styles.verticalLine}
                                />
                                <Text
                                  style={styles.moveTimeText}
                                  selectable={true}>
                                  {getTranslatedUIText(
                                    '이동시간',
                                    selectedLanguage,
                                  )}
                                  :{' '}
                                  {getTranslatedUIText(
                                    '이동시간 정보 없음',
                                    selectedLanguage,
                                  )}
                                </Text>
                                <View
                                  style={styles.verticalLine}
                                />
                              </View>
                            ) : null}
                          </React.Fragment>
                        ))}
                      </View>
                    );
                  })}
                </>
              )}
            </View>

            <Text style={styles.sectionTitle}>
              🗺 {getTranslatedUIText('지도', selectedLanguage)}
            </Text>
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
                  data.schedules?.length > 0
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
                {data.schedules
                  ? data.schedules.map((s, idx) => (
                      <Marker
                        key={idx}
                        coordinate={{latitude: s.lat, longitude: s.lon}}
                        title={`Day ${s.day} - ${
                          s.placeName ||
                          getTranslatedUIText('장소명 없음', selectedLanguage)
                        }`}
                        description={
                          s.placeDescription ||
                          getTranslatedUIText('설명 없음', selectedLanguage)
                        }
                        pinColor={dayColors[(s.day - 1) % dayColors.length]}
                      />
                    ))
                  : null}
                <Polyline
                  coordinates={
                    data.schedules
                      ? data.schedules.map(s => ({
                          latitude: s.lat,
                          longitude: s.lon,
                        }))
                      : []
                  }
                  strokeColor="#0288d1"
                  strokeWidth={3}
                />
              </MapView>
              <Text
                style={{textAlign: 'right', marginTop: 6}}
                selectable={true}>
                {getTranslatedUIText('총 거리', selectedLanguage)}:{' '}
                {String(getTotalDistance(data.schedules || []))}
                {getTranslatedUIText('km', selectedLanguage)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              🧑‍💼 {getTranslatedUIText('호스트 정보', selectedLanguage)}
            </Text>
            <Text style={styles.description} selectable={true}>
              {getTranslatedUIText('호스트', selectedLanguage)}:{' '}
              {(translatedData || data)?.user?.name ||
                getTranslatedUIText('정보 없음', selectedLanguage)}
            </Text>

            <Text style={styles.sectionTitle}>
              📖 {getTranslatedUIText('투어 설명', selectedLanguage)}
            </Text>
            <Text style={styles.description} selectable={true}>
              {(translatedData || data)?.description ||
                getTranslatedUIText('설명이 없습니다', selectedLanguage)}
            </Text>

            <View style={{height: 100}} />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Text style={styles.price} selectable={true}>
            ₩{(data.guidePrice || 0).toLocaleString()}{' '}
            {getTranslatedUIText('인당', selectedLanguage)}
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Text style={styles.chatText}>
                {getTranslatedUIText('상담하기', selectedLanguage)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reserveBtn}
              onPress={handleReservation}>
              <Text style={styles.reserveText}>
                {getTranslatedUIText('예약하기', selectedLanguage)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* 언어 선택 모달 */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getTranslatedUIText('언어 선택', selectedLanguage)}
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {supportedLanguages.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === language.code &&
                      styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text style={styles.languageName}>{language.name}</Text>
                  {selectedLanguage === language.code && (
                    <Icon name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  thumbnail: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  whiteBox: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    color: '#333',
  },
  editDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  rightAlignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  region: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  review: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 16,
  },
  like: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#333',
  },
  scheduleContainer: {
    marginBottom: 20,
  },
  scheduleCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    color: '#000000',
  },
  placeBox: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  placeArrow: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  verticalLineContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
  },
  moveTimeText: {
    fontSize: 12,
    color: '#000000',
    marginVertical: 4,
  },
  bottomBar: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatText: {
    color: '#333',
    fontWeight: '700',
  },
  reserveBtn: {
    flex: 1,
    backgroundColor: '#FF385C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reserveText: {
    color: 'white',
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 20,
  },
  translationProgressContainer: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  translationProgressText: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  translationButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  translationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#007AFF',
    minWidth: 150,
    justifyContent: 'center',
  },
  translationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedLanguageItem: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  lockedScheduleContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedCenterBox: {
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  lockedSub: {
    fontSize: 14,
    color: '#666',
  },
  lockedPayBtn: {
    backgroundColor: '#FF385C',
    padding: 12,
    borderRadius: 6,
  },
  lockedPayBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  lockedPreviewBox: {
    marginTop: 20,
  },
  lockedPreviewDay: {
    marginBottom: 12,
  },
  lockedPreviewDayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  lockedPreviewPlace: {
    marginBottom: 4,
  },
  lockedPreviewPlaceName: {
    fontSize: 14,
    color: '#666',
  },
  lockedPreviewPlaceDesc: {
    fontSize: 12,
    color: '#999',
  },
  lockedCardBtn: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  lockedCardBtnText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default Program_detail;
