<script lang="ts">
  import { checklistStore, type ChecklistItem } from '$lib/stores/checklist';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onDestroy } from 'svelte';
  
  let checklist: ChecklistItem[] = [];
  let isExpanded = true;
  let showPopup = false;
  let popupMessage = '';
  
  const unsubscribe = checklistStore.subscribe(value => {
    checklist = value;
    
    // Check if all completed
    if (checklistStore.isAllComplete(value) && value.length > 0) {
      triggerPopup('✅ All tasks completed! Redirecting...');
      setTimeout(() => {
        goto(`${base}/end`);
      }, 2500);
    }
  });
  
  onDestroy(() => {
    unsubscribe();
  });
  
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
  
  function clearChecklist() {
    checklistStore.reset();
    triggerPopup('🔄 Checklist reset!');
  }
  
  function triggerPopup(message: string) {
    popupMessage = message;
    showPopup = true;
    setTimeout(() => (showPopup = false), 3000);
  }
  
  // Group by page
  $: groupedChecklist = {
    tasks: checklist.filter(item => item.page === 'tasks'),
    countdown: checklist.filter(item => item.page === 'countdown'),
    calendar: checklist.filter(item => item.page === 'calendar'),
    forest: checklist.filter(item => item.page === 'forest')  
  };
  
  $: completedCount = checklist.filter(item => item.completed).length;
  $: totalCount = checklist.length;
</script>

<div class="checklist-container" class:expanded={isExpanded}>
  <button class="checklist-header" on:click={toggleExpanded}>
    <div class="header-content">
      <span class="title">✓ Test Tasks</span>
      <span class="progress">{completedCount}/{totalCount}</span>
    </div>
    <svg 
      class="arrow" 
      class:rotated={isExpanded}
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none"
    >
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  
  {#if isExpanded}
    <div class="checklist-body">
      <!-- Task Board Section -->
      <div class="section">
        <h4 class="section-title">📋 Task Board</h4>
        {#each groupedChecklist.tasks as item (item.id)}
          <div class="checklist-item" class:completed={item.completed}>
            <span class="checkbox">{item.completed ? '✓' : ''}</span>
            <span class="checklist-text">{item.text}</span>
          </div>
        {/each}
      </div>
      
      <!-- Timer Section -->
      <div class="section">
        <h4 class="section-title">⏱️ Timer</h4>
        {#each groupedChecklist.countdown as item (item.id)}
          <div class="checklist-item" class:completed={item.completed}>
            <span class="checkbox">{item.completed ? '✓' : ''}</span>
            <span class="checklist-text">{item.text}</span>
          </div>
        {/each}
      </div>
      
      <!-- Calendar Section -->
      <div class="section">
        <h4 class="section-title">📅 Calendar</h4>
        {#each groupedChecklist.calendar as item (item.id)}
          <div class="checklist-item" class:completed={item.completed}>
            <span class="checkbox">{item.completed ? '✓' : ''}</span>
            <span class="checklist-text">{item.text}</span>
          </div>
        {/each}
      </div>

      <!-- Forest Section -->
     <div class="section">
        <h4 class="section-title">🌳 Forest</h4>
          {#each groupedChecklist.forest as item (item.id)}
           <div class="checklist-item" class:completed={item.completed}>
          <span class="checkbox">{item.completed ? '✓' : ''}</span>
          <span class="checklist-text">{item.text}</span>
        </div>
        {/each}
      </div>
      
      <button class="clear-btn" on:click={clearChecklist}>
        Clear Checklist
      </button>
    </div>
  {/if}
</div>

{#if showPopup}
  <div class="popup">{popupMessage}</div>
{/if}

<style>
  .checklist-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    min-width: 300px;
    max-width: 350px;
    z-index: 1500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .checklist-container.expanded {
    max-height: 600px;
  }
  
  .checklist-header {
    width: 100%;
    padding: 16px 20px;
    background: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;
  }
  
  .checklist-header:hover {
    background: #f9fafb;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .title {
    color: #03440C;
    font-size: 16px;
    font-weight: 700;
  }
  
  .progress {
    background: #ABDE9D;
    color: #03440C;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .arrow {
    transition: transform 0.3s;
    color: #03440C;
  }
  
  .arrow.rotated {
    transform: rotate(180deg);
  }
  
  .checklist-body {
    padding: 0 20px 20px 20px;
    max-height: 500px;
    overflow-y: auto;
    animation: slideDown 0.3s ease;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .section {
    margin-bottom: 20px;
  }
  
  .section-title {
    margin: 0 0 10px 0;
    color: #374151;
    font-size: 14px;
    font-weight: 700;
    padding-bottom: 6px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px;
    margin-bottom: 6px;
    border-radius: 6px;
    background: #f9fafb;
    transition: all 0.2s ease;
  }
  
  .checklist-item.completed {
    background: #d1fae5;
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
  
  .checklist-item.completed .checkbox {
    background: #10b981;
    border-color: #10b981;
    color: white;
  }
  
  .checklist-text {
    color: #374151;
    font-size: 13px;
    line-height: 1.4;
    flex: 1;
  }
  
  .checklist-item.completed .checklist-text {
    color: #059669;
    font-weight: 500;
  }
  
  .clear-btn {
    width: 100%;
    margin-top: 10px;
    padding: 10px 14px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .clear-btn:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
  
  .checklist-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .checklist-body::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .checklist-body::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
  }
  
  .checklist-body::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  
  .popup {
    position: fixed;
    bottom: 90px;
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
  
  @media (max-width: 768px) {
    .checklist-container {
      bottom: 90px;
      right: 10px;
      min-width: 280px;
      max-width: 300px;
    }
  }
</style>
