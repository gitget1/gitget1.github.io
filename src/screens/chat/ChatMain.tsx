import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
  const navigation = useNavigation<ChatNavigationProp>();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userId = 1; // 실제로는 AsyncStorage에서 불러오기

        if (!token || !userId) {
          console.warn('JWT 토큰 또는 사용자 ID가 없습니다.');
          return;
        }

        setCurrentUserId(Number(userId));
        const response = await axios.get(
          `http://10.147.17.114:8080/api/chat/rooms?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const rooms = response.data;

        const transformed: ChatRoom[] = rooms.map((room: any) => ({
          id: room.id,
          user1Id: room.user1Id,
          user2Id: room.user2Id,
          name: room.name || `채팅방 ${room.id}`,
          lastMessage: room.lastMessage || '최근 메시지 미지원',
          time: room.updatedAt
            ? new Date(room.updatedAt).toLocaleTimeString()
            : '오전 10:00',
          unread: Math.floor(Math.random() * 5),
          avatar: 'https://via.placeholder.com/50',
        }));

        setChatRooms(transformed);
      } catch (error) {
        console.error('채팅방 목록 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, []);

  const renderChatRoom = ({item}: {item: ChatRoom}) => (
    <TouchableOpacity
      style={styles.chatRoom}
      onPress={() => {
        if (currentUserId !== null) {
          navigation.navigate('ChatRoom', {
            roomId: String(item.id),
            userId: currentUserId,
          });
        }
      }}>
      <Image source={{uri: item.avatar}} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread && item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅 목록</Text>
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
          keyExtractor={item => item.id.toString()}
          style={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('NewChat')}>
        <Text style={styles.newChatButtonText}>새 채팅</Text>
      </TouchableOpacity>
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
});

export default ChatMain;