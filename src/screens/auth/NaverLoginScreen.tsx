import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebView from 'react-native-webview';

// 버튼 컴포넌트의 props 타입 정의
interface ButtonProps {
  backendUrl: string;
}

// URL 파라미터 파싱 함수
function getQueryParams(url: string) {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1];
  if (!queryString) return params;

  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
}

const App: React.FC = () => {
  // 백엔드 서버 URL 설정
  const backendUrl: string = 'http://124.60.137.10:8080';
  // WebView 모달 표시 여부를 관리하는 상태
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);

  // 컴포넌트 마운트 시 토큰 체크 및 갱신
  useEffect(() => {
    console.log('useEffect 실행1');
    checkAndRefreshToken();
  }, []);

  // 토큰 체크 및 갱신 함수
  const checkAndRefreshToken = async () => {
    try {
      // AsyncStorage에서 토큰 확인
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        console.log('useEffect 실행2');
        // 토큰이 없으면 갱신 요청
        const response = await axios.post(
          `${backendUrl}/reissue`,
          {},
          {
            withCredentials: true,
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );

        const newAccessToken = response.headers['authorization'];
        console.log('Access Token 확인:', newAccessToken);

        if (newAccessToken) {
          // 새 토큰 저장
          await AsyncStorage.setItem('accessToken', newAccessToken);
          console.log('Access Token 갱신 완료:', newAccessToken);
        } else {
          console.error('Access Token 갱신 실패');
        }
      }
    } catch (error) {
      // 에러 처리
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          Alert.alert(
            '알림',
            '서버 연결 시간이 초과되었습니다. 다시 시도해주세요.',
          );
        } else if (error.response?.status === 401) {
          Alert.alert(
            '알림',
            '로그인이 되어 있지 않습니다. 로그인을 해주세요.',
          );
        } else if (error.code === 'ERR_NETWORK') {
          Alert.alert(
            '알림',
            '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.',
          );
        } else {
          console.error('네트워크 오류:', error.message);
          Alert.alert('알림', '서버 연결 중 오류가 발생했습니다.');
        }
      } else {
        console.error('알 수 없는 오류:', error);
        Alert.alert('알림', '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  // 네이버 로그인 버튼 클릭 시 WebView 모달 표시
  const onNaverLogin = (): void => {
    setIsWebViewVisible(true);
  };

  // WebView 네비게이션 상태 변경 처리
  const handleWebViewNavigationStateChange = (navState: any) => {
    console.log('Navigation State:', navState);
    // 네이버 로그인 콜백 URL 처리
    if (navState.url.includes('login/oauth2/code/naver')) {
      const params = getQueryParams(navState.url);
      const code = params.code;
      const state = params.state;
      if (code && state) {
        // 토큰 교환 요청
        axios
          .post(
            `${backendUrl}/login/oauth2/code/naver`,
            {code, state},
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          .then(async response => {
            const token = response.headers['authorization'];
            if (token) {
              await AsyncStorage.setItem('accessToken', token);
              setIsWebViewVisible(false);
              Alert.alert('알림', '네이버 로그인이 완료되었습니다.');
            }
          })
          .catch(error => {
            console.error('토큰 교환 실패:', error);
            Alert.alert('알림', '로그인 처리 중 오류가 발생했습니다.');
          });
      }
    }
  };

  // WebView 에러 처리
  const handleWebViewError = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    Alert.alert('알림', '페이지 로딩 중 오류가 발생했습니다.');
  };

  // 로그아웃 처리
  const handleLogout = async (): Promise<void> => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        Alert.alert(
          '알림',
          '로그인 되어 있지 않기 때문에 로그아웃할 수 없습니다.',
        );
        return;
      }

      // 로그아웃 요청
      const response = await axios.get(`${backendUrl}/logout`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        console.log('로그아웃 성공');
        // 토큰 제거
        await AsyncStorage.removeItem('accessToken');
        Alert.alert('알림', '로그아웃되었습니다.');
      } else {
        console.error('로그아웃 실패:', response);
        Alert.alert('알림', '로그아웃에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('로그아웃 요청 중 오류 발생:', error);
      Alert.alert('알림', '로그아웃 처리 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OAuth2 네이버 로그인 및 데이터 요청</Text>
      {/* 네이버 로그인 버튼 */}
      <TouchableOpacity style={styles.button} onPress={onNaverLogin}>
        <Text style={styles.buttonText}>NAVER LOGIN</Text>
      </TouchableOpacity>
      {/* 테스트 버튼 */}
      <TestButton backendUrl={backendUrl} />
      {/* 메인 버튼 */}
      <MainButton backendUrl={backendUrl} />
      {/* 로그아웃 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>LOGOUT</Text>
      </TouchableOpacity>

      {/* WebView 모달 */}
      <Modal
        visible={isWebViewVisible}
        onRequestClose={() => setIsWebViewVisible(false)}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.webViewContainer}>
            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsWebViewVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
            {/* 네이버 로그인 WebView */}
            <WebView
              source={{uri: `${backendUrl}/oauth2/authorization/naver`}}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              onError={handleWebViewError}
              style={styles.webView}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 테스트 API 호출 버튼 컴포넌트
const TestButton: React.FC<ButtonProps> = ({backendUrl}) => {
  const TestData = async (): Promise<void> => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', 'Access Token이 없습니다.');
        return;
      }

      // 테스트 API 호출
      const response = await axios.get(`${backendUrl}/test`, {
        headers: {
          Authorization: `${accessToken}`,
        },
        withCredentials: true,
      });

      console.log('응답 데이터 (/test):', response.data);
      Alert.alert('응답', `응답 데이터: ${response.data}`);
    } catch (error) {
      console.error('데이터 요청 실패:', error);
      Alert.alert('알림', '데이터 요청에 실패했습니다.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={TestData}>
      <Text style={styles.buttonText}>TEST 요청</Text>
    </TouchableOpacity>
  );
};

// 메인 API 호출 버튼 컴포넌트
const MainButton: React.FC<ButtonProps> = ({backendUrl}) => {
  const MainData = async (): Promise<void> => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', 'Access Token이 없습니다. 다시 로그인하세요.');
        return;
      }

      // 메인 API 호출
      const response = await axios.get(`${backendUrl}/`, {
        headers: {
          Authorization: `${accessToken}`,
        },
        withCredentials: true,
      });

      console.log('응답 데이터 (/):', response.data);
      Alert.alert('응답', `응답 데이터: ${response.data}`);
    } catch (error) {
      console.error(
        '데이터 요청 실패 (/):',
        error instanceof Error ? error.message : '알 수 없는 오류',
      );
      Alert.alert('알림', '데이터 요청에 실패했습니다.');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={MainData}>
      <Text style={styles.buttonText}>HOME 요청</Text>
    </TouchableOpacity>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'blue',
    fontSize: 16,
  },
});

export default App;
