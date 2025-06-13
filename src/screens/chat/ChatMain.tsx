import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';

type RootStackParamList = {
  ChatRoom: {roomId: string};
  NewChat: undefined;
};

type ChatNavigationProp = StackNavigationProp<RootStackParamList>;

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
}

const ChatMain = () => {
  const navigation = useNavigation<ChatNavigationProp>();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await axios.get('http://192.168.1.120:8080/rooms'); // 수정 필요
        const rooms = response.data;

        // 서버에서 받은 데이터 형식을 ChatRoom에 맞게 매핑
        const transformed: ChatRoom[] = rooms.map((room: any) => ({
          id: room.id.toString(),
          name: `채팅방 ${room.id}`,
          lastMessage: '최근 메시지를 불러오는 기능 추가 예정',
          time: '오전 10:00',
          unread: Math.floor(Math.random() * 5), // 예시
          avatar: 'https://via.placeholder.com/50',
        }));

        setChatRooms(transformed);
      } catch (error) {
        console.error('채팅방 목록 불러오기 실패:', error);
      }
    };

    fetchChatRooms();
  }, []);

  const renderChatRoom = ({item}: {item: ChatRoom}) => (
    <TouchableOpacity
      style={styles.chatRoom}
      onPress={() => navigation.navigate('ChatRoom', {roomId: item.id})}>
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
          {item.unread > 0 && (
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
        <Text style={styles.headerTitle}>채팅</Text>
      </View>
      <FlatList
        data={chatRooms}
        renderItem={renderChatRoom}
        keyExtractor={item => item.id}
        style={styles.list}
      />
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
