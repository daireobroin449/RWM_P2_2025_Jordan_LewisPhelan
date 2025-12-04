<script lang="ts">
  // =================== ORIGINALS ===================
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import UnifiedChecklist from '$lib/components/UnifiedChecklist.svelte';
  import { checklistStore } from '$lib/stores/checklist';

  // =================== TUTORIAL ADDITIONS ===================
  import TutorialPopup from '$lib/components/TutorialPopup.svelte';
  let tutorialComponent: any;
  const tutorialSteps = [
    {
      title: "Welcome to the Timer!",
      message: "Use this timer to focus your work and take regular breaks.",
      position: "center"
    },
    {
      title: "Set Time",
      message: "Just type your desired minutes and seconds, and the timer updates automatically.",
      position: "center"
    },
    {
      title: "Start & Pause",
      message: "Click 'Start Timer' to begin! You can pause anytime with the same button.",
      position: "center"
    },
    {
      title: "Reset When Needed",
      message: "Click 'Reset to 25:00' to go back to Pomodoro default.",
      position: "center"
    }
  ];

  onMount(async () => {
    timeLeft.set(totalSeconds);

    // ✅ Only start tutorial if not completed
    const tutorialCompleted = localStorage.getItem('tutorial-timer');
    if (!tutorialCompleted) {
      await tick();
      if (tutorialComponent) {
        tutorialComponent.start();
      }
    }

    window.addEventListener('open-tutorials', showTutorial);
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

  // =================== TIMER CODE WITH REACTIVE INPUTS ===================
  let minutes: number = 25;
  let seconds: number = 0;
  const timeLeft = writable(25 * 60);
  let interval: ReturnType<typeof setInterval> | null = null;
  let isRunning: boolean = false;
  let showCompletionNotification: boolean = false;
  let notificationMessage = '';

  $: totalSeconds = minutes * 60 + seconds;
  $: if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }

  // ✅ REACTIVE UPDATE: Updates timer when inputs change (only when not running)
  $: {
    if (!isRunning) {
      const total = Math.max(1, totalSeconds);
      timeLeft.set(total);
      checklistStore.complete('set_timer');
    }
  }

  // Navigation functions
  function goToHome() { goto(`${base}/`); }
  function goToCalendar() { goto(`${base}/calender`); }
  function goToForest() { goto(`${base}/forest`); }

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
    checklistStore.complete('start_timer');
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
      checklistStore.complete('stop_timer');
    }
  }

  function toggleTimer() {
    if (isRunning) pauseTimer();
    else startTimer();
  }

  // ✅ Resets to Pomodoro default
  function resetToDefault() {
    pauseTimer();
    minutes = 25;
    seconds = 0;
    timeLeft.set(25 * 60);
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

  // ✅ Auto-pause when editing either input
  function handleInputFocus() {
    if (isRunning) {
      pauseTimer();
    }
  }
</script>

<main>
  <div class="content">
    <div class="header">
      <h1>Timer</h1>
      <input type="search" class="search-bar" placeholder="Search..." />
    </div>
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
          <div class="timer-info">{isRunning ? 'Work Timer Running' : 'Ready to Start'}</div>
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
                  on:focus={handleInputFocus}
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
                  on:focus={handleInputFocus}
                  min="0"
                  max="59"
                />
              </div>
            </div>
            <div class="button-group">
              <button on:click={toggleTimer} class="btn-control btn-start">
                {isRunning ? 'Pause Timer' : 'Start Timer'}
              </button>
              <button on:click={resetToDefault} class="btn-control btn-reset">
                Reset to 25:00
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <UnifiedChecklist />
  <TutorialPopup
    bind:this={tutorialComponent}
    tutorialKey="timer"
    steps={tutorialSteps}
    autoStart={false}
  />
</main>

<main>
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

  <TutorialPopup
    bind:this={tutorialComponent}
    tutorialKey="timer"
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
