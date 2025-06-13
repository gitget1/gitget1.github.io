// // // import React, {useEffect, useState, useRef} from 'react';
// // // import {
// // //   View,
// // //   TextInput,
// // //   FlatList,
// // //   Text,
// // //   StyleSheet,
// // //   KeyboardAvoidingView,
// // //   Platform,
// // //   SafeAreaView,
// // //   TouchableOpacity,
// // // } from 'react-native';
// // // import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
// // // import {StackNavigationProp} from '@react-navigation/stack';
// // // import Ionicons from 'react-native-vector-icons/Ionicons';
// // // import axios from 'axios';
// // // import AsyncStorage from '@react-native-async-storage/async-storage';
// // // import {
// // //   connectWebSocket,
// // //   disconnectWebSocket,
// // //   sendMessage,
// // // } from '../../api/chatsocket';

// // // interface Message {
// // //   id: number;
// // //   userId: number;
// // //   message: string;
// // //   createdAt?: string;
// // // }

// // // type RootStackParamList = {
// // //   ChatRoom: {roomId: string; userId?: number};
// // // };

// // // type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
// // // type ChatRoomNavigationProp = StackNavigationProp<RootStackParamList>;

// // // const ChatRoom = () => {
// // //   const {params} = useRoute<ChatRoomRouteProp>();
// // //   const navigation = useNavigation<ChatRoomNavigationProp>();
// // //   const [input, setInput] = useState('');
// // //   const [messages, setMessages] = useState<Message[]>([]);
// // //   const [wsConnected, setWsConnected] = useState(false);
// // //   const userId = params.userId || 1;
// // //   const flatListRef = useRef<FlatList>(null);

// // //   useEffect(() => {
// // //     const initChat = async () => {
// // //       try {
// // //         const token = await AsyncStorage.getItem('accessToken');
// // //         if (!token) {
// // //           console.warn('JWT 토큰이 없습니다.');
// // //           return;
// // //         }

// // //         // 메시지 불러오기
// // //         const res = await axios.get(
// // //           `http://192.168.1.120:8080/api/chat/rooms/${params.roomId}/messages`,
// // //           {
// // //             headers: {
// // //               Authorization: `Bearer ${token}`,
// // //               'Content-Type': 'application/json',
// // //             },
// // //           },
// // //         );
// // //         setMessages(res.data);
// // //         res;

// // //         // WebSocket 연결
// // //         await connectWebSocket(params.roomId, (msg: Message) => {
// // //           setMessages(prev => [...prev, msg]);
// // //         });
// // //         setWsConnected(true);
// // //       } catch (err) {
// // //         console.error('WebSocket 연결 실패 또는 메시지 로딩 실패:', err);
// // //       }
// // //     };

// // //     initChat();

// // //     return () => {
// // //       disconnectWebSocket();
// // //     };
// // //   }, [params.roomId, userId]);

// // //   const handleSend = () => {
// // //     if (!wsConnected) {
// // //       console.warn('❌ WebSocket이 아직 연결되지 않았습니다.');
// // //       return;
// // //     }

// // //     if (input.trim()) {
// // //       const newMessage: Message = {
// // //         id: Date.now(), // 임시 ID
// // //         userId,
// // //         message: input,
// // //         createdAt: new Date().toISOString(),
// // //       };

// // //       setMessages(prev => [...prev, newMessage]); // 낙관적 UI
// // //       sendMessage(params.roomId, userId, input); // WebSocket으로 전송
// // //       setInput('');
// // //     }
// // //   };

// // //   const renderMessage = ({item}: {item: Message}) => (
// // //     <View
// // //       style={[
// // //         styles.messageContainer,
// // //         item.userId === userId ? styles.myMessage : styles.otherMessage,
// // //       ]}>
// // //       <View
// // //         style={[
// // //           styles.messageBubble,
// // //           item.userId === userId ? styles.myBubble : styles.otherBubble,
// // //         ]}>
// // //         <Text style={styles.messageText}>{item.message}</Text>
// // //       </View>
// // //       <Text style={styles.timestamp}>
// // //         {new Date(item.createdAt || '').toLocaleTimeString()}
// // //       </Text>
// // //     </View>
// // //   );

