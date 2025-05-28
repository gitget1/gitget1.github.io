import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const MyPage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [nickname, _setNickname] = useState('홍길동');

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

  const Section = ({title, items}: {title: string; items: string[]}) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.menuItem}>
          <Text style={styles.menuText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Image
              source={
                profileImage
                  ? {uri: profileImage}
                  : require('../../assets/default.png')
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>{nickname}</Text>
        </View>

        <Section
          title="나의 거래"
          items={['판매내역', '구매내역', '중고거래 가계부']}
        />
        <Section title="나의 관심" items={['관심목록', '키워드 알림 설정']} />
        <Section title="나의 활동" items={['내 동네생활 글']} />
        <Section title="나의 비즈니스" items={['비즈프로필 관리', '광고']} />

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
  },
  profileName: {
    fontSize: 18,
    marginLeft: 16,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#fefefe',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalText: {
    fontSize: 18,
    paddingVertical: 10,
  },
});
