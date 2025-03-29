import { StackScreenProps } from '@react-navigation/stack';
import React from 'react';
import { Button, StyleSheet, View, Image, Dimensions,ImageBackground} from 'react-native'; // Image 추가
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigations/stack/AuthStackNavigator';
import { authNavigations } from '../../constants';
import CustomButton from '../../components/CustomButton';

type AuthHomeScreenProps = StackScreenProps<AuthStackParamList, typeof authNavigations.AUTH_HOME>;

function AuthHomeScreen({ navigation }: AuthHomeScreenProps) {
  return (
    <ImageBackground
    source={require('../../assets/가로수길.jpg')} 
    style={styles.background} 
    resizeMode="cover" 
  >
    <SafeAreaView style={styles.container}>
     <View style={styles.imageContainer}>
      <Image 
      resizeMode="contain"
      style={styles.image} 
      source={require('../../assets/감사합니다.jpg')} />



     </View>
      
      <View style={styles.buttonContainer}>
        <CustomButton
          label="로그인 하기"
          onPress={() => navigation.navigate(authNavigations.Login)}
        />
        <CustomButton
          label="회원가입 하기"
          variant="outlined"
          onPress={() => navigation.navigate(authNavigations.SIGNUP)}
        />
      </View>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container:{
  flex:1,
  margin: 30,
  alignItems: 'center',
  },
  imageContainer:{
    flex:1,
    width: Dimensions.get('screen').width / 2  ,
  },
  
  image:{
    width:'100%',
    height:'100%',
  },
  
  buttonContainer:{
    flex: 1,
    gap: 20,
  },
background:{
  flex:1,
  width:'100%',
  height:'100%',
}

});

export default AuthHomeScreen;
