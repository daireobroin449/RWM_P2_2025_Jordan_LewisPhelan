<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TaskData, SubTask } from './types';

  export let task: TaskData;
  export let isOpen: boolean = false;

  const dispatch = createEventDispatcher<{
    close: void;
    update: { task: TaskData };
  }>();

  // Local copy of task for editing
  let editedTask: TaskData = JSON.parse(JSON.stringify(task));
  
  // Watch for task prop changes and update local copy
  $: if (task && isOpen) {
    editedTask = JSON.parse(JSON.stringify(task));
  }

  // New subtask input
  let newSubTaskTitle = '';

  // Toggle subtask status
  function toggleSubTaskStatus(subTaskId: number) {
    const subTask = editedTask.subTasks.find(st => st.id === subTaskId);
    if (subTask) {
      // Cycle through statuses: To-Do -> In Progress -> Done -> To-Do
      if (subTask.status === 'To-Do') {
        subTask.status = 'In Progress';
      } else if (subTask.status === 'In Progress') {
        subTask.status = 'Done';
      } else {
        subTask.status = 'To-Do';
      }
      // Unmark as ready when subtask status changes
      editedTask.isReady = false;
      editedTask = editedTask; // Trigger reactivity
    }
  }

  // Add new subtask
  function addSubTask() {
    if (!newSubTaskTitle.trim()) return;

    const newSubTask: SubTask = {
      id: Date.now(), // Simple ID generation
      title: newSubTaskTitle,
      status: 'To-Do',
      createdAt: Date.now(),
      addedAfterPlanning: true // Mark as added after initial planning
    };

    editedTask.subTasks = [...editedTask.subTasks, newSubTask];
    // Unmark as ready when new subtask is added
    editedTask.isReady = false;
    newSubTaskTitle = '';
  }

  // Delete subtask
  function deleteSubTask(subTaskId: number) {
    editedTask.subTasks = editedTask.subTasks.filter(st => st.id !== subTaskId);
    // Unmark as ready when subtask is deleted
    editedTask.isReady = false;
  }

  // Toggle ready state
  function toggleReady() {
    editedTask.isReady = !editedTask.isReady;
    if (editedTask.isReady) {
      editedTask.markedReadyAt = Date.now();
    }
    editedTask = editedTask; // Trigger reactivity
  }

  // Save changes and close
  function saveAndClose() {
    dispatch('update', { task: editedTask });
    dispatch('close');
  }

  // Close without saving
  function closeModal() {
    dispatch('close');
  }

  // Get status color
  function getStatusColor(status: string): string {
    if (status === 'Done') return '#10b981'; // Green
    if (status === 'In Progress') return '#f59e0b'; // Orange
    return '#6b7280'; // Gray
  }

  // Handle escape key
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }
</script>

