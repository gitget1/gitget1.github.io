
import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  ImageBackground,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authNavigations, colors } from '../../constants';
import CustomButton from '../../components/CustomButton';
import { Text } from 'react-native-gesture-handler';
import { AuthStackParamList } from '../../navigations/stack/AuthStackNavigator';

type Props = StackScreenProps<AuthStackParamList, typeof authNavigations.AUTH_HOME>;

type AuthHomeScreenProps = Props & {
  navigationOverride?: () => void;
};

function AuthHomeScreen({ navigation, navigationOverride }: AuthHomeScreenProps) {
  return (
    <ImageBackground
      source={require('../../assets/가로수길.jpg')}
      style={styles.background}
      resizeMode="cover">
      <SafeAreaView style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            resizeMode="contain"
            style={styles.image}
            source={require('../../assets/감사합니다.jpg')}
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

          <Pressable onPress={navigationOverride}>
            <Text style={styles.emailText}>로그인없이 메인화면으로 이동하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 30,
    alignItems: 'center',
    marginHorizontal: 30,
    marginVertical: 30,
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
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    color: colors.BLACK,
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