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

interface ButtonProps {
  backendUrl: string;
}

const App: React.FC = () => {
  const backendUrl: string = 'http://114.71.220.195:8080';
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);

  useEffect(() => {
    console.log('useEffect 실행1');
    checkAndRefreshToken();
  }, []);

  const checkAndRefreshToken = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        console.log('useEffect 실행2');
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
          await AsyncStorage.setItem('accessToken', newAccessToken);
          console.log('Access Token 갱신 완료:', newAccessToken);
        } else {
          console.error('Access Token 갱신 실패');
        }
      }
    } catch (error) {
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

  const onNaverLogin = (): void => {
    setIsWebViewVisible(true);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    console.log('Navigation State:', navState);
    // 네이버 로그인 콜백 URL 처리
    if (navState.url.includes('login/oauth2/code/naver')) {
      const url = new URL(navState.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
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

  const handleWebViewError = (syntheticEvent: any) => {
    const {nativeEvent} = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    Alert.alert('알림', '페이지 로딩 중 오류가 발생했습니다.');
  };

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

      const response = await axios.get(`${backendUrl}/logout`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        console.log('로그아웃 성공');
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
      <TouchableOpacity style={styles.button} onPress={onNaverLogin}>
        <Text style={styles.buttonText}>NAVER LOGIN</Text>
      </TouchableOpacity>
      <TestButton backendUrl={backendUrl} />
      <MainButton backendUrl={backendUrl} />
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>LOGOUT</Text>
      </TouchableOpacity>

      <Modal
        visible={isWebViewVisible}
        onRequestClose={() => setIsWebViewVisible(false)}
        animationType="slide"
        transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.webViewContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsWebViewVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
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

const TestButton: React.FC<ButtonProps> = ({backendUrl}) => {
  const TestData = async (): Promise<void> => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', 'Access Token이 없습니다.');
        return;
      }

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

const MainButton: React.FC<ButtonProps> = ({backendUrl}) => {
  const MainData = async (): Promise<void> => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', 'Access Token이 없습니다. 다시 로그인하세요.');
        return;
      }

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