// // //   return (
// // //     <SafeAreaView style={styles.container}>
// // //       <View style={styles.header}>
// // //         <TouchableOpacity
// // //           style={styles.backButton}
// // //           onPress={() => navigation.goBack()}>
// // //           <Ionicons name="chevron-back" size={24} color="#000" />
// // //         </TouchableOpacity>
// // //         <Text style={styles.headerTitle}>채팅방</Text>
// // //         <View style={{width: 24}} />
// // //       </View>

// // //       <FlatList
// // //         ref={flatListRef}
// // //         data={messages}
// // //         renderItem={renderMessage}
// // //         keyExtractor={item => String(item.id)}
// // //         onContentSizeChange={() =>
// // //           flatListRef.current?.scrollToEnd({animated: true})
// // //         }
// // //         contentContainerStyle={styles.messagesList}
// // //       />

// // //       <KeyboardAvoidingView
// // //         behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
// // //         <View style={styles.inputContainer}>
// // //           <TextInput
// // //             style={styles.input}
// // //             value={input}
// // //             onChangeText={setInput}
// // //             placeholder="메시지를 입력하세요"
// // //             multiline
// // //           />
// // //           <TouchableOpacity
// // //             style={[
// // //               styles.sendButton,
// // //               !input.trim() && styles.sendButtonDisabled,
// // //             ]}
// // //             onPress={handleSend}
// // //             disabled={!input.trim()}>
// // //             <Ionicons
// // //               name="send"
// // //               size={24}
// // //               color={input.trim() ? '#0288d1' : '#ccc'}
// // //             />
// // //           </TouchableOpacity>
// // //         </View>
// // //       </KeyboardAvoidingView>
// // //     </SafeAreaView>
// // //   );
// // // };

// // // const styles = StyleSheet.create({
// // //   container: {flex: 1, backgroundColor: '#fff'},
// // //   header: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     padding: 10,
// // //     borderBottomWidth: 1,
// // //     borderBottomColor: '#eee',
// // //   },
// // //   backButton: {padding: 5},
// // //   headerTitle: {flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold'},
// // //   messagesList: {padding: 10},
// // //   messageContainer: {marginVertical: 5, maxWidth: '80%'},
// // //   myMessage: {alignSelf: 'flex-end'},
// // //   otherMessage: {alignSelf: 'flex-start'},
// // //   messageBubble: {borderRadius: 20, padding: 12},
// // //   myBubble: {backgroundColor: '#0288d1'},
// // //   otherBubble: {backgroundColor: '#f1f1f1'},
// // //   messageText: {fontSize: 16, color: '#000'},
// // //   timestamp: {fontSize: 12, color: '#666', marginTop: 2},
// // //   inputContainer: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     padding: 10,
// // //     borderTopWidth: 1,
// // //     borderTopColor: '#eee',
// // //   },
// // //   input: {
// // //     flex: 1,
// // //     borderWidth: 1,
// // //     borderColor: '#ddd',
// // //     borderRadius: 20,
// // //     paddingHorizontal: 15,
// // //     paddingVertical: 8,
// // //     maxHeight: 100,
// // //     fontSize: 16,
// // //   },
// // //   sendButton: {padding: 5, marginLeft: 5},
// // //   sendButtonDisabled: {opacity: 0.5},
// // // });

// // // export default ChatRoom;
// // import React, {useEffect, useState, useRef} from 'react';
// // import {
// //   View,
// //   TextInput,
// //   FlatList,
// //   Text,
// //   StyleSheet,
// //   KeyboardAvoidingView,
// //   Platform,
// //   SafeAreaView,
// //   TouchableOpacity,
// // } from 'react-native';
// // import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
// // import {StackNavigationProp} from '@react-navigation/stack';
// // import Ionicons from 'react-native-vector-icons/Ionicons';
// // import axios from 'axios';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import {
// //   connectWebSocket,
// //   disconnectWebSocket,
// //   sendMessage,
// // } from '../../api/chatsocket';

// // interface Message {
// //   id: number;
// //   userId: number;
// //   message: string;
// //   createdAt?: string;
// // }

// // type RootStackParamList = {
// //   ChatRoom: {roomId: string; userId?: number};
// // };

