import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { PersistentHeader } from '../../components/header/PersistentHeader';
import { StudentRepository, type Student } from '../../lib/repository';
import { formatFullDate } from '../../lib/dateUtils';
import { RELATIONSHIP_OPTIONS } from '../../components/people/RelationshipSelector';

const ACCENT_COLOR = '#c084fc'; // Purple for people

export default function PeopleIndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPeople = async () => {
    try {
      const allPeople = await StudentRepository.getAll();
      setPeople(allPeople);
    } catch (e) {
      console.error('Failed to load people', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPeople();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPeople();
  };

  const renderItem = ({ item }: { item: Student }) => (
    <TouchableOpacity
      onPress={() => router.push(`/people/${item.id}` as any)}
      className="bg-crescender-800/40 p-4 rounded-2xl mb-3 flex-row items-center border border-crescender-800"
    >
      <View className="w-16 h-16 bg-crescender-900/60 rounded-full justify-center items-center mr-4">
        <Feather name="user" size={24} color={ACCENT_COLOR} />
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.name}</Text>
          {item.relationship && (
            <View className="bg-gold/20 px-2 py-0.5 rounded-full">
              <Text className="text-gold text-xs font-medium">
                {RELATIONSHIP_OPTIONS.find(r => r.value === item.relationship)?.label || item.relationship}
              </Text>
            </View>
          )}
        </View>
        {item.instrument && (
          <Text className="text-crescender-400 text-sm mb-1" numberOfLines={1}>
            {item.instrument}
          </Text>
        )}
        {item.startedLessonsDate && (
          <Text className="text-crescender-500 text-xs">
            Started {formatFullDate(item.startedLessonsDate)}
          </Text>
        )}
      </View>
      
      <Feather name="chevron-right" size={16} color="#f5c518" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      ) : (
        <FlatList
          data={people}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View className="items-center py-20 px-6">
              <Feather name="users" size={48} color="#374151" />
              <Text className="text-crescender-400 mt-4 text-lg">No people yet</Text>
              <Text className="text-crescender-500 mt-2 text-sm text-center">
                Add a person to start tracking their learning journey
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/people/new')}
                className="bg-gold px-6 py-3 rounded-full mt-6 flex-row items-center gap-2"
              >
                <Feather name="plus" size={18} color="#000" />
                <Text className="text-black font-bold">Add Person</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            people.length > 0 ? (
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-2xl font-bold">People</Text>
                <TouchableOpacity
                  onPress={() => router.push('/people/new')}
                  className="bg-gold px-4 py-2 rounded-full flex-row items-center gap-2"
                >
                  <Feather name="plus" size={18} color="#000" />
                  <Text className="text-black font-bold">Add</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
