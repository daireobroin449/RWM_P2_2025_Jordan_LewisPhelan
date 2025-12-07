<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TaskData, PlanningBoardConfig, CanvasState, Shape, Arrow } from './types';
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
  let draggedShapeId: string | null = null;
  let dragOffset = { x: 0, y: 0 };
  let panStart = { x: 0, y: 0 };
  let mouseDownPos = { x: 0, y: 0 };
  let hasMovedSinceMouseDown = false;

  // Shape editing
  let editingShapeId: string | null = null;
  let editingShapeLabel: string = '';
  let editingShapeDescription: string = ''
  let forceShapeModalUpdate = 0; // Force reactivity trigger

  // Reactive statement to debug modal rendering
  $: {
    console.log('Reactive: editingShapeId changed to:', editingShapeId);
    console.log('Reactive: forceShapeModalUpdate is:', forceShapeModalUpdate);
  }

  // Arrow editing
  let editingArrowId: string | null = null;

  // SVG element reference
  let svgElement: SVGSVGElement;

  // Modal state
  let isModalOpen = false;
  let selectedTaskForEdit: TaskData | null = null;

  // Shape and arrow state
  let shapes: Shape[] = [];
  let arrows: Arrow[] = [];
  let nextShapeId = 1;
  let nextArrowId = 1;

  // Tool state
  let activeTool: 'select' | 'arrow' = 'select';
  let arrowStartId: string | null = null;
  let arrowStartType: 'shape' | 'task' | null = null;

  // Dropdowns
  let showShapeDropdown = false;

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
    // Check if mouse has moved significantly
    const distMoved = Math.sqrt(
      Math.pow(e.clientX - mouseDownPos.x, 2) + 
      Math.pow(e.clientY - mouseDownPos.y, 2)
    );
    
    if (distMoved > 3) {
      hasMovedSinceMouseDown = true;
    }
    
    if (isPanning) {
      canvasState.pan.x = e.clientX - panStart.x;
      canvasState.pan.y = e.clientY - panStart.y;
    } else if (isDragging && draggedTaskId !== null && hasMovedSinceMouseDown) {
      const svgCoords = screenToSVG(e.clientX, e.clientY);
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.planningPosition) {
        task.planningPosition.x = svgCoords.x - dragOffset.x;
        task.planningPosition.y = svgCoords.y - dragOffset.y;
        tasks = tasks; // Trigger reactivity
        arrows = arrows; // Force arrow recalculation
      }
    } else if (isDragging && draggedShapeId !== null && hasMovedSinceMouseDown) {
      const svgCoords = screenToSVG(e.clientX, e.clientY);
      const shape = shapes.find(s => s.id === draggedShapeId);
      if (shape) {
        shape.position.x = svgCoords.x - dragOffset.x;
        shape.position.y = svgCoords.y - dragOffset.y;
        shapes = shapes; // Trigger reactivity
        arrows = arrows; // Force arrow recalculation
      }
    }
  }

  // Mouse up - end panning or dragging
  function handleMouseUp(e: MouseEvent) {
    if (isPanning) {
      isPanning = false;
    } else if (isDragging && draggedTaskId !== null) {
      isDragging = false;
      draggedTaskId = null;
      hasMovedSinceMouseDown = false;
      // Force arrow update
      tasks = tasks;
      arrows = arrows;
      // Emit update event
      dispatch('update', { tasks });
    } else if (isDragging && draggedShapeId !== null) {
      isDragging = false;
      draggedShapeId = null;
      hasMovedSinceMouseDown = false;
      // Force arrow update
      shapes = shapes;
      arrows = arrows;
    }
  }

  // Start dragging a task
  function startDragTask(e: MouseEvent, taskId: number) {
    if (e.button !== 0) return; // Only left click
    if (activeTool === 'arrow') return; // Don't drag in arrow mode
    e.stopPropagation();
    
    mouseDownPos = { x: e.clientX, y: e.clientY };
    hasMovedSinceMouseDown = false;
    isDragging = true;
    draggedTaskId = taskId;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.planningPosition) {
      const svgCoords = screenToSVG(e.clientX, e.clientY);
      dragOffset.x = svgCoords.x - task.planningPosition.x;
      dragOffset.y = svgCoords.y - task.planningPosition.y;
    }
  }

  // Start dragging a shape
  function startDragShape(e: MouseEvent, shapeId: string) {
    if (e.button !== 0) return; // Only left click
    if (activeTool === 'arrow') return; // Don't drag in arrow mode
    e.stopPropagation();
    
    mouseDownPos = { x: e.clientX, y: e.clientY };
    hasMovedSinceMouseDown = false;
    isDragging = true;
    draggedShapeId = shapeId;
    
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      const svgCoords = screenToSVG(e.clientX, e.clientY);
      dragOffset.x = svgCoords.x - shape.position.x;
      dragOffset.y = svgCoords.y - shape.position.y;
    }
  }

  // Double-click shape to edit label
  function handleShapeDoubleClick(shapeId: string) {
    editingShapeId = shapeId;
    const shape = shapes.find(s => s.id === shapeId);
    
    if (shape) {
      editingShapeId = shapeId;
      editingShapeLabel = shape.label;
      editingShapeDescription = shape.description || '';
      forceShapeModalUpdate++; // Force Svelte to detect change
    } else {
      console.log('Shape not found!');
    }
  }

  // Save shape label edit
  function saveShapeLabel() {
    console.log('Saving shape label');
    if (editingShapeId) {
      const shape = shapes.find(s => s.id === editingShapeId);
      if (shape) {
        shape.label = editingShapeLabel;
        shape.description = editingShapeDescription;
        shapes = shapes; // Trigger reactivity
      }
    }
    editingShapeId = null;
    editingShapeLabel = '';
    editingShapeDescription = '';
  }

  // Cancel shape label edit
  function cancelShapeEdit() {
    console.log('Canceling shape edit');
    editingShapeId = null;
    editingShapeLabel = '';
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

  // Add shape to canvas
  function addShape(type: 'rectangle' | 'circle' | 'diamond') {
    const newShape: Shape = {
      id: `shape-${nextShapeId++}`,
      type,
      position: { 
        x: 500 + Math.random() * 200, 
        y: 300 + Math.random() * 200 
      },
      size: { 
        width: type === 'circle' ? 150 : 200, 
        height: type === 'circle' ? 150 : 120 
      },
      color: '#9333ea',
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextShapeId - 1}`,
      description: '',
      containedTaskIds: []
    };
    shapes = [...shapes, newShape];
    showShapeDropdown = false;
  }

  // Start arrow creation
  function startArrowMode() {
    activeTool = 'arrow';
    arrowStartId = null;
    arrowStartType = null;
  }

  // Handle click on shape or task for arrow creation
  function handleItemClickForArrow(id: string | number, type: 'shape' | 'task') {
    if (activeTool !== 'arrow') return;

    const stringId = String(id);

    if (arrowStartId === null) {
      // First click - set start point
      arrowStartId = stringId;
      arrowStartType = type;
    } else {
      // Second click - create arrow
      if (arrowStartId !== stringId) { // Can't connect to self
        const newArrow: Arrow = {
          id: `arrow-${nextArrowId++}`,
          fromShapeId: arrowStartId,
          toShapeId: stringId,
          color: '#6366f1',
          label: ''
        };
        arrows = [...arrows, newArrow];
      }
      // Reset arrow mode
      activeTool = 'select';
      arrowStartId = null;
      arrowStartType = null;
    }
  }

  // Delete selected item
  function deleteSelectedItem() {
    if (canvasState.selectedItemType === 'shape' && canvasState.selectedItemId) {
      shapes = shapes.filter(s => s.id !== canvasState.selectedItemId);
      // Also delete arrows connected to this shape
      arrows = arrows.filter(a => 
        a.fromShapeId !== canvasState.selectedItemId && 
        a.toShapeId !== canvasState.selectedItemId
      );
    } else if (canvasState.selectedItemType === 'arrow' && canvasState.selectedItemId) {
      arrows = arrows.filter(a => a.id !== canvasState.selectedItemId);
    }
    canvasState.selectedItemId = null;
    canvasState.selectedItemType = null;
  }

  // Handle keyboard shortcuts
  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!isModalOpen) { // Don't delete when modal is open
        deleteSelectedItem();
      }
    }
  }

  // Get position for arrow endpoints (edge snapping)
  function getItemPosition(id: string): { x: number; y: number } {
    // Check if it's a task
    const task = tasks.find(t => String(t.id) === id);
    if (task && task.planningPosition) {
      return { 
        x: task.planningPosition.x + TASK_WIDTH / 2, 
        y: task.planningPosition.y + TASK_HEIGHT / 2 
      };
    }

    // Check if it's a shape
    const shape = shapes.find(s => s.id === id);
    if (shape) {
      return { 
        x: shape.position.x + shape.size.width / 2, 
        y: shape.position.y + shape.size.height / 2 
      };
    }

    return { x: 0, y: 0 };
  }

  // Get edge connection point (snaps to nearest edge)
  function getEdgeConnectionPoint(
    itemId: string, 
    targetId: string
  ): { x: number; y: number } {
    const itemCenter = getItemPosition(itemId);
    const targetCenter = getItemPosition(targetId);
    
    // Calculate angle between centers
    const dx = targetCenter.x - itemCenter.x;
    const dy = targetCenter.y - itemCenter.y;
    
    // Find the item
    const task = tasks.find(t => String(t.id) === itemId);
    const shape = shapes.find(s => s.id === itemId);
    
    if (task && task.planningPosition) {
      // Task edge snapping
      const left = task.planningPosition.x;
      const right = task.planningPosition.x + TASK_WIDTH;
      const top = task.planningPosition.y;
      const bottom = task.planningPosition.y + TASK_HEIGHT;
      
      // Determine which edge is closest to target
      const angle = Math.atan2(dy, dx);
      
      if (Math.abs(angle) < Math.PI / 4) {
        // Right edge
        return { x: right, y: itemCenter.y };
      } else if (Math.abs(angle) > (3 * Math.PI) / 4) {
        // Left edge
        return { x: left, y: itemCenter.y };
      } else if (angle > 0) {
        // Bottom edge
        return { x: itemCenter.x, y: bottom };
      } else {
        // Top edge
        return { x: itemCenter.x, y: top };
      }
    } else if (shape) {
      // Shape edge snapping
      const left = shape.position.x;
      const right = shape.position.x + shape.size.width;
      const top = shape.position.y;
      const bottom = shape.position.y + shape.size.height;
      const centerX = shape.position.x + shape.size.width / 2;
      const centerY = shape.position.y + shape.size.height / 2;
      
      if (shape.type === 'circle') {
        // For circles, calculate point on circumference
        const angle = Math.atan2(dy, dx);
        const radius = shape.size.width / 2;
        return {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      } else if (shape.type === 'diamond') {
        // For diamonds, use diamond edge points
        const angle = Math.atan2(dy, dx);
        if (Math.abs(angle) < Math.PI / 4) {
          return { x: right, y: centerY };
        } else if (Math.abs(angle) > (3 * Math.PI) / 4) {
          return { x: left, y: centerY };
        } else if (angle > 0) {
          return { x: centerX, y: bottom };
        } else {
          return { x: centerX, y: top };
        }
      } else {
        // Rectangle - same as task
        const angle = Math.atan2(dy, dx);
        if (Math.abs(angle) < Math.PI / 4) {
          return { x: right, y: centerY };
        } else if (Math.abs(angle) > (3 * Math.PI) / 4) {
          return { x: left, y: centerY };
        } else if (angle > 0) {
          return { x: centerX, y: bottom };
        } else {
          return { x: centerX, y: top };
        }
      }
    }
    
    return itemCenter;
  }

  // Toggle arrow old idea state
  function toggleArrowOldIdea(arrowId: string) {
    const arrow = arrows.find(a => a.id === arrowId);
    if (arrow) {
      arrow.isOldIdea = !arrow.isOldIdea;
      if (arrow.isOldIdea) {
        arrow.markedOldAt = Date.now();
        arrow.color = '#ef4444'; // Red for old ideas
      } else {
        arrow.color = '#6366f1'; // Blue for current ideas
      }
      arrows = arrows; // Trigger reactivity
    }
    editingArrowId = null;
  }

  // Double-click arrow to edit
  function handleArrowDoubleClick(arrowId: string) {
    editingArrowId = arrowId;
  }

  // Check if task is connected by old idea arrows
  function hasOldIdeaConnection(taskId: number): boolean {
    const stringId = String(taskId);
    return arrows.some(a => 
      a.isOldIdea && (a.fromShapeId === stringId || a.toShapeId === stringId)
    );
  }

  // Calculate viewBox for zoom and pan
  $: viewBox = `${-canvasState.pan.x / canvasState.zoom} ${-canvasState.pan.y / canvasState.zoom} ${cfg.canvasWidth / canvasState.zoom} ${cfg.canvasHeight / canvasState.zoom}`;

  // Force arrow recalculation when tasks or shapes move
  $: if (tasks || shapes) {
    // This reactive statement forces arrow endpoints to recalculate
    arrows = arrows;
  }

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

<div class="planning-board-container" on:keydown={handleKeyPress}>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-section">
      <h3>Planning Board</h3>
      <span class="task-count">{tasks.length} tasks</span>
      <span class="ready-count">{tasks.filter(t => t.isReady).length} ready</span>
    </div>
    
    <!-- Tools Section -->
    <div class="toolbar-section">
      <div class="dropdown-container">
        <button 
          class="tool-btn" 
          on:click={() => showShapeDropdown = !showShapeDropdown}
        >
          + Add Shape ▾
        </button>
        {#if showShapeDropdown}
          <div class="dropdown-menu">
            <button class="dropdown-item" on:click={() => addShape('rectangle')}>
              ▭ Rectangle
            </button>
            <button class="dropdown-item" on:click={() => addShape('circle')}>
              ● Circle
            </button>
            <button class="dropdown-item" on:click={() => addShape('diamond')}>
              ◆ Diamond
            </button>
          </div>
        {/if}
      </div>

      <button 
        class="tool-btn"
        class:active={activeTool === 'arrow'}
        on:click={startArrowMode}
        title="Click two items to connect them"
      >
        {#if activeTool === 'arrow'}
          ⚡ Connecting... (click 2 items)
        {:else}
          → Add Arrow
        {/if}
      </button>

      {#if canvasState.selectedItemId}
        <button class="tool-btn delete" on:click={deleteSelectedItem}>
          🗑️ Delete
        </button>
      {/if}
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
          <!-- Arrow markers -->
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#6366f1" />
          </marker>
          <marker
            id="arrowhead-red"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
        </defs>
        <rect width={cfg.canvasWidth} height={cfg.canvasHeight} fill="url(#grid)" />
      {/if}

      <!-- Arrows (drawn first, so they're behind shapes/tasks) -->
      {#each arrows as arrow (arrow.id)}
        {@const startPos = getEdgeConnectionPoint(arrow.fromShapeId, arrow.toShapeId)}
        {@const endPos = getEdgeConnectionPoint(arrow.toShapeId, arrow.fromShapeId)}
        <g 
          class="arrow"
          class:selected={canvasState.selectedItemId === arrow.id}
          class:old-idea={arrow.isOldIdea}
        >
          <!-- Invisible thick line for easier clicking -->
          <path
            d="M {startPos.x} {startPos.y} L {endPos.x} {endPos.y}"
            stroke="transparent"
            stroke-width="20"
            fill="none"
            class="arrow-hitbox"
            on:click={(e) => {
              e.stopPropagation();
              if (activeTool === 'select') {
                canvasState.selectedItemId = arrow.id;
                canvasState.selectedItemType = 'arrow';
              }
            }}
            on:dblclick={(e) => {
              e.stopPropagation();
              handleArrowDoubleClick(arrow.id);
            }}
          />
          <!-- Visible arrow line -->
          <path
            d="M {startPos.x} {startPos.y} L {endPos.x} {endPos.y}"
            stroke={arrow.isOldIdea ? '#ef4444' : arrow.color}
            stroke-width="3"
            fill="none"
            marker-end="url(#{arrow.isOldIdea ? 'arrowhead-red' : 'arrowhead'})"
            class="arrow-line"
            pointer-events="none"
          />
          {#if arrow.isOldIdea}
            <!-- Label for old idea -->
            <text
              x={(startPos.x + endPos.x) / 2}
              y={(startPos.y + endPos.y) / 2 - 10}
              text-anchor="middle"
              class="arrow-label"
              fill="#ef4444"
              pointer-events="none"
            >
              OLD
            </text>
          {/if}
        </g>
      {/each}

      <!-- Shapes -->
      {#each shapes as shape (shape.id)}
        <g
          class="shape-box"
          class:selected={canvasState.selectedItemId === shape.id}
          transform="translate({shape.position.x}, {shape.position.y})"
        >
          {#if shape.type === 'rectangle'}
            <rect
              width={shape.size.width}
              height={shape.size.height}
              fill={shape.color}
              fill-opacity="0.2"
              stroke={shape.color}
              stroke-width="3"
              rx="8"
              class="shape-element"
              on:mousedown={(e) => startDragShape(e, shape.id)}
              on:click={(e) => {
                e.stopPropagation();
                if (activeTool === 'arrow') {
                  handleItemClickForArrow(shape.id, 'shape');
                } else {
                  canvasState.selectedItemId = shape.id;
                  canvasState.selectedItemType = 'shape';
                }
              }}
              on:dblclick={(e) => {
                e.stopPropagation();
                if (!hasMovedSinceMouseDown) {
                  handleShapeDoubleClick(shape.id);
                }
              }}
            />
          {:else if shape.type === 'circle'}
            <circle
              cx={shape.size.width / 2}
              cy={shape.size.height / 2}
              r={shape.size.width / 2}
              fill={shape.color}
              fill-opacity="0.2"
              stroke={shape.color}
              stroke-width="3"
              class="shape-element"
              on:mousedown={(e) => startDragShape(e, shape.id)}
              on:click={(e) => {
                e.stopPropagation();
                if (activeTool === 'arrow') {
                  handleItemClickForArrow(shape.id, 'shape');
                } else {
                  canvasState.selectedItemId = shape.id;
                  canvasState.selectedItemType = 'shape';
                }
              }}
              on:dblclick={(e) => {
                e.stopPropagation();
                if (!hasMovedSinceMouseDown) {
                  handleShapeDoubleClick(shape.id);
                }
              }}
            />
          {:else if shape.type === 'diamond'}
            <path
              d="M {shape.size.width / 2} 0 L {shape.size.width} {shape.size.height / 2} L {shape.size.width / 2} {shape.size.height} L 0 {shape.size.height / 2} Z"
              fill={shape.color}
              fill-opacity="0.2"
              stroke={shape.color}
              stroke-width="3"
              class="shape-element"
              on:mousedown={(e) => startDragShape(e, shape.id)}
              on:click={(e) => {
                e.stopPropagation();
                if (activeTool === 'arrow') {
                  handleItemClickForArrow(shape.id, 'shape');
                } else {
                  canvasState.selectedItemId = shape.id;
                  canvasState.selectedItemType = 'shape';
                }
              }}
              on:dblclick={(e) => {
                e.stopPropagation();
                if (!hasMovedSinceMouseDown) {
                  handleShapeDoubleClick(shape.id);
                }
              }}
            />
          {/if}

          <!-- Shape label -->
          <text
            x={shape.size.width / 2}
            y={shape.size.height / 2}
            text-anchor="middle"
            dominant-baseline="middle"
            class="shape-label"
            fill={shape.color}
          >
            {shape.label}
          </text>
        </g>
      {/each}

      <!-- Tasks -->
      {#each tasks as task (task.id)}
        {#if task.planningPosition}
          {@const progress = getTaskProgress(task)}
          {@const isOldIdea = hasOldIdeaConnection(task.id)}
          <g
            class="task-box"
            class:selected={canvasState.selectedItemId === task.id}
            class:is-ready={task.isReady}
            class:old-idea-connected={isOldIdea}
            transform="translate({task.planningPosition.x}, {task.planningPosition.y})"
            on:mousedown={(e) => startDragTask(e, task.id)}
            on:click={(e) => {
              e.stopPropagation();
              if (activeTool === 'arrow') {
                handleItemClickForArrow(task.id, 'task');
              } else {
                selectTask(task.id);
              }
            }}
            on:dblclick={(e) => {
              e.stopPropagation();
              if (!hasMovedSinceMouseDown) {
                handleTaskDoubleClick(task.id);
              }
            }}
          >
            <!-- Task background -->
            <rect
              width={TASK_WIDTH}
              height={TASK_HEIGHT}
              fill="white"
              stroke={isOldIdea ? '#ef4444' : task.color}
              stroke-width="3"
              rx="8"
              class="task-bg"
            />

            <!-- Old idea indicator -->
            {#if isOldIdea}
              <rect
                width="6"
                height={TASK_HEIGHT}
                fill="#ef4444"
                opacity="0.3"
              />
            {/if}

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
      <li>👆 Left click + drag: Move task/shape</li>
      <li>👆👆 Double click task: Edit subtasks</li>
      <li>👆👆 Double click shape: Edit label</li>
      <li>👆👆 Double click arrow: Mark as old idea</li>
      <li>⌨️ Delete/Backspace: Remove selected item</li>
    </ul>
  </div>
</div>

<!-- Modals (outside main container) -->

<!-- Task Edit Modal -->
{#if isModalOpen && selectedTaskForEdit}
  <TaskEditModal 
    task={selectedTaskForEdit}
    isOpen={isModalOpen}
    on:close={handleModalClose}
    on:update={handleTaskUpdate}
  />
{/if}

<!-- Shape Edit Modal -->
{#if editingShapeId !== null}
  <div class="modal-overlay" on:click={cancelShapeEdit} role="button" tabindex="0">
    <div class="modal small" on:click|stopPropagation role="dialog">
      <div class="modal-header">
        <h3>Edit Shape Label</h3>
        <button class="close-btn" on:click={cancelShapeEdit}>✕</button>
      </div>
      
   <div class="modal-body">
  <div class="form-group">
    <label>Label</label>
    <input 
      type="text" 
      bind:value={editingShapeLabel}
      placeholder="Shape title..."
      autofocus
    />
  </div>
  
  <div class="form-group">
    <label>Description</label>
    <textarea 
      bind:value={editingShapeDescription}
      placeholder="What is this shape for? Add notes here..."
      rows="4"
    ></textarea>
  </div>
</div>

      <div class="modal-footer">
        <button class="cancel-btn" on:click={cancelShapeEdit}>Cancel</button>
        <button class="save-btn" on:click={saveShapeLabel}>Save</button>
      </div>
    </div>
  </div>
{/if}

<!-- Arrow Edit Modal -->
{#if editingArrowId !== null}
  {@const arrow = arrows.find(a => a.id === editingArrowId)}
  {#if arrow}
    <div class="modal-overlay" on:click={() => editingArrowId = null} role="button" tabindex="0">
      <div class="modal small" on:click|stopPropagation role="dialog">
        <div class="modal-header">
          <h3>Edit Arrow</h3>
          <button class="close-btn" on:click={() => editingArrowId = null}>✕</button>
        </div>
        
        <div class="modal-body">
          <p style="margin-bottom: 1rem; color: #6b7280;">
            Mark this connection as an old/deprecated approach. Tasks connected by old arrows will be highlighted in red.
          </p>
          <button 
            class="toggle-old-btn"
            class:is-old={arrow.isOldIdea}
            on:click={() => toggleArrowOldIdea(arrow.id)}
          >
            {#if arrow.isOldIdea}
              ✓ Marked as Old Idea
            {:else}
              Mark as Old Idea
            {/if}
          </button>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" on:click={() => editingArrowId = null}>Close</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

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

  .dropdown-container {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.25rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    z-index: 100;
    min-width: 150px;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background 0.2s;
  }

  .dropdown-item:hover {
    background: #f3f4f6;
  }

  .dropdown-item:first-child {
    border-radius: 6px 6px 0 0;
  }

  .dropdown-item:last-child {
    border-radius: 0 0 6px 6px;
  }

  .tool-btn.active {
    background: #3b82f6;
  }

  .tool-btn.delete {
    background: #ef4444;
  }

  .tool-btn.delete:hover {
    background: #dc2626;
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
    cursor: pointer;
    transition: filter 0.2s;
  }

  .task-box:active {
    cursor: move;
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

  .shape-box {
    cursor: pointer;
    transition: filter 0.2s;
  }

  .shape-box:active {
    cursor: move;
  }

  .shape-box:hover {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }

  .shape-box.selected .shape-element {
    stroke-width: 5;
    filter: drop-shadow(0 0 8px rgba(147, 51, 234, 0.5));
  }

  .shape-label {
    font-size: 14px;
    font-weight: 600;
    pointer-events: none;
  }

  .arrow {
    cursor: pointer;
  }

  .arrow-hitbox {
    cursor: pointer;
  }

  .arrow-line {
    transition: stroke-width 0.2s;
  }

  .arrow:hover .arrow-line {
    stroke-width: 5;
  }

  .arrow.selected .arrow-line {
    stroke-width: 6;
    filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.6));
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

  .task-box.old-idea-connected .task-bg {
    filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4));
  }

  .arrow.old-idea .arrow-line {
    stroke-dasharray: 5, 5;
    animation: dash 0.5s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }

  .arrow-label {
    font-size: 10px;
    font-weight: 700;
    pointer-events: none;
  }

  .toggle-old-btn {
    width: 100%;
    padding: 1rem;
    border: 2px solid #ef4444;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    background: white;
    color: #ef4444;
    font-size: 1rem;
  }

  .toggle-old-btn:hover {
    background: #fef2f2;
  }

  .toggle-old-btn.is-old {
    background: #ef4444;
    color: white;
  }

  .toggle-old-btn.is-old:hover {
    background: #dc2626;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal.small {
    max-width: 400px;
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1f2937;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f3f4f6;
    color: #1f2937;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #374151;
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.9375rem;
  }

  .form-group input:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 2px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .cancel-btn,
  .save-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: #f3f4f6;
    color: #374151;
  }

  .cancel-btn:hover {
    background: #e5e7eb;
  }

  .save-btn {
    background: #4CAF50;
    color: white;
  }

  .save-btn:hover {
    background: #45a049;
  }
</style>