// // type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
// // type ChatRoomNavigationProp = StackNavigationProp<RootStackParamList>;

// // const ChatRoom = () => {
// //   const {params} = useRoute<ChatRoomRouteProp>();
// //   const navigation = useNavigation<ChatRoomNavigationProp>();
// //   const [input, setInput] = useState('');
// //   const [messages, setMessages] = useState<Message[]>([]);
// //   const [wsConnected, setWsConnected] = useState(false);
// //   const userId = params.userId || 1;
// //   const flatListRef = useRef<FlatList>(null);

// //   useEffect(() => {
// //     const initChat = async () => {
// //       try {
// //         const token = await AsyncStorage.getItem('accessToken');
// //         if (!token) {
// //           console.warn('JWT 토큰이 없습니다.');
// //           return;
// //         }

// //         const res = await axios.get(
// //           `http://192.168.1.120:8080/api/chat/rooms/${params.roomId}/messages`,
// //           {
// //             headers: {
// //               Authorization: `Bearer ${token}`,
// //               'Content-Type': 'application/json',
// //             },
// //           },
// //         );
// //         setMessages(res.data);

// //         await connectWebSocket(params.roomId, (msg: Message) => {
// //           setMessages(prev => [...prev, msg]);
// //         });

// //         setWsConnected(true);
// //       } catch (err) {
// //         console.error('WebSocket 연결 실패 또는 메시지 로딩 실패:', err);
// //       }
// //     };

// //     initChat();

// //     return () => {
// //       disconnectWebSocket();
// //     };
// //   }, [params.roomId, userId]);

// //   const handleSend = async () => {
// //     if (!wsConnected) {
// //       console.warn('❌ WebSocket이 아직 연결되지 않았습니다.');
// //       return;
// //     }

// //     if (input.trim()) {
// //       const newMessage: Message = {
// //         id: Date.now(), // 임시 ID
// //         userId,
// //         message: input,
// //         createdAt: new Date().toISOString(),
// //       };

// //       setMessages(prev => [...prev, newMessage]); // 낙관적 UI
// //       sendMessage(params.roomId, userId, input); // WebSocket 전송

// //       try {
// //         const token = await AsyncStorage.getItem('accessToken');
// //         if (!token) throw new Error('토큰 없음');

// //         await axios.post(
// //           `http://192.168.1.120:8080/api/chat/rooms/${params.roomId}/messages`,
// //           {
// //             userId,
// //             message: input,
// //           },
// //           {
// //             headers: {
// //               Authorization: `Bearer ${token}`,
// //               'Content-Type': 'application/json',
// //             },
// //           },
// //         );
// //       } catch (err) {
// //         console.error('❌ 메시지 저장 실패:', err);
// //       }

// //       setInput('');
// //     }
// //   };

// //   const renderMessage = ({item}: {item: Message}) => (
// //     <View
// //       style={[
// //         styles.messageContainer,
// //         item.userId === userId ? styles.myMessage : styles.otherMessage,
// //       ]}>
// //       <View
// //         style={[
// //           styles.messageBubble,
// //           item.userId === userId ? styles.myBubble : styles.otherBubble,
// //         ]}>
// //         <Text style={styles.messageText}>{item.message}</Text>
// //       </View>
// //       <Text style={styles.timestamp}>
// //         {new Date(item.createdAt || '').toLocaleTimeString()}
// //       </Text>
// //     </View>
// //   );

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       <View style={styles.header}>
// //         <TouchableOpacity
// //           style={styles.backButton}
// //           onPress={() => navigation.goBack()}>
// //           <Ionicons name="chevron-back" size={24} color="#000" />
// //         </TouchableOpacity>
// //         <Text style={styles.headerTitle}>채팅방</Text>
// //         <View style={{width: 24}} />
// //       </View>

// //       <FlatList
// //         ref={flatListRef}
// //         data={messages}
// //         renderItem={renderMessage}
// //         keyExtractor={item => String(item.id)}
// //         onContentSizeChange={() =>
// //           flatListRef.current?.scrollToEnd({animated: true})
// //         }
// //         contentContainerStyle={styles.messagesList}
// //       />

