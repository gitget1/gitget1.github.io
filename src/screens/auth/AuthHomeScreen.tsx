import {StackScreenProps} from '@react-navigation/stack';
import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {authNavigations, colors} from '../../constants';
import CustomButton from '../../components/CustomButton';
import {Text} from 'react-native-gesture-handler';
import {AuthStackParamList} from '../../navigations/stack/AuthStackNavigator';

type Props = StackScreenProps<
  AuthStackParamList,
  typeof authNavigations.AUTH_HOME
>;

type AuthHomeScreenProps = Props & {
  navigationOverride?: () => void;
};

function AuthHomeScreen({navigation, navigationOverride}: AuthHomeScreenProps) {
  const [videoError, setVideoError] = useState(false);

  const onVideoError = (error: any) => {
    console.log('Video error:', error);
    setVideoError(true);
  };

  const onVideoLoad = () => {
    console.log('Video loaded successfully');
  };

  return (
    <View style={styles.container}>
      {/* 동영상 배경 */}
      <Video
        source={require('../../assets/videos/login_background.mp4')}
        style={styles.videoBackground}
        muted={true}
        repeat={true}
        resizeMode="cover"
        onError={onVideoError}
        onLoad={onVideoLoad}
      />
      
      {/* 동영상 로드 실패 시 대체 배경 */}
      {videoError && (
        <View style={styles.fallbackBackground} />
      )}
      
      {/* 반투명 오버레이 */}
      <View style={styles.overlay} />
      
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.imageContainer}>
          <Image
            resizeMode="contain"
            style={styles.image}
            source={require('../../assets/KakaoTalk_20250919_002642553.png')}
          />
        </View>
        <View style={styles.buttonContainer}>
          <CustomButton
            label="카카오 로그인 하기"
            onPress={() => navigation.navigate(authNavigations.KAKAO)}
            style={styles.kakaoButtonContainer}
            textstyle={styles.kakaoButtonText}
            icon={
              <Ionicons name={'chatbubble-sharp'} color={'#181500'} size={16} />
            }
          />
          <CustomButton
            label="네이버 로그인 하기"
            onPress={() => navigation.navigate(authNavigations.NAVER)}
            style={styles.NAVERButtonContainer}
            textstyle={styles.NAVERButtonText}
            icon={
              <Image
                source={require('../../assets/btnG_아이콘사각.png')}
                style={styles.naverIcon}
                resizeMode="contain"
              />
            }
          />
          <CustomButton
            label="구글 로그인하기"
            onPress={() => navigation.navigate(authNavigations.GOOGLE)}
            style={styles.GoogleButtonContainer}
            textstyle={styles.GoogleButtonText}
            icon={
              <Image
                source={require('../../assets/png-transparent-google-company-text-logo.png')}
                style={styles.googleIcon}
                resizeMode="contain"
              />
            }
          />

          {/* <Pressable onPress={navigationOverride}>
            <Text style={styles.emailText}>
              로그인없이 메인화면으로 이동하기
            </Text>
          </Pressable> */}
        </View>
      </SafeAreaView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // 반투명 오버레이
  },
  contentContainer: {
    flex: 1,
    margin: 30,
    alignItems: 'center',
    marginHorizontal: 30,
    marginVertical: 30,
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: '#1a1a2e', // 동영상과 비슷한 어두운 배경
  },
  imageContainer: {
    flex: 1,
    width: Dimensions.get('screen').width / 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flex: 1,
    gap: 20,
  },
  kakaoButtonContainer: {
    backgroundColor: '#FEE503',
  },
  kakaoButtonText: {
    color: '#181600',
  },
  emailText: {
    textDecorationLine: 'underline',
    fontWeight: '500',
    padding: 10,
    color: '#999',
    alignSelf: 'center',
  },
  NAVERButtonContainer: {
    backgroundColor: '#03C75A',
  },
  NAVERButtonText: {
    color: '#FFFFFF',
  },
  GoogleButtonContainer: {
    backgroundColor: '#FFFFFF',
  },
  GoogleButtonText: {
    color: '#181600',
  },
  naverIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    alignSelf: 'center',
  },
  googleIcon: {
    width: 28,
    height: 20,
    marginRight: 8,
  },
});

export default AuthHomeScreen;
