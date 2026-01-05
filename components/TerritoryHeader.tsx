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
    </View>
  );
};

export default TerritoryHeader;
