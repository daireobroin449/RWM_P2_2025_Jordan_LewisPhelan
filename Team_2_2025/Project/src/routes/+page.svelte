<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import UnifiedChecklist from '$lib/components/UnifiedChecklist.svelte';
  import { checklistStore } from '$lib/stores/checklist';
  import { availableTreesStore } from '$lib/stores/taskStore';
  import TutorialPopup from '$lib/components/TutorialPopup.svelte';

  interface SubTask { id: number; title: string; status: string; }
  interface TaskData { 
    id: number; 
    title: string; 
    color: string;
    startDate: string;
    dueDate: string;
    status: string;
    notes: string;
    subTasks: SubTask[];
  }

  let tasks: TaskData[] = [
    { 
      id: 1, 
      title: 'VPX', 
      color: '#FFD700',
      startDate: '01/11',
      dueDate: '05/12',
      status: 'In Progress',
      notes: '',
      subTasks: [
        { id: 101, title: 'Presentation', status: 'Done' },
        { id: 102, title: 'Rough Videos', status: 'To-Do' },
        { id: 103, title: 'Final Videos', status: 'To-Do' }
      ]
    },
    { 
      id: 2, 
      title: 'Design', 
      color: '#00FFFF',
      startDate: '10/11',
      dueDate: '20/12',
      status: 'Not Started',
      notes: '',
      subTasks: []
    },
    { 
      id: 3, 
      title: '3D Modelling', 
      color: '#FF00FF',
      startDate: '15/11',
      dueDate: '30/12',
      status: 'In Progress',
      notes: '',
      subTasks: []
    }
  ];

  let nextTaskId = 4;
  let nextSubTaskId = 200;
  let selectedTask: TaskData | null = null;
  let showTaskModal = false;
  let showSubTaskModal = false;
  let isEditingTask = false;

  // New task form
  let newTaskTitle = '';
  let newTaskColor = '#FFD700';
  let newTaskStartDate = '';
  let newTaskDueDate = '';
  let newTaskStatus = 'Not Started';
  let newTaskNotes = '';

  // New subtask form
  let newSubTaskTitle = '';
  let newSubTaskStatus = 'To-Do';

  // Welcome popup state
  let showWelcomePopup = true;
  let agreedToTest = false;

  let showPopup = false;
  let popupMessage = '';
  let popupTimeout: NodeJS.Timeout;

  // tutorial reference + steps
  let tutorialComponent: any;

  const tutorialSteps = [
    {
      title: "Welcome to Your Tasks!",
      message: "This is your main task board. Here you can view all your tasks and organize your work.",
      position: "center"
    },
    {
      title: "Add New Tasks",
      message: "Click the '+ Add Task' button to create a new task with dates, status, and color coding.",
      position: "top-right"
    },
    {
      title: "View Task Details",
      message: "Click on any task card to view and edit its details, including notes and sub-tasks.",
      position: "center"
    },
    {
      title: "Add Sub-Tasks",
      message: "Break down your tasks into smaller steps using the '+ Add Sub-Task' button on each task card.",
      position: "center"
    },
    {
      title: "Complete Tasks for Trees!",
      message: "At the top right of a task it displays a toggle to mark the task as completed." +
               " Once marked completed, you can remove the task and earn a tree for your forest!",
      position: "center"
    }
  ];

  onMount(async () => {
    const savedAgreement = localStorage.getItem('agreedToTest');
    const savedTasks = localStorage.getItem('tasks');
    const savedNextTaskId = localStorage.getItem('nextTaskId');
    const savedNextSubTaskId = localStorage.getItem('nextSubTaskId');
    
    // Always show welcome popup on first visit
    if (savedAgreement !== 'true') {
      showWelcomePopup = true;
      agreedToTest = false;
    } else {
      showWelcomePopup = false;
      agreedToTest = true;
      
      const tutorialCompleted = localStorage.getItem('tutorial-home-tasks');
      if (!tutorialCompleted) {
        await tick();
        if (tutorialComponent) {
          tutorialComponent.start();
        }
      }
    }

    if (savedTasks) {
      tasks = JSON.parse(savedTasks);
    }

    if (savedNextTaskId) {
      nextTaskId = JSON.parse(savedNextTaskId);
    }

    if (savedNextSubTaskId) {
      nextSubTaskId = JSON.parse(savedNextSubTaskId);
    }

    window.addEventListener('open-tutorials', showTutorial);
  });

  // Modified handleAgree to start tutorial after agreement
  async function handleAgree() {
    if (agreedToTest) {
      localStorage.setItem('agreedToTest', 'true');
      showWelcomePopup = false;
      const tutorialCompleted = localStorage.getItem('tutorial-home-tasks');
      if (!tutorialCompleted) {
        await tick();
        if (tutorialComponent) {
          tutorialComponent.start();
        }
      }
    }
  }

  // navigation + tutorial controls
  function goBack() {
    window.history.back();
  }

  function startTutorial() {
    if (tutorialComponent) {
      tutorialComponent.start();
    }
  }

  function showTutorial() {
    if (tutorialComponent) {
      if (typeof tutorialComponent.restart === 'function') {
        tutorialComponent.restart();
      } else if (typeof tutorialComponent.start === 'function') {
        tutorialComponent.start();
      }
    }
  }

  function triggerPopup(message: string) {
    popupMessage = message;
    showPopup = true;
    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => (showPopup = false), 3000);
  }

  function openTaskModal(task?: TaskData) {
    if (task) {
      selectedTask = task;
      isEditingTask = true;
      newTaskTitle = task.title;
      newTaskColor = task.color;
      newTaskStartDate = task.startDate;
      newTaskDueDate = task.dueDate;
      newTaskStatus = task.status;
      newTaskNotes = task.notes;
      checklistStore.complete('view_task');
    } else {
      selectedTask = null;
      isEditingTask = false;
      resetTaskForm();
    }
    showTaskModal = true;
  }

  function resetTaskForm() {
    newTaskTitle = '';
    newTaskColor = '#FFD700';
    newTaskStartDate = '';
    newTaskDueDate = '';
    newTaskStatus = 'Not Started';
    newTaskNotes = '';
  }

  function saveTask() {
    if (!newTaskTitle.trim()) return;
    
    if (isEditingTask && selectedTask) {
      // Logic for editing existing task (Completion logic REMOVED from here)
      tasks = tasks.map(t => 
        t.id === selectedTask!.id 
          ? { ...t, title: newTaskTitle, color: newTaskColor, startDate: newTaskStartDate, 
              dueDate: newTaskDueDate, status: newTaskStatus, notes: newTaskNotes }
          : t
      );
      localStorage.setItem('tasks', JSON.stringify(tasks));
      triggerPopup('✏️ Task updated!');
    } else {
      // Logic for creating new task
      const newTask: TaskData = {
        id: nextTaskId++,
        title: newTaskTitle,
        color: newTaskColor,
        startDate: newTaskStartDate,
        dueDate: newTaskDueDate,
        status: newTaskStatus,
        notes: newTaskNotes,
        subTasks: []
      };
      tasks = [...tasks, newTask];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('nextTaskId', JSON.stringify(nextTaskId));
      triggerPopup('✨ Task created!');
      checklistStore.complete('add_task');
    }
    
    showTaskModal = false;
    resetTaskForm();
  }

  let showDeleteConfirm = false;
  let taskToDelete: TaskData | null = null;

  function toggleTaskStatus(task: TaskData) {
    // Toggle between Completed and In Progress/Not Started
    const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
    
    tasks = tasks.map(t => 
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function requestDelete(task: TaskData) {
    taskToDelete = task;
    showDeleteConfirm = true;
  }

  function confirmDelete() {
    if (taskToDelete) {
      availableTreesStore.increment();
      triggerPopup('🎉 Task finished! You earned a tree! 🌳');
      
      // Remove the task
      tasks = tasks.filter(t => t.id !== taskToDelete!.id);
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    showDeleteConfirm = false;
    taskToDelete = null;
  }

  function deleteTask() {
    if (!selectedTask) return;
    tasks = tasks.filter(t => t.id !== selectedTask!.id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    showTaskModal = false;
    triggerPopup('🗑️ Task deleted!');
  }

  function openSubTaskModal(task: TaskData) {
    selectedTask = task;
    newSubTaskTitle = '';
    newSubTaskStatus = 'To-Do';
    showSubTaskModal = true;
  }

  function saveSubTask() {
    if (!newSubTaskTitle.trim() || !selectedTask) return;

    const newSubTask: SubTask = {
      id: nextSubTaskId++,
      title: newSubTaskTitle,
      status: newSubTaskStatus
    };

    tasks = tasks.map(t => 
      t.id === selectedTask!.id 
        ? { ...t, subTasks: [...t.subTasks, newSubTask] }
        : t
    );

    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('nextSubTaskId', JSON.stringify(nextSubTaskId));
    triggerPopup('📋 Subtask added!');
    checklistStore.complete('add_subtask');
    showSubTaskModal = false;
  }

  function deleteSubTask(taskId: number, subTaskId: number) {
    tasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, subTasks: t.subTasks.filter(st => st.id !== subTaskId) }
        : t
    );
    localStorage.setItem('tasks', JSON.stringify(tasks));
    triggerPopup('🗑️ Subtask deleted!');
  }

  function getStatusColor(status: string) {
    if (status === 'Done' || status === 'Completed') return '#10b981';
    if (status === 'In Progress') return '#f59e0b';
    return '#6b7280';
  }
</script>


<main>
  {#if showWelcomePopup}
    <div class="welcome-overlay">
      <div class="welcome-popup">
        <h2>Welcome to the Project Board Test</h2>
        <p>Hello! If you are here, you are likely helping us test our app. We are a group of 7 students conducting this usability test. At the end, there will be a short questionnaire for your feedback.</p>
        <p>This is just a reminder: we are not collecting or storing any sensitive data. Your responses are completely anonymous. We appreciate any feedback, so please share your honest thoughts to help us improve our app!</p>
        
        <div class="agreement-section">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={agreedToTest} />
            <span>I agree to participate in this test and am comfortable using this application, as well as completing the short questionnaire at the end.</span>
          </label>
        </div>

        <button class="agree-button" on:click={handleAgree} disabled={!agreedToTest}>
          Get Started
        </button>
      </div>
    </div>
  {/if}

  <div class="content">
    <div class="header">
      <h1>Sprout-ED</h1>
      <input type="search" class="search-bar" placeholder="Search..." />
    </div>

    <div class="tasks-container">
      <div class="tasks-header">
        <h2>TASKS:</h2>
        <button class="add-task-btn" on:click={() => openTaskModal()}>+ Add Task</button>
      </div>

      <div class="tasks-list">
        {#each tasks as task (task.id)}
          <div class="task-card" style="border-left: 6px solid {task.color}; background: {task.color}20;">
            <div class="task-main" on:click={() => openTaskModal(task)} on:keydown={(e) => e.key === 'Enter' && openTaskModal(task)} role="button" tabindex="0">
              <div class="task-header-row">
                <div class="title-row">
                  <div class="task-title">{task.title}</div>
                  <div class="edit-hint">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    Edit Task Details
                  </div>
                </div>
                
                <div class="complete-toggle" on:click|stopPropagation>
                  <span class="toggle-label">{task.status === 'Completed' ? 'Task Completed' : 'Task in Progress'}</span>
                  <label class="switch">
                    <input type="checkbox" checked={task.status === 'Completed'} on:change={() => toggleTaskStatus(task)}>
                    <span class="slider round"></span>
                  </label>

                  {#if task.status === 'Completed'}
                    <button class="finalize-btn" on:click|stopPropagation={() => requestDelete(task)}>
                      REMOVE
                    </button>
                  {/if}
                </div>
              </div>
              
              <div class="task-dates">
                {#if task.startDate || task.dueDate}
                  <span class="date-badge">
                    {task.startDate || '—'} → {task.dueDate || '—'}
                  </span>
                {/if}
              </div>
            </div>
            {#if task.subTasks.length > 0}
              <div class="subtasks">
                {#each task.subTasks as subtask (subtask.id)}
                  <div class="subtask-item">
                    <span class="subtask-title">{subtask.title}</span>
                    <span class="subtask-status" style="background: {getStatusColor(subtask.status)};">
                      {subtask.status}
                    </span>
                  </div>
                {/each}
              </div>
            {/if}

            <button class="add-subtask-btn" on:click={() => openSubTaskModal(task)}>
              + Add Sub-Task
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if showTaskModal}
    <div class="modal-overlay" on:click={() => showTaskModal = false} on:keydown={(e) => e.key === 'Escape' && (showTaskModal = false)} role="button" tabindex="0" aria-label="Close modal">
      <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal-header">
          <h3>{isEditingTask ? 'Edit Task' : 'New Task'}</h3>
          <button class="close-btn" on:click={() => showTaskModal = false}>✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Task Title</label>
            <input type="text" bind:value={newTaskTitle} placeholder="Enter task title..." />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Start Date</label>
              <input type="text" bind:value={newTaskStartDate} placeholder="DD/MM" />
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input type="text" bind:value={newTaskDueDate} placeholder="DD/MM" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Color</label>
              <input type="color" bind:value={newTaskColor} />
            </div>
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea bind:value={newTaskNotes} placeholder="Add notes..."></textarea>
          </div>

          {#if isEditingTask && selectedTask && selectedTask.subTasks.length > 0}
            <div class="subtasks-section">
              <h4>Sub-Tasks:</h4>
              {#each selectedTask.subTasks as subtask (subtask.id)}
                <div class="subtask-row">
                  <span>{subtask.title}</span>
                  <button class="delete-subtask-btn" on:click={() => deleteSubTask(selectedTask.id, subtask.id)}>🗑️</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="modal-footer">
          {#if isEditingTask}
            <button class="delete-btn" on:click={deleteTask}>Delete Task</button>
          {/if}
          <button class="save-btn" on:click={saveTask}>Save</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showSubTaskModal}
    <div class="modal-overlay" on:click={() => showSubTaskModal = false} on:keydown={(e) => e.key === 'Escape' && (showSubTaskModal = false)} role="button" tabindex="0" aria-label="Close modal">
      <div class="modal small" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal-header">
          <h3>Add Sub-Task</h3>
          <button class="close-btn" on:click={() => showSubTaskModal = false}>✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Sub-Task Title</label>
            <input type="text" bind:value={newSubTaskTitle} placeholder="Enter subtask title..." />
          </div>

          <div class="form-group">
            <label>Status</label>
            <select bind:value={newSubTaskStatus}>
              <option>To-Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button class="save-btn" on:click={saveSubTask}>Add Sub-Task</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showPopup}
    <div class="popup">{popupMessage}</div>
  {/if}

  {#if showDeleteConfirm}
    <div class="modal-overlay" style="z-index: 4000;">
      <div class="modal small confirm-modal">
        <h3>Are you sure?</h3>
        <p>This will permanently remove the task and add a tree to your forest.</p>
        <div class="modal-footer" style="justify-content: center;">
          <button class="cancel-btn" on:click={() => showDeleteConfirm = false}>Cancel</button>
          <button class="confirm-btn" on:click={confirmDelete}>Yes, Collect Tree!</button>
        </div>
      </div>
    </div>
  {/if}

  <UnifiedChecklist />

  <TutorialPopup 
    bind:this={tutorialComponent}
    tutorialKey="home-tasks"
    steps={tutorialSteps}
    autoStart={false}
  />
</main>

<style>
  main {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
    display: flex;
    background: #ABDE9D;
  }

  .sidebar {
    width: 70px;
    background: #03440C;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    position: fixed;
    height: 100vh;
    z-index: 1000;
  }

  .sidebar-header {
    margin-bottom: 40px;
  }

  .logo {
    font-size: 32px;
  }

  .logo svg {
    display: block;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .nav-icon-svg {
    width: 24px;
    height: 24px;
  }

  .nav-item {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;
  }

  .nav-item:hover, .nav-item.active {
    background: rgba(255, 255, 255, 0.2);
  }

  .nav-item svg {
    flex-shrink: 0;
  }

  .nav-icon {
    font-size: 24px;
  }

  .content {
    margin-left: 70px;
    flex: 1;
    padding: 20px 40px;
  }

  .header {
    background: #03440C;
    padding: 15px 30px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .header h1 {
    color: white;
    font-size: 24px;
    margin: 0;
  }

  .search-bar {
    padding: 8px 16px;
    border-radius: 20px;
    border: none;
    width: 300px;
    font-size: 14px;
  }

  .tasks-container {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    padding: 30px;
    min-height: 500px;
  }

  .tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .tasks-header h2 {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
  }

  .add-task-btn {
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .add-task-btn:hover {
    transform: scale(1.05);
  }

  .tasks-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .task-card {
    border-radius: 12px;
    padding: 20px;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .task-main {
    cursor: pointer;
    margin-bottom: 15px;
  }

  .task-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start; 
    gap: 10px;
    margin-bottom: 8px;
  }

  .title-row {
    display: flex;
    align-items: center; 
    flex-wrap: wrap;     
    gap: 10px;           
    flex: 1;
  }

  .task-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 0 !important;
    line-height: 1.2;
  }

  .edit-hint {
    font-size: 11px;
    color: #4b5563;
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0.7;
    white-space: nowrap;
    padding-top: 2px;
  }
  
  .task-main:hover .edit-hint {
    opacity: 1;
    text-decoration: underline;
  }

  .complete-toggle {
    display: flex;
    flex-direction: column;
    align-items: flex-end; 
    gap: 2px;
    min-width: 40px; 
    z-index: 10;
  }

  .toggle-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    color: #555;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
  }

  .switch input { 
    opacity: 0; 
    width: 0; 
    height: 0; 
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 14px; width: 14px;
    left: 3px; bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .slider { background-color: #10b981; }
  input:checked + .slider:before { transform: translateX(14px); }

  .finalize-btn {
    margin-top: 5px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 9px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    animation: fadeIn 0.3s ease;
  }

  .finalize-btn:hover {
    background: #dc2626;
  }

  .task-dates {
    margin-top: 8px;
  }

  .date-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(0,0,0,0.1);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
  }

  .subtasks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .subtask-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: white;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .subtask-title {
    flex: 1;
  }

  .subtask-status {
    padding: 4px 12px;
    border-radius: 12px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
    min-width: 70px;
    text-align: center;
  }

  .add-subtask-btn {
    padding: 8px 16px;
    background: rgba(0,0,0,0.1);
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .add-subtask-btn:hover {
    background: rgba(0,0,0,0.15);
  }

  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 2px;
    transition: all 0.2s ease;
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
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  }

  .modal.small {
    max-width: 400px;
  }

  .modal-header {
    padding: 20px 30px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 20px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }

  .modal-body {
    padding: 30px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #374151;
    font-size: 14px;
  }

  .form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 10px 15px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
  }

  .form-group input[type="color"] {
    height: 45px;
    padding: 5px;
  }

  .form-group textarea {
    min-height: 100px;
    resize: vertical;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .subtasks-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  }

  .subtasks-section h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
  }

  .subtask-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .subtask-row:hover {
    background: #f3f4f6;
  }

  .delete-subtask-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
  }

  .modal-footer {
    padding: 20px 30px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    background: #f9fafb;
  }

  .save-btn, .delete-btn {
    padding: 10px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .save-btn {
    background: #667eea;
    color: white;
  }

  .delete-btn {
    background: #ef4444;
    color: white;
    margin-right: auto;
  }

  .save-btn:hover, .delete-btn:hover {
    transform: scale(1.05);
  }

  .welcome-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5000;
    backdrop-filter: blur(4px);
  }

  .welcome-popup {
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
  }

  .welcome-popup h2 {
    margin: 0 0 16px 0;
    color: #333;
    font-size: 28px;
    font-weight: 700;
  }

  .welcome-popup p {
    margin: 0 0 16px 0;
    color: #666;
    font-size: 16px;
    line-height: 1.6;
  }

  .agreement-section {
    background: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    margin: 20px 0;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .checkbox-label span {
    color: #374151;
    font-size: 14px;
    line-height: 1.6;
  }

  .agree-button {
    width: 100%;
    padding: 14px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .agree-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .agree-button:not(:disabled):hover {
    background: #5568d3;
    transform: scale(1.02);
  }

  .popup {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: #03440C;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    z-index: 3500;
    animation: slideInUp 0.3s ease;
    font-size: 15px;
    font-weight: 500;
  }

  .confirm-modal {
    text-align: center;
    padding: 20px;
  }

  .confirm-modal h3 {
    margin-top: 0;
    color: #374151;
  }

  .cancel-btn {
    padding: 10px 20px;
    background: #e5e7eb;
    color: #374151;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .confirm-btn {
    padding: 10px 20px;
    background: #10b981; 
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .cancel-btn:hover { background: #d1d5db; }
  .confirm-btn:hover { background: #059669; }

  @keyframes slideInUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .modal::-webkit-scrollbar {
    width: 8px;
  }

  .modal::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .modal::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }

  .modal::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .nav-item:focus,
  .add-task-btn:focus,
  .add-subtask-btn:focus,
  .save-btn:focus,
  .delete-btn:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  @media (max-width: 768px) {
    .content {
      margin-left: 0;
      padding: 15px 20px;
    }

    .sidebar {
      width: 100%;
      height: auto;
      position: fixed;
      bottom: 0;
      top: auto;
      flex-direction: row;
      padding: 10px 0;
      justify-content: space-around;
    }

    .sidebar-header {
      display: none;
    }

    .sidebar-nav {
      flex-direction: row;
      gap: 10px;
    }

    .search-bar {
      width: 200px;
    }

    .modal {
      width: 95%;
      max-height: 90vh;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>