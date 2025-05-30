import React, {useEffect, useState} from 'react';
import {connectWebSocket, disconnectWebSocket, sendMessage} from './chatsocket';
import {View, Text, TextInput, Button, FlatList} from 'react-native';

// 메시지 타입 정의
export type Message = {
  id: number;
  userId: number;
  message: string;
};

const ChatRoom = ({
  chatRoomId,
  userId,
}: {
  chatRoomId: number;
  userId: number;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    connectWebSocket(chatRoomId, (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      disconnectWebSocket();
    };
  }, [chatRoomId]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(chatRoomId, userId, input);
      setInput('');
    }
  };

  return (
    <View>
      <FlatList
        data={messages}
        keyExtractor={item => String(item.id)}
        renderItem={({item}) => (
          <Text>
            {item.userId === userId ? 'Me' : 'Other'}: {item.message}
          </Text>
        )}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type message..."
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

export default ChatRoom;
