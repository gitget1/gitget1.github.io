import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MainHomeScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* 버튼 그룹 */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#2c3e50' }]}
            
          >
            <Text style={styles.buttonText}>성향 테스트</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#27ae60' }]}
         
          >
            <Text style={styles.buttonText}>나의 성향으로 관광 정하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#e67e22' }]}
    
          >
            <Text style={styles.buttonText}>지역설정으로 관광 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: '#c0392b' }]}
            
          >
            <Text style={styles.buttonText}>오늘의 관광 추천리스트</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'white',
  },
  buttonSpacer: {
    height: 20,
  },
  buttonContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
  customButton: {
    width: '45%',
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MainHomeScreen;
