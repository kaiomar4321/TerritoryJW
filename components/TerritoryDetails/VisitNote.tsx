import React from 'react';
import { TextInput } from 'react-native';
import { MotiView } from 'moti';
import { CustomButton } from 'components/CustomButton';
import { styles } from '../styles';
import ThemedText from '../ThemedText';

type Props = {
  note: string;
  onChangeNote: (text: string) => void;
  onSave: () => void;
};

const VisitNote: React.FC<Props> = ({ note, onChangeNote, onSave }) => {
  return (
    <MotiView
      className={styles.containerCard}
      from={{ opacity: 0, scale: 0.8, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      exit={{ opacity: 0, scale: 0.8, translateY: -20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
      <ThemedText className="mb-1 mt-2.5 text-sm text-gray-600">Nota de la visita</ThemedText>
      <TextInput
        value={note}
        onChangeText={onChangeNote}
        placeholder="Agregar nota..."
        className={styles.noteInput}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <CustomButton
        text="Guardar nota"
        onPress={onSave}
        variant="primary"
        className="mt-2 bg-cyan-500"
      />
    </MotiView>
  );
};

export default VisitNote;
