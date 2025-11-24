<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TaskData, PlanningBoardConfig, CanvasState } from './types';
  import TaskEditModal from './TaskEditModal.svelte';

  // Props
  export let tasks: TaskData[] = [];
  export let config: PlanningBoardConfig = {};

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    update: { tasks: TaskData[] };
    error: { message: string };
  }>();

  // Default config
  const defaultConfig: Required<PlanningBoardConfig> = {
    canvasWidth: 3000,
    canvasHeight: 2000,
    gridSize: 20,
    enableGrid: true,
    minZoom: 0.1,
    maxZoom: 3
  };
  const cfg = { ...defaultConfig, ...config };

  // Canvas state
  let canvasState: CanvasState = {
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedItemId: null,
    selectedItemType: null
  };

  // Drag state
  let isDragging = false;
  let isPanning = false;
  let draggedTaskId: number | null = null;
  let dragOffset = { x: 0, y: 0 };
  let panStart = { x: 0, y: 0 };

  // SVG element reference
  let svgElement: SVGSVGElement;

  // Modal state
  let isModalOpen = false;
  let selectedTaskForEdit: TaskData | null = null;

  // Task box dimensions
  const TASK_WIDTH = 200;
  const TASK_HEIGHT = 120;

  // Initialize task positions if they don't have them
  $: {
    tasks.forEach((task, index) => {
      if (!task.planningPosition) {
        task.planningPosition = {
          x: 100 + (index % 5) * 250,
          y: 100 + Math.floor(index / 5) * 180
        };
      }
    });
  }

  // Get screen coordinates from SVG coordinates
  function screenToSVG(screenX: number, screenY: number): { x: number; y: number } {
    if (!svgElement) return { x: 0, y: 0 };
    const pt = svgElement.createSVGPoint();
    pt.x = screenX;
    pt.y = screenY;
    const svgPt = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  // Mouse wheel zoom
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(
      cfg.maxZoom,
      Math.max(cfg.minZoom, canvasState.zoom + delta)
    );
    canvasState.zoom = newZoom;
  }

  // Middle mouse button pan start
  function handleMouseDown(e: MouseEvent) {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
      isPanning = true;
      panStart = { x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y };
    }
  }

  // Mouse move - handle panning and dragging
  function handleMouseMove(e: MouseEvent) {
    if (isPanning) {
      canvasState.pan.x = e.clientX - panStart.x;
      canvasState.pan.y = e.clientY - panStart.y;
    } else if (isDragging && draggedTaskId !== null) {
      const svgCoords = screenToSVG(e.clientX, e.clientY);
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.planningPosition) {
        task.planningPosition.x = svgCoords.x - dragOffset.x;
        task.planningPosition.y = svgCoords.y - dragOffset.y;
        tasks = tasks; // Trigger reactivity
      }
    }
  }

  // Mouse up - end panning or dragging
  function handleMouseUp(e: MouseEvent) {
    if (isPanning) {
      isPanning = false;
    } else if (isDragging) {
      isDragging = false;
      draggedTaskId = null;
      // Emit update event
      dispatch('update', { tasks });
    }
  }

  // Start dragging a task
  function startDragTask(e: MouseEvent, taskId: number) {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    isDragging = true;
    draggedTaskId = taskId;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.planningPosition) {
      const svgCoords = screenToSVG(e.clientX, e.clientY);
      dragOffset.x = svgCoords.x - task.planningPosition.x;
      dragOffset.y = svgCoords.y - task.planningPosition.y;
    }
  }

  // Select a task
  function selectTask(taskId: number) {
    canvasState.selectedItemId = taskId;
    canvasState.selectedItemType = 'task';
  }

  // Double click to edit task
  function handleTaskDoubleClick(taskId: number) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      selectedTaskForEdit = task;
      isModalOpen = true;
    }
  }

  // Handle modal close
  function handleModalClose() {
    isModalOpen = false;
    selectedTaskForEdit = null;
  }

  // Handle task update from modal
  function handleTaskUpdate(event: CustomEvent<{ task: TaskData }>) {
    const updatedTask = event.detail.task;
    tasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    dispatch('update', { tasks });
  }

  // Calculate viewBox for zoom and pan
  $: viewBox = `${-canvasState.pan.x / canvasState.zoom} ${-canvasState.pan.y / canvasState.zoom} ${cfg.canvasWidth / canvasState.zoom} ${cfg.canvasHeight / canvasState.zoom}`;

  // Calculate task progress (original vs new subtasks)
  function getTaskProgress(task: TaskData) {
    const total = task.subTasks.length;
    if (total === 0) return { originalComplete: 0, newComplete: 0, totalComplete: 0, originalPercent: 0, newPercent: 0 };

    const originalSubtasks = task.subTasks.filter(st => !st.addedAfterPlanning);
    const newSubtasks = task.subTasks.filter(st => st.addedAfterPlanning);

    const originalComplete = originalSubtasks.filter(st => st.status === 'Done').length;
    const newComplete = newSubtasks.filter(st => st.status === 'Done').length;
    const totalComplete = originalComplete + newComplete;

    const originalPercent = (originalComplete / total) * 100;
    const newPercent = (newComplete / total) * 100;

    return { originalComplete, newComplete, totalComplete, originalPercent, newPercent, total };
  }

  // Calculate global progress across all tasks
  $: globalProgress = (() => {
    let totalOriginalSubtasks = 0;
    let totalNewSubtasks = 0;
    let completedOriginalSubtasks = 0;
    let completedNewSubtasks = 0;

    tasks.forEach(task => {
      task.subTasks.forEach(st => {
        if (st.addedAfterPlanning) {
          totalNewSubtasks++;
          if (st.status === 'Done') completedNewSubtasks++;
        } else {
          totalOriginalSubtasks++;
          if (st.status === 'Done') completedOriginalSubtasks++;
        }
      });
    });

    const totalSubtasks = totalOriginalSubtasks + totalNewSubtasks;
    const totalCompleted = completedOriginalSubtasks + completedNewSubtasks;

    const originalPercent = totalSubtasks > 0 ? (completedOriginalSubtasks / totalSubtasks) * 100 : 0;
    const newPercent = totalSubtasks > 0 ? (completedNewSubtasks / totalSubtasks) * 100 : 0;
    const totalPercent = totalSubtasks > 0 ? (totalCompleted / totalSubtasks) * 100 : 0;

    return {
      originalPercent,
      newPercent,
      totalPercent,
      totalSubtasks,
      completedOriginalSubtasks,
      completedNewSubtasks,
      totalCompleted
    };
  })();
