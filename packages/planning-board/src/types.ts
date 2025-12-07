// src/types.ts - Planning Board Component Types

export interface SubTask {
  id: number;
  title: string;
  status: string; // "To-Do" | "In Progress" | "Done"
  
  // Planning Board: Version tracking
  createdAt?: number; // Timestamp when subtask was created
  addedAfterPlanning?: boolean; // Was this added after initial planning?
}

export interface TaskData {
  // Core task fields (existing)
  id: number;
  title: string;
  color: string;
  startDate: string;
  dueDate: string;
  status: string; // "Not Started" | "In Progress" | "Completed"
  notes: string;
  subTasks: SubTask[];
  isReady: boolean;
  markedReadyAt?: number;
  
  // Planning Board: Position & Canvas Data (optional)
  planningPosition?: {
    x: number; // X coordinate on canvas
    y: number; // Y coordinate on canvas
  };
  
  // Planning Board: Version Tracking (optional)
  addedToPlanningAt?: number; // Timestamp when first added to planning board
  originalSubTaskCount?: number; // How many subtasks existed when added to board
  planningSnapshot?: {
    // Snapshot of task state when added to planning board
    subTaskIds: number[]; // IDs of subtasks that were "original"
    notes: string; // Original notes
  };
}

// Planning Board: Shape/Arrow types
export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'diamond';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  label: string;
  description?: string;
  // Track tasks contained in this shape
  containedTaskIds: number[];
}

export interface Arrow {
  id: string;
  fromShapeId: string;
  toShapeId: string;
  color: string;
  label?: string;
}

// Planning Board: Canvas State
export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  selectedItemId: string | number | null;
  selectedItemType: 'task' | 'shape' | 'arrow' | null;
}

// Planning Board: Component Config
export interface PlanningBoardConfig {
  canvasWidth?: number;
  canvasHeight?: number;
  gridSize?: number;
  enableGrid?: boolean;
  minZoom?: number;
  maxZoom?: number;
}