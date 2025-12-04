<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { checklistStore } from '$lib/stores/checklist';
    import Forest from "$lib/components/Forest.svelte";
    import TutorialPopup from '$lib/components/TutorialPopup.svelte';

    function goToHome() { goto(`${base}/`); }
    function goToCountdown() { goto(`${base}/countdown`); }
    function goToCalendar() { goto(`${base}/calender`); }
    function goToForest() { goto(`${base}/forest`); }
</script>

<div class="content">
    <div class="header">
        <h1>Growth</h1>
        <input type="search" class="search-bar" placeholder="Search..." />
    </div>

    <div class="white-box">
        <Forest />
    </div>
</div>

<style>
    :global(body) { margin:0; }

    .content {
        padding:20px 40px;
        min-height:100vh;
        background:#ABDE9D;
    }

    .header {
        background:#03440C;
        padding:15px 30px;
        border-radius:12px;
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:30px;
    }

    .header h1 {
        color:white;
        font-size:24px;
        margin:0;
    }

    .search-bar {
        padding:8px 16px;
        border-radius:20px;
        border:none;
        width:300px;
        font-size:14px;
    }

    .white-box {
        background:white;
        border-radius:20px;
        padding:40px;
    }
</style>
