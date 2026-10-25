// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { Plus, Trash2, Undo2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { SlideRenderer } from "./SlideRenderer";
import type { Slide, AspectRatio } from "@/types/carousel";
import { DIMENSIONS, MAX_SLIDES } from "@/types/carousel";
import { cn } from "@/lib/utils";

interface SlideFilmstripProps {
  slides: Slide[];
  aspectRatio: AspectRatio;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onDeleteSlide?: (slideId: string) => void;
  onUndoSlide?: (slideId: string) => void;
  onAddSlideRequest?: () => void;
  onReorderSlides?: (slideIds: string[]) => void;
  isGenerating?: boolean;
}

function SortableSlideThumb({
  slide,
  index,
  isActive,
  thumbWidth,
  thumbHeight,
  aspectRatio,
  onSelect,
  onDelete,
  onUndo,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  thumbWidth: number;
  thumbHeight: number;
  aspectRatio: AspectRatio;
  onSelect: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("oc-enter-pop relative group shrink-0", isDragging && "!opacity-50")}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      <button
        onClick={onSelect}
        className={cn(
          "oc-press block rounded-lg overflow-hidden transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] border-2",
          isActive
            ? "border-accent shadow-md ring-2 ring-accent/20"
            : "border-border hover:border-muted-foreground/50"
        )}
        style={{ width: thumbWidth, height: thumbHeight }}
        aria-label={`Select slide ${index + 1}`}
      >
        <SlideRenderer
          html={slide.html}
          aspectRatio={aspectRatio}
          className="w-full h-full"
        />
      </button>

      {/* Hover actions */}
      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onUndo && slide.previousVersions.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 bg-white shadow-sm border border-border rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            aria-label="Undo last change"
          >
            <Undo2 className="h-2.5 w-2.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 bg-white shadow-sm border border-border rounded-full text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete slide ${index + 1}`}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>

      {/* Slide number */}
      <div className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/60 rounded px-1 py-0.5 leading-none">
        {index + 1}
      </div>
    </div>
  );
}

export function SlideFilmstrip({
  slides,
  aspectRatio,
  activeIndex,
  onActiveChange,
  onDeleteSlide,
  onUndoSlide,
  onAddSlideRequest,
  onReorderSlides,
  isGenerating,
}: SlideFilmstripProps) {
  const { width: slideW, height: slideH } = DIMENSIONS[aspectRatio];
  const thumbHeight = 80;
  const thumbWidth = Math.round(thumbHeight * (slideW / slideH));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Build new order
    const newSlides = [...slides];
    const [moved] = newSlides.splice(oldIndex, 1);
    newSlides.splice(newIndex, 0, moved);

    onReorderSlides?.(newSlides.map((s) => s.id));

    // Update active index to follow the selected slide
    if (activeIndex === oldIndex) {
      onActiveChange(newIndex);
    } else if (activeIndex > oldIndex && activeIndex <= newIndex) {
      onActiveChange(activeIndex - 1);
    } else if (activeIndex < oldIndex && activeIndex >= newIndex) {
      onActiveChange(activeIndex + 1);
    }
  };

  return (
    <div className="border-t border-border bg-surface shrink-0">
      <div className="h-28 flex items-center gap-3 px-4 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            {slides.map((slide, index) => (
              <SortableSlideThumb
                key={slide.id}
                slide={slide}
                index={index}
                isActive={index === activeIndex}
                thumbWidth={thumbWidth}
                thumbHeight={thumbHeight}
                aspectRatio={aspectRatio}
                onSelect={() => onActiveChange(index)}
                onDelete={onDeleteSlide ? () => onDeleteSlide(slide.id) : undefined}
                onUndo={onUndoSlide ? () => onUndoSlide(slide.id) : undefined}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isGenerating && (
          <div
            className="shrink-0 rounded-lg border-2 border-dashed border-accent/50 flex items-center justify-center bg-accent/5"
            style={{ width: thumbWidth, height: thumbHeight }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-[8px] text-accent font-medium">Creating</span>
            </div>
          </div>
        )}

        {slides.length < MAX_SLIDES && !isGenerating && (
          <button
            onClick={onAddSlideRequest}
            className="shrink-0 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors cursor-pointer"
            style={{ width: thumbWidth, height: thumbHeight }}
            aria-label="Add slide via AI"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
