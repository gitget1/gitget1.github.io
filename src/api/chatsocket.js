import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export const connectWebSocket = (chatRoomId, onMessageReceived) => {
  stompClient = new Client({
    // 서버에 연결할 SockJS 엔드포인트 (Spring에서 설정한 WebSocket 엔드포인트)
    webSocketFactory: () => new SockJS('http://<your-backend-server>/ws'), // 예: http://localhost:8083/ws

    reconnectDelay: 5000,

    onConnect: () => {
      console.log('✅ WebSocket connected');

      // 채팅방 구독
      stompClient.subscribe(`/topic/chatroom/${chatRoomId}`, (message) => {
        const msg = JSON.parse(message.body);
        console.log('📩 New message received:', msg);
        onMessageReceived(msg); // 프론트에 메시지 전달
      });
    },

    onStompError: (frame) => {
      console.error('❌ WebSocket error:', frame);
    },
  });

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
  }
};

export const sendMessage = (chatRoomId, userId, content) => {
  if (stompClient && stompClient.connected) {
    const message = {
      id: chatRoomId,
      userId: userId,
      message: content,
    };

    stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message),
    });
  } else {
    console.warn('⚠️ WebSocket not connected');
  }
};
