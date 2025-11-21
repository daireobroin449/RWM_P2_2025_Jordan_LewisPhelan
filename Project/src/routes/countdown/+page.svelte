<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import UnifiedChecklist from '$lib/components/UnifiedChecklist.svelte';
  import { checklistStore } from '$lib/stores/checklist';

  // Timer variables
  let minutes: number = 0;
  let seconds: number = 25;
  const timeLeft = writable(25);
  let interval: ReturnType<typeof setInterval> | null = null;
  let isRunning: boolean = false;
  let showCompletionNotification: boolean = false;
  let notificationMessage = '';

  $: totalSeconds = minutes * 60 + seconds;
  $: if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }

  onMount(() => {
    timeLeft.set(totalSeconds);
  });

  // Navigation functions
  function goToHome() {
    goto(`${base}/`);
  }

  function goToCalendar() {
    goto(`${base}/calender`);
  }

  function triggerPopup(message: string) {
    notificationMessage = message;
    showCompletionNotification = true;
    setTimeout(() => {
      showCompletionNotification = false;
    }, 5000);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  $: formattedTime = formatTime($timeLeft);

  function startTimer() {
    if (interval || $timeLeft <= 0) return;
    isRunning = true;
    checklistStore.complete('start_timer'); // CHANGED: Use store
    interval = setInterval(() => {
      timeLeft.update(t => {
        if (t <= 1) {
          clearInterval(interval as ReturnType<typeof setInterval>);
          interval = null;
          isRunning = false;
          showCompletionNotification = true;
          setTimeout(() => {
            showCompletionNotification = false;
          }, 5000);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (interval) {
      clearInterval(interval);
      interval = null;
      isRunning = false;
      checklistStore.complete('stop_timer'); // CHANGED: Use store
    }
  }

  function toggleTimer() {
    if (isRunning) pauseTimer();
    else startTimer();
  }

  function setCustomTime() {
    pauseTimer();
    const total = Math.max(1, totalSeconds);
    timeLeft.set(total);
    checklistStore.complete('set_timer'); // CHANGED: Use store
  }

  function resetTimer() {
    pauseTimer();
    const total = Math.max(1, totalSeconds);
    timeLeft.set(total);
  }

  function closeCompletionNotification() {
    showCompletionNotification = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTimer();
    }
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      setCustomTime();
    }
  }
</script>

<main>
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="15" r="8" fill="#90EE90"/>
          <path d="M20 23 L20 35 M15 30 L25 30" stroke="#90EE90" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
    <nav class="sidebar-nav">
      <!-- Back/Arrow Icon -->
      <button class="nav-item" on:click={goToHome}>
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <!-- User/Profile Icon -->
      <button class="nav-item">
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" fill="white"/>
          <path d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 17.134 18 21" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      
      <!-- AI Chat Icon -->
      <button class="nav-item">
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="12" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">AI</text>
        </svg>
      </button>
      
      <!-- Calendar Icon -->
      <button class="nav-item" on:click={goToCalendar}>
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" stroke-width="2"/>
          <path d="M3 10H21M8 2V6M16 2V6" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <rect x="7" y="14" width="3" height="3" fill="white"/>
          <rect x="14" y="14" width="3" height="3" fill="white"/>
        </svg>
      </button>

      <!-- Timer/Countdown Icon - ACTIVE -->
      <button class="nav-item active">
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="9" stroke="white" stroke-width="2"/>
          <path d="M12 13L12 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 13L15 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M10 3L14 3" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 3L12 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      
      <!-- Home/Dashboard Icon -->
      <button class="nav-item" on:click={goToHome}>
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 22V12H15V22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <!-- Tree/Growth Icon -->
      <button class="nav-item">
        <svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
          <path d="M12 8C10 8 8 10 8 12C8 13 9 14 10 14C8.5 14 7 15.5 7 17C7 18.5 8.5 20 10 20H14C15.5 20 17 18.5 17 17C17 15.5 15.5 14 14 14C15 14 16 13 16 12C16 10 14 8 12 8Z" fill="#1a4d2e"/>
          <rect x="11" y="16" width="2" height="4" fill="#1a4d2e"/>
        </svg>
      </button>
    </nav>
  </div>

  <!-- REMOVED: Old checklist div -->

  <div class="content">
    <!-- Header -->
    <div class="header">
      <h1>Timer</h1>
      <input type="search" class="search-bar" placeholder="Search..." />
    </div>

    <!-- Timer Card -->
    <div class="timer-card">
      {#if showCompletionNotification}
        <div class="notification-wrapper">
          <div class="notification">
            <div class="notification-content">
              <span class="notification-text">{notificationMessage}</span>
              <button class="close-btn" on:click={closeCompletionNotification}>×</button>
            </div>
          </div>
        </div>
      {/if}

      <div class="timer-content">
        <div class="timer-left">
          <div class="time-label">TIMER</div>
          <div class="flower-image">🌸</div>
          <div class="timer-info">Work Timer Running</div>
        </div>

        <div class="timer-right">
          <div class="time-display-large">
            <div class="time-value">{formatTime(totalSeconds)}</div>
            <div 
              class="time-display-main" 
              on:click={toggleTimer} 
              on:keydown={handleKeydown} 
              role="button" 
              tabindex="0"
            >
              {formattedTime}
            </div>
          </div>

          <div class="timer-controls">
            <div class="input-group">
              <div class="input-field">
                <label for="minutes">Minutes</label>
                <input 
                  id="minutes"
                  type="number" 
                  bind:value={minutes} 
                  on:keydown={handleInputKeydown}
                  min="0"
                  max="99"
                />
              </div>
              <div class="input-field">
                <label for="seconds">Seconds</label>
                <input 
                  id="seconds"
                  type="number" 
                  bind:value={seconds} 
                  on:keydown={handleInputKeydown}
                  min="0"
                  max="59"
                />
              </div>
            </div>

            <div class="button-group">
              <button on:click={toggleTimer} class="btn-control btn-start">
                {isRunning ? 'Pause Timer' : 'Start Timer'}
              </button>
              <button on:click={resetTimer} class="btn-control btn-reset">
                Reset Timer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ADDED: Unified checklist component -->
  <UnifiedChecklist />
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

  .timer-card {
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .timer-content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 40px;
    align-items: center;
  }

  .timer-left {
    text-align: center;
  }

  .time-label {
    font-size: 24px;
    font-weight: 700;
    color: #03440C;
    margin-bottom: 20px;
  }

  .flower-image {
    font-size: 80px;
    margin: 20px 0;
  }

  .timer-info {
    font-size: 14px;
    color: #666;
    margin-top: 20px;
  }

  .timer-right {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .time-display-large {
    text-align: center;
  }

  .time-value {
    font-size: 18px;
    color: #666;
    margin-bottom: 10px;
  }

  .time-display-main {
    font-size: 64px;
    font-weight: 800;
    color: #03440C;
    cursor: pointer;
    padding: 20px;
    border-radius: 12px;
    transition: all 0.2s;
  }

  .time-display-main:hover {
    background: rgba(3, 68, 12, 0.05);
  }

  .timer-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .input-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .input-field {
    display: flex;
    flex-direction: column;
  }

  .input-field label {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
  }

  .input-field input {
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    text-align: center;
    font-weight: 600;
  }

  .input-field input:focus {
    outline: none;
    border-color: #03440C;
  }

  .button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .btn-control {
    padding: 14px 24px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-start {
    background: #03440C;
    color: white;
  }

  .btn-start:hover {
    background: #055a0f;
    transform: translateY(-2px);
  }

  .btn-reset {
    background: #e5e7eb;
    color: #374151;
  }

  .btn-reset:hover {
    background: #d1d5db;
  }

  /* REMOVED: All .checklist styles - now in UnifiedChecklist component */

  .notification-wrapper {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    animation: slideInDown 0.4s ease;
  }

  .notification-content {
    background: #FFD700;
    color: #333;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .notification-text {
    flex: 1;
    font-weight: 600;
    font-size: 14px;
  }

  .close-btn {
    background: rgba(0, 0, 0, 0.1);
    border: none;
    color: #333;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
    line-height: 1;
  }

  .close-btn:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  @keyframes slideInDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @media (max-width: 768px) {
    .timer-content {
      grid-template-columns: 1fr;
      gap: 30px;
    }

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
  }
</style>