</script>

<div class="planning-board-container">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-section">
      <h3>Planning Board</h3>
      <span class="task-count">{tasks.length} tasks</span>
      <span class="ready-count">{tasks.filter(t => t.isReady).length} ready</span>
    </div>
    <div class="toolbar-section">
      <button class="tool-btn" on:click={() => canvasState.zoom = 1}>Reset Zoom</button>
      <button class="tool-btn" on:click={() => canvasState.pan = { x: 0, y: 0 }}>Reset Pan</button>
      <span class="zoom-indicator">Zoom: {(canvasState.zoom * 100).toFixed(0)}%</span>
    </div>
  </div>

  <!-- Global Progress Bar -->
  <div class="global-progress-container">
    <div class="global-progress-bar">
      <!-- Original subtasks (green) -->
      <div 
        class="progress-segment progress-original"
        style="width: {globalProgress.originalPercent}%"
      ></div>
      <!-- New subtasks (orange) -->
      <div 
        class="progress-segment progress-new"
        style="width: {globalProgress.newPercent}%"
      ></div>
    </div>
    <div class="global-progress-label">
      Overall Progress: {globalProgress.totalCompleted}/{globalProgress.totalSubtasks} subtasks 
      ({globalProgress.totalPercent.toFixed(0)}%)
      <span class="progress-breakdown">
        • {globalProgress.completedOriginalSubtasks} original 
        • {globalProgress.completedNewSubtasks} new
      </span>
    </div>
  </div>

  <!-- Canvas -->
  <div 
    class="canvas-wrapper"
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
  >
    <svg
      bind:this={svgElement}
      width="100%"
      height="100%"
      viewBox={viewBox}
      class="planning-canvas"
    >
      <!-- Grid (optional) -->
      {#if cfg.enableGrid}
        <defs>
          <pattern id="grid" width={cfg.gridSize} height={cfg.gridSize} patternUnits="userSpaceOnUse">
            <path d="M {cfg.gridSize} 0 L 0 0 0 {cfg.gridSize}" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width={cfg.canvasWidth} height={cfg.canvasHeight} fill="url(#grid)" />
      {/if}

      <!-- Tasks -->
      {#each tasks as task (task.id)}
        {#if task.planningPosition}
          {@const progress = getTaskProgress(task)}
          <g
            class="task-box"
            class:selected={canvasState.selectedItemId === task.id}
            class:is-ready={task.isReady}
            transform="translate({task.planningPosition.x}, {task.planningPosition.y})"
            on:mousedown={(e) => startDragTask(e, task.id)}
            on:click={() => selectTask(task.id)}
            on:dblclick={() => handleTaskDoubleClick(task.id)}
          >
            <!-- Task background -->
            <rect
              width={TASK_WIDTH}
              height={TASK_HEIGHT}
              fill="white"
              stroke={task.color}
              stroke-width="3"
              rx="8"
              class="task-bg"
            />

            <!-- Ready indicator badge -->
            {#if task.isReady}
              <circle
                cx={TASK_WIDTH - 15}
                cy="15"
                r="12"
                fill="#10b981"
                class="ready-badge"
              />
              <text
                x={TASK_WIDTH - 15}
                y="19"
                text-anchor="middle"
                class="ready-checkmark"
                fill="white"
              >
                ✓
              </text>
            {/if}
            
            <!-- Color strip -->
            <rect
              width={TASK_WIDTH}
              height="8"
              fill={task.color}
              rx="8"
              ry="0"
            />

            <!-- Task title -->
            <text
              x={TASK_WIDTH / 2}
              y="30"
              text-anchor="middle"
              class="task-title"
            >
              {task.title}
            </text>

            <!-- Progress bar -->
            {#if task.subTasks.length > 0}
              <g transform="translate(10, 40)">
                <!-- Background bar -->
                <rect
                  width={TASK_WIDTH - 20}
                  height="12"
                  fill="#e5e7eb"
                  rx="6"
                />
                <!-- Original subtasks progress (green) -->
                {#if progress.originalPercent > 0}
                  <rect
                    width={(TASK_WIDTH - 20) * (progress.originalPercent / 100)}
                    height="12"
                    fill="#10b981"
                    rx="6"
                  />
                {/if}
                <!-- New subtasks progress (orange) -->
                {#if progress.newPercent > 0}
                  <rect
                    x={(TASK_WIDTH - 20) * (progress.originalPercent / 100)}
                    width={(TASK_WIDTH - 20) * (progress.newPercent / 100)}
                    height="12"
                    fill="#f59e0b"
                    rx="6"
                  />
                {/if}
                <!-- Progress text -->
                <text
                  x={(TASK_WIDTH - 20) / 2}
                  y="9"
                  text-anchor="middle"
                  class="progress-text"
                  fill="#374151"
                >
                  {progress.totalComplete}/{progress.total}
                </text>
              </g>
            {/if}

            <!-- Status -->
            <text
              x="10"
              y="70"
              class="task-info"
            >
              Status: {task.status}
            </text>

            <!-- Dates -->
            {#if task.startDate || task.dueDate}
              <text
                x="10"
                y="90"
                class="task-info"
              >
                {task.startDate || '—'} → {task.dueDate || '—'}
              </text>
            {/if}

            <!-- Subtask count -->
            {#if task.subTasks.length > 0}
              <text
                x="10"
                y="110"
                class="task-info"
              >
                📋 {task.subTasks.length} subtasks ({((progress.totalComplete / progress.total) * 100).toFixed(0)}%)
              </text>
            {/if}
          </g>
        {/if}
      {/each}
    </svg>
  </div>

  <!-- Instructions -->
  <div class="instructions">
    <p><strong>Controls:</strong></p>
    <ul>
      <li>🖱️ Middle mouse + drag: Pan canvas</li>
      <li>🔍 Mouse wheel: Zoom in/out</li>
      <li>👆 Left click + drag: Move task</li>
      <li>👆👆 Double click: Edit task & subtasks</li>
    </ul>
  </div>

  <!-- Task Edit Modal -->
  {#if isModalOpen && selectedTaskForEdit}
    <TaskEditModal 
      task={selectedTaskForEdit}
      isOpen={isModalOpen}
      on:close={handleModalClose}
      on:update={handleTaskUpdate}
    />
  {/if}
</div>

<style>
  .planning-board-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-bottom: 2px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toolbar h3 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }

  .task-count {
    background: #90EE90;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .ready-count {
    background: #10b981;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .tool-btn {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }

  .tool-btn:hover {
    background: #45a049;
  }

  .zoom-indicator {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
  }

  .canvas-wrapper {
    flex: 1;
    overflow: hidden;
    cursor: grab;
    background: white;
  }

  .canvas-wrapper:active {
    cursor: grabbing;
  }

  .planning-canvas {
    display: block;
  }

  .task-box {
    cursor: move;
    transition: filter 0.2s;
  }

  .task-box:hover {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }

  .task-box.is-ready .task-bg {
    filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.4));
  }

  .task-box.selected .task-bg {
    stroke-width: 5;
    filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.5));
  }

  .task-title {
    font-size: 16px;
    font-weight: 600;
    fill: #333;
  }

  .task-info {
    font-size: 12px;
    fill: #666;
  }

  .progress-text {
    font-size: 9px;
    font-weight: 600;
    pointer-events: none;
  }

  .ready-badge {
    filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4));
  }

  .ready-checkmark {
    font-size: 14px;
    font-weight: bold;
    pointer-events: none;
  }

  .global-progress-container {
    background: white;
    border-bottom: 2px solid #e0e0e0;
    padding: 0.75rem 1rem;
    position: relative;
    transition: opacity 0.3s;
    opacity: 0.4;
  }

  .global-progress-container:hover {
    opacity: 1;
  }

  .global-progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    margin-bottom: 0.5rem;
  }

  .progress-segment {
    height: 100%;
    transition: width 0.3s ease;
  }

  .progress-original {
    background: #10b981;
  }

  .progress-new {
    background: #f59e0b;
  }

  .global-progress-label {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-breakdown {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: normal;
  }

  .instructions {
    padding: 1rem;
    background: #333;
    color: white;
    font-size: 0.875rem;
  }

  .instructions p {
    margin: 0 0 0.5rem 0;
  }

  .instructions ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .instructions li {
    margin: 0.25rem 0;
  }
</style>