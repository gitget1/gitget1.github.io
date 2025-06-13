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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../navigations/AppNavigator';

const {width} = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const images = [
  require('../../assets/풍경1.jpg'),
  require('../../assets/풍경2.jpg'),
  require('../../assets/풍경3.jpg'),
];

const MainHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(width)).current;
  const dotPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(width);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(translateX, {
            toValue: -width,
            duration: 700,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex(prev => (prev + 1) % images.length);
          });
        }, 5000);
      });

      Animated.spring(dotPosition, {
        toValue: currentIndex,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };
    animate();
  }, [currentIndex, dotPosition, translateX]);

  const handleTest = () => navigation.navigate('QuestionScreen');
  const handleTraitSelection = () => navigation.navigate('TraitSelection');
  const handleTourByRegion = () => navigation.navigate('TestPost');
  const handleTodayRecommend = () => navigation.navigate('PracticeDetail');

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 🔥 인기 지역 슬라이드 */}
        <View style={{alignItems: 'center', marginTop: 24, marginBottom: 10}}>
          <Text style={styles.sectionTitle}>🔥 인기 지역</Text>
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
              label: '성향 테스트',
              action: handleTest,
              bg: '#E3F2FD',
            },
            {
              icon: '📍',
              label: '나의 성향 관광',
              action: handleTraitSelection,
              bg: '#C8E6C9',
            },
            {
              icon: '🗺️',
              label: '지역 설정 관광',
              action: handleTourByRegion,
              bg: '#FFE0B2',
            },
            {
              icon: '🌟',
              label: '오늘의 추천',
              action: handleTodayRecommend,
              bg: '#FFCDD2',
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
          <Text style={styles.tipTitle}>📍 현재 위치: 서울</Text>
          <Text style={styles.tipSub}>☀️ 맑음, 22℃ | 한강 산책 어때요?</Text>
        </View>

        {/* 📢 이벤트 정보 박스 */}
        <View style={styles.eventBox}>
          <Text style={styles.eventTitle}>📢 이벤트</Text>
          <Text style={styles.eventDescription}>
            🎉 5월 한정! 성향 분석하면 굿즈 추첨 이벤트에 참여해보세요.
          </Text>
        </View>
      </ScrollView>
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
});

export default MainHomeScreen;
