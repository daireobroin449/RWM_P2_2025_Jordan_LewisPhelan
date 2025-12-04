<script lang="ts">
  import { onMount } from 'svelte';
  import { checklistStore } from '$lib/stores/checklist';

  onMount(() => {
    checklistStore.reset();     
    
    // Clear checklist and agreement
    localStorage.removeItem('checklist');
    localStorage.removeItem('agreedToTest');
    
    // ✅ Clear all tutorial completion flags
    localStorage.removeItem('tutorial-home-tasks');
    localStorage.removeItem('tutorial-timer');
    localStorage.removeItem('tutorial-calendar');
    localStorage.removeItem('tutorial-forest');
    
    // Optional: Clear all other app data if you want a complete reset
    // localStorage.removeItem('calendarEvents_v2');
    // localStorage.removeItem('tasks');
    // localStorage.removeItem('forestData');
    // localStorage.removeItem('nextTaskId');
    // localStorage.removeItem('nextSubTaskId');
  });
</script>

<main>
  <div class="container">
    <header class="header">
      <div class="title-badge">
        <h1>🎉 Thank You!</h1>
      </div>
      <p class="subtitle">
        You’ve completed all the tasks. We really appreciate your participation in this usability test.
      </p>
    </header>

    <section>
      <h2 class="section-title">📝 Quick Feedback</h2>
      <p>Please fill out this short feedback form before you go:</p>
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSeDmdiZRGhpS75O121niQF6gIkJS7l73nIY94Uy1BJbCcXLcw/viewform?usp=header"
        width="640"
        height="800"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
      >
        Loading…
      </iframe>
    </section>
  </div>
</main>

<style>
  /* 🔒 Force-hide the global sidebar ONLY on this page */
  :global(.sidebar) {
    display: none !important;
  }

  /* If any content on other pages relies on margin-left from the sidebar,
     this page doesn't, so we don't need to adjust it here. */

:global(body) {
    overflow: hidden;
  }

  main {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    height: 100vh;
    background: linear-gradient(135deg, #1e5128 0%, #2d6a4f 50%, #52b788 100%);
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .container {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border-radius: 24px;
    padding: 32px 32px 24px;
    width: 100%;
    max-width: 900px;
    height: 95vh;
    max-height: 95vh;
    color: #1f2937;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.6s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .header {
    text-align: center;
    margin-bottom: 40px;
  }

  .title-badge {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    padding: 16px 32px;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }

  .title-badge h1 {
    font-size: 40px;
    font-weight: 800;
    margin: 0;
  }

  .subtitle {
    font-size: 18px;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.6;
    color: #4b5563;
  }

  section {
    text-align: center;
  }

  .section-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #374151;
  }

  iframe {
    border-radius: 16px;
    margin-top: 20px;
    max-width: 100%;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    border: none;
  }

  @media (max-width: 720px) {
    .container {
      padding: 32px 24px;
    }

    .title-badge h1 {
      font-size: 32px;
    }

    .subtitle {
      font-size: 16px;
    }

    .section-title {
      font-size: 20px;
    }

    iframe {
      height: 600px;
    }
  }
</style>
