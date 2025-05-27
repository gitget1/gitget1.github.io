import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
//import axios from 'axios';

// 가상 리뷰 데이터 (초기값)
const defaultReviews = [
  {
    id: 'temp-1',
    title: '테스트 리뷰입니다',
    content: '이건 가상 리뷰이며 삭제 또는 수정이 가능합니다.',
    date: '2025-05-28',
  },
];

const MyReviewList = () => {
  const [reviews, setReviews] = useState(defaultReviews);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    // TODO: 여기에 실제 리뷰 API 연동 가능
    // axios.get('/api/my-reviews').then(res => setReviews(res.data));
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('리뷰 삭제', '정말 삭제하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        onPress: () => {
          setReviews(prev => prev.filter(r => r.id !== id));
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setEditedContent(review.content);
    setModalVisible(true);
  };

  const saveEdited = () => {
    setReviews(prev =>
      prev.map(r =>
        r.id === editingReview.id ? {...r, content: editedContent} : r,
      ),
    );
    setModalVisible(false);
    setEditingReview(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>내가 쓴 리뷰</Text>

      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.reviewCard}>
            <View style={styles.cardTop}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={styles.actionText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={[styles.actionText, {color: 'red'}]}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>작성한 리뷰가 없습니다.</Text>
        }
        contentContainerStyle={
          reviews.length === 0 ? styles.emptyContainer : undefined
        }
      />

      {/* 수정 모달 */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>리뷰 수정</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              value={editedContent}
              onChangeText={setEditedContent}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#ccc'}]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingReview(null);
                }}>
                <Text>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: '#0288d1'}]}
                onPress={saveEdited}>
                <Text style={{color: 'white'}}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f9f9f9', padding: 16},
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#0288d1',
    alignSelf: 'center',
  },
  reviewCard: {
    backgroundColor: '#fff',
    marginBottom: 18,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {fontWeight: 'bold', fontSize: 17, color: '#222'},
  actions: {flexDirection: 'row', gap: 12},
  actionText: {
    fontSize: 14,
    color: '#0288d1',
  },
  content: {
    fontSize: 15,
    color: '#444',
    marginVertical: 8,
  },
  date: {
    fontSize: 13,
    color: '#888',
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#aaa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
});

export default MyReviewList;
