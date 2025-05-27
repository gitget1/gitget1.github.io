import React from 'react';
import {View, Text, StyleSheet, FlatList, SafeAreaView} from 'react-native';

// 샘플 리뷰 데이터
const reviews = [
  {
    id: '1',
    title: '전주 한옥마을 투어',
    content: '정말 재밌었어요!',
    date: '2024-05-01',
  },
  {
    id: '2',
    title: '강릉 바다 여행',
    content: '바다가 너무 예뻤어요.',
    date: '2024-04-20',
  },
  {
    id: '3',
    title: '서울 야경 투어',
    content: '야경이 멋졌어요.',
    date: '2024-03-15',
  },
];

const MyReviewList = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>내가 쓴 리뷰</Text>
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.reviewCard}>
            <Text style={styles.title}>{item.title}</Text>
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
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    color: '#222',
  },
  content: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
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
});

export default MyReviewList;
