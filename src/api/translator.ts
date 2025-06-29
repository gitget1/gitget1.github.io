import axios from 'axios';

export const supportedLanguages = [
  {code: 'ko', name: '한국어', flag: '🇰🇷'},
  {code: 'en', name: 'English', flag: '🇺🇸'},
  {code: 'ja', name: '日本語', flag: '🇯🇵'},
  {code: 'zh', name: '中文', flag: '🇨🇳'},
  {code: 'es', name: 'Español', flag: '🇪🇸'},
  {code: 'fr', name: 'Français', flag: '🇫🇷'},
];

// 간단한 번역 매핑 (API 실패 시 사용)
const simpleTranslations: {[key: string]: {[key: string]: string}} = {
  '남해 사찰과 휴양림 힐링여행': {
    en: 'Namhae Temple and Forest Healing Trip',
    ja: '南海寺院と森林浴ヒーリング旅行',
    zh: '南海寺庙和森林疗养之旅',
    es: 'Viaje de Sanación en Templos y Bosques de Namhae',
    fr: 'Voyage de Guérison dans les Temples et Forêts de Namhae',
  },
  '남해 체험형 2박3일 여행': {
    en: 'Namhae Experience 2 Nights 3 Days Trip',
    ja: '南海体験型2泊3日旅行',
    zh: '南海体验型2晚3天旅行',
    es: 'Viaje de Experiencia de Namhae 2 Noches 3 Días',
    fr: "Voyage d'Expérience Namhae 2 Nuits 3 Jours",
  },
  '남해 대표 해변과 뷰포인트': {
    en: 'Namhae Representative Beaches and Viewpoints',
    ja: '南海代表ビーチとビューポイント',
    zh: '南海代表海滩和观景点',
    es: 'Playas y Miradores Representativos de Namhae',
    fr: 'Plages et Points de Vue Représentatifs de Namhae',
  },
  '남해 체험형 2박3일 여행를 주제로 한 남해 3일 관광 프로그램입니다.': {
    en: 'This is a 3-day Namhae tourism program themed on Namhae experience 2 nights 3 days trip.',
    ja: '南海体験型2泊3日旅行をテーマにした南海3日観光プログラムです。',
    zh: '这是以南海体验型2晚3天旅行为主题的南海3天观光项目。',
    es: 'Este es un programa turístico de 3 días de Namhae con el tema de viaje de experiencia de Namhae de 2 noches 3 días.',
    fr: "C'est un programme touristique de 3 jours de Namhae sur le thème du voyage d'expérience de Namhae de 2 nuits 3 jours.",
  },
  '남해 대표 해변과 뷰포인트를 주제로 한 남해 1일 관광 프로그램입니다.': {
    en: 'This is a 1-day Namhae tourism program themed on Namhae representative beaches and viewpoints.',
    ja: '南海代表ビーチとビューポイントをテーマにした南海1日観光プログラムです。',
    zh: '这是以南海代表海滩和观景点为主题的南海1天观光项目。',
    es: 'Este es un programa turístico de 1 día de Namhae con el tema de playas y miradores representativos de Namhae.',
    fr: "C'est un programme touristique de 1 jour de Namhae sur le thème des plages et points de vue représentatifs de Namhae.",
  },
  남해: {
    en: 'Namhae',
    ja: '南海',
    zh: '南海',
    es: 'Namhae',
    fr: 'Namhae',
  },
  힐링: {
    en: 'Healing',
    ja: 'ヒーリング',
    zh: '疗养',
    es: 'Sanación',
    fr: 'Guérison',
  },
  체험: {
    en: 'Experience',
    ja: '体験',
    zh: '体验',
    es: 'Experiencia',
    fr: 'Expérience',
  },
  해변: {
    en: 'Beach',
    ja: 'ビーチ',
    zh: '海滩',
    es: 'Playa',
    fr: 'Plage',
  },
  뷰포인트: {
    en: 'Viewpoint',
    ja: 'ビューポイント',
    zh: '观景点',
    es: 'Mirador',
    fr: 'Point de Vue',
  },
  관광: {
    en: 'Tourism',
    ja: '観光',
    zh: '观光',
    es: 'Turismo',
    fr: 'Tourisme',
  },
  여행: {
    en: 'Travel',
    ja: '旅行',
    zh: '旅行',
    es: 'Viaje',
    fr: 'Voyage',
  },
  프로그램: {
    en: 'Program',
    ja: 'プログラム',
    zh: '项目',
    es: 'Programa',
    fr: 'Programme',
  },
  사찰: {
    en: 'Temple',
    ja: '寺院',
    zh: '寺庙',
    es: 'Templo',
    fr: 'Temple',
  },
  휴양림: {
    en: 'Forest',
    ja: '森林',
    zh: '森林',
    es: 'Bosque',
    fr: 'Forêt',
  },
  이동시간: {
    en: 'Travel Time',
    ja: '移動時間',
    zh: '移动时间',
    es: 'Tiempo de Viaje',
    fr: 'Temps de Voyage',
  },
  '정보 없음': {
    en: 'No Information',
    ja: '情報なし',
    zh: '无信息',
    es: 'Sin Información',
    fr: 'Aucune Information',
  },
  장소: {
    en: 'Place',
    ja: '場所',
    zh: '地点',
    es: 'Lugar',
    fr: 'Lieu',
  },
  소요시간: {
    en: 'Duration',
    ja: '所要時間',
    zh: '所需时间',
    es: 'Duración',
    fr: 'Durée',
  },
  분: {
    en: 'min',
    ja: '分',
    zh: '分钟',
    es: 'min',
    fr: 'min',
  },
  '총 거리': {
    en: 'Total Distance',
    ja: '総距離',
    zh: '总距离',
    es: 'Distancia Total',
    fr: 'Distance Totale',
  },
  km: {
    en: 'km',
    ja: 'km',
    zh: '公里',
    es: 'km',
    fr: 'km',
  },
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
  인당: {
    en: 'per person',
    ja: '一人当たり',
    zh: '每人',
    es: 'por persona',
    fr: 'par personne',
  },
  원: {
    en: 'won',
    ja: 'ウォン',
    zh: '韩元',
    es: 'won',
    fr: 'won',
  },
  리뷰: {
    en: 'Review',
    ja: 'レビュー',
    zh: '评论',
    es: 'Reseña',
    fr: 'Avis',
  },
  찜: {
    en: 'Like',
    ja: 'いいね',
    zh: '喜欢',
    es: 'Me Gusta',
    fr: "J'aime",
  },
  찜함: {
    en: 'Liked',
    ja: 'いいね済み',
    zh: '已喜欢',
    es: 'Me Gustó',
    fr: 'Aimé',
  },
  수정: {
    en: 'Edit',
    ja: '編集',
    zh: '编辑',
    es: 'Editar',
    fr: 'Modifier',
  },
  삭제: {
    en: 'Delete',
    ja: '削除',
    zh: '删除',
    es: 'Eliminar',
    fr: 'Supprimer',
  },
  닫기: {
    en: 'Close',
    ja: '閉じる',
    zh: '关闭',
    es: 'Cerrar',
    fr: 'Fermer',
  },
  '언어 선택': {
    en: 'Language Selection',
    ja: '言語選択',
    zh: '语言选择',
    es: 'Selección de Idioma',
    fr: 'Sélection de Langue',
  },
  '상세 일정은 예약 후 확인 가능합니다': {
    en: 'Detailed schedule available after reservation',
    ja: '詳細スケジュールは予約後に確認可能',
    zh: '详细行程预订后可见',
    es: 'Horario detallado disponible después de la reserva',
    fr: 'Horaire détaillé disponible après réservation',
  },
  '첫 번째 일정만 미리보기 가능': {
    en: 'Only first schedule preview available',
    ja: '最初のスケジュールのみプレビュー可能',
    zh: '仅可预览第一个行程',
    es: 'Solo vista previa del primer horario disponible',
    fr: 'Aperçu du premier horaire uniquement disponible',
  },
  '포인트로 결제하기': {
    en: 'Pay with Points',
    ja: 'ポイントで支払う',
    zh: '用积分支付',
    es: 'Pagar con Puntos',
    fr: 'Payer avec des Points',
  },
  결제하기: {
    en: 'Pay Now',
    ja: '支払う',
    zh: '立即支付',
    es: 'Pagar Ahora',
    fr: 'Payer Maintenant',
  },
  '이동시간: 이동시간 정보 없음': {
    en: 'Travel Time: No travel time information',
    ja: '移動時間：移動時間情報なし',
    zh: '移动时间：无移动时间信息',
    es: 'Tiempo de Viaje: Sin información de tiempo de viaje',
    fr: 'Temps de Voyage: Aucune information sur le temps de voyage',
  },
};

