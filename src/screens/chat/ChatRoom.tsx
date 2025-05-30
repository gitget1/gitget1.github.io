import React, {useState, useRef, useEffect} from 'react';
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
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
} from '../../api/chatsocket';

// 메시지 타입 정의
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
type ChatRoomNavigationProp = StackNavigationProp<RootStackParamList>;

const ChatRoom = () => {
  const {params} = useRoute<ChatRoomRouteProp>();
  const navigation = useNavigation<ChatRoomNavigationProp>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const userId = params.userId || 1; // 실제 로그인 유저 id로 대체
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    connectWebSocket(params.roomId, (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      disconnectWebSocket();
    };
  }, [params.roomId]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(params.roomId, userId, input);
      setInput('');
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
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>{item.createdAt || ''}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>채팅방</Text>
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
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* 메시지 입력 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
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
