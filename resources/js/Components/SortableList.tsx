import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '@/Components/Icon';
import { ReactNode } from 'react';

/* ── SortableItem ── */
interface SortableItemProps {
    id: string | number;
    children: ReactNode;
    showHandle?: boolean;
}

export function SortableItem({ id, children, showHandle = true }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            {showHandle && (
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 touch-none"
                    title="Drag to reorder"
                >
                    <Icon name="bars-3" className="w-4 h-4" />
                </button>
            )}
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}

/* ── SortableList ── */
interface SortableListProps {
    items: { id: string | number }[];
    onReorder: (activeId: string | number, overId: string | number) => void;
    children: ReactNode;
    className?: string;
}

export default function SortableList({ items, onReorder, children, className = '' }: SortableListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorder(active.id, over.id);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className={className}>{children}</div>
            </SortableContext>
        </DndContext>
    );
}
