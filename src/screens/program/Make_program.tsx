import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Button, Image, ScrollView, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
// import MapView, { Marker } from 'react-native-maps';

interface DayPlan {
  place: string;
  memo: string;
}

interface DaySchedule {
  plans: DayPlan[];
}

function Make_program() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<DaySchedule[]>([{ plans: [] }]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [plan, setPlan] = useState<DayPlan>({ place: '', memo: '' });

  // 썸네일(사진) 추가
  const handlePickThumbnail = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        selectionLimit: 1,
      });

      if (result.assets && result.assets[0]?.uri) {
        setThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  // Day 추가
  const addDay = () => {
    setDays([...days, { plans: [] }]);
  };

  // Day별 일정 추가
  const addPlan = (dayIdx: number) => {
    if (!plan.place) return;
    const newDays = [...days];
    newDays[dayIdx].plans.push({ ...plan });
    setDays(newDays);
    setPlan({ place: '', memo: '' });
  };

  // Day별 일정 삭제
  const removePlan = (dayIdx: number, planIdx: number) => {
    const newDays = [...days];
    newDays[dayIdx].plans.splice(planIdx, 1);
    setDays(newDays);
  };

  // 게시하기
  const handleSave = () => {
    // TODO: 저장/게시 로직
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 상단: 썸네일 + 제목/소개 */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.thumbnailBox} onPress={handlePickThumbnail}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnailImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailText}>사진추가</Text>
              <Text style={styles.thumbnailSubText}>클릭하여 선택</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.titleBox}>
          <TextInput
            style={styles.titleInput}
            placeholder="제목"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.descInput}
            placeholder="소개"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </View>

      {/* 지도 */}
      {/*
      <View style={styles.mapBox}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <Marker coordinate={region} />
        </MapView>
      </View>
      */}

      {/* Day별 일정 */}
      {days.map((day, idx) => (
        <View key={idx} style={styles.dayBox}>
          <Text style={styles.dayTitle}>Day {idx + 1}</Text>
          {day.plans.map((p, pIdx) => (
            <View key={pIdx} style={styles.planItem}>
              <Text style={{ flex: 1 }}>{p.place} {p.memo ? `- ${p.memo}` : ''}</Text>
              <TouchableOpacity onPress={() => removePlan(idx, pIdx)}>
                <Text style={{ color: 'red' }}>삭제</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.planInputRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="장소"
              value={selectedDay === idx ? plan.place : ''}
              onChangeText={text => {
                setSelectedDay(idx);
                setPlan(p => ({ ...p, place: text }));
              }}
            />
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="메모"
              value={selectedDay === idx ? plan.memo : ''}
              onChangeText={text => {
                setSelectedDay(idx);
                setPlan(p => ({ ...p, memo: text }));
              }}
            />
            <Button title="추가" onPress={() => addPlan(idx)} />
          </View>
        </View>
      ))}
      <Button title="일정 추가" onPress={addDay} />
      <View style={{ height: 20 }} />
      <Button title="게시하기" onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  thumbnailBox: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 4,
  },
  thumbnailSubText: {
    color: '#999',
    fontSize: 12,
  },
  titleBox: {
    flex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    padding: 4,
  },
  descInput: {
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  mapBox: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  dayBox: {
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  planInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginRight: 5,
    fontSize: 15,
  },
});

export default Make_program;