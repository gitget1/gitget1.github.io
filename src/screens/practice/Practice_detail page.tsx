import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {AppStackParamList} from '../../navigations/AppNavigator';

// Removed unused 'width' variable

type Schedule = {
  day: number;
  scheduleSequence: number;
  placeName: string;
  lat: number;
  lon: number;
  placeDescription: string;
  travelTime: number;
};

type TourData = {
  title: string;
  description: string;
  region: string;
  guidePrice: number;
  thumbnailUrl: string;
  user: {name: string};
  schedules: Schedule[];
  reviewCount: number;
  wishlistCount: number;
  hashtags: string[];
};

const Practice = () => {
  const [data, setData] = useState<TourData | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();

  useEffect(() => {
    const mockResponse = {
      title: '전주 한옥마을 투어',
      description: '전주의 멋과 맛을 함께 즐길 수 있는 투어입니다.',
      region: '전주',
      guidePrice: 50000,
      thumbnailUrl: 'https://via.placeholder.com/600x400.png?text=썸네일',
      user: {name: '김경탁'},
      reviewCount: 3,
      wishlistCount: 12,
      hashtags: ['한옥마을', '맛집투어', '전주'],
      schedules: [
        {
          day: 1,
          scheduleSequence: 1,
          placeName: '전주 한옥마을 입구',
          lat: 35.81,
          lon: 127.15,
          placeDescription: '한옥마을의 시작점',
          travelTime: 10,
        },
        {
          day: 1,
          scheduleSequence: 2,
          placeName: '비빔밥 거리',
          lat: 35.82,
          lon: 127.151,
          placeDescription: '전통 비빔밥 식사',
          travelTime: 20,
        },
        {
          day: 2,
          scheduleSequence: 1,
          placeName: '전동성당',
          lat: 35.83,
          lon: 127.152,
          placeDescription: '역사적 성당 방문',
          travelTime: 15,
        },
      ],
    };

    setData(mockResponse);
  }, []);

  const toggleLike = () => setIsLiked(prev => !prev);

  if (!data)
    return <Text style={{marginTop: 40, textAlign: 'center'}}>로딩 중...</Text>;

  const groupedSchedules = data.schedules.reduce((acc, cur) => {
    const key = `Day ${cur.day}`;
    acc[key] = acc[key] || [];
    acc[key].push(cur);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 상단 이미지 */}
        <Image source={require('../../assets/풍경1.jpg')} style={styles.map} />
        {/* 흰 배경 box (라운드) */}
        <View style={styles.whiteBox}>
          <Text style={styles.title}>{data.title}</Text>

          <View style={styles.rightAlignRow}>
            <Text style={styles.region}>📍 {data.region}</Text>

            <View style={styles.rowRight}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('FunctionStack', {screen: 'Practice'})
                }>
                <Text style={styles.review}>💬 리뷰 {data.reviewCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleLike}>
                <Text style={styles.like}>
                  {isLiked ? '💖 찜함' : '🤍 찜'} {data.wishlistCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tags}>
            {data.hashtags.map((tag, i) => (
              <Text key={i} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
          <Text style={styles.sectionTitle}>🗓️ 일정</Text>
          {Object.entries(groupedSchedules).map(([day, items], i) => (
            <View key={i} style={styles.scheduleCard}>
              <Text style={styles.dayTitle}>{day}</Text>
              {items.map((item, idx) => (
                <Text key={idx} style={styles.scheduleItem}>
                  ⏱ {item.placeName} ({item.travelTime}분) -{' '}
                  {item.placeDescription}
                </Text>
              ))}
            </View>
          ))}
          <Text style={styles.sectionTitle}>🗺 지도 (샘플)</Text>
          <Image
            source={require('../../assets/풍경1.jpg')}
            style={styles.map}
          />

          <Text style={styles.sectionTitle}>🧑‍💼 호스트 정보</Text>
          <Text style={styles.description}>호스트: {data.user.name}</Text>
          <Text style={styles.sectionTitle}>📖 투어 설명</Text>
          <Text style={styles.description}>{data.description}</Text>

          <View style={{height: 100}} />
        </View>
      </ScrollView>

      {/* 하단 예약 바 */}
      <View style={styles.bottomBar}>
        <Text style={styles.price}>
          ₩{data.guidePrice.toLocaleString()} /인
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.chatBtn}>
            <Text style={styles.chatText}>상담하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reserveBtn}>
            <Text style={styles.reserveText}>예약하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  thumbnail: {width: '100%', height: 230},
  whiteBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  title: {fontSize: 22, fontWeight: 'bold'},
  region: {fontSize: 14, color: '#666', marginBottom: 6},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  review: {fontSize: 14},
  like: {fontSize: 14},
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
  },
  scheduleCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dayTitle: {fontWeight: 'bold', marginBottom: 6},
  scheduleItem: {fontSize: 14, marginBottom: 4},
  map: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
  description: {fontSize: 14, color: '#333'},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reserveBtn: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reserveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 16,
  },
  chatBtn: {
    backgroundColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chatText: {
    color: '#333',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // React Native 0.71 이상에서만 동작. 낮은 버전이면 marginLeft 써도 됨
  },
  rightAlignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // ← 핵심!
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default Practice;
