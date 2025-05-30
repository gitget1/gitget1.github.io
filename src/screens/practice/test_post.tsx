import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {AppStackParamList} from '../../navigations/AppNavigator';
// import axios from 'axios';

const TestPost = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'TestPost'>>();
  const navigation = useNavigation();
  const data = route.params?.data;
  const tourProgramId = route.params?.tourProgramId;

  const handleGoBack = () => {
    navigation.navigate('Main');
  };

  const handleEdit = () => {
    if (data) {
      navigation.navigate('Make_program', {
        editData: data,
        tourProgramId: tourProgramId,
      });
    }
  };

  const handleDelete = async () => {
    if (!tourProgramId) {
      Alert.alert('오류', '삭제할 프로그램 ID가 없습니다.');
      return;
    }

    Alert.alert('삭제 확인', '정말로 이 투어 프로그램을 삭제하시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          // axios 호출 대신 메인으로 이동
          Alert.alert('성공', '투어 프로그램이 삭제되었습니다.', [
            {
              text: '확인',
              onPress: () => navigation.navigate('Main'),
            },
          ]);
          /*
            try {
              const response = await axios.delete(
                `http://124.60.137.10:80/api/tour-program/${tourProgramId}`,
              );
              
              if (response.status === 200) {
                Alert.alert('성공', '투어 프로그램이 삭제되었습니다.', [
                  {
                    text: '확인',
                    onPress: () => navigation.navigate('Main'),
                  },
                ]);
              }
            } catch (error) {
              console.error('삭제 에러:', error);
              Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
            }
            */
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← 메인으로</Text>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.buttonText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>투어 프로그램 데이터 테스트</Text>

      {data ? (
        <View style={styles.dataContainer}>
          <Text style={styles.label}>제목: {data.title}</Text>
          <Text style={styles.label}>설명: {data.description}</Text>
          <Text style={styles.label}>가격: {data.guidePrice}원</Text>
          <Text style={styles.label}>지역: {data.region}</Text>
          <Text style={styles.label}>해시태그: {data.hashtags.join(', ')}</Text>

          <Text style={styles.sectionTitle}>일정:</Text>
          {data.schedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text>Day {schedule.day}</Text>
              <Text>장소: {schedule.placeName}</Text>
              <Text>설명: {schedule.placeDescription}</Text>
              <Text>위도: {schedule.lat}</Text>
              <Text>경도: {schedule.lon}</Text>
              <Text>소요시간: {schedule.travelTime}분</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noData}>데이터가 없습니다.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0288d1',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#0288d1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dataContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  scheduleItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  noData: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});

export default TestPost;
