<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TaskCard from './TaskCard.svelte';

  export let id: number; 
  export let title: string;
  export let tasks: { id: number, text: string }[];

  const dispatch = createEventDispatcher();
  let isEditing: boolean = false;
  let editTitle: string = title;
  let isAddingTask: boolean = false;
  let newTaskText: string = '';

  function remove()
  {
    dispatch('remove', id);
  }

  function startEdit()
  {
    isEditing = true;
    editTitle = title;
  }

  function finishEdit()
  {
    if (editTitle.trim() && editTitle !== title) 
    {
      dispatch('edit', { id, newTitle: editTitle.trim() });
    }
    isEditing = false;
  }

  function startAddTask()
  {
    isAddingTask = true;
    newTaskText = '';
  }

  function addTask()
  {
    if (newTaskText.trim()) 
    {
      dispatch('addTask', { columnId: id, text: newTaskText.trim() });
      newTaskText = '';
    }
    isAddingTask = false;
  }
  
  function cancelAddTask()
  {
    isAddingTask = false;
    newTaskText = '';
  }

  function handleRemoveTask(event: CustomEvent<{ columnId: number, taskId: number }>)
  {
    // Simply relay the event and its details up to the Board component
    dispatch('removeTask', event.detail);
  }
</script>

<div class="column">
  <div class="column-header">
    {#if isEditing}
      <input 
        bind:value={editTitle} 
        on:blur={finishEdit}
        on:keydown={(e) => { if (e.key === 'Enter') finishEdit(); }}
        class="title-input"
        autofocus
      />
    {:else}
      <h3 class="column-title">{title}</h3>
    {/if}

    <div class="icon-group">
      <button on:click={startEdit} class="edit-button" style="font-size: 0.8em; margin-right: 4px;">
        ✏️
      </button>
      <button on:click={remove} class="remove-button">
        &times;
      </button>
    </div>
  </div>

  <div class="task-list">
    {#each tasks as task (task.id)}
      <TaskCard 
        columnId={id} 
        taskId={task.id} 
        text={task.text}
        on:removeTask={handleRemoveTask}
      />
    {/each}
  </div>

  <div class="add-task-container">
    {#if isAddingTask}
      <textarea 
        bind:value={newTaskText} 
        placeholder="Enter a title for this card..."
        on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(); }}}
        autofocus
      ></textarea>
      <div class="add-task-controls">
        <button on:click={addTask} class="add-card-button">Add card</button>
        <button on:click={cancelAddTask} class="cancel-button">&times;</button>
      </div>
    {:else}
      <button on:click={startAddTask} class="add-task-placeholder">
        + Add a card
      </button>
    {/if}
  </div>
</div>

<style>
  .column
  {
    flex-shrink: 0;
    width: 272px;
    background-color: #ebecf0;
    border-radius: 3px;
    padding: 8px;
    max-height: calc(100vh - 40px);
    display: flex;
    flex-direction: column;
  }
  
  .column-header
  {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 4px;
  }

  .column-title
  {
    margin: 0;
    padding: 0 4px;
    font-size: 14px;
    font-weight: 600;
  }

  .title-input
  {
    flex-grow: 1;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid #0079bf;
    border-radius: 3px;
    padding: 4px;
  }

  .icon-group
  {
    display: flex;
    align-items: center;
  }

  .edit-button,
  .remove-button
  {
    background: none;
    border: none;
    color: #6b778c;
    cursor: pointer;
    line-height: 1;
    padding: 0 4px;
    transition: color 0.2s;
  }

  .edit-button:hover,
  .remove-button:hover
  {
    color: #172b4d;
  }
  
  .remove-button
  {
    font-size: 1.2em;
  }

  .task-list
  {
    flex-grow: 1;
    overflow-y: auto;
    padding-top: 4px;
    margin-bottom: 8px;
  }

  .add-task-placeholder
  {
    width: 100%;
    background: none;
    border: none;
    color: #6b778c;
    cursor: pointer;
    text-align: left;
    padding: 6px 8px;
    font-size: 14px;
  }

  .add-task-placeholder:hover
  {
    background-color: #dadce0;
    border-radius: 3px;
  }

  textarea
  {
    width: calc(100% - 10px);
    border: none;
    border-radius: 3px;
    padding: 5px;
    resize: none;
    box-shadow: 0 1px 0 rgba(9, 30, 66, 0.25);
    margin-bottom: 8px;
    font-size: 14px;
    font-family: inherit;
  }

  .add-task-controls
  {
    display: flex;
    align-items: center;
  }

  .add-card-button
  {
    background-color: #0079bf;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 6px 12px;
    margin-right: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .cancel-button
  {
    background: none;
    border: none;
    font-size: 20px;
    color: #6b778c;
    cursor: pointer;
  }
</style>