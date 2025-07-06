import React, {useRef, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../navigations/AppNavigator';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {width} = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const images = [
  require('../../assets/풍경1.jpg'),
  require('../../assets/풍경2.jpg'),
  require('../../assets/풍경3.jpg'),
];

const MainHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {t, i18n} = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(width)).current;
  const dotPosition = useRef(new Animated.Value(0)).current;
  const animationTimer = useRef<NodeJS.Timeout | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // 도트 애니메이션만 currentIndex 변경 시 실행
  useEffect(() => {
    Animated.spring(dotPosition, {
      toValue: currentIndex,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, dotPosition]);

  // 슬라이드 애니메이션은 컴포넌트 마운트 시에만 시작
  useEffect(() => {
    const startSlideAnimation = () => {
      // 기존 타이머가 있다면 클리어
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }

      translateX.setValue(width);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        animationTimer.current = setTimeout(() => {
          Animated.timing(translateX, {
            toValue: -width,
            duration: 700,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex(prev => (prev + 1) % images.length);
            // 다음 애니메이션 예약
            startSlideAnimation();
          });
        }, 5000);
      });
    };

    startSlideAnimation();

    // 컴포넌트 언마운트 시 타이머 클리어
    return () => {
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, [translateX]); // translateX만 의존성으로 설정

  const handleTest = () => navigation.navigate('QuestionScreen');
  const handleTraitSelection = () => navigation.navigate('TraitSelection');
  const handleCalendar = () => navigation.navigate('CalendarHome');
  const handleChat = () => navigation.navigate('ChatMain');
  const handleTranslator = () => navigation.navigate('Translator');

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const languages = [
    {code: 'ko', name: t('korean'), flag: '🇰🇷'},
    {code: 'en', name: t('english'), flag: '🇺🇸'},
    {code: 'ja', name: t('japanese'), flag: '🇯🇵'},
    {code: 'zh', name: t('chinese'), flag: '🇨🇳'},
  ];

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {images.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {backgroundColor: index === currentIndex ? '#0288d1' : '#D9D9D9'},
          ]}
        />
      ))}
      <Animated.View
        style={[
          styles.activeDot,
          {
            transform: [
              {
                translateX: dotPosition.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, 24, 48],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 언어 선택 버튼 */}
      <View style={styles.languageButtonContainer}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageModal(true)}>
          <Ionicons name="language" size={20} color="#0288d1" />
          <Text style={styles.languageButtonText}>{t('language')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 🔥 인기 지역 슬라이드 */}
        <View style={{alignItems: 'center', marginTop: 24, marginBottom: 10}}>
          <Text style={styles.sectionTitle}>{t('popularRegions')}</Text>
          <Animated.View
            style={{
              transform: [{translateX}],
              width: width * 0.9,
              height: 220,
              borderRadius: 16,
              overflow: 'hidden',
              marginHorizontal: width * 0.05,
            }}>
            <Image
              source={images[currentIndex]}
              style={{width: '100%', height: '100%'}}
              resizeMode="cover"
            />
          </Animated.View>
          {renderDots()}
        </View>

        {/* 버튼형 카드 4개 */}
        <View style={styles.actionGrid}>
          {[
            {
              icon: '🧠',
              label: t('personalityTest'),
              action: handleTest,
              bg: '#E3F2FD',
            },
            {
              icon: '📍',
              label: t('myTourism'),
              action: handleTraitSelection,
              bg: '#C8E6C9',
            },
            {
              icon: '📅',
              label: t('calendar'),
              action: handleCalendar,
              bg: '#FFE0B2',
            },
            {
              icon: '💬',
              label: t('chat'),
              action: handleChat,
              bg: '#FFCDD2',
            },
            {
              icon: '🌍',
              label: t('realTimeTranslator'),
              action: handleTranslator,
              bg: '#E8F5E8',
            },
            {
              icon: '🔎',
              label: '성향별 맞춤 찾기',
              action: () => navigation.navigate('TraitSelection1'),
              bg: '#FFF9C4',
            },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.iconCard, {backgroundColor: item.bg}]}
              onPress={item.action}>
              <Text style={styles.iconEmoji}>{item.icon}</Text>
              <Text style={styles.iconLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 📍 위치 기반 추천 박스 */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>{t('currentLocation')}</Text>
          <Text style={styles.tipSub}>{t('weatherInfo')}</Text>
        </View>

        {/* 📢 이벤트 정보 박스 */}
        <View style={styles.eventBox}>
          <Text style={styles.eventTitle}>{t('event')}</Text>
          <Text style={styles.eventDescription}>{t('eventDescription')}</Text>
        </View>
      </ScrollView>

      {/* 언어 선택 모달 */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            {languages.map(language => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  i18n.language === language.code && styles.selectedLanguage,
                ]}
                onPress={() => changeLanguage(language.code)}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.name}</Text>
                {i18n.language === language.code && (
                  <Ionicons name="checkmark" size={20} color="#0288d1" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    height: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0288d1',
    position: 'absolute',
    left: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    marginTop: 30,
  },
  iconCard: {
    width: width * 0.42,
    height: 100,
    borderRadius: 16,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  iconLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  tipBox: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#e1f5fe',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'column',
    gap: 4,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0277bd',
  },
  tipSub: {
    fontSize: 15,
    color: '#37474f',
  },
  eventBox: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 14,
    color: '#4E342E',
    lineHeight: 20,
  },
  // 언어 선택 관련 스타일
  languageButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#0288d1',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: width * 0.8,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLanguage: {
    backgroundColor: '#e3f2fd',
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
  closeButton: {
    marginTop: 20,
    backgroundColor: '#0288d1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MainHomeScreen;
