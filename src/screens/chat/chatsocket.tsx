import SockJS from 'sockjs-client';
import {Client, IMessage, Frame} from '@stomp/stompjs';

let stompClient: Client | null = null;

export const connectWebSocket = (
  roomId: string,
  onMessage: (message: any) => void,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = new SockJS('http://10.147.17.114:8080/ws/chat');
    stompClient = new Client({
      webSocketFactory: () => socket,
      debug: str => console.log('[STOMP DEBUG]', str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('🟢 WebSocket 연결 성공');
        stompClient?.subscribe(
          `/topic/chatroom/${roomId}`,
          (message: IMessage) => {
            const payload = JSON.parse(message.body);
            onMessage(payload);
          },
        );
        resolve(true);
      },
      onStompError: (frame: Frame) => {
        console.error('❌ STOMP 에러:', frame.body);
        reject(new Error(frame.body));
      },
      onWebSocketError: (err: any) => {
        console.error('❌ WebSocket 에러:', err);
        reject(err);
      },
    });

    stompClient.activate();
  });
};

export const disconnectWebSocket = () => {
  if (stompClient && stompClient.connected) {
    stompClient.deactivate();
    stompClient = null;
    console.log('🔌 WebSocket 연결 해제');
  }
};

export const sendMessage = (
  roomId: string,
  userId: number,
  message: string,
) => {
  if (!stompClient || !stompClient.connected) {
    console.warn('⚠️ WebSocket 연결되어 있지 않습니다.');
    return false;
  }

  const payload = {
    id: roomId, // ✅ 백엔드 MessageDto의 'id' 필드에 대응
    userId,
    message,
  };

  try {
    stompClient.publish({
      destination: '/app/chat.sendMessage', // ✅ 백엔드의 @MessageMapping 주소
      body: JSON.stringify(payload),
    });
    console.log('📤 메시지 전송 성공:', payload);
    return true;
  } catch (error) {
    console.error('❌ 메시지 전송 실패:', error);
    return false;
  }
};

/**
 * WebSocket 연결 상태 확인
 */
export const isWebSocketConnected = (): boolean => {
  return stompClient?.connected || false;
};
