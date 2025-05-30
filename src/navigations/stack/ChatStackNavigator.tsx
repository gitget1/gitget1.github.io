import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ChatMain from '../../screens/chat/ChatMain';
import ChatRoom from '../../screens/chat/ChatRoom';

export type ChatStackParamList = {
  ChatMain: undefined;
  ChatRoom: {roomId: string};
  ChatRoomScreen: {roomId: string; userId?: number};
  NewChat: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'white',
        },
      }}>
      <Stack.Screen
        name="ChatMain"
        component={ChatMain}
        options={{title: '채팅'}}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoom}
        options={{title: '채팅방'}}
      />
      <Stack.Screen
        name="ChatRoomScreen"
        component={ChatRoom}
        options={{title: '채팅방'}}
      />
      <Stack.Screen
        name="NewChat"
        component={ChatMain}
        options={{title: '새 채팅'}}
      />
    </Stack.Navigator>
  );
};

export default ChatStackNavigator;
