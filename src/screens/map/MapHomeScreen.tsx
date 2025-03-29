import React from 'react';
import {SafeAreaView,StyleSheet,Text, Button} from 'react-native';
import useAuth from '../../hooks/queries/useAuth';




function MapHomeScreen() {
  const {logoutMutation} = useAuth();

  
  return (
    <SafeAreaView>
      <Text>맵 스크린</Text>
      <Button title="로그아웃" onPress={()=> logoutMutation.mutate(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

export default MapHomeScreen;