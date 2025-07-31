import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const SplashScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 배경 슬라이드 애니메이션 (우에서 좌로)
    Animated.timing(slideAnim, {
      toValue: -width / 2,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 메인 로고 애니메이션 (배경 애니메이션 후 시작)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // 로딩 점 애니메이션 (순차적으로)
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(dotAnim1, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim2, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim3, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);

    // 3초 후 메인 화면으로 이동
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{name: 'AuthStack' as never}],
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, dotAnim1, dotAnim2, dotAnim3, navigation]);

  return (
    <View style={styles.container}>
      {/* 배경 이미지 (전체 화면) */}
      <Animated.View
        style={[
          styles.backgroundImage,
          {
            transform: [{translateX: slideAnim}],
            left: -width / 2,
          },
        ]}>
        <Image
          source={require('../assets/07d45e77-cd53-4cf1-a3f7-e0511c7e2de3.jpg')}
          style={styles.backgroundImageStyle}
          resizeMode="cover"
        />
      </Animated.View>
      
      {/* 오버레이 (텍스트 가독성을 위해) */}
      <View style={styles.overlay} />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        {/* 로고 이미지 */}
        <Image
          source={require('../assets/default.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>TravelLocal</Text>
        <Text style={styles.subtitle}>여행의 모든 순간을 기록하세요</Text>
      </Animated.View>
      
      {/* 로딩 인디케이터 */}
      <View style={styles.loadingContainer}>
        <Animated.View 
          style={[
            styles.dot, 
            {
              opacity: dotAnim1,
              transform: [{scale: dotAnim1}],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            {
              opacity: dotAnim2,
              transform: [{scale: dotAnim2}],
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.dot, 
            {
              opacity: dotAnim3,
              transform: [{scale: dotAnim3}],
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 2,
    height: height,
  },
  backgroundImageStyle: {
    width: width * 2,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
});

export default SplashScreen; 