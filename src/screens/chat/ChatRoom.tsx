import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
  isWebSocketConnected,
} from './chatsocket';
import {useTranslation} from 'react-i18next';

interface Message {
  id: number;
  userId: number;
  message: string;
  createdAt?: string;
}

type RootStackParamList = {
  ChatRoom: {roomId: string; userId?: number};
};

type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
const ChatRoom = () => {
  const {t} = useTranslation();
  const {params} = useRoute<ChatRoomRouteProp>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const userId = params.userId || 1;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMessages = async (token: string): Promise<Message[]> => {
      const res = await fetch(
        `http://10.147.17.114:8080/api/chat/rooms/${params.roomId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return await res.json();
    };

    const initChat = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.warn('JWT 토큰이 없습니다.');
          return;
        }

        // 1. 기존 메시지 불러오기
        const res = await fetchMessages(token);
        setMessages(res);
        console.log('📋 기존 메시지 로드:', res.length, '개');

        // 2. WebSocket 연결
        console.log('🔗 WebSocket 연결 시도...');
        try {
          const connected = await connectWebSocket(
            params.roomId,
            (msg: Message) => {
              console.log('📩 새 메시지 수신:', msg);
              setMessages(prev => [...prev, msg]);
            },
          );

          if (connected) {
            setWsConnected(true);
            console.log('✅ WebSocket 연결 성공');
            console.log('✅ 연결 상태 확인:', isWebSocketConnected());
          } else {
            console.error('❌ WebSocket 연결 실패');
            setWsConnected(false);
          }
        } catch (wsError) {
          console.error('❌ WebSocket 연결 중 오류:', wsError);
          setWsConnected(false);
        }
      } catch (err) {
        console.error('❌ 초기 채팅 로딩 실패:', err);
        setWsConnected(false);
      }
    };

    initChat();

    return () => {
      disconnectWebSocket();
    };
  }, [params.roomId, userId]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  const handleSend = async () => {
    if (!wsConnected) {
      console.warn('❌ WebSocket이 아직 연결되지 않았습니다.');
      return;
    }

    if (input.trim()) {
      const messageText = input.trim();
      setInput(''); // 먼저 입력 필드를 비워서 중복 전송 방지

      // WebSocket으로만 전송 - 서버에서 받은 메시지가 상태에 추가됨
      sendMessage(params.roomId, userId, messageText);

      console.log('📤 메시지 전송:', messageText);
    }
  };

  const renderMessage = ({item}: {item: Message}) => (
    <View
      style={[
        styles.messageContainer,
        item.userId === userId ? styles.myMessage : styles.otherMessage,
      ]}>
      <View
        style={[
          styles.messageBubble,
          item.userId === userId ? styles.myBubble : styles.otherBubble,
        ]}>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      <Text style={styles.timestamp}>
        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.messagesList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('enterMessage')}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !input.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim()}>
            <Ionicons
              name="send"
              size={24}
              color={input.trim() ? '#0288d1' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  messagesList: {padding: 10},
  messageContainer: {marginVertical: 5, maxWidth: '80%'},
  myMessage: {alignSelf: 'flex-end'},
  otherMessage: {alignSelf: 'flex-start'},
  messageBubble: {borderRadius: 20, padding: 12},
  myBubble: {backgroundColor: '#0288d1'},
  otherBubble: {backgroundColor: '#f1f1f1'},
  messageText: {fontSize: 16, color: '#000'},
  timestamp: {fontSize: 12, color: '#666', marginTop: 2},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  sendButton: {padding: 5, marginLeft: 5},
  sendButtonDisabled: {opacity: 0.5},
});

export default ChatRoom;
