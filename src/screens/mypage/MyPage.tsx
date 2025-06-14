import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ 추가
import {useTranslation} from 'react-i18next';

type RootStackParamList = {
  MyPage: undefined;
  QuestionScreen: undefined;
  Result: undefined;
  MakeProgram: undefined;
  MyReviewList: undefined;
};

const MainScreen = () => {
  const {t} = useTranslation();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nickname, setNickname] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // JWT 토큰 디코딩 함수
  const decodeJWT = useCallback((token: string) => {
    try {
      const cleanToken = token.replace('Bearer ', '');
      const base64Url = cleanToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const decoded = JSON.parse(jsonPayload);
      console.log('🔍 JWT 디코딩 결과:', decoded);
      console.log('🔍 JWT에서 찾은 이름 필드들:', {
        name: decoded.name,
        username: decoded.username,
        nickname: decoded.nickname,
        sub: decoded.sub,
        email: decoded.email,
      });
      return decoded;
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
      return null;
    }
  }, []);

  // API를 통해 사용자 프로필 정보 가져오기
  const fetchUserProfile = useCallback(
    async (token: string) => {
      try {
        const cleanToken = token.replace('Bearer ', '');
        console.log(
          '🔍 API 호출 시작 - 토큰:',
          cleanToken.substring(0, 20) + '...',
        );

        // 여러 API 엔드포인트 시도 (네이버 사용자 포함)
        const apiEndpoints = [
          'http://124.60.137.10/api/user/profile',
          'http://124.60.137.10/api/users/me',
          'http://124.60.137.10/api/user/me',
          'http://124.60.137.10/api/auth/me',
          'http://124.60.137.10/api/user/info',
          'http://124.60.137.10/api/auth/user',
          'http://124.60.137.10/api/naver/user',
        ];

        for (const endpoint of apiEndpoints) {
          try {
            console.log(`🔍 시도 중인 API: ${endpoint}`);

            const response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                'Content-Type': 'application/json',
              },
            });

            console.log(`🔍 ${endpoint} 응답 상태:`, response.status);

            if (response.ok) {
              const userData = await response.json();
              console.log(
                `🔍 ${endpoint} 응답 데이터:`,
                JSON.stringify(userData, null, 2),
              );

              // 다양한 필드에서 이름 찾기
              let userName = null;

              // 기본 구조
              if (userData.data && userData.data.name) {
                userName = userData.data.name;
              } else if (userData.data && userData.data.username) {
                userName = userData.data.username;
              } else if (userData.data && userData.data.nickname) {
                userName = userData.data.nickname;
              }
              // 직접 필드
              else if (userData.name) {
                userName = userData.name;
              } else if (userData.username) {
                userName = userData.username;
              } else if (userData.nickname) {
                userName = userData.nickname;
              }
              // 중첩된 user 객체
              else if (userData.user && userData.user.name) {
                userName = userData.user.name;
              } else if (userData.user && userData.user.username) {
                userName = userData.user.username;
              } else if (userData.user && userData.user.nickname) {
                userName = userData.user.nickname;
              }
              // 네이버 특화 필드들
              else if (userData.naverName) {
                userName = userData.naverName;
              } else if (userData.socialName) {
                userName = userData.socialName;
              } else if (userData.displayName) {
                userName = userData.displayName;
              }
              // 이메일에서 추출
              else if (userData.email) {
                userName = userData.email.split('@')[0];
              } else if (userData.data && userData.data.email) {
                userName = userData.data.email.split('@')[0];
              }

              console.log(`🔍 ${endpoint}에서 찾은 사용자 이름:`, userName);

              if (userName) {
                setNickname(userName);
                return; // 성공하면 함수 종료
              }
            } else {
              const errorText = await response.text();
              console.log(`⚠️ ${endpoint} 실패:`, response.status, errorText);
            }
          } catch (endpointError) {
            console.log(`⚠️ ${endpoint} 오류:`, endpointError);
          }
        }

        // 모든 API 호출이 실패했을 경우
        console.log('⚠️ 모든 API 엔드포인트에서 사용자 이름을 찾을 수 없음');
        setNickname(t('defaultUser'));
      } catch (error) {
        console.error('❌ 사용자 프로필 API 호출 실패:', error);
        setNickname(t('defaultUser'));
      }
    },
    [t],
  );

  // 네이버 API를 통해 사용자 프로필 정보 가져오기
  const fetchNaverUserProfile = useCallback(
    async (naverToken: string) => {
      try {
        console.log('🔍 네이버 API 호출 시작');

        const response = await fetch('https://openapi.naver.com/v1/nid/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${naverToken}`,
          },
        });

        console.log('🔍 네이버 API 응답 상태:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log(
            '🔍 네이버 API 응답 데이터:',
            JSON.stringify(userData, null, 2),
          );

          if (userData.response) {
            const naverName =
              userData.response.name ||
              userData.response.nickname ||
              userData.response.email?.split('@')[0];

            console.log('🔍 네이버 API에서 찾은 사용자 이름:', naverName);

            if (naverName) {
              setNickname(naverName);
              // 네이버 사용자 정보를 AsyncStorage에 저장
              await AsyncStorage.setItem(
                'naver_userinfo',
                JSON.stringify(userData),
              );
              return;
            }
          }
        } else {
          const errorText = await response.text();
          console.error('네이버 API 호출 실패:', response.status, errorText);
        }

        // 네이버 API 호출이 실패했을 경우 기본값 사용
        setNickname(t('defaultUser'));
      } catch (error) {
        console.error('❌ 네이버 API 호출 실패:', error);
        setNickname(t('defaultUser'));
      }
    },
    [t],
  );

  // ✅ 사용자 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);

        // AsyncStorage에서 다양한 키로 사용자 정보 확인 (네이버 로그인 포함)
        const token = await AsyncStorage.getItem('accessToken');
        const naverToken = await AsyncStorage.getItem('naver_accesstoken');
        const naverUserInfo = await AsyncStorage.getItem('naver_userinfo');
        const userName = await AsyncStorage.getItem('userName');
        const userInfo = await AsyncStorage.getItem('userInfo');
        const nickname = await AsyncStorage.getItem('nickname');
        const email = await AsyncStorage.getItem('email');

        console.log('📌 AsyncStorage 확인 (네이버 포함):', {
          'token 존재': !!token,
          'naverToken 존재': !!naverToken,
          naverUserInfo: naverUserInfo,
          userName: userName,
          userInfo: userInfo,
          nickname: nickname,
          email: email,
        });

        // 네이버 사용자 정보 우선 확인
        if (naverUserInfo) {
          try {
            const parsedNaverInfo = JSON.parse(naverUserInfo);
            console.log('✅ 네이버 사용자 정보 발견:', parsedNaverInfo);

            // 네이버 사용자 정보에서 이름 추출
            let naverName = null;
            if (parsedNaverInfo.response) {
              naverName =
                parsedNaverInfo.response.name ||
                parsedNaverInfo.response.nickname ||
                parsedNaverInfo.response.email?.split('@')[0];
            } else {
              naverName =
                parsedNaverInfo.name ||
                parsedNaverInfo.nickname ||
                parsedNaverInfo.email?.split('@')[0];
            }

            if (naverName) {
              console.log('✅ 네이버에서 이름 추출:', naverName);
              setNickname(naverName);
              return;
            }
          } catch (parseError) {
            console.log('⚠️ 네이버 사용자 정보 파싱 실패:', parseError);
          }
        }

        // 네이버 토큰이 있으면 네이버 API 호출
        if (naverToken) {
          console.log('🔍 네이버 토큰 발견, 네이버 API 호출 시도');
          await fetchNaverUserProfile(naverToken);
          return;
        }

        // AsyncStorage에서 직접 이름 찾기
        if (userName) {
          console.log('✅ AsyncStorage에서 userName 발견:', userName);
          setNickname(userName);
          return;
        }

        if (nickname) {
          console.log('✅ AsyncStorage에서 nickname 발견:', nickname);
          setNickname(nickname);
          return;
        }

        if (userInfo) {
          try {
            const parsedUserInfo = JSON.parse(userInfo);
            console.log('✅ AsyncStorage에서 userInfo 발견:', parsedUserInfo);
            if (
              parsedUserInfo.name ||
              parsedUserInfo.username ||
              parsedUserInfo.nickname
            ) {
              const foundName =
                parsedUserInfo.name ||
                parsedUserInfo.username ||
                parsedUserInfo.nickname;
              console.log('✅ userInfo에서 이름 추출:', foundName);
              setNickname(foundName);
              return;
            }
          } catch (parseError) {
            console.log('⚠️ userInfo 파싱 실패:', parseError);
          }
        }

        console.log('📌 일반 토큰 앞부분:', token?.substring(0, 50) + '...');

        if (token) {
          // JWT 토큰에서 사용자 정보 추출
          const userInfo = decodeJWT(token);
          if (userInfo) {
            // JWT에서 이름 찾기 (다양한 필드 시도)
            let jwtName =
              userInfo.name || userInfo.username || userInfo.nickname;

            // 네이버 사용자 ID 처리
            if (!jwtName && userInfo.sub && userInfo.sub.startsWith('naver_')) {
              console.log('🔍 네이버 사용자 ID 발견:', userInfo.sub);
              // 서버 API를 통해 사용자 정보 가져오기 시도
              await fetchUserProfile(token);
              return;
            }

            console.log('🔍 JWT에서 추출한 이름:', jwtName);

            if (jwtName) {
              setNickname(jwtName);
            } else {
              console.log('🔍 JWT에서 이름을 찾을 수 없음, API 호출 시도');
              // JWT에서 이름을 가져올 수 없으면 API 호출
              await fetchUserProfile(token);
            }
          } else {
            console.log('🔍 JWT 디코딩 실패, API 호출 시도');
            await fetchUserProfile(token);
          }
        } else {
          console.log('⚠️ 토큰이 없음, 기본값 사용');
          // 토큰이 없으면 기본값 설정
          setNickname(t('defaultUser'));
        }
      } catch (err) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
        setNickname(t('defaultUser'));
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, [t, decodeJWT, fetchUserProfile, fetchNaverUserProfile]);

  const pickImage = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri || null);
        setShowModal(false);
      }
    });
  };

  const takePhoto = () => {
    launchCamera({mediaType: 'photo'}, response => {
      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri || null);
        setShowModal(false);
      }
    });
  };

  const resetProfile = () => {
    setProfileImage(null);
    setShowModal(false);
  };

  const goToTest = () => {
    navigation.navigate('QuestionScreen');
  };

  const goToMakeProgram = () => {
    navigation.navigate('Make_program');
  };

  const goToReview = () => {
    navigation.navigate('MyReviewList');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerBox}>
          <View style={styles.profileWrap}>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Image
                source={
                  profileImage
                    ? {uri: profileImage}
                    : require('../../assets/default.png')
                }
                style={styles.profileCircle}
              />
            </TouchableOpacity>
            <Text style={styles.helloText}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#1e7c3c" />
                  <Text style={styles.loadingText}>{t('loadingUserInfo')}</Text>
                </View>
              ) : (
                `${nickname}${t('welcome')}`
              )}
            </Text>
          </View>
        </View>

        <View style={styles.gridBox}>
          <TouchableOpacity style={styles.gridItem} onPress={goToTest}>
            <Text style={styles.gridIcon}>📊</Text>
            <Text style={styles.gridText}>{t('personalityTestShort')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={goToMakeProgram}>
            <Text style={styles.gridIcon}>📝</Text>
            <Text style={styles.gridText}>{t('programWrite')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridIcon}>💬</Text>
            <Text style={styles.gridText}>{t('inquiry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={goToReview}>
            <Text style={styles.gridIcon}>📚</Text>
            <Text style={styles.gridText}>{t('myReview')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>{t('buddyPass')}</Text>
          <Text style={styles.noticeSub}>{t('buddyPassDesc')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('service')}</Text>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceItem}>{t('recentViewed')}</Text>
            <Text style={styles.serviceItem}>{t('favorites')}</Text>
            <Text style={styles.serviceItem}>{t('events')}</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={takePhoto}>
            <Text style={styles.modalText}>{t('takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.modalText}>{t('selectFromGallery')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetProfile}>
            <Text style={styles.modalText}>{t('resetToDefault')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text style={styles.modalText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBox: {
    paddingVertical: 24,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  profileWrap: {
    alignItems: 'center',
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  helloText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e7c3c',
  },
  gridBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridItem: {
    width: '40%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridIcon: {
    fontSize: 30,
  },
  gridText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  noticeCard: {
    backgroundColor: '#e6f5ea',
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e7c3c',
  },
  noticeSub: {
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceItem: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    width: '30%',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffffee',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
  },
  modalText: {
    fontSize: 18,
    paddingVertical: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1e7c3c',
  },
});
