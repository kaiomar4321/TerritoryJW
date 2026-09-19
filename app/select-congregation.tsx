import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import ThemedText from 'components/ThemedText';
import { styles } from 'components/styles';
import { useUser } from '~/hooks/useUser';
import { useCongregation } from '~/hooks/useCongregation';

export default function SelectCongregation() {
  const router = useRouter();
  const { selectCongregation } = useUser();
  const { congregations, loading } = useCongregation();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSelect = async (congregationId: string) => {
    setSavingId(congregationId);
    try {
      await selectCongregation(congregationId);
      router.replace('/(tabs)/');
    } catch (error) {
      console.error('Error eligiendo congregación:', error);
      Alert.alert('Error', 'No se pudo guardar tu congregación. Intenta de nuevo.');
      setSavingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black2">
      <View className="flex-1 gap-8 p-6">
        <View>
          <ThemedText className={styles.loginTitle}>¿A qué congregación perteneces?</ThemedText>
          <Text className={`${styles.loginDescription} text-gray-600 dark:text-gray-400`}>
            Solo lo eliges una vez. Después ya no se puede cambiar.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#925ffa" />
        ) : (
          <View className="gap-3">
            {congregations.map((c) => (
              <TouchableOpacity
                key={c.id}
                disabled={savingId !== null}
                onPress={() => handleSelect(c.id)}
                className={`flex-row items-center justify-between rounded-md border border-gray-300 p-4 dark:border-gray-600 ${
                  savingId !== null && savingId !== c.id ? 'opacity-50' : ''
                }`}>
                <View className="flex-1 pr-3">
                  <ThemedText className="text-lg font-semibold">{c.name}</ThemedText>
                  {(c.city || c.state) && (
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {[c.city, c.state].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
                {savingId === c.id ? (
                  <ActivityIndicator color="#925ffa" />
                ) : (
                  <Ionicons name="chevron-forward" size={22} color="#925ffa" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