async function tryLibreTranslate(text: string, from: string, to: string) {
  try {
    const res = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: from,
        target: to,
        format: 'text',
      },
      {timeout: 5000},
    );
    return res.data.translatedText;
  } catch (error) {
    console.log('LibreTranslate 실패:', error);
    return null;
  }
}

async function tryLingvaTranslate(text: string, from: string, to: string) {
  try {
    const res = await axios.get(
      `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(text)}`,
      {
        timeout: 5000,
      },
    );
    return res.data.translation;
  } catch (error) {
    console.log('Lingva 실패:', error);
    return null;
  }
}

async function tryYandexTranslate(text: string, from: string, to: string) {
  try {
    const res = await axios.get(
      `https://translate.yandex.net/api/v1/tr.json/translate`,
      {
        params: {
          srv: 'tr-text',
          id: '01a83b9b.5c7c8b9a.1a2b3c4d',
          source_lang: from,
          target_lang: to,
          text: text,
        },
        timeout: 5000,
      },
    );
    return res.data.text[0];
  } catch (error) {
    console.log('Yandex 실패:', error);
    return null;
  }
}

export async function translateText(text: string, from: string, to: string) {
  // 한국어로 번역하는 경우 원본 반환
  if (to === 'ko') {
    return {translatedText: text};
  }

  // 간단한 번역 매핑 확인
  if (simpleTranslations[text] && simpleTranslations[text][to]) {
    console.log('간단한 번역 사용:', text, '->', simpleTranslations[text][to]);
    return {translatedText: simpleTranslations[text][to]};
  }

  // 여러 무료 API 시도
  const apis = [
    () => tryLibreTranslate(text, from, to),
    () => tryLingvaTranslate(text, from, to),
    () => tryYandexTranslate(text, from, to),
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result && result.trim() !== '') {
        console.log('번역 성공:', text, '->', result);
        return {translatedText: result};
      }
    } catch (error) {
      console.log('API 시도 실패:', error);
      continue;
    }
  }

  // 모든 API 실패 시 원본 반환
  console.log('모든 번역 API 실패, 원본 반환:', text);
  return {translatedText: text};
}
