<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import Forest from "$lib/components/Forest.svelte";

    function goToHome() { goto(`${base}/`); }
    function goToCountdown() { goto(`${base}/countdown`); }
    function goToCalendar() { goto(`${base}/calender`); }
    function goToForest() { goto(`${base}/forest`); }
</script>

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
        <button class="nav-item active" on:click={goToForest}>
            <img src="{base}/Images/tree.png" alt="Forest" style="width: 32px; height: 32px; object-fit: contain;" />
        </button>

        <button class="nav-item" on:click={goToHome}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5"
                      stroke="white" stroke-width="2"
                      stroke-linecap="round"/>
            </svg>
        </button>

        <button class="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="white"/>
                <path d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 17.134 18 21"
                      stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>

        <button class="nav-item">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                      stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <text x="12" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">AI</text>
            </svg>
        </button>

        <button class="nav-item" on:click={goToCalendar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2"
                      stroke="white" stroke-width="2"/>
                <path d="M3 10H21M8 2V6M16 2V6"
                      stroke="white" stroke-width="2"/>
                <rect x="7" y="14" width="3" height="3" fill="white"/>
                <rect x="14" y="14" width="3" height="3" fill="white"/>
            </svg>
        </button>

        <button class="nav-item" on:click={goToCountdown}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="13" r="9" stroke="white" stroke-width="2"/>
                <path d="M12 13L12 8" stroke="white" stroke-width="2"/>
                <path d="M12 13L15 15" stroke="white" stroke-width="2"/>
            </svg>
        </button>
    </nav>
</div>

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

    .sidebar {
        width:70px;
        background:#03440C;
        display:flex;
        flex-direction:column;
        align-items:center;
        padding:20px 0;
        position:fixed;
        height:100vh;
    }

    .sidebar-header { margin-bottom:40px; }

    .sidebar-nav {
        display:flex;
        flex-direction:column;
        gap:20px;
    }

    .nav-item {
        width:50px;
        height:50px;
        border-radius:12px;
        background:transparent;
        border:none;
        cursor:pointer;
        display:flex;
        align-items:center;
        justify-content:center;
    }

    .nav-item:hover,
    .nav-item.active {
        background:rgba(255,255,255,0.2);
    }

    .content {
        margin-left:70px;
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
