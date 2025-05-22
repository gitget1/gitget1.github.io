import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigations/root/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Practice'>;

const Practice = ({navigation: _navigation}: Props) => {
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = () => {
    setIsLiked(prev => !prev);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 🖼 이미지 + 제목 + 작성자 */}
        <View style={styles.headerRow}>
          <Image
            source={require('../../assets/sample-post.png')}
            style={styles.image}
          />
          <View style={styles.textBox}>
            <Text style={styles.title}>강릉 바다</Text>
            <Text style={styles.author}>작성자: 홍길동</Text>
          </View>
        </View>

        {/* 💬 리뷰 */}
        <TouchableOpacity style={styles.reviewRow}>
          <Image
            source={require('../../assets/chat-icon.png')}
            style={styles.icon}
          />
          <Text style={styles.reviewText}>메뉴 리뷰 62개</Text>
        </TouchableOpacity>

        {/* ░░ 점선 구분선 */}
        <View style={styles.divider} />

        {/* 📅 일정 카드 */}
        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>일정</Text>
          <Text style={styles.dayText}>1일차</Text>
          <Text style={styles.timeText}>08:00 순천향대 출발</Text>
          <Text style={styles.timeText}>08:56 천안역</Text>
          <Text style={styles.moreText}>~~~</Text>
        </View>

        {/* 🗺 지도 */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>지도</Text>
          <Image
            source={require('../../assets/sample-map.png')}
            style={styles.map}
          />
        </View>

        {/* ❤️ 💬 📅 하단 버튼 */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
            <Text style={styles.heartText}>
              {isLiked ? '💖 찜했어요' : '🤍 찜하기'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text>💬 채팅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text>📅 예약하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  image: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  textBox: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  reviewText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    marginVertical: 16,
  },
  scheduleCard: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
  },
  mapContainer: {
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  heartText: {
    fontWeight: 'bold',
  },
});

export default Practice;
