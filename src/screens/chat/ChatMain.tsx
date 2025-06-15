import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {extractUserIdFromNaverJWT} from '../../utils/jwtUtils';

type RootStackParamList = {
  ChatRoom: {roomId: string; userId?: number};
  NewChat: undefined;
};

type ChatNavigationProp = StackNavigationProp<RootStackParamList>;

interface ChatRoom {
  id: number;
  user1Id: number;
  user2Id: number;
  name?: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  avatar?: string;
}

const ChatMain = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<ChatNavigationProp>();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchChatRooms = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.warn('JWT 토큰이 없습니다.');
        return;
      }

      const cleanToken = token.replace('Bearer ', '');

      // JWT 토큰에서 사용자 ID 추출
      const userId = extractUserIdFromNaverJWT(cleanToken);

      console.log('🟢 채팅방 목록 요청:', {
        userId,
      });

      setCurrentUserId(Number(userId));
      const response = await axios.get(
        `http://124.60.137.10:80/api/chat/rooms`,
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('🟢 채팅방 목록 응답:', response.data);

      const rooms = response.data;

      // API 명세에 맞는 데이터 변환
      const transformed: ChatRoom[] = Array.isArray(rooms)
        ? rooms.map((room: any, index: number) => {
            console.log(`🟢 채팅방 ${index}:`, room);

            // 상대방 ID 결정 (현재 사용자가 아닌 다른 사용자)
            const otherUserId =
              room.user1Id === userId ? room.user2Id : room.user1Id;

            return {
              id: Number(room?.id) || index,
              user1Id: Number(room?.user1Id) || 0,
              user2Id: Number(room?.user2Id) || 0,
              name: String(
                `${t('chatRoomTitle')} ${otherUserId}`, // 상대방 ID로 채팅방 이름 설정
              ),
              lastMessage: String(t('recentMessageNotSupported')),
              time: String(t('morningTime')),
              unread: Number(Math.floor(Math.random() * 5)),
              avatar: String('https://via.placeholder.com/50'),
            };
          })
        : [];

      console.log('🟢 변환된 채팅방 목록:', transformed);
      setChatRooms(transformed);
    } catch (error) {
      console.error(t('chatRoomLoadError'), error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 화면이 포커스될 때마다 채팅방 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchChatRooms();
    }, [fetchChatRooms]),
  );

  const renderChatRoom = ({item}: {item: ChatRoom}) => {
    // 안전성 검사
    if (!item) {
      return null;
    }

    const safeName = String(
      item.name || `${t('chatRoomTitle')} ${item.id || 'Unknown'}`,
    );
    const safeTime = String(item.time || '');
    const safeLastMessage = String(
      item.lastMessage || t('recentMessageNotSupported'),
    );
    const safeUnread = Number(item.unread || 0);
    const safeAvatar = String(item.avatar || 'https://via.placeholder.com/50');

    return (
      <TouchableOpacity
        style={styles.chatRoom}
        onPress={() => {
          if (currentUserId !== null && item.id) {
            navigation.navigate('ChatRoom', {
              roomId: String(item.id),
              userId: currentUserId,
            });
          }
        }}>
        <Image source={{uri: safeAvatar}} style={styles.avatar} />
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={styles.name}>{safeName}</Text>
            <Text style={styles.time}>{safeTime}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {safeLastMessage}
            </Text>
            {safeUnread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{String(safeUnread)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('chatList')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{marginTop: 20}}
          size="large"
          color="#0288d1"
        />
      ) : (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item, index) => `chatroom-${item?.id || index}`}
          style={styles.list}
          removeClippedSubviews={false}
        />
      )}

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('NewChat')}>
        <Text style={styles.newChatButtonText}>{t('newChat')}</Text>
      </TouchableOpacity>

      {/* 하단 탭 네비게이션 */}
      <View style={styles.bottomTabContainer}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home" size={24} color="#666" />
          <Text style={styles.tabLabel}>{t('home')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('WishlistScreen')}>
          <Ionicons name="heart" size={24} color="#666" />
          <Text style={styles.tabLabel}>{t('wishlist')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('MyPage')}>
          <Ionicons name="person" size={24} color="#666" />
          <Text style={styles.tabLabel}>{t('mypage')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {fontSize: 24, fontWeight: 'bold'},
  list: {flex: 1},
  chatRoom: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {flex: 1},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {fontSize: 16, fontWeight: '600'},
  time: {fontSize: 12, color: '#666'},
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#0288d1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  newChatButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#0288d1',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  newChatButtonText: {color: '#fff', fontSize: 14, fontWeight: '600'},
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default ChatMain;
