<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { availableTreesStore } from '$lib/stores/taskStore';

  export let columnId: number;
  export let taskId: number;
  export let text: string;

  const dispatch = createEventDispatcher();

  let showModal = false;
  let isCompleted = false;

  function remove() {
    dispatch('removeTask', { columnId, taskId });
  }

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function markComplete() {
    if (!isCompleted) {
      isCompleted = true;
      availableTreesStore.increment();
      showModal = false;
      // Optional: visual feedback
      setTimeout(() => {
        // You could dispatch an event to remove or style differently
      }, 500);
    }
  }
</script>

<div class="task-card" class:completed={isCompleted} on:click={openModal} on:keydown={(e) => e.key === 'Enter' && openModal()} role="button" tabindex="0">
  {#if isCompleted}
    <span class="checkmark">✓</span>
  {/if}
  {text}
  <button on:click|stopPropagation={remove} class="remove-task-button">
    &times;
  </button>
</div>

{#if showModal}
  <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="button" tabindex="0" aria-label="Close modal">
    <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>Task Details</h3>
        <button class="close-btn" on:click={closeModal}>&times;</button>
      </div>
      
      <div class="modal-body">
        <p class="task-text">{text}</p>
        
        {#if isCompleted}
          <div class="completed-badge">
            ✓ Completed
          </div>
        {:else}
          <button class="complete-btn" on:click={markComplete}>
            Mark as Complete
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .task-card {
    background-color: white;
    border-radius: 3px;
    padding: 8px 12px;
    margin-bottom: 8px;
    box-shadow: 0 1px 0 rgba(9, 30, 66, 0.25);
    cursor: pointer;
    font-size: 14px;
    line-height: 20px;
    word-break: break-word;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.3s;
  }

  .task-card:hover {
    background-color: #f4f5f7;
  }

  .task-card.completed {
    opacity: 0.6;
    background-color: #e8f5e9;
    text-decoration: line-through;
  }

  .task-card:last-child {
    margin-bottom: 0;
  }

  .checkmark {
    color: #4caf50;
    font-weight: bold;
    margin-right: 8px;
  }

  .remove-task-button {
    background: none;
    border: none;
    color: #6b778c;
    font-size: 1.2em;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;
    transition: color 0.2s;
    opacity: 0;
  }

  .task-card:hover .remove-task-button {
    opacity: 1;
  }

  .remove-task-button:hover {
    color: #172b4d;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  }

  .modal-header {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }

  .modal-body {
    padding: 20px;
  }

  .task-text {
    margin: 0 0 20px 0;
    font-size: 16px;
    line-height: 1.5;
  }

  .complete-btn {
    width: 100%;
    padding: 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .complete-btn:hover {
    background: #45a049;
  }

  .completed-badge {
    padding: 12px;
    background: #e8f5e9;
    color: #2e7d32;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
  }
</style>