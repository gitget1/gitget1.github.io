// import React, {useState} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   Modal,
//   SafeAreaView,
//   ScrollView,
//   TextInput,
//   Alert,
// } from 'react-native';
// import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
// import {useNavigation} from '@react-navigation/native';
// import type {StackNavigationProp} from '@react-navigation/stack';

// // RootStackParamList 정의
// type RootStackParamList = {
//   MyPage: undefined;
//   QuestionScreen: undefined;
//   Result: undefined;
//   MakeProgram: undefined;
//   MyReviewList: undefined;
// };

// const MainScreen = () => {
//   const [profileImage, setProfileImage] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedMenu, setSelectedMenu] = useState('계정 정보');
//   const [passwordConfirmed, setPasswordConfirmed] = useState(false);
//   const [inputPassword, setInputPassword] = useState('');
//   const [nickname, setNickname] = useState('홍길동');
//   const [name, setName] = useState('홍길동');
//   const [password, setPassword] = useState('1234');
//   const [editingField, setEditingField] = useState<string | null>(null);
//   const [editValue, setEditValue] = useState('');

//   const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

//   const pickImage = () => {
//     launchImageLibrary({mediaType: 'photo'}, response => {
//       if (response.assets && response.assets.length > 0) {
//         setProfileImage(response.assets[0].uri || null);
//         setShowModal(false);
//       }
//     });
//   };

//   const takePhoto = () => {
//     launchCamera({mediaType: 'photo'}, response => {
//       if (response.assets && response.assets.length > 0) {
//         setProfileImage(response.assets[0].uri || null);
//         setShowModal(false);
//       }
//     });
//   };

//   const resetProfile = () => {
//     setProfileImage(null);
//     setShowModal(false);
//   };

//   const handlePasswordCheck = () => {
//     if (inputPassword === password) {
//       setPasswordConfirmed(true);
//     } else {
//       Alert.alert('오류', '비밀번호가 일치하지 않습니다');
//     }
//   };

//   const saveEdit = () => {
//     if (editingField === 'nickname') {
//       setNickname(editValue);
//     } else if (editingField === 'name') {
//       setName(editValue);
//     } else if (editingField === 'password') {
//       setPassword(editValue);
//     }
//     setEditingField(null);
//   };

//   const handleLogout = () => {
//     Alert.alert('로그아웃', '로그아웃 되었습니다');
//     // 실제로는 토큰 삭제 및 로그인 화면 이동 필요
//   };

//   const renderContent = () => {
//     if (selectedMenu === '계정 정보') {
//       if (!passwordConfirmed) {
//         return (
//           <View>
//             <Text>비밀번호를 입력하세요</Text>
//             <TextInput
//               style={styles.input}
//               secureTextEntry
//               value={inputPassword}
//               onChangeText={setInputPassword}
//               placeholder="비밀번호"
//             />
//             <TouchableOpacity
//               onPress={handlePasswordCheck}
//               style={styles.confirmButton}>
//               <Text>확인</Text>
//             </TouchableOpacity>
//           </View>
//         );
//       }

//       if (editingField) {
//         return (
//           <View>
//             <Text>{editingField} 변경</Text>
//             <TextInput
//               style={styles.input}
//               value={editValue}
//               onChangeText={setEditValue}
//               placeholder={`${editingField} 입력`}
//               secureTextEntry={editingField === 'password'}
//             />
//             <TouchableOpacity onPress={saveEdit} style={styles.confirmButton}>
//               <Text>저장</Text>
//             </TouchableOpacity>
//           </View>
//         );
//       }

//       return (
//         <View>
//           <Text style={styles.sectionTitle}>변경하기</Text>
//           <TouchableOpacity
//             onPress={() => {
//               setEditingField('nickname');
//               setEditValue(nickname);
//             }}>
//             <Text style={styles.linkItem}>닉네임 변경 </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => {
//               setEditingField('name');
//               setEditValue(name);
//             }}>
//             <Text style={styles.linkItem}>아이디 변경 </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => {
//               setEditingField('password');
//               setEditValue('');
//             }}>
//             <Text style={styles.linkItem}>비밀번호 변경 </Text>
//           </TouchableOpacity>

//           <View style={styles.sectionDivider} />

//           <Text style={styles.sectionTitle}>로그아웃</Text>
//           <TouchableOpacity onPress={handleLogout}>
//             <Text style={styles.linkItem}>로그아웃 </Text>
//           </TouchableOpacity>

//           <View style={styles.sectionDivider} />

//           <Text style={styles.sectionTitle}>회원탈퇴</Text>
//           <TouchableOpacity
//             onPress={() =>
//               Alert.alert('탈퇴', '회원탈퇴 기능은 준비 중입니다.')
//             }>
//             <Text style={styles.linkItem}>회원탈퇴 </Text>
//           </TouchableOpacity>
//         </View>
//       );
//     }

//     switch (selectedMenu) {
//       case '이용 내역':
//         return <Text>여기에 이용 내역 표시</Text>;
//       case '성향 리스트':
//         return <Text>여기에 성향 리스트 표시</Text>;
//       case '게시 내역':
//         return <Text>여기에 게시 내역 표시</Text>;
//       case '접근성':
//         return <Text>여기에 접근성 옵션 표시</Text>;
//       case '관광 프로그램 Helper':
//         return <Text>여기에 관광 프로그램 정보 표시</Text>;
//       case '예약 요청 목록 리스트':
//         return <Text>여기에 예약 요청 리스트 표시</Text>;
//       case '1:1 문의':
//         return <Text>여기에 1:1 문의 내용 표시</Text>;
//       case '마이리뷰':
//         return <Text>여기에 내 리뷰 내역 표시</Text>;
//       default:
//         return <Text>선택된 항목이 없습니다.</Text>;
//     }
//   };