{#if isOpen}
  <div 
    class="modal-overlay" 
    on:click={closeModal}
    on:keydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-label="Close modal"
  >
    <div 
      class="modal" 
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
    >
      <!-- Modal Header -->
      <div class="modal-header" style="border-left: 6px solid {editedTask.color}">
        <div>
          <h2>{editedTask.title}</h2>
          <p class="task-meta">
            {editedTask.startDate || '—'} → {editedTask.dueDate || '—'} 
            <span class="status-badge" style="background: {getStatusColor(editedTask.status)}">
              {editedTask.status}
            </span>
          </p>
        </div>
        <button class="close-btn" on:click={closeModal} aria-label="Close">✕</button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Notes Section -->
        {#if editedTask.notes}
          <div class="notes-section">
            <h3>Notes</h3>
            <p>{editedTask.notes}</p>
          </div>
        {/if}

        <!-- Subtasks Section -->
        <div class="subtasks-section">
          <h3>Subtasks ({editedTask.subTasks.length})</h3>
          
          {#if editedTask.subTasks.length === 0}
            <p class="empty-state">No subtasks yet. Add one below!</p>
          {:else}
            <ul class="subtask-list">
              {#each editedTask.subTasks as subTask (subTask.id)}
                <li class="subtask-item" class:added-later={subTask.addedAfterPlanning}>
                  <div class="subtask-content">
                    <button 
                      class="status-toggle"
                      style="background: {getStatusColor(subTask.status)}"
                      on:click={() => toggleSubTaskStatus(subTask.id)}
                      title="Click to change status"
                    >
                      {#if subTask.status === 'Done'}
                        ✓
                      {:else if subTask.status === 'In Progress'}
                        ⟳
                      {:else}
                        ○
                      {/if}
                    </button>
                    
                    <span class="subtask-title" class:completed={subTask.status === 'Done'}>
                      {subTask.title}
                    </span>
                    
                    {#if subTask.addedAfterPlanning}
                      <span class="new-badge" title="Added after initial planning">NEW</span>
                    {/if}
                  </div>
                  
                  <button 
                    class="delete-btn"
                    on:click={() => deleteSubTask(subTask.id)}
                    aria-label="Delete subtask"
                  >
                    🗑️
                  </button>
                </li>
              {/each}
            </ul>
          {/if}

          <!-- Add New Subtask -->
          <div class="add-subtask">
            <input 
              type="text" 
              bind:value={newSubTaskTitle}
              placeholder="Add new subtask..."
              on:keydown={(e) => e.key === 'Enter' && addSubTask()}
            />
            <button class="add-btn" on:click={addSubTask}>+ Add</button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button 
          class="ready-btn"
          class:is-ready={editedTask.isReady}
          on:click={toggleReady}
          title={editedTask.isReady ? 'Mark as not ready' : 'Mark as ready for use'}
        >
          {#if editedTask.isReady}
            ✓ Ready
          {:else}
            Mark as Ready
          {/if}
        </button>
        <div class="spacer"></div>
        <button class="cancel-btn" on:click={closeModal}>Cancel</button>
        <button class="save-btn" on:click={saveAndClose}>Save Changes</button>
      </div>
    </div>
  </div>
{/if}

<style>
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
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    padding: 1.5rem;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .modal-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #1f2937;
  }

  .task-meta {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
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

  .notes-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .notes-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #374151;
  }

  .notes-section p {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
  }

  .subtasks-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    color: #1f2937;
  }

  .empty-state {
    text-align: center;
    color: #9ca3af;
    padding: 2rem;
    font-style: italic;
  }

  .subtask-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem 0;
  }

  .subtask-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    transition: all 0.2s;
  }

  .subtask-item:hover {
    border-color: #d1d5db;
    background: #f9fafb;
  }

  .subtask-item.added-later {
    border-left: 4px solid #f59e0b;
  }

  .subtask-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .status-toggle {
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: white;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }

  .status-toggle:hover {
    transform: scale(1.1);
  }

  .subtask-title {
    flex: 1;
    color: #1f2937;
    font-size: 0.9375rem;
  }

  .subtask-title.completed {
    text-decoration: line-through;
    color: #9ca3af;
  }

  .new-badge {
    background: #f59e0b;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 8px;
    font-size: 0.625rem;
    font-weight: 700;
  }

  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0.25rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .delete-btn:hover {
    opacity: 1;
  }

  .add-subtask {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .add-subtask input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.9375rem;
  }

  .add-subtask input:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .add-btn {
    padding: 0.75rem 1.25rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }

  .add-btn:hover {
    background: #45a049;
  }

  .modal-footer {
    padding: 1.5rem;
    border-top: 2px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
  }

  .spacer {
    flex: 1;
  }

  .ready-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #10b981;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    background: white;
    color: #10b981;
  }

  .ready-btn:hover {
    background: #f0fdf4;
  }

  .ready-btn.is-ready {
    background: #10b981;
    color: white;
  }

  .ready-btn.is-ready:hover {
    background: #059669;
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