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
  Alert,
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
import {extractUserIdFromNaverJWT} from '../../utils/jwtUtils';

interface Message {
  id: number;
  userId: number;
  message: string;
  createdAt?: string;
}

type RootStackParamList = {
  ChatRoom: {
    roomId: string;
    userId?: number;
    tourTitle?: string;
    hostName?: string;
  };
};

type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
const ChatRoom = () => {
  const {t} = useTranslation();
  const {params} = useRoute<ChatRoomRouteProp>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [_wsConnected, setWsConnected] = useState(false);
  const [userId, setUserId] = useState<number>(params.userId || 1);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMessages = async (token: string): Promise<Message[]> => {
      const res = await fetch(
        `http://124.60.137.10:8080/api/chat/rooms/${params.roomId}/messages`,
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

        const cleanToken = token.replace('Bearer ', '');

        // JWT 토큰에서 사용자 ID 추출
        const extractedUserId = extractUserIdFromNaverJWT(cleanToken);
        setUserId(extractedUserId);

        console.log('🟢 ChatRoom 초기화:', {
          roomId: params.roomId,
          userId: extractedUserId,
        });

        // 1. 기존 메시지 불러오기
        const res = await fetchMessages(cleanToken);
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
  }, [params.roomId, params.userId]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  const handleSend = async () => {
    if (input.trim()) {
      const messageText = input.trim();
      setInput(''); // 먼저 입력 필드를 비워서 중복 전송 방지

      // WebSocket 연결 상태 실시간 확인
      const isConnected = isWebSocketConnected();
      console.log('🔍 WebSocket 연결 상태:', isConnected);

      if (!isConnected) {
        console.warn('❌ WebSocket 연결되어 있지 않습니다. 재연결 시도...');

        // 재연결 시도
        try {
          const reconnected = await connectWebSocket(
            params.roomId,
            (msg: Message) => {
              console.log('📩 새 메시지 수신:', msg);
              setMessages(prev => [...prev, msg]);
            },
          );

          if (reconnected) {
            setWsConnected(true);
            console.log('✅ WebSocket 재연결 성공');
          } else {
            console.error('❌ WebSocket 재연결 실패');
            Alert.alert(
              '연결 오류',
              'WebSocket 연결에 실패했습니다. 다시 시도해주세요.',
            );
            return;
          }
        } catch (error) {
          console.error('❌ WebSocket 재연결 중 오류:', error);
          Alert.alert(
            '연결 오류',
            'WebSocket 연결에 실패했습니다. 다시 시도해주세요.',
          );
          return;
        }
      }

      // 메시지 전송
      const success = sendMessage(params.roomId, userId, messageText);
      if (success) {
        console.log('📤 메시지 전송 성공:', messageText);
      } else {
        console.error('❌ 메시지 전송 실패');
        Alert.alert(
          '전송 실패',
          '메시지 전송에 실패했습니다. 다시 시도해주세요.',
        );
        setInput(messageText); // 실패 시 입력 내용 복원
      }
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
        <Text
          style={[
            styles.messageText,
            item.userId === userId && styles.myMessageText,
          ]}>
          {item.message}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 채팅방 헤더 */}
      {(params.tourTitle || params.hostName) && (
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>
            {params.hostName || '가이드'}님과의 상담
          </Text>
          {params.tourTitle && (
            <Text style={styles.tourTitle}>📍 {params.tourTitle}</Text>
          )}
          <Text style={styles.connectionStatus}>
            {isWebSocketConnected() ? '🟢 연결됨' : '🔴 연결 끊김'}
          </Text>
        </View>
      )}

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
  chatHeader: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  tourTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  connectionStatus: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  messagesList: {padding: 10},
  messageContainer: {marginVertical: 5, maxWidth: '80%'},
  myMessage: {alignSelf: 'flex-end'},
  otherMessage: {alignSelf: 'flex-start'},
  messageBubble: {borderRadius: 20, padding: 12},
  myBubble: {backgroundColor: '#0288d1'},
  otherBubble: {backgroundColor: '#f1f1f1'},
  messageText: {fontSize: 16, color: '#000'},
  myMessageText: {fontSize: 16, color: '#fff'},
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