//   const goToTest = () => {
//     navigation.navigate('QuestionScreen');
//   };

//   const goToMakeProgram = () => {
//     navigation.navigate('Make_program');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.profileContainer}>
//         <TouchableOpacity onPress={() => setShowModal(true)}>
//           <Image
//             source={
//               profileImage
//                 ? {uri: profileImage}
//                 : require('../../assets/default.png')
//             }
//             style={styles.profileCircle}
//           />
//         </TouchableOpacity>
//         <Text style={styles.profileName}>{nickname}</Text>
//       </View>

//       <View style={styles.tabContainer}>
//         <TouchableOpacity style={styles.tabButton} onPress={goToTest}>
//           <Text style={styles.tabButtonText}>성향테스트 하러 가기</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.tabButton} onPress={goToMakeProgram}>
//           <Text style={styles.tabButtonText}>프로그램 작성하러 가기</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.body}>
//         <View style={styles.sidebar}>
//           {[
//             '계정 정보',
//             '이용 내역',
//             '성향 리스트',
//             '게시 내역',
//             '접근성',
//             '관광 프로그램 Helper',
//             '예약 요청 목록 리스트',
//             '1:1 문의',
//             '마이리뷰',
//           ].map(item => (
//             <TouchableOpacity
//               key={item}
//               onPress={() => {
//                 if (item === '마이리뷰') {
//                   navigation.navigate('MyReviewList');
//                 } else {
//                   setSelectedMenu(item);
//                 }
//               }}
//               style={styles.sidebarItem}>
//               <Text style={styles.sidebarText}>{item}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         <View style={styles.mainContent}>
//           <ScrollView>{renderContent()}</ScrollView>
//         </View>
//       </View>

//       <Modal visible={showModal} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <TouchableOpacity onPress={takePhoto}>
//             <Text style={styles.modalText}>📷 사진 찍기</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={pickImage}>
//             <Text style={styles.modalText}>🖼 갤러리에서 선택</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={resetProfile}>
//             <Text style={styles.modalText}>🔄 기본 이미지로 변경</Text>
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => setShowModal(false)}>
//             <Text style={styles.modalText}>❌ 취소</Text>
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// export default MainScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   profileContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },
//   profileCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#ddd',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   profileName: {
//     fontSize: 18,
//     marginLeft: 10,
//   },
//   tabContainer: {
//     flexDirection: 'row',
//     marginHorizontal: 10,
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 10,
//   },
//   tabButton: {
//     flex: 1,
//     minWidth: '30%',
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#0288d1',
//     borderRadius: 8,
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     marginBottom: 8,
//   },
//   tabButtonText: {
//     color: '#0288d1',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   body: {
//     flex: 1,
//     flexDirection: 'row',
//   },
//   sidebar: {
//     width: 100,
//     backgroundColor: '#e0e0e0',
//     paddingVertical: 10,
//   },
//   sidebarItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//   },
//   sidebarText: {
//     fontWeight: '500',
//   },
//   mainContent: {
//     flex: 1,
//     padding: 16,
//   },
//   modalContainer: {
//     backgroundColor: '#ffffffee',
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     padding: 20,
//   },
//   modalText: {
//     fontSize: 18,
//     paddingVertical: 10,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#aaa',
//     borderRadius: 5,
//     padding: 8,
//     marginVertical: 10,
//   },
//   confirmButton: {
//     backgroundColor: '#ddd',
//     padding: 10,
//     alignItems: 'center',
//     borderRadius: 5,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     marginTop: 20,
//   },
//   linkItem: {
//     fontSize: 15,
//     paddingVertical: 6,
//     color: '#333',
//   },
//   sectionDivider: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#ccc',
//     marginVertical: 15,
//   },
// });
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ 추가

type RootStackParamList = {
  MyPage: undefined;
  QuestionScreen: undefined;
  Result: undefined;
  MakeProgram: undefined;
  MyReviewList: undefined;
};

const MainScreen = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nickname] = useState('홍길동');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // ✅ 토큰 불러오기
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        console.log('📌 저장된 토큰:', token);
      } catch (err) {
        console.error('❌ 토큰 불러오기 실패:', err);
      }
    };
    loadToken();
  }, []);

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
            <Text style={styles.helloText}>{nickname} 님 환영합니다! 🙌</Text>
          </View>
        </View>

        <View style={styles.gridBox}>
          <TouchableOpacity style={styles.gridItem} onPress={goToTest}>
            <Text style={styles.gridIcon}>📊</Text>
            <Text style={styles.gridText}>성향테스트</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={goToMakeProgram}>
            <Text style={styles.gridIcon}>📝</Text>
            <Text style={styles.gridText}>프로그램 작성</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Text style={styles.gridIcon}>💬</Text>
            <Text style={styles.gridText}>1:1 문의</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={goToReview}>
            <Text style={styles.gridIcon}>📚</Text>
            <Text style={styles.gridText}>마이리뷰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>🎁 Buddy Pass</Text>
          <Text style={styles.noticeSub}>30일간 매일 만나는 30% 혜택</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>서비스</Text>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceItem}>📍 최근 본 글</Text>
            <Text style={styles.serviceItem}>⭐ 관심 목록</Text>
            <Text style={styles.serviceItem}>🗓 이벤트</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity onPress={takePhoto}>
            <Text style={styles.modalText}>📷 사진 찍기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.modalText}>🖼 갤러리에서 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetProfile}>
            <Text style={styles.modalText}>🔄 기본 이미지로 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text style={styles.modalText}>❌ 취소</Text>
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
});
