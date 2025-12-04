<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	let { children } = $props();

	let isExpanded = $state(true);

	function toggleSidebar() {
		isExpanded = !isExpanded;
	}

	function goToForest() {
		goto(`${base}/forest`);
	}

	function goToCalendar() {
		goto(`${base}/calender`);
	}

	function goToCountdown() {
		goto(`${base}/countdown`);
	}

	function goToHome() {
		goto(`${base}/`);
	}

	function openTutorials() {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('open-tutorials'));
		}
	}

	// Routes where the sidebar should NOT be shown
	const hideSidebarOn = [
		'/signup',
		'/login',
		'/forgot-password',
		'/reset-password',
		'/terms',
		'/privacy',
		'/end'
	].map((path) => (base && base !== '' ? `${base}${path}` : path));

	// Determine if the sidebar should be hidden on the current route
	function shouldHideSidebar(pathname: string) {
		return hideSidebarOn.some((path) => pathname.startsWith(path));
	}

	// Hide Back button on the base (home) page
	function isHomePath(pathname: string) {
		const home = base && base !== '' ? base : '/';
		const homeSlash = home.endsWith('/') ? home : `${home}/`;
		return pathname === home || pathname === homeSlash;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="/styles.css" />
</svelte:head>

<div class="app-layout">
	{#if !shouldHideSidebar($page.url.pathname)}
		<!-- Sidebar with expandable state -->
		<div class="sidebar" class:expanded={isExpanded}>
			<div class="sidebar-content">
				<div class="sidebar-header">
					<div class="logo">
						<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
							<circle cx="20" cy="15" r="8" fill="#90EE90" />
							<path
								d="M20 23 L20 35 M15 30 L25 30"
								stroke="#90EE90"
								stroke-width="3"
								stroke-linecap="round"
							/>
						</svg>
					</div>
					{#if isExpanded}
						<span class="brand-name">Sprout-ED</span>
					{/if}
				</div>

				<!-- Back button (hidden on home/base route) -->
				{#if !isHomePath($page.url.pathname)}
					<button class="nav-item" on:click={goToHome} type="button">
						<img class="nav-icon-img" src={base + '/Images/icons/back_arrow.png'} alt="Back" />
						{#if isExpanded}
							<span class="nav-label">Back</span>
						{/if}
					</button>
				{/if}

				<nav class="sidebar-nav">
					<!-- Forest -->
					<button class="nav-item" on:click={goToForest} type="button">
						<img class="nav-icon-img" src={base + '/Images/icons/tree_button.png'} alt="Forest" />
						{#if isExpanded}
							<span class="nav-label">Forest</span>
						{/if}
					</button>

					<!-- Home -->
					<button class="nav-item" on:click={goToHome} type="button">
						<img class="nav-icon-img" src={base + '/Images/icons/home_button.png'} alt="Home" />
						{#if isExpanded}
							<span class="nav-label">Home</span>
						{/if}
					</button>

					<!-- Calendar -->
					<button class="nav-item" on:click={goToCalendar} type="button">
						<img class="nav-icon-img" src={base + '/Images/icons/Date_range.png'} alt="Calendar" />
						{#if isExpanded}
							<span class="nav-label">Calendar</span>
						{/if}
					</button>

					<!-- Countdown -->
					<button class="nav-item" on:click={goToCountdown} type="button">
						<svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="13" r="9" stroke="white" stroke-width="2" />
							<path
								d="M12 13L15 10"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M8 1H10"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M14 1H16"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path d="M9 4V3" stroke="white" stroke-width="2" stroke-linecap="round" />
							<path d="M15 4V3" stroke="white" stroke-width="2" stroke-linecap="round" />
							<path d="M12 3L12 4" stroke="white" stroke-width="2" stroke-linecap="round" />
						</svg>
						{#if isExpanded}
							<span class="nav-label">Countdown</span>
						{/if}
					</button>
				</nav>

				<!-- Tutorial button at bottom -->
				<div class="tutorial-nav-wrapper">
					<button class="nav-item tutorial-nav" type="button" on:click={openTutorials}>
						<svg class="nav-icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" />
							<path
								d="M11 9.5C11 8.39543 11.8954 7.5 13 7.5C14.1046 7.5 15 8.39543 15 9.5C15 10.4314 14.5 11 13.9 11.4C13.3 11.8 13 12.1 13 13"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<circle cx="12" cy="16" r="1" fill="white" />
						</svg>
						{#if isExpanded}
							<span class="nav-label">Tutorial</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Toggle button on right edge -->
			<button class="toggle-btn" on:click={toggleSidebar} type="button" aria-label="Toggle sidebar">
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					{#if isExpanded}
						<path
							d="M10 4L6 8L10 12"
							stroke="white"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					{:else}
						<path
							d="M6 4L10 8L6 12"
							stroke="white"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					{/if}
				</svg>
			</button>
		</div>
	{/if}

	<!-- Child pages render here -->
	<main
		class="main-content"
		class:shifted={isExpanded && !shouldHideSidebar($page.url.pathname)}
		class:no-sidebar={shouldHideSidebar($page.url.pathname)}
	>
		{@render children?.()}
	</main>
</div>

<style>
	:global(html, body, #svelte) {
		margin: 0;
		padding: 0;
		height: 100%;
	}

	.app-layout {
		min-height: 100vh;
		position: relative;
	}

	/* ========== SIDEBAR ========== */
	.sidebar {
		width: 70px;
		background: #03440c;
		display: flex;
		flex-direction: column;
		position: fixed;
		left: 0;
		top: 0;
		height: 100vh;
		z-index: 100;
		transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
		align-items: flex-start;
	}

	.sidebar.expanded {
		width: 220px;
	}

	.sidebar-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 20px 0;
		overflow: hidden;
	}

	/* ========== HEADER ========== */
	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 15px;
		margin-bottom: 40px;
	}

	.logo svg {
		display: block;
		flex-shrink: 0;
	}

	.brand-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #f0fff0;
		white-space: nowrap;
	}

	/* ========== NAVIGATION ========== */
	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 0 10px;
	}

	.nav-item {
		width: 100%;
		background: transparent;
		border: none;
		color: #f0fff0;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		border-radius: 10px;
		cursor: pointer;
		transition:
			background 0.2s,
			transform 0.1s;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: translateX(2px);
	}

	.nav-item:active {
		transform: translateX(1px) scale(0.99);
	}

.nav-icon-img,
.nav-icon-svg {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
}

	.nav-label {
		font-size: 0.96rem;
		font-weight: 500;
		color: #f5fff5;
		white-space: nowrap;
	}

	/* ========== TUTORIAL BUTTON (Bottom) ========== */
	.tutorial-nav-wrapper {
		margin-top: auto;
		padding: 0 10px 12px 10px;
	}

	.tutorial-nav {
		/* Inherits all nav-item styles */
	}

	/* ========== TOGGLE BUTTON ========== */
	.toggle-btn {
		position: absolute;
		right: -12px;
		top: 50%;
		transform: translateY(-50%);
		width: 24px;
		height: 40px;
		background: #03440c;
		border: none;
		border-radius: 0 8px 8px 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
	}

	.toggle-btn:hover {
		background: #055014;
		right: -14px;
	}

	.toggle-btn:active {
		background: #077019;
	}

	/* ========== MAIN CONTENT ========== */
	.main-content {
		margin-left: 70px;
		min-height: 100vh;
		transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		z-index: 1;
	}

	.main-content.shifted {
		margin-left: 220px;
	}

	.main-content.no-sidebar {
		margin-left: 0;
	}

	/* ========== MOBILE ========== */
	@media (max-width: 768px) {
		.sidebar {
			width: 60px;
		}

		.sidebar.expanded {
			width: 200px;
		}

		.main-content {
			margin-left: 60px;
		}

		.main-content.shifted {
			margin-left: 200px;
		}

		.sidebar-header {
			margin-bottom: 20px;
		}

		.brand-name {
			font-size: 1rem;
		}

		.nav-item {
			padding: 8px 10px;
		}

		.nav-icon-img {
			width: 28px;
			height: 28px;
		}

		.nav-icon-svg {
			width: 20px;
			height: 20px;
		}
	}
</style>