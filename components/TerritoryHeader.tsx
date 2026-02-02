import { Text, View } from 'react-native';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Territory } from '~/types/Territory';
import { styles } from './styles';
import ThemedText from './ThemedText';

type Props = {
  territory: Territory;
  isVisit: boolean;
};

const TerritoryHeader: React.FC<Props> = ({ territory, isVisit }) => {
  return (
    <View className={styles.containerCard}>
      <View className=" flex w-full flex-row justify-between">
        <ThemedText className="text-xl leading-none ">Territorio No: {territory.number}</ThemedText>
      </View>
      <View className=" flex w-full flex-row">
        <View className="flex w-5/6   ">
          <ThemedText className=" text-3xl font-bold   ">{territory.name}</ThemedText>
          {isVisit ? <ThemedText className=''>Estado: Inconcluso</ThemedText> : <ThemedText className=''>Estado: Finalizado</ThemedText>}
        </View>
        {isVisit ? <Ionicons name="alert" size={50} color="orange" /> : <Ionicons name="checkmark-circle" size={50} color="green" />}
        
      </View>

      {/* Badges para Parejas y Horas */}
      <View className=" flex flex-row gap-3">
        {/* Badge Parejas */}
        <View className="flex flex-row items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 dark:bg-blue-900">
          <Ionicons name="people" size={16} color="#2563eb" />
          <ThemedText className="text-sm font-semibold text-blue-700 dark:text-blue-200">
            {territory.couples || 0} parejas
          </ThemedText>
        </View>

        {/* Badge Horas */}
        <View className="flex flex-row items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 dark:bg-purple-900">
          <Ionicons name="time" size={16} color="#9333ea" />
          <ThemedText className="text-sm font-semibold text-purple-700 dark:text-purple-200">
            {territory.hours || 0}h
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

export default TerritoryHeader;
