import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  ChatRoom: { roomId: string };
};

type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
type ChatRoomNavigationProp = StackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  isRead: boolean;
}

// 더미 데이터
const dummyMessages: Message[] = [
  {
    id: '1',
    text: '안녕하세요! 여행 계획 세우실 분 구해요~',
    sender: 'other',
    timestamp: '오후 2:30',
    isRead: true,
  },
  {
    id: '2',
    text: '저도 참여하고 싶어요! 어디로 가실 예정인가요?',
    sender: 'me',
    timestamp: '오후 2:31',
    isRead: true,
  },
  {
    id: '3',
    text: '제주도로 가려고 해요! 3박 4일 정도 생각하고 있어요.',
    sender: 'other',
    timestamp: '오후 2:32',
    isRead: true,
  },
  {
    id: '4',
    text: '좋네요! 저도 제주도 가보고 싶었어요. 언제쯤 계획하고 계신가요?',
    sender: 'me',
    timestamp: '오후 2:33',
    isRead: true,
  },
];

const ChatRoom = () => {
  const { params } = useRoute<ChatRoomRouteProp>();
  const navigation = useNavigation<ChatRoomNavigationProp>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(dummyMessages);
  const [roomTitle, _setRoomTitle] = useState(() => {
    // roomId에 따라 채팅방 제목을 설정
    // 실제로는 API나 데이터베이스에서 가져올 수 있음
    return params.roomId === '1' ? '여행 친구 모임' : '제주도 여행팸';
  });
  const flatListRef = useRef<FlatList>(null);

  // 메시지 전송
  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString('ko-KR', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }),
        isRead: false,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // 스크롤을 최신 메시지로 이동
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // 메시지 렌더링
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'me' ? styles.myMessage : styles.otherMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'me' ? styles.myBubble : styles.otherBubble
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
      <View style={styles.messageFooter}>
        {item.sender === 'me' && item.isRead && (
          <Text style={styles.readStatus}>읽음</Text>
        )}
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{roomTitle}</Text>
          <Text style={styles.headerSubtitle}>2명</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* 메시지 입력 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="메시지를 입력하세요"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={24}
              color={message.trim() ? '#0288d1' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    padding: 5,
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
  },
  myBubble: {
    backgroundColor: '#0288d1',
  },
  otherBubble: {
    backgroundColor: '#f1f1f1',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  readStatus: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  attachButton: {
    padding: 5,
    marginRight: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 5,
    marginLeft: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatRoom; 