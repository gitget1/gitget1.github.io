import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {checkLoginAndShowAlert} from '../../utils/auth';
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


  // --- 네비게이션 ---
  const goToTest = async () => {
    const isLoggedIn = await checkLoginAndShowAlert(navigation, '성향 테스트는 로그인이 필요한 기능입니다.');
    if (isLoggedIn) {
      navigation.navigate('QuestionScreen');
    }
  };
  
  const goToMakeProgram = async () => {
    const isLoggedIn = await checkLoginAndShowAlert(navigation, '프로그램 작성은 로그인이 필요한 기능입니다.');
    if (isLoggedIn) {
      navigation.navigate('Make_program' as any);
    }
  };
  
  const goToReview = async () => {
    const isLoggedIn = await checkLoginAndShowAlert(navigation, '리뷰 관리는 로그인이 필요한 기능입니다.');
    if (isLoggedIn) {
      navigation.navigate('MyReviewList');
    }
  };

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
    // 로그인 상태 확인 후 정보 가져오기
    const checkLoginAndFetch = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('[MY_PAGE] 로그인하지 않은 사용자 - 정보 조회 생략');
        return;
      }
      
      // 로그인된 사용자만 정보 가져오기
      fetchPoints();
      fetchUserInfo();
    };
    
    checkLoginAndFetch();
  }, [fetchPoints, fetchUserInfo]);

  // --- 정보 수정 모달 열기 ---
  const editUserInfo = useCallback(async () => {
    const isLoggedIn = await checkLoginAndShowAlert(navigation, '정보 수정은 로그인이 필요한 기능입니다.');
    if (!isLoggedIn) {
      return;
    }

    try {
      // 서버에서 최신 사용자 정보 가져오기
      const headers = await getAuthHeader();
      if (!headers) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      console.log('[USER][GET] 최신 정보 조회 →', `${BE_SERVER}/api/user`);
      const res = await fetch(`${BE_SERVER}/api/user`, {
        method: 'GET',
        headers: {...headers, 'Content-Type': 'application/json'},
      });

      console.log('[USER][GET] 최신 정보 조회 ← status:', res.status);
      if (!res.ok) {
        const txt = await res.text();
        console.log('[USER][GET] 최신 정보 조회 error body:', txt);
        Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
        return;
      }

      const payload = await res.json();
      const latestUserInfo = pickUserObject(payload);
      
      if (!latestUserInfo) {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 최신 사용자 정보로 상태 업데이트
      setUserInfo(latestUserInfo);

      // 최신 정보로 폼 초기화
      setEditForm({
        name: latestUserInfo?.name ?? '',
        email: latestUserInfo?.email ?? '',
        gender: latestUserInfo?.gender ?? '',
        birthYear: latestUserInfo?.birthYear ?? '',
        mobile: latestUserInfo?.mobile ?? '',
        role: (latestUserInfo?.role as Role) ?? 'Guide_consumer',
        protectNumber: latestUserInfo?.protectNumber ?? '',
      });

      setShowEditModal(true);
    } catch (e: any) {
      console.log('[USER][GET] 최신 정보 조회 exception:', e?.message ?? e);
      Alert.alert('오류', '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }, [getAuthHeader]);

  // --- 정보 수정 모달 닫기 ---
  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    // 모달을 닫을 때 폼 상태는 유지 (다시 열 때 현재 정보로 초기화됨)
  }, []);

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

      // 폼 상태도 업데이트된 정보로 갱신
      setEditForm({
        name: updated?.name ?? '',
        email: updated?.email ?? '',
        gender: updated?.gender ?? '',
        birthYear: updated?.birthYear ?? '',
        mobile: updated?.mobile ?? '',
        role: (updated?.role as Role) ?? 'Guide_consumer',
        protectNumber: updated?.protectNumber ?? '',
      });

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
            <Text style={styles.helloText}>{`${nickname}${t('welcome')}`}</Text>
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
          <TouchableOpacity style={styles.gridItem} onPress={editUserInfo}>
            <Text style={styles.gridIcon}>✏️</Text>
            <Text style={styles.gridText}>정보 수정</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.gridItem} onPress={goToReview}>
            <Text style={styles.gridIcon}>📚</Text>
            <Text style={styles.gridText}>{t('myReview')}</Text>
          </TouchableOpacity> */}
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
              <Text style={{color: '#228B22'}}>
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

      </ScrollView>


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
                onPress={closeEditModal}
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
  helloText: {fontSize: 20, fontWeight: '800', color: '#228B22'},
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
    backgroundColor: '#90EE90',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridIcon: {fontSize: 30},
  gridText: {marginTop: 8, fontSize: 14, fontWeight: '700', color: '#000000'},
  noticeCard: {
    backgroundColor: '#e6f5ea',
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  noticeTitle: {fontSize: 16, fontWeight: '800', color: '#228B22'},
  pointsValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
    color: '#228B22',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {marginLeft: 8, fontSize: 16, color: '#228B22'},
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#228B22',
  },
  editFormContainer: {maxHeight: 400},
  inputGroup: {marginBottom: 16},
  inputLabel: {fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#333'},
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000000',
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
  saveButton: {backgroundColor: '#90EE90'},
  cancelButtonText: {fontSize: 16, fontWeight: '700', color: '#666'},
  saveButtonText: {fontSize: 16, fontWeight: '700', color: '#000000'},
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
  pickerButtonText: {fontSize: 16, color: '#000000'},
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
  fixedValueText: {fontSize: 16, color: '#000000', fontWeight: '500'},
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
    color: '#228B22',
  },
  selectionList: {maxHeight: 300},
  selectionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionItemText: {fontSize: 16, color: '#000000', textAlign: 'center'},
  selectionCancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectionCancelText: {fontSize: 16, fontWeight: '700', color: '#000000'},
});