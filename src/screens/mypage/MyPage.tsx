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
  Alert,
  TextInput,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    gender: '',
    birthYear: '',
    mobile: '',
    role: 'USER',
    protectNumber: ''
  });
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // 출생년도 옵션 생성 (1950년부터 현재까지)
  const generateBirthYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year.toString());
    }
    return years;
  };

  const birthYears = generateBirthYears();

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
          'http://124.60.137.10:8083/api/user', // 사용자 상세 정보 조회 API (우선순위 높음)
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
                // 전체 사용자 정보 저장
                setUserInfo(userData.data || userData);
                console.log('✅ MyPage에서 전체 사용자 정보 저장됨:', userData.data || userData);
                // AsyncStorage에 사용자 이름 저장 (다른 화면에서 사용할 수 있도록)
                await AsyncStorage.setItem('currentUserName', userName);
                console.log('✅ MyPage에서 사용자 이름 저장됨:', userName);
                // 서버 내부 ID도 저장
                if (userData.data && userData.data.id) {
                  await AsyncStorage.setItem('currentUserId', userData.data.id.toString());
                  console.log('✅ MyPage에서 서버 내부 ID 저장됨:', userData.data.id);
                }
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
              // 사용자 이름도 별도로 저장
              await AsyncStorage.setItem('currentUserName', naverName);
              console.log('✅ MyPage에서 네이버 사용자 이름 저장됨:', naverName);
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

  // ✅ 사용자 정보 불러오기 - 매번 API 호출
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);
        console.log('🔄 MyPage 진입 - 사용자 정보 조회 시작');

        // 토큰 확인
        const token = await AsyncStorage.getItem('accessToken');
        const naverToken = await AsyncStorage.getItem('naver_accesstoken');

        console.log('📌 토큰 확인:', {
          'accessToken 존재': !!token,
          'naverToken 존재': !!naverToken,
        });

        // 네이버 토큰이 있으면 네이버 API 호출
        if (naverToken) {
          console.log('🔍 네이버 토큰 발견, 네이버 API 호출 시도');
          await fetchNaverUserProfile(naverToken);
          return;
        }

        // 일반 토큰이 있으면 서버 API 호출
        if (token) {
          console.log('🔍 일반 토큰 발견, 서버 API 호출 시도');
          await fetchUserProfile(token);
          return;
        }

        // 토큰이 없으면 기본값 설정
        console.log('⚠️ 토큰이 없음, 기본값 사용');
        setNickname(t('defaultUser'));
      } catch (err) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
        setNickname(t('defaultUser'));
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, [t, fetchUserProfile, fetchNaverUserProfile]);

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

  // 내 정보 확인 함수
  const showUserInfo = () => {
    console.log('🔍 내 정보 확인 버튼 클릭');
    console.log('📋 현재 상태:', {
      nickname,
      profileImage,
      loading,
      userInfo: userInfo ? '있음' : '없음',
      userInfoKeys: userInfo ? Object.keys(userInfo) : 'N/A'
    });
    
    // AsyncStorage에서 저장된 정보 확인
    AsyncStorage.getItem('currentUserName').then(userName => {
      AsyncStorage.getItem('currentUserId').then(userId => {
        console.log('📋 AsyncStorage 사용자 정보:', {
          userName,
          userId
        });
      });
    });
    
    // 사용자 정보가 있으면 상세 정보 표시
    if (userInfo && Object.keys(userInfo).length > 0) {
      console.log('📋 userInfo 상세 내용:', JSON.stringify(userInfo, null, 2));
      
      const infoText = `
📋 내 정보 상세

🆔 ID: ${userInfo.id || 'N/A'}
👤 사용자명: ${userInfo.username || 'N/A'}
📝 이름: ${userInfo.name || 'N/A'}
📧 이메일: ${userInfo.email || 'N/A'}
⚧ 성별: ${userInfo.gender === 'NOT_PROVIDED' ? '정보를 입력하시오' : userInfo.gender || 'N/A'}
🎂 출생년도: ${userInfo.birthYear === 'NOT_PROVIDED' ? '정보를 입력하시오' : userInfo.birthYear || 'N/A'}
📱 휴대폰: ${userInfo.mobile === 'NOT_PROVIDED' ? '정보를 입력하시오' : userInfo.mobile || 'N/A'}
👑 역할: ${userInfo.role || 'N/A'}
🔒 보호번호: ${userInfo.protectNumber === 'NOT_PROVIDED' ? '정보를 입력하시오' : userInfo.protectNumber || 'N/A'}

📸 프로필 이미지: ${profileImage ? '설정됨' : '기본 이미지'}
      `.trim();
      
      Alert.alert('내 정보 상세', infoText, [{ text: '확인' }]);
    } else {
      // 사용자 정보가 없으면 기본 정보만 표시
      console.log('⚠️ userInfo가 없거나 비어있음');
      Alert.alert(
        '내 정보',
        `이름: ${nickname}\n프로필 이미지: ${profileImage ? '설정됨' : '기본 이미지'}\n\n⚠️ 상세 정보를 불러오는 중입니다.\n\n로딩 상태: ${loading ? '로딩 중' : '완료'}`,
        [{ text: '확인' }]
      );
    }
  };

  // 정보 수정 함수
  const editUserInfo = () => {
    console.log('✏️ 정보 수정 버튼 클릭');
    
    if (!userInfo) {
      Alert.alert('알림', '사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // 현재 사용자 정보로 폼 초기화
    setEditForm({
      name: userInfo.name || '',
      email: userInfo.email || '',
      gender: userInfo.gender || '',
      birthYear: userInfo.birthYear || '',
      mobile: userInfo.mobile || '',
      role: userInfo.role || '',
      protectNumber: userInfo.protectNumber || ''
    });
    
    setShowEditModal(true);
  };

  // 사용자 정보 업데이트 함수
  const updateUserInfo = async () => {
    try {
      console.log('🔄 사용자 정보 업데이트 시작');
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }
      
      const cleanToken = token.replace('Bearer ', '');
      const username = userInfo.username;
      
      if (!username) {
        Alert.alert('오류', '사용자명을 찾을 수 없습니다.');
        return;
      }
      
      const requestBody = {
        name: editForm.name,
        email: editForm.email,
        gender: editForm.gender,
        birthYear: editForm.birthYear,
        mobile: editForm.mobile,
        role: editForm.role,
        protectNumber: editForm.protectNumber
      };
      
      console.log('🔍 업데이트 요청 데이터:', requestBody);
      console.log('🔍 업데이트 요청 URL:', `http://124.60.137.10:8083/api/user/${username}`);
      
      const response = await fetch(`http://124.60.137.10:8083/api/user/${username}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('🔍 업데이트 응답 상태:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ 사용자 정보 업데이트 성공:', responseData);
        
        // 업데이트된 정보로 상태 갱신
        setUserInfo(responseData.data || responseData);
        setNickname(editForm.name || editForm.email?.split('@')[0] || nickname);
        
        // AsyncStorage에도 업데이트된 이름 저장
        if (editForm.name) {
          await AsyncStorage.setItem('currentUserName', editForm.name);
        }
        
        setShowEditModal(false);
        Alert.alert('성공', '사용자 정보가 성공적으로 업데이트되었습니다.');
      } else {
        const errorData = await response.text();
        console.error('❌ 사용자 정보 업데이트 실패:', response.status, errorData);
        Alert.alert('오류', '사용자 정보 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 사용자 정보 업데이트 중 오류:', error);
      Alert.alert('오류', '사용자 정보 업데이트 중 오류가 발생했습니다.');
    }
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

        {/* 내정보 관리 섹션 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>내 정보</Text>
          <View style={styles.infoButtons}>
            <TouchableOpacity style={styles.infoButton} onPress={showUserInfo}>
              <Text style={styles.infoButtonIcon}>👤</Text>
              <Text style={styles.infoButtonText}>내 정보 확인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoButton} onPress={editUserInfo}>
              <Text style={styles.infoButtonIcon}>✏️</Text>
              <Text style={styles.infoButtonText}>정보 수정</Text>
            </TouchableOpacity>
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

      {/* 정보 수정 모달 */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.editModalContainer}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>정보 수정</Text>
            
            <ScrollView style={styles.editFormContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="이름을 입력하세요"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이메일</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="이메일을 입력하세요"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>성별</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {editForm.gender === 'MALE' ? '남성' : 
                     editForm.gender === 'FEMALE' ? '여성' : 
                     editForm.gender === 'OTHER' ? '기타' : 
                     editForm.gender === 'NOT_PROVIDED' ? '정보를 입력하시오' : 
                     editForm.gender === '' ? '정보를 입력하시오' : 
                     '성별을 선택하세요'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>출생년도</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowBirthYearModal(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {editForm.birthYear === 'NOT_PROVIDED' ? '정보를 입력하시오' : 
                     editForm.birthYear || '출생년도를 선택하세요'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>휴대폰</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.mobile}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, mobile: text }))}
                  placeholder="휴대폰 번호를 입력하세요"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>역할</Text>
                <View style={styles.fixedValueContainer}>
                  <Text style={styles.fixedValueText}>USER</Text>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>보호번호</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.protectNumber}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, protectNumber: text }))}
                  placeholder="보호번호를 입력하세요"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
            
            <View style={styles.editModalButtons}>
              <TouchableOpacity 
                style={[styles.editModalButton, styles.cancelButton]} 
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editModalButton, styles.saveButton]} 
                onPress={updateUserInfo}
              >
                <Text style={styles.saveButtonText}>수정하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 성별 선택 모달 */}
      <Modal visible={showGenderModal} transparent animationType="slide">
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>성별 선택</Text>
            <ScrollView style={styles.selectionList}>
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({ ...prev, gender: 'MALE' }));
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.selectionItemText}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({ ...prev, gender: 'FEMALE' }));
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.selectionItemText}>여성</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({ ...prev, gender: 'OTHER' }));
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.selectionItemText}>기타</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({ ...prev, gender: 'NOT_PROVIDED' }));
                  setShowGenderModal(false);
                }}
              >
                <Text style={styles.selectionItemText}>정보를 입력하시오</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity 
              style={styles.selectionCancelButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.selectionCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 출생년도 선택 모달 */}
      <Modal visible={showBirthYearModal} transparent animationType="slide">
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>출생년도 선택</Text>
            <ScrollView style={styles.selectionList}>
              <TouchableOpacity 
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({ ...prev, birthYear: 'NOT_PROVIDED' }));
                  setShowBirthYearModal(false);
                }}
              >
                <Text style={styles.selectionItemText}>정보를 입력하시오</Text>
              </TouchableOpacity>
              {birthYears.map(year => (
                <TouchableOpacity 
                  key={year}
                  style={styles.selectionItem}
                  onPress={() => {
                    setEditForm(prev => ({ ...prev, birthYear: year }));
                    setShowBirthYearModal(false);
                  }}
                >
                  <Text style={styles.selectionItemText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.selectionCancelButton}
              onPress={() => setShowBirthYearModal(false)}
            >
              <Text style={styles.selectionCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
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
  infoSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  infoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
  editModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1e7c3c',
  },
  editFormContainer: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#1e7c3c',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#666',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  picker: {
    height: 120,
  },
  fixedValueContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
  },
  fixedValueText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  selectionModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectionModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1e7c3c',
  },
  selectionList: {
    maxHeight: 300,
  },
  selectionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectionCancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectionCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
});