// //       <KeyboardAvoidingView
// //         behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
// //         <View style={styles.inputContainer}>
// //           <TextInput
// //             style={styles.input}
// //             value={input}
// //             onChangeText={setInput}
// //             placeholder="메시지를 입력하세요"
// //             multiline
// //           />
// //           <TouchableOpacity
// //             style={[
// //               styles.sendButton,
// //               !input.trim() && styles.sendButtonDisabled,
// //             ]}
// //             onPress={handleSend}
// //             disabled={!input.trim()}>
// //             <Ionicons
// //               name="send"
// //               size={24}
// //               color={input.trim() ? '#0288d1' : '#ccc'}
// //             />
// //           </TouchableOpacity>
// //         </View>
// //       </KeyboardAvoidingView>
// //     </SafeAreaView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {flex: 1, backgroundColor: '#fff'},
// //   header: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     padding: 10,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#eee',
// //   },
// //   backButton: {padding: 5},
// //   headerTitle: {flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold'},
// //   messagesList: {padding: 10},
// //   messageContainer: {marginVertical: 5, maxWidth: '80%'},
// //   myMessage: {alignSelf: 'flex-end'},
// //   otherMessage: {alignSelf: 'flex-start'},
// //   messageBubble: {borderRadius: 20, padding: 12},
// //   myBubble: {backgroundColor: '#0288d1'},
// //   otherBubble: {backgroundColor: '#f1f1f1'},
// //   messageText: {fontSize: 16, color: '#000'},
// //   timestamp: {fontSize: 12, color: '#666', marginTop: 2},
// //   inputContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     padding: 10,
// //     borderTopWidth: 1,
// //     borderTopColor: '#eee',
// //   },
// //   input: {
// //     flex: 1,
// //     borderWidth: 1,
// //     borderColor: '#ddd',
// //     borderRadius: 20,
// //     paddingHorizontal: 15,
// //     paddingVertical: 8,
// //     maxHeight: 100,
// //     fontSize: 16,
// //   },
// //   sendButton: {padding: 5, marginLeft: 5},
// //   sendButtonDisabled: {opacity: 0.5},
// // });

// // export default ChatRoom;
// import React, {useEffect, useState, useRef} from 'react';
// import {
//   View,
//   TextInput,
//   FlatList,
//   Text,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   SafeAreaView,
//   TouchableOpacity,
// } from 'react-native';
// import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//   connectWebSocket,
//   disconnectWebSocket,
//   sendMessage,
// } from '../../api/chatsocket';

// interface Message {
//   id: number;
//   userId: number;
//   message: string;
//   createdAt?: string;
// }

// type RootStackParamList = {
//   ChatRoom: {roomId: string; userId?: number};
// };

// type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoom'>;
// type ChatRoomNavigationProp = StackNavigationProp<RootStackParamList>;

// const ChatRoom = () => {
//   const {params} = useRoute<ChatRoomRouteProp>();
//   const navigation = useNavigation<ChatRoomNavigationProp>();
//   const [input, setInput] = useState('');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [wsConnected, setWsConnected] = useState(false);
//   const userId = params.userId || 1;
//   const flatListRef = useRef<FlatList>(null);

//   useEffect(() => {
//     const initChat = async () => {
//       try {
//         const token = await AsyncStorage.getItem('accessToken');
//         if (!token) {
//           console.warn('JWT 토큰이 없습니다.');
//           return;
//         }

//         const res = await axios.get(
//           `http://192.168.1.120:8080/api/chat/rooms/${params.roomId}/messages`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           },
//         );
//         setMessages(res.data);

//         // WebSocket 연결
//         connectWebSocket(params.roomId, (msg: Message) => {
//           console.log('WebSocket 메시지 수신:', msg);

//           setMessages(prev => [...prev, msg]);
//           setWsConnected(true);
//         });
//       } catch (err) {
//         console.error('WebSocket 연결 실패 또는 메시지 로딩 실패:', err);
//       }
//     };

//     initChat();

//     return () => {
//       disconnectWebSocket();
//     };
//   }, [params.roomId, userId]);

//   useEffect(() => {
//     flatListRef.current?.scrollToEnd({animated: true});
//   }, [messages]);

//   const handleSend = async () => {
//     if (!wsConnected) {
//       console.warn('❌ WebSocket이 아직 연결되지 않았습니다.');
//       return;
//     }

