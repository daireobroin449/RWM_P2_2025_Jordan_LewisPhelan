<script>
  import { onMount, tick } from "svelte";
  import { base } from '$app/paths';
  import { checklistStore } from '$lib/stores/checklist';
  import { availableTreesStore } from '$lib/stores/taskStore';
  import UnifiedChecklist from '$lib/components/UnifiedChecklist.svelte';
  import TutorialPopup from '$lib/components/TutorialPopup.svelte';

  let completedTasks = 0;
  let streak = 0;
  let availableTrees = 0;

  let hasTree = false;
  let forest = [];
  let nextId = 1;

  const SPROUT_DURATION = 2 * 60 * 1000;
  const SAPLING_DURATION = 5 * 60 * 1000;

  availableTreesStore.subscribe(value => {
    availableTrees = value;
  });

  function plantTree() {
    if (availableTrees <= 0) {
      alert("Complete more tasks to plant trees! 🌱");
      return;
    }
    forest = [
      ...forest,
      { 
        id: nextId++, 
        size: randomSize(),
        plantedAt: Date.now()
      }
    ];
    availableTreesStore.decrement();
    saveForest();

    checklistStore.complete('plant_tree');
  }

  function randomSize() {
    return 60 + Math.floor(Math.random() * 80);
  }

  function getGrowthPhase(plantedAt) {
    const elapsed = Date.now() - plantedAt;
    
    if (elapsed < SPROUT_DURATION) {
      return 'sprout';
    } else if (elapsed < SPROUT_DURATION + SAPLING_DURATION) {
      return 'sapling';
    } else {
      return 'tree';
    }
  }

  function getGrowthProgress(plantedAt) {
    const elapsed = Date.now() - plantedAt;
    
    if (elapsed < SPROUT_DURATION) {
      return (elapsed / SPROUT_DURATION) * 100;
    } else if (elapsed < SPROUT_DURATION + SAPLING_DURATION) {
      const saplingElapsed = elapsed - SPROUT_DURATION;
      return (saplingElapsed / SAPLING_DURATION) * 100;
    } else {
      return 100;
    }
  }

  function saveForest() {
    localStorage.setItem("forest_list", JSON.stringify(forest));
    localStorage.setItem("nextId", JSON.stringify(nextId));
  }

  function loadForest() {
    const saved = localStorage.getItem("forest_list");
    if (saved) {
      forest = JSON.parse(saved);
      forest = forest.map(tree => ({
        ...tree,
        plantedAt: tree.plantedAt || Date.now()
      }));
    }
    
    const savedId = localStorage.getItem("nextId");
    if (savedId) nextId = JSON.parse(savedId);
  }

onMount(async () => { 
  loadForest();
  availableTreesStore.load();
  
  const raw = localStorage.getItem("forestData");
  const saved = raw ? JSON.parse(raw) : null;
  if (saved) {
    completedTasks = saved.completedTasks;
    streak = saved.streak;
    hasTree = saved.completedTasks > 0;
  }

  const interval = setInterval(() => {
    forest = [...forest];
  }, 1000);

  // ✅ ADD THIS CHECK - Only start tutorial if not completed
  const tutorialCompleted = localStorage.getItem('tutorial-forest');
  if (!tutorialCompleted) {
    await tick();
    if (tutorialComponent) {
      tutorialComponent.start();
    }
  }

  window.addEventListener('open-tutorials', showTutorial);

  return () => clearInterval(interval);
});

  function showTutorial() {
    if (tutorialComponent) {
      if (typeof tutorialComponent.restart === 'function') {
        tutorialComponent.restart();
      } else if (typeof tutorialComponent.start === 'function') {
        tutorialComponent.start();
      }
    }
  }
  
  function save() {
    localStorage.setItem(
      "forestData",
      JSON.stringify({
        completedTasks,
        streak
      })
    );
  }

  export function taskCompleted() {
    completedTasks++;
    hasTree = true;

    const today = new Date().toLocaleDateString();
    const last = localStorage.getItem("lastCompletionDay");

    if (today !== last) {
      streak++;
      localStorage.setItem("lastCompletionDay", today);
    }

    availableTreesStore.increment();

    save();
  }

  function treeSize() {
    return Math.min(200, 50 + completedTasks * 10);
  }

  function getTimeUntilNextPhase(plantedAt) {
    const elapsed = Date.now() - plantedAt;
    const phase = getGrowthPhase(plantedAt);
    
    if (phase === 'sprout') {
      const remaining = SPROUT_DURATION - elapsed;
      return formatTime(remaining);
    } else if (phase === 'sapling') {
      const remaining = (SPROUT_DURATION + SAPLING_DURATION) - elapsed;
      return formatTime(remaining);
    }
    return 'Fully grown!';
  }

  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  let tutorialComponent;
  const tutorialSteps = [
    {
      title: "Welcome to Your Forest!",
      message: "Every completed task lets you plant a tree. Watch your forest grow as you work!",
      position: "center"
    },
    {
      title: "Plant a Tree",
      message: "Click '🌱 Plant a Tree' when you have trees to add. That's it!",
      position: "center"
    }
  ];
