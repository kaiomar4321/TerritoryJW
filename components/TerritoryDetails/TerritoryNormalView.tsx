import React from 'react';
import { MotiView } from 'moti';
import TerritoryHeader from '../TerritoryHeader';
import { VisitDateSection } from '../VisitDateSection';
import VisitNote from './VisitNote';
import TerritoryActionsHeader from './TerritoryActionsHeader';
import { Territory } from '~/types/Territory';

type Props = {
  territory: Territory;
  form: any;
  isVisitActive: boolean;
  startDisabled: boolean;
  endDisabled: boolean;
  showStartPicker: boolean;
  showEndPicker: boolean;
  setShowStartPicker: (val: boolean) => void;
  setShowEndPicker: (val: boolean) => void;
  onStartVisit: () => void;
  onEndVisit: () => void;
  onSaveNote: () => void;
  onChangeForm: (key: any, value: any) => void;
  onClose: () => void;
  onEdit: () => void;
  onAddHouse: () => void;
};

const TerritoryNormalView: React.FC<Props> = ({
  territory,
  form,
  isVisitActive,
  startDisabled,
  endDisabled,
  showStartPicker,
  showEndPicker,
  setShowStartPicker,
  setShowEndPicker,
  onStartVisit,
  onEndVisit,
  onSaveNote,
  onChangeForm,
  onClose,
  onEdit,
  onAddHouse,
}) => {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: 50 }}
      transition={{ type: 'timing', duration: 250 }}>
      {/* Header con botones */}
      <TerritoryActionsHeader onAddHouse={onAddHouse} onEdit={onEdit} onClose={onClose} />

      {/* Encabezado */}
      <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
        <TerritoryHeader territory={territory} isVisit={isVisitActive} />
      </MotiView>

      {/* Fechas de visita */}
      <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }}>
        <VisitDateSection
          form={form}
          isVisitActive={isVisitActive}
          startDisabled={startDisabled}
          endDisabled={endDisabled}
          showStartPicker={showStartPicker}
          showEndPicker={showEndPicker}
          setShowStartPicker={setShowStartPicker}
          setShowEndPicker={setShowEndPicker}
          onStart={onStartVisit}
          onEnd={onEndVisit}
          setForm={() => {}}
        />
      </MotiView>

      {/* Nota de visita */}
      {isVisitActive && (
        <VisitNote
          note={form.note}
          onChangeNote={(t: string) => onChangeForm('note', t)}
          onSave={onSaveNote}
        />
      )}
    </MotiView>
  );
};

export default TerritoryNormalView;
