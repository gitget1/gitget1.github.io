// // // import SockJS from 'sockjs-client';
// // // import {Client} from '@stomp/stompjs';
// // // import AsyncStorage from '@react-native-async-storage/async-storage';

// // // let client: Client;

// // // /**
// // //  * WebSocket 연결 함수 (Promise로 연결 완료 보장)
// // //  */
// // // export const connectWebSocket = async (
// // //   roomId: string,
// // //   onMessage: (msg: any) => void,
// // // ): Promise<void> => {
// // //   return new Promise(async (resolve, reject) => {
// // //     const socket = new SockJS('http://192.168.1.120:8080/ws/chat'); // ✅ WebSocket URL 수정
// // //     const token = await AsyncStorage.getItem('accessToken');

// // //     client = new Client({
// // //       webSocketFactory: () => socket,
// // //       connectHeaders: {
// // //         Authorization: `Bearer ${token ?? ''}`, // ✅ 토큰 포함
// // //       },
// // //       onConnect: () => {
// // //         console.log('✅ WebSocket 연결 완료');
// // //         client.subscribe(`/topic/chatroom/${roomId}`, message => {
// // //           const msg = JSON.parse(message.body);
// // //           console.log('📩 메시지 수신:', msg);
// // //           onMessage(msg);
// // //         });
// // //         resolve(); // ✅ 연결 성공 시 외부에 알림
// // //       },
// // //       onStompError: frame => {
// // //         console.error('[STOMP ERROR]', frame.body);
// // //         reject(new Error('WebSocket 연결 실패: ' + frame.body)); // ✅ 실패 알림
// // //       },
// // //       debug: str => console.log('[STOMP DEBUG]', str),
// // //     });

// // //     client.activate();
// // //   });
// // // };

// // // /**
// // //  * 메시지 전송 함수
// // //  */
// // // export const sendMessage = (
// // //   roomId: string,
// // //   userId: number,
// // //   message: string,
// // // ) => {
// // //   if (client && client.connected) {
// // //     const messageDto = {
// // //       id: roomId, // ✅ roomId를 id로 전송
// // //       userId: userId,
// // //       message: message,
// // //     };

// // //     client.publish({
// // //       destination: `/app/chat.sendMessage`, // ✅ 수정된 전송 주소
// // //       body: JSON.stringify(messageDto),
// // //     });
// // //   } else {
// // //     console.warn('⚠️ WebSocket not connected');
// // //   }
// // // };

// // // export const disconnectWebSocket = () => {
// // //   client?.deactivate();
// // // };
// // import SockJS from 'sockjs-client';
// // import {Client} from '@stomp/stompjs';
// // import AsyncStorage from '@react-native-async-storage/async-storage';

// // let client: Client | null = null;

// // /**
// //  * WebSocket 연결 함수
// //  */
// // export const connectWebSocket = async (
// //   roomId: string,
// //   onMessage: (msg: any) => void,
// // ): Promise<void> => {
// //   return new Promise(async (resolve, reject) => {
// //     try {
// //       const token = await AsyncStorage.getItem('accessToken');
// //       if (!token) {
// //         console.warn('❌ 토큰이 없어 WebSocket 연결을 생략합니다.');
// //         reject('No token');
// //         return;
// //       }

// //       if (client?.connected) {
// //         client.deactivate(); // 중복 연결 방지
// //       }

// //       const socket = new SockJS('http://192.168.1.120:8080/ws/chat');

// //       client = new Client({
// //         webSocketFactory: () => socket,
// //         connectHeaders: {
// //           Authorization: `Bearer ${token}`,
// //         },
// //         onConnect: () => {
// //           console.log('✅ WebSocket 연결 완료');
// //           client?.subscribe(`/topic/chatroom/${roomId}`, message => {
// //             const msg = JSON.parse(message.body);
// //             console.log('📩 메시지 수신:', msg);
// //             onMessage(msg);
// //           });
// //           resolve();
// //         },
// //         onStompError: frame => {
// //           console.error('[STOMP ERROR]', frame.body);
// //           reject(new Error('WebSocket 연결 실패: ' + frame.body));
// //         },
// //         debug: str => console.log('[STOMP DEBUG]', str),
// //       });

// //       client.activate();
// //     } catch (err) {
// //       console.error('WebSocket 연결 중 예외 발생:', err);
// //       reject(err);
// //     }
// //   });
// // };