//     if (input.trim()) {
//       const newMessage: Message = {
//         id: Date.now(),
//         userId,
//         message: input,
//         createdAt: new Date().toISOString(),
//       };

//       setMessages(prev => [...prev, newMessage]);
//       sendMessage(params.roomId, userId, input);

//       try {
//         const token = await AsyncStorage.getItem('accessToken');
//         if (!token) throw new Error('❌ 토큰 없음');

//         await axios.post(
//           `http://192.168.1.120:8080/api/chat/rooms/${params.roomId}/messages`,
//           {
//             userId,
//             message: input,
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               'Content-Type': 'application/json',
//             },
//           },
//         );
//       } catch (err: any) {
//         console.error(
//           '❌ 메시지 저장 실패:',
//           err?.response?.data || err.message,
//         );
//       }

//       setInput('');
//     }
//   };

//   const renderMessage = ({item}: {item: Message}) => (
//     <View
//       style={[
//         styles.messageContainer,
//         item.userId === userId ? styles.myMessage : styles.otherMessage,
//       ]}>
//       <View
//         style={[
//           styles.messageBubble,
//           item.userId === userId ? styles.myBubble : styles.otherBubble,
//         ]}>
//         <Text style={styles.messageText}>{item.message}</Text>
//       </View>
//       <Text style={styles.timestamp}>
//         {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}
//       </Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}>
//           <Ionicons name="chevron-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>채팅방</Text>
//         <View style={{width: 24}} />
//       </View>

//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         renderItem={renderMessage}
//         keyExtractor={item => String(item.id)}
//         contentContainerStyle={styles.messagesList}
//       />

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             value={input}
//             onChangeText={setInput}
//             placeholder="메시지를 입력하세요"
//             multiline
//           />
//           <TouchableOpacity
//             style={[
//               styles.sendButton,
//               !input.trim() && styles.sendButtonDisabled,
//             ]}
//             onPress={handleSend}
//             disabled={!input.trim()}>
//             <Ionicons
//               name="send"
//               size={24}
//               color={input.trim() ? '#0288d1' : '#ccc'}
//             />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {flex: 1, backgroundColor: '#fff'},
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   backButton: {padding: 5},
//   headerTitle: {flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold'},
//   messagesList: {padding: 10},
//   messageContainer: {marginVertical: 5, maxWidth: '80%'},
//   myMessage: {alignSelf: 'flex-end'},
//   otherMessage: {alignSelf: 'flex-start'},
//   messageBubble: {borderRadius: 20, padding: 12},
//   myBubble: {backgroundColor: '#0288d1'},
//   otherBubble: {backgroundColor: '#f1f1f1'},
//   messageText: {fontSize: 16, color: '#000'},
//   timestamp: {fontSize: 12, color: '#666', marginTop: 2},
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//   },
//   input: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     maxHeight: 100,
//     fontSize: 16,
//   },
//   sendButton: {padding: 5, marginLeft: 5},
//   sendButtonDisabled: {opacity: 0.5},
// });

// export default ChatRoom;// src/screens/ChatRoom.tsx
// src/screens/ChatRoom.tsx

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
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectWebSocket,
  disconnectWebSocket,
  sendMessage,
} from '../../api/chatsocket';

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
  const [wsConnected, setWsConnected] = useState(false);
  const userId = params.userId || 1;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMessages = async (token: string): Promise<Message[]> => {
      const res = await fetch(
        `http://192.168.1.120:8080/api/chat/rooms/${params.roomId}/messages`,
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

        const res = await fetchMessages(token);
        setMessages(res);

        connectWebSocket(params.roomId, (msg: Message) => {
          setMessages(prev => [...prev, msg]);
        });

        setWsConnected(true);
      } catch (err) {
        console.error('❌ 초기 채팅 로딩 실패:', err);
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
      const newMessage: Message = {
        id: Date.now(), // 임시 ID
        userId,
        message: input,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);
      sendMessage(params.roomId, userId, input); // ✅ WebSocket 전송만

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
      <Text style={styles.timestamp}>
        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>채팅방</Text>
        <View style={{width: 24}} />
      </View>

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
  container: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {padding: 5},
  headerTitle: {flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold'},
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
