<script lang="ts">
  import { PlanningBoard } from '../../../packages/planning-board/src';
  import { mockTasks } from '../../../packages/planning-board/src/mockData';
  
  let tasks = mockTasks;
  
  function handleUpdate(event: CustomEvent<{ tasks: any[] }>) {
    tasks = event.detail.tasks;
    console.log('Tasks updated:', tasks);
    // In real use: localStorage.setItem('tasks', JSON.stringify(tasks));
  }
</script>

<PlanningBoard {tasks} on:update={handleUpdate} />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>