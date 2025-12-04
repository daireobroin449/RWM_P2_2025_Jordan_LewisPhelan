<script lang="ts">
  import { onMount } from 'svelte';
  
  export let tutorialKey: string; // Unique key for this tutorial (e.g., 'home-tutorial')
  export let steps: Array<{
    title: string;
    message: string;
    position?: 'center' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }>;
  export let autoStart = false; // Whether to start automatically
  export let delay = 500; // Delay before showing tutorial
  
  let showTutorial = false;
  let currentStep = 0;
  
  onMount(() => {
    const tutorialCompleted = localStorage.getItem(`tutorial-${tutorialKey}`);
    
    if (!tutorialCompleted && autoStart) {
      setTimeout(() => {
        showTutorial = true;
      }, delay);
    }
  });
  
  export function start() {
    showTutorial = true;
    currentStep = 0;
  }
  
  export function restart() {
    localStorage.removeItem(`tutorial-${tutorialKey}`);
    start();
  }
  
  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
    } else {
      closeTutorial();
    }
  }
  
  function previousStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }
  
  function closeTutorial() {
    showTutorial = false;
    localStorage.setItem(`tutorial-${tutorialKey}`, 'true');
    currentStep = 0;
  }
  
  function skipTutorial() {
    closeTutorial();
  }
</script>

{#if showTutorial}
  <div class="tutorial-overlay">
    <div class="tutorial-popup {steps[currentStep].position || 'center'}">
      <button class="tutorial-close" on:click={closeTutorial}>✕</button>
      
      <div class="tutorial-content">
        <div class="tutorial-step">Step {currentStep + 1} of {steps.length}</div>
        <h3>{steps[currentStep].title}</h3>
        <p>{steps[currentStep].message}</p>
      </div>

      <div class="tutorial-footer">
        <button class="tutorial-skip" on:click={skipTutorial}>Skip Tutorial</button>
        <div class="tutorial-navigation">
          {#if currentStep > 0}
            <button class="tutorial-prev" on:click={previousStep}>← Back</button>
          {/if}
          <button class="tutorial-next" on:click={nextStep}>
            {currentStep < steps.length - 1 ? 'Next →' : 'Got it!'}
          </button>
        </div>
      </div>

      <div class="tutorial-dots">
        {#each steps as _, index}
          <span class="dot" class:active={index === currentStep}></span>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .tutorial-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3500;
    backdrop-filter: blur(4px);
  }

  .tutorial-popup {
    background: white;
    border-radius: 20px;
    padding: 30px;
    max-width: 450px;
    width: 90%;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    position: relative;
    animation: tutorialFadeIn 0.3s ease;
  }

  .tutorial-popup.center {
    position: relative;
  }

  .tutorial-popup.top-right {
    position: fixed;
    top: 100px;
    right: 100px;
    max-width: 350px;
  }

  .tutorial-popup.top-left {
    position: fixed;
    top: 100px;
    left: 150px;
    max-width: 350px;
  }

  .tutorial-popup.bottom-right {
    position: fixed;
    bottom: 100px;
    right: 100px;
    max-width: 350px;
  }

  .tutorial-popup.bottom-left {
    position: fixed;
    bottom: 100px;
    left: 150px;
    max-width: 350px;
  }

  .tutorial-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
    padding: 5px;
    line-height: 1;
    transition: color 0.2s;
  }

  .tutorial-close:hover {
    color: #374151;
  }

  .tutorial-content {
    margin-bottom: 20px;
  }

  .tutorial-step {
    font-size: 12px;
    color: #667eea;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  .tutorial-content h3 {
    margin: 0 0 12px 0;
    font-size: 22px;
    color: #1f2937;
  }

  .tutorial-content p {
    margin: 0;
    color: #4b5563;
    font-size: 15px;
    line-height: 1.6;
  }

  .tutorial-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  }

  .tutorial-skip {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .tutorial-skip:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .tutorial-navigation {
    display: flex;
    gap: 10px;
  }

  .tutorial-prev,
  .tutorial-next {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .tutorial-prev {
    background: #f3f4f6;
    color: #374151;
  }

  .tutorial-prev:hover {
    background: #e5e7eb;
  }

  .tutorial-next {
    background: #667eea;
    color: white;
  }

  .tutorial-next:hover {
    background: #5568d3;
    transform: scale(1.05);
  }

  .tutorial-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    transition: all 0.2s;
  }

  .dot.active {
    background: #667eea;
    width: 24px;
    border-radius: 4px;
  }

  @keyframes tutorialFadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 768px) {
    .tutorial-popup.top-right,
    .tutorial-popup.top-left,
    .tutorial-popup.bottom-right,
    .tutorial-popup.bottom-left {
      position: relative;
      top: auto;
      left: auto;
      right: auto;
      bottom: auto;
      max-width: 90%;
    }
  }
</style>