// // /**
// //  * 메시지 전송 함수
// //  */
// // export const sendMessage = (
// //   roomId: string,
// //   userId: number,
// //   message: string,
// // ) => {
// //   if (client && client.connected) {
// //     const messageDto = {
// //       roomId, // ✅ 명확하게 roomId 필드명 사용 (서버 DTO에 맞게)
// //       userId,
// //       message,
// //     };

// //     client.publish({
// //       destination: '/app/chat.sendMessage',
// //       body: JSON.stringify(messageDto),
// //     });
// //   } else {
// //     console.warn('⚠️ WebSocket not connected');
// //   }
// // };

// // /**
// //  * WebSocket 연결 종료
// //  */
// // export const disconnectWebSocket = () => {
// //   if (client) {
// //     client.deactivate();
// //     client = null;
// //     console.log('🔌 WebSocket 연결 해제됨');
// //   }
// // };
// import SockJS from 'sockjs-client';
// import {Client, IMessage} from '@stomp/stompjs';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// let client: Client | null = null;

// /**
//  * WebSocket 연결 함수
//  * @param roomId - 채팅방 ID
//  * @param onMessage - 메시지 수신 시 호출될 콜백
//  * @returns Promise<void>
//  */
// export const connectWebSocket = async (
//   roomId: string,
//   onMessage: (msg: any) => void,
//   onConnected?: () => void,
// ): Promise<void> => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const token = await AsyncStorage.getItem('accessToken');
//       if (!token) {
//         console.warn('❌ JWT 토큰이 없어 WebSocket 연결 생략');
//         reject('No token');
//         return;
//       }

//       // 기존 연결 해제
//       if (client?.connected) {
//         client.deactivate();
//       }

//       const socket = new SockJS('http://192.168.1.120:8080/ws/chat');

//       client = new Client({
//         webSocketFactory: () => socket,
//         connectHeaders: {
//           Authorization: `Bearer ${token}`,
//         },
//         debug: str => console.log('[🛠 STOMP DEBUG]', str),
//         onConnect: () => {
//           console.log('✅ WebSocket 연결 완료');

//           // 메시지 수신 구독
//           client?.subscribe(
//             `/topic/chatroom/${roomId}`,
//             (message: IMessage) => {
//               try {
//                 const parsed = JSON.parse(message.body);
//                 console.log('📩 수신 메시지:', parsed);
//                 onMessage(parsed);
//               } catch (err) {
//                 console.error('❌ 메시지 파싱 실패:', err);
//               }
//             },
//           );

//           if (onConnected) onConnected();
//           resolve();
//         },
//         onStompError: frame => {
//           console.error('❌ STOMP ERROR:', frame.body);
//           reject(new Error(frame.body));
//         },
//       });

//       client.activate();
//     } catch (error) {
//       console.error('❌ WebSocket 연결 예외 발생:', error);
//       reject(error);
//     }
//   });
// };

// /**
//  * 메시지 전송 함수
//  * @param roomId - 채팅방 ID
//  * @param userId - 사용자 ID
//  * @param message - 전송할 메시지
//  */
// export const sendMessage = (
//   roomId: string,
//   userId: number,
//   message: string,
// ) => {
//   if (!client || !client.connected) {
//     console.warn('⚠️ WebSocket이 연결되지 않았습니다.');
//     return;
//   }

//   const messagePayload = {
//     roomId,
//     userId,
//     message,
//   };

//   client.publish({
//     destination: '/app/chat.sendMessage',
//     body: JSON.stringify(messagePayload),
//   });
// };

// /**
//  * WebSocket 연결 해제
//  */
// export const disconnectWebSocket = () => {
//   if (client) {
//     client.deactivate();
//     client = null;
//     console.log('🔌 WebSocket 연결 해제 완료');
//   }
// };// src/api/chatsocket.tsimport SockJS from 'sockjs-client';
// src/api/chatsocket.ts

import SockJS from 'sockjs-client';
import {Client, IMessage, Frame} from '@stomp/stompjs';

let stompClient: Client | null = null;

export const connectWebSocket = (
  roomId: string,
  onMessage: (message: any) => void,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = new SockJS('http://192.168.1.120:8080/ws/chat');
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
    return;
  }

  const payload = {
    id: roomId, // ✅ 백엔드 MessageDto의 'id' 필드에 대응
    userId,
    message,
  };

  stompClient.publish({
    destination: '/app/chat.sendMessage', // ✅ 백엔드의 @MessageMapping 주소
    body: JSON.stringify(payload),
  });
};
