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
  const handleTourByRegion = () => navigation.navigate('Practice');
  const handleTodayRecommend = () =>
    navigation.navigate('FunctionStack', {screen: 'TodayRecommend'});

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
        {/* 🔍 검색 영역 */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <Text style={styles.searchText}>검색을 시작해 보세요</Text>
        </View>

        {/* 🔥 인기 지역 슬라이드 */}
        <View style={{alignItems: 'center', marginTop: 24, marginBottom: 10}}>
          <Text style={styles.sectionTitle}>🔥 인기 지역</Text>
          <Animated.View
            style={{
              transform: [{translateX}],
              width: 320,
              height: 180,
              borderRadius: 16,
              overflow: 'hidden',
            }}>
            <Image
              source={images[currentIndex]}
              style={{width: 320, height: 180}}
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
              bg: '#E8F5E9',
            },
            {
              icon: '🗺️',
              label: '지역 설정 관광',
              action: handleTourByRegion,
              bg: '#FFF3E0',
            },
            {
              icon: '🌟',
              label: '오늘의 추천',
              action: handleTodayRecommend,
              bg: '#FFEBEE',
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
        {/* ✅ 위치 기반 추천 박스 */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>📍 현재 위치: 서울</Text>
          <Text style={styles.tipSub}>☀️ 맑음, 22℃ | 한강 산책 어때요?</Text>
        </View>

        {/* ✅ 이벤트 배너 박스 */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerText}>
            🎉 5월 한정! 성향 분석하면 굿즈 추첨!
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
  tipBox: {
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0277bd',
    marginBottom: 4,
  },
  tipSub: {
    fontSize: 13,
    color: '#333',
  },
  bannerBox: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bannerText: {
    fontSize: 14,
    color: '#795548',
    fontWeight: '600',
  },
  searchContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#f1f3f5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  searchEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  searchText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
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
    justifyContent: 'space-around',
    paddingHorizontal: 10,
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
});

export default MainHomeScreen;
