"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type DropZoneProps = {
  dropDownValues: any[];
  handleSave: (data: any) => void;
  selectedRow: any;
};

const Draggable = ({ item }: { item: any }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: { type: "item" },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        cursor: "grabbing",
      }
    : { cursor: "grab" };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 mb-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm"
    >
      {item.name}
    </div>
  );
};

const Droppable = ({
  id,
  groupList,
}: {
  id: string;
  groupList: any[];
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { accepts: ["item"] },
  });

  const selectedGroupCount = groupList.filter(
    (item) => item.containerId === "Selected Group"
  ).length;

  const shouldDisableGroup = id === "Group" && selectedGroupCount === 1;

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 rounded-lg min-h-[200px] min-w-[250px] transition-colors ${
        isOver ? "bg-green-100 border-green-300" : "bg-gray-50 border-gray-200"
      }`}
      style={{
        pointerEvents: shouldDisableGroup ? "none" : "auto",
        opacity: shouldDisableGroup ? 0.3 : 1,
      }}
    >
      <h3 className="font-semibold text-gray-700 mb-4">
        {id} ({groupList.filter((item) => item.containerId === id).length})
      </h3>
      {groupList
        .filter((item) => item.containerId === id)
        .map((item) => (
          <Draggable key={item.id} item={item} />
        ))}
    </div>
  );
};

const DropZone = ({ dropDownValues, handleSave, selectedRow }: DropZoneProps) => {
  const containers = ["Group", "Selected Group"];
  const [selectedItem, setSelectedItem] = useState<any>({});
  const [initialGroupState, setInitialGroupState] = useState<any[]>([]);
  const [groupList, setGroupList] = useState<any[]>([]);

  useEffect(() => {
    setGroupList(dropDownValues);
    const initializedGroups = dropDownValues.map((item) => ({
      ...item,
      containerId: "Group",
    }));
    setInitialGroupState(initializedGroups);
  }, [dropDownValues]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    setGroupList((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, containerId: over.id } : item
      )
    );
  };

  useEffect(() => {
    const selectedGroups = groupList.filter(
      (item) => item.containerId === "Selected Group"
    );
    setSelectedItem(selectedGroups[0] || {});
  }, [groupList]);

  const handleReset = () => {
    setGroupList(initialGroupState);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Name</label>
        <input
          value={selectedRow?.TARGETNAME1 || ""}
          type="text"
          disabled
          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {containers.map((containerId) => (
            <div key={containerId}>
              <Droppable id={containerId} groupList={groupList} />
            </div>
          ))}
        </div>
      </DndContext>

      <div className="flex gap-4 mt-8 px-4 justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={JSON.stringify(groupList) === JSON.stringify(initialGroupState)}
        >
          Reset
        </Button>
        <Button
          onClick={() => handleSave({ ...selectedRow, ...selectedItem })}
          disabled={!groupList.some((item) => item.containerId === "Selected Group")}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default DropZone;
