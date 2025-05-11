import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TourByPreference = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>성향 테스트 페이지</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20 },
});

export default TourByPreference;