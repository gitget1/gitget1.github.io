import React, {useState, useCallback, useEffect} from 'react';
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
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
// import {BE_server as BE_SERVER} from '@env';
const BE_SERVER = 'http://124.60.137.10:8083';

type RootStackParamList = {
  MyPage: undefined;
  QuestionScreen: undefined;
  Result: undefined;
  Make_program: undefined;
  MyReviewList: undefined;
};

// ===== Roles =====
type Role = 'Admin' | 'Guide_provider' | 'Guide_consumer';

// role → 한국어 라벨
const getRoleLabel = (role?: Role | string) => {
  switch (role) {
    case 'Admin':
      return '관리자';
    case 'Guide_provider':
      return '가이드(제공자)';
    case 'Guide_consumer':
      return '가이드(소비자)';
    default:
      return role || '미지정';
  }
};

const MainScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 화면 상단 인사말 표시용 닉네임(초기엔 기본값)
  const [nickname, setNickname] = useState<string>(t('defaultUser'));

  // 사용자 전체 정보 (수정 모달 채우고, 저장 후 갱신용)
  const [userInfo, setUserInfo] = useState<any>(null);

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    gender: string;
    birthYear: string;
    mobile: string;
    role: Role;
    protectNumber: string;
  }>({
    name: '',
    email: '',
    gender: '',
    birthYear: '',
    mobile: '',
    role: 'Guide_consumer',
    protectNumber: '',
  });

  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);

  // 포인트 상태
  const [points, setPoints] = useState<number | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);

  // 출생년도 옵션 (1950~현재)
  const birthYears = (() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear; y >= 1950; y--) {
      years.push(String(y));
    }
    return years;
  })();

  // --- Utils ---

  const getAuthHeader = useCallback(async () => {
    const raw = await AsyncStorage.getItem('accessToken');
    if (!raw) {
      return undefined;
    }
    const pure = raw.startsWith('Bearer ')
      ? raw.replace(/^Bearer\s+/i, '')
      : raw;
    return {Authorization: `Bearer ${pure}`};
  }, []);

  // 백엔드 응답에서 유저 객체 뽑기
  const pickUserObject = (payload: any) => {
    if (!payload) {
      return null;
    }
    if (payload.data) {
      return payload.data;
    }
    if (payload.user) {
      return payload.user;
    }
    return payload;
  };

  // nickname 후보 생성
  const deriveName = (u: any) =>
    u?.name ||
    u?.username ||
    u?.nickname ||
    (u?.email ? String(u.email).split('@')[0] : null);

  // 숫자 포맷
  const formatPoints = (n: number) => n.toLocaleString('ko-KR');

  // --- 이미지 관련 ---

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

  // --- 네비게이션 ---
  const goToTest = () => navigation.navigate('QuestionScreen');
  const goToMakeProgram = () => navigation.navigate('Make_program' as any);
  const goToReview = () => navigation.navigate('MyReviewList');

  // --- 포인트 조회 ---
  const fetchPoints = useCallback(async () => {
    try {
      setPointsLoading(true);
      setPointsError(null);

      const headers = await getAuthHeader();
      if (!headers) {
        setPointsError('로그인이 필요합니다.');
        setPoints(null);
        return;
      }

      const url = `${BE_SERVER}/api/points/balance`;
      console.log('[POINTS][GET] →', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {...headers, 'Content-Type': 'application/json'},
      });

      console.log('[POINTS][GET] ← status:', res.status);

      if (!res.ok) {
        const txt = await res.text();
        console.log('[POINTS][GET] error body:', txt);
        setPointsError('포인트를 불러오지 못했습니다.');
        setPoints(null);
        return;
      }

      const payload = await res.json();
      // 응답 형태: { status, message, data: { balance: number } }
      const balance = payload?.data?.balance ?? payload?.balance ?? 0;

      setPoints(balance);
    } catch (e: any) {
      console.log('[POINTS][GET] exception:', e?.message ?? e);
      setPointsError('네트워크 오류가 발생했습니다.');
      setPoints(null);
    } finally {
      setPointsLoading(false);
    }
  }, [BE_SERVER, getAuthHeader]);

  // --- 사용자 정보 조회 (화면 진입 시) ---
  const fetchUserInfo = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      if (!headers) {
        console.log('[USER][GET] 로그인이 필요합니다.');
        return;
      }

      console.log('[USER][GET] →', `${BE_SERVER}/api/user`);
      const res = await fetch(`${BE_SERVER}/api/user`, {
        method: 'GET',
        headers: {...headers, 'Content-Type': 'application/json'},
      });

      console.log('[USER][GET] ← status:', res.status);
      if (!res.ok) {
        const txt = await res.text();
        console.log('[USER][GET] error body:', txt);
        return;
      }

      const payload = await res.json();
      const u = pickUserObject(payload);
      setUserInfo(u);

      // 상단 인사말 업데이트
      const nameFound = deriveName(u);
      if (nameFound) {
        setNickname(nameFound);
        await AsyncStorage.setItem('currentUserName', nameFound);
      }
    } catch (e: any) {
      console.log('[USER][GET] exception:', e?.message ?? e);
    }
  }, [BE_SERVER, getAuthHeader]);

  useEffect(() => {
    // 화면 진입 시 포인트와 사용자 정보 가져오기
    fetchPoints();
    fetchUserInfo();
  }, [fetchPoints, fetchUserInfo]);

  // --- 정보 수정 모달 열기 ---
  const editUserInfo = useCallback(async () => {
    if (!userInfo) {
      Alert.alert('알림', '사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 현재 사용자 정보로 폼 초기화
    setEditForm({
      name: userInfo?.name ?? '',
      email: userInfo?.email ?? '',
      gender: userInfo?.gender ?? '',
      birthYear: userInfo?.birthYear ?? '',
      mobile: userInfo?.mobile ?? '',
      role: (userInfo?.role as Role) ?? 'Guide_consumer',
      protectNumber: userInfo?.protectNumber ?? '',
    });

    setShowEditModal(true);
  }, [userInfo]);

  // --- 저장(수정하기) ---
  const updateUserInfo = useCallback(async () => {
    try {
      if (!userInfo?.username) {
        Alert.alert('오류', '사용자명을 찾을 수 없습니다.');
        return;
      }

      setSaving(true);

      const headers = await getAuthHeader();
      if (!headers) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const body = {
        name: editForm.name,
        email: editForm.email,
        gender: editForm.gender,
        birthYear: editForm.birthYear,
        mobile: editForm.mobile,
        role: editForm.role, // Admin | Guide_provider | Guide_consumer
        protectNumber: editForm.protectNumber,
      };

      const url = `${BE_SERVER}/api/user/${encodeURIComponent(
        userInfo.username,
      )}`;
      console.log('[USER][PUT] →', url, body);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {...headers, 'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });

      console.log('[USER][PUT] ← status:', res.status);

      if (!res.ok) {
        const txt = await res.text();
        console.log('[USER][PUT] error body:', txt);
        Alert.alert('오류', '사용자 정보 업데이트에 실패했습니다.');
        return;
      }

      const updatedPayload = await res.json();
      const updated = pickUserObject(updatedPayload);

      // 상태/닉네임 갱신
      setUserInfo(updated);
      const nameFound =
        deriveName(updated) ||
        editForm.name ||
        (editForm.email?.split('@')[0] ?? nickname);
      setNickname(nameFound);
      await AsyncStorage.setItem('currentUserName', nameFound);

      setShowEditModal(false);
      Alert.alert('성공', '사용자 정보가 성공적으로 업데이트되었습니다.');
    } catch (e: any) {
      console.log('[USER][PUT] exception:', e?.message ?? e);
      Alert.alert('오류', '사용자 정보 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }, [BE_SERVER, editForm, getAuthHeader, nickname, userInfo?.username]);

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
            <Text style={styles.helloText}>{`${nickname}${t('welcome')}`}</Text>
          </View>
        </View>

        {/* 내정보 관리 섹션 */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>내 정보</Text>
          <View style={styles.infoButtons}>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={editUserInfo}>
              <Text style={styles.infoButtonIcon}>✏️</Text>
              <Text style={styles.infoButtonText}>정보 수정</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 기능 카드들 */}
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

        {/* 🔵 잔여 포인트 카드 (Buddy Pass 대신) */}
        <View style={styles.noticeCard}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text style={styles.noticeTitle}>잔여 포인트</Text>
            <TouchableOpacity onPress={fetchPoints} disabled={pointsLoading}>
              <Text style={{color: '#1e7c3c'}}>
                {pointsLoading ? '새로고침…' : '새로고침'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{marginTop: 8}}>
            {pointsLoading ? (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ActivityIndicator />
                <Text style={{marginLeft: 8}}>불러오는 중…</Text>
              </View>
            ) : pointsError ? (
              <Text style={{color: '#c62828'}}>{pointsError}</Text>
            ) : (
              <Text style={styles.pointsValue}>
                {points !== null ? `${formatPoints(points)} P` : '0 P'}
              </Text>
            )}
          </View>
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

      {/* 하단 프로필 이미지 모달 */}
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
                      onChangeText={text =>
                        setEditForm(prev => ({...prev, name: text}))
                      }
                      placeholder="이름을 입력하세요"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>이메일</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.email}
                      onChangeText={text =>
                        setEditForm(prev => ({...prev, email: text}))
                      }
                      placeholder="이메일을 입력하세요"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>성별</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowGenderModal(true)}>
                      <Text style={styles.pickerButtonText}>
                        {editForm.gender === 'MALE'
                          ? '남성'
                          : editForm.gender === 'FEMALE'
                          ? '여성'
                          : editForm.gender === 'OTHER'
                          ? '기타'
                          : editForm.gender === 'NOT_PROVIDED'
                          ? '정보를 입력하시오'
                          : editForm.gender === ''
                          ? '정보를 입력하시오'
                          : '성별을 선택하세요'}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>출생년도</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowBirthYearModal(true)}>
                      <Text style={styles.pickerButtonText}>
                        {editForm.birthYear === 'NOT_PROVIDED'
                          ? '정보를 입력하시오'
                          : editForm.birthYear || '출생년도를 선택하세요'}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>휴대폰</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.mobile}
                      onChangeText={text =>
                        setEditForm(prev => ({...prev, mobile: text}))
                      }
                      placeholder="휴대폰 번호를 입력하세요"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>등급</Text>
                    <View style={styles.fixedValueContainer}>
                      <Text style={styles.fixedValueText}>
                        {getRoleLabel(editForm.role)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>보호자 번호</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.protectNumber}
                      onChangeText={text =>
                        setEditForm(prev => ({...prev, protectNumber: text}))
                      }
                      placeholder="보호번호를 입력하세요"
                      keyboardType="numeric"
                    />
                  </View>
                </ScrollView>

            <View style={styles.editModalButtons}>
              <TouchableOpacity
                style={[styles.editModalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
                disabled={saving}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalButton, styles.saveButton]}
                onPress={updateUserInfo}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>수정하기</Text>
                )}
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
                  setEditForm(prev => ({...prev, gender: 'MALE'}));
                  setShowGenderModal(false);
                }}>
                <Text style={styles.selectionItemText}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({...prev, gender: 'FEMALE'}));
                  setShowGenderModal(false);
                }}>
                <Text style={styles.selectionItemText}>여성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({...prev, gender: 'OTHER'}));
                  setShowGenderModal(false);
                }}>
                <Text style={styles.selectionItemText}>기타</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionItem}
                onPress={() => {
                  setEditForm(prev => ({...prev, gender: 'NOT_PROVIDED'}));
                  setShowGenderModal(false);
                }}>
                <Text style={styles.selectionItemText}>정보를 입력하시오</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.selectionCancelButton}
              onPress={() => setShowGenderModal(false)}>
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
                  setEditForm(prev => ({...prev, birthYear: 'NOT_PROVIDED'}));
                  setShowBirthYearModal(false);
                }}>
                <Text style={styles.selectionItemText}>정보를 입력하시오</Text>
              </TouchableOpacity>
              {birthYears.map(year => (
                <TouchableOpacity
                  key={year}
                  style={styles.selectionItem}
                  onPress={() => {
                    setEditForm(prev => ({...prev, birthYear: year}));
                    setShowBirthYearModal(false);
                  }}>
                  <Text style={styles.selectionItemText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.selectionCancelButton}
              onPress={() => setShowBirthYearModal(false)}>
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
  container: {flex: 1, backgroundColor: '#fff'},
  headerBox: {
    paddingVertical: 24,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  profileWrap: {alignItems: 'center'},
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  helloText: {fontSize: 20, fontWeight: 'bold', color: '#1e7c3c'},
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
  gridIcon: {fontSize: 30},
  gridText: {marginTop: 8, fontSize: 14, fontWeight: '500'},
  noticeCard: {
    backgroundColor: '#e6f5ea',
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  noticeTitle: {fontSize: 16, fontWeight: 'bold', color: '#1e7c3c'},
  pointsValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    color: '#1e7c3c',
  },
  section: {marginTop: 24, paddingHorizontal: 16},
  sectionTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 8},
  infoSection: {marginTop: 16, paddingHorizontal: 16, marginBottom: 8},
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
  infoButtonIcon: {fontSize: 24, marginBottom: 8},
  infoButtonText: {fontSize: 14, fontWeight: '500', color: '#333'},
  serviceRow: {flexDirection: 'row', justifyContent: 'space-between'},
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
  modalText: {fontSize: 18, paddingVertical: 10},
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {marginLeft: 8, fontSize: 16, color: '#1e7c3c'},
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
  editFormContainer: {maxHeight: 400},
  inputGroup: {marginBottom: 16},
  inputLabel: {fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333'},
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
  saveButton: {backgroundColor: '#1e7c3c'},
  cancelButtonText: {fontSize: 16, fontWeight: '500', color: '#666'},
  saveButtonText: {fontSize: 16, fontWeight: '500', color: '#fff'},
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
  pickerButtonText: {fontSize: 16, color: '#333'},
  pickerArrow: {fontSize: 12, color: '#666'},
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  picker: {height: 120},
  fixedValueContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
  },
  fixedValueText: {fontSize: 16, color: '#666', fontWeight: '500'},
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
  selectionList: {maxHeight: 300},
  selectionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionItemText: {fontSize: 16, color: '#333', textAlign: 'center'},
  selectionCancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectionCancelText: {fontSize: 16, fontWeight: '500', color: '#666'},
});