</script>

<div class="forest-container">
  <h1>Your Forest</h1>

  <div class="tree-counter">
    <div class="counter-label">Available Trees to Plant:</div>
    <div class="counter-value" class:zero={availableTrees === 0}>
      {availableTrees}
    </div>
  </div>

  <button 
    class="plant-tree-btn" 
    on:click={plantTree}
    disabled={availableTrees <= 0}
  >
    {availableTrees > 0 ? '🌱 Plant a Tree' : '🔒 Complete Tasks to Unlock'}
  </button>

  {#if forest.length === 0}
    <p class="placeholder">
      You have no trees yet.<br>
      Complete tasks on the board to earn trees! 🌳
    </p>
  {:else}
    <div class="forest-grid">
      {#each forest as t}
        <div class="tree-wrapper">
          <div class="tree-visual">
            {#if getGrowthPhase(t.plantedAt) === 'sprout'}
              <img src="{base}/Images/sprout.png" alt="Sprout" width={t.size * 0.8} />
              <div class="growth-label"></div>
            {:else if getGrowthPhase(t.plantedAt) === 'sapling'}
              <img src="{base}/Images/sapling.png" alt="Sapling" width={t.size * 1.2} />
              <div class="growth-label"></div>
            {:else}
              <img src="{base}/Images/tree.png" alt="Tree" width={t.size * 1.5} />
              <div class="growth-label"></div>
            {/if}
          </div>
          
          {#if getGrowthPhase(t.plantedAt) !== 'tree'}
            <div class="progress-container">
              <div class="progress-bar" style="width: {getGrowthProgress(t.plantedAt)}%"></div>
            </div>
            <div class="time-remaining">{getTimeUntilNextPhase(t.plantedAt)}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if hasTree}
    <div style="margin-top: 30px;">
      <p><strong>Completed Tasks:</strong> {completedTasks}</p>
      <p><strong>Streak:</strong> {streak} days</p>
    </div>
  {/if}
</div>

<UnifiedChecklist />
<TutorialPopup
  bind:this={tutorialComponent}
  tutorialKey="forest"
  steps={tutorialSteps}
  autoStart={false}
/>

<style>
  .forest-container {
    padding: 20px;
  }

  .tree-counter {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f0f0f0;
    border-radius: 10px;
  }

  .counter-label {
    font-weight: 600;
    font-size: 16px;
    color: #333;
  }

  .counter-value {
    font-size: 32px;
    font-weight: bold;
    color: #4CAF50;
    min-width: 50px;
    text-align: center;
  }

  .counter-value.zero {
    color: #999;
  }

  .plant-tree-btn {
    padding: 12px 24px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .plant-tree-btn:hover:not(:disabled) {
    background: #45a049;
    transform: scale(1.05);
  }

  .plant-tree-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  .placeholder {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 40px;
    font-size: 16px;
  }

  .forest-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 30px;
    margin-top: 30px;
    padding: 20px;
    background: #f0f0f0;
    border-radius: 10px;
    max-height: 600px;
    overflow-y: auto;
  }

  .tree-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .tree-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .growth-label {
    font-size: 12px;
    color: #666;
    font-weight: 600;
    margin-top: 5px;
  }

  .progress-container {
    width: 100px;
    height: 8px;
    background: #ddd;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #90EE90, #4CAF50);
    transition: width 0.3s ease;
  }

  .time-remaining {
    font-size: 11px;
    color: #888;
    font-weight: 500;
  }
</style>