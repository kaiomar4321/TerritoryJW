import { Text, View } from 'react-native';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Territory } from '~/types/Territory';

type Props = {
  territory: Territory;
  isVisit: boolean;
};

const TerritoryHeader: React.FC<Props> = ({ territory, isVisit }) => {
  return (
    <View className=" flex flex-col items-center justify-between rounded-2xl bg-white p-3">
      <View className=" flex w-full flex-row justify-between">
        <Text className="text-xl leading-none">Territorio No: {territory.number}</Text>
      </View>
      <View className=" flex w-full flex-row">
        <View className="flex w-5/6   ">
          <Text className=" text-3xl font-bold   ">{territory.name}</Text>
          {isVisit ? <Text>Estado: Inconcluso</Text> : <Text>Estado: Finalizado</Text>}
        </View>
        {isVisit ? <Ionicons name="alert" size={50} color="orange" /> : <Ionicons name="checkmark-circle" size={50} color="green" />}
        
      </View>
    </View>
  );
};

export default TerritoryHeader;
