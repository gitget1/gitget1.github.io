import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigations/AppNavigator';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const { width } = Dimensions.get('window');

const images = [
  require('../../assets/풍경1.jpg'),
  require('../../assets/풍경2.jpg'),
  require('../../assets/풍경3.jpg'),
];

const MainHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  // 이미지 슬라이드 관련 상태 및 애니메이션
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(width)).current;
  const dotPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateX.setValue(width);
      
      // 이미지 슬라이드 애니메이션
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
            setCurrentIndex((prev) => (prev + 1) % images.length);
          });
        }, 5000);
      });

      // 점 애니메이션
      Animated.spring(dotPosition, {
        toValue: currentIndex,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };
    animate();
  }, [currentIndex, translateX, dotPosition]);

  const handleTest = () => {
    navigation.navigate('QuestionScreen');
  };

  const handleTraitSelection = () => {
    navigation.navigate('TraitSelection');
  };

  const handleTourByRegion = () => {
    navigation.navigate('Practice');
  };

  const handleTodayRecommend = () => {
    navigation.navigate('FunctionStack', { screen: 'TodayRecommend' });
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? '#0288d1' : '#D9D9D9',
              },
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
                    outputRange: [0, 24, 48], // 점 사이의 간격에 따라 조정
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 이미지 슬라이드 */}
      <View style={{ alignItems: 'center', marginTop: 90, marginBottom: 10 }}>
        <Animated.View style={{ transform: [{ translateX }], width: 320, height: 180, borderRadius: 16, overflow: 'hidden' }}>
          <Image
            source={images[currentIndex]}
            style={{ width: 320, height: 180, borderRadius: 16 }}
            resizeMode="cover"
          />
        </Animated.View>
        {renderDots()}
      </View>

      {/* 기존 버튼 UI */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#2c3e50' }]}
            onPress={handleTest}
          >
            <Text style={styles.buttonText}>성향 테스트</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#27ae60' }]}
            onPress={handleTraitSelection}
          >
            <Text style={styles.buttonText}>나의 성향으로 관광 정하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#e67e22' }]}
            onPress={handleTourByRegion}
          >
            <Text style={styles.buttonText}>지역설정으로 관광 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#c0392b' }]}
            onPress={handleTodayRecommend}
          >
            <Text style={styles.buttonText}>오늘의 관광 추천리스트</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  customButton: {
    width: width * 0.4,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
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
    left: 8, // 첫 번째 점의 위치
  },
});

export default MainHomeScreen;
