import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localClient } from '@/api/localClient';
import RoutineWeekTable from '@/components/routines/RoutineWeekTable';
import RoutineInputPanel from '@/components/routines/RoutineInputPanel';

export default function Routines() {
  const queryClient = useQueryClient();
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [previewRoutine, setPreviewRoutine] = useState(null);

  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: () => localClient.entities.Routine.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => localClient.entities.Routine.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routines'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => localClient.entities.Routine.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      setEditingRoutine(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => localClient.entities.Routine.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      if (editingRoutine) setEditingRoutine(null);
    },
  });

  return (
    <div className="h-full flex gap-5 p-6 overflow-hidden">
      {/* Week table */}
      <div className="flex-1 min-w-0">
        <RoutineWeekTable
          routines={routines}
          previewRoutine={previewRoutine}
          onSelectRoutine={setEditingRoutine}
          onDeleteRoutine={(id) => deleteMutation.mutate(id)}
          selectedRoutineId={editingRoutine?.id}
        />
      </div>

      {/* Input panel */}
      <div className="w-[300px] shrink-0">
        <RoutineInputPanel
          onAdd={(data) => createMutation.mutate(data)}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          editingRoutine={editingRoutine}
          onCancelEdit={() => setEditingRoutine(null)}
          onPreviewChange={setPreviewRoutine}
        />
      </div>
    </div>
  );
}