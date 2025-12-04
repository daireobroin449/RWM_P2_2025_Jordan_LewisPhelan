<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import UnifiedChecklist from '$lib/components/UnifiedChecklist.svelte';
  import { checklistStore } from '$lib/stores/checklist';
  import TutorialPopup from '$lib/components/TutorialPopup.svelte';

  // Sidebar navigation actions
  function goToHome() { goto(`${base}/`); }
  function goToCountdown() { goto(`${base}/countdown`); }
  function goToCalendar() { goto(`${base}/calender`); }
  function goToForest() { goto(`${base}/forest`); }

  // Tutorial reference + steps
  let tutorialComponent: any;

  const tutorialSteps = [
    {
      title: "Welcome to the Calendar",
      message: "This calendar helps you see your tasks and events over the month at a glance.",
      position: "center"
    },
    {
      title: "Navigate Dates",
      message: "Use the arrows and Today button to move between months and quickly return to the current month.",
      position: "top"
    },
    {
      title: "Add Events",
      message: "Click the + button on a day to add a new event with a title, category, and color.",
      position: "center"
    },
    {
      title: "Switch Views",
      message: "Use the Monthly / Weekly toggle to change how your schedule is displayed.",
      position: "center"
    },
    {
      title: "View Analytics",
      message: "Choose Pie Chart or Bar Graph to see how your time is spread across categories.",
      position: "center"
    }
  ];

  type CalEvent = {
    id: number;
    title: string;
    dateISO: string;
    color: string;
    category: string;
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const categories = [
    { name: 'VPX', color: '#FFD700' },
    { name: 'Design', color: '#00FFFF' },
    { name: '3D Modelling', color: '#FF00FF' },
    { name: 'Development', color: '#10b981' },
    { name: 'Meeting', color: '#f59e0b' }
  ];

  let current = new Date();
  current.setDate(1);
  current.setHours(0,0,0,0);

  let viewType: 'monthly' | 'weekly' = 'monthly';
  let chartType: 'pie' | 'bar' = 'pie';

  let events: CalEvent[] = [];
  let nextId = 1;

  let showAddEventModal = false;
  let selectedDay: Date | null = null;
  let newEventTitle = '';
  let newEventColor = categories[0].color;
  let newEventCategory = categories[0].name;

  let chartData: Array<{category:string;count:number;percentage:string;color:string;startAngle:number;endAngle:number}> = [];

onMount(() => {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('calendarEvents_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      events = parsed;
      nextId = Math.max(0, ...parsed.map((e: any) => e.id)) + 1;
    } catch (error) {
      events = seedDefaults();
      persist();
    }
  } else {
    events = seedDefaults();
    persist();
  }

  // ✅ ADD THIS CHECK - Only start tutorial if not completed
  const tutorialCompleted = localStorage.getItem('tutorial-calendar');
  if (!tutorialCompleted && tutorialComponent) {
    tutorialComponent.start();
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


  function seedDefaults(): CalEvent[] {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    nextId = 1;
    const d0 = (day:number, color:string, cat:string, title:string): CalEvent => ({
      id: nextId++,
      title,
      dateISO: new Date(y,m,day,0,0,0,0).toISOString(),
      color,
      category: cat
    });
    return [
      d0(3,'#FF00FF','3D Modelling','3D Modelling'),
      d0(4,'#00FFFF','Design','Design'),
      d0(4,'#f59e0b','Meeting','Meeting'),
      d0(4,'#FFD700','VPX','VPX'),
      d0(5,'#FFD700','VPX','VPX Presentation')
    ];
  }

  function persist() { 
    localStorage.setItem('calendarEvents_v2', JSON.stringify(events)); 
  }

  function firstOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
  function daysInMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); }
  function gridDays(): (Date | null)[] {
    const start = firstOfMonth(current);
    const blanks = start.getDay();
    const total = daysInMonth(current);
    const cells: (Date | null)[] = [];
    for (let i=0; i<blanks; i++) cells.push(null);
    for (let day=1; day<=total; day++) cells.push(new Date(current.getFullYear(), current.getMonth(), day, 0,0,0,0));
    return cells;
  }
  function isTodayDate(d: Date | null) {
    if (!d) return false;
    const t = new Date();
    return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
  }
  function prevMonth() { current = new Date(current.getFullYear(), current.getMonth()-1, 1); }
  function nextMonth() { current = new Date(current.getFullYear(), current.getMonth()+1, 1); }
  function goToday() { const t = new Date(); current = new Date(t.getFullYear(), t.getMonth(), 1); }

  function startOfWeekForCurrentMonth(now: Date): Date {
    const today = new Date();
    const d = new Date(now);
    if (today.getMonth() === now.getMonth() && today.getFullYear() === now.getFullYear()) {
      const s = new Date(today);
      s.setDate(today.getDate() - today.getDay());
      s.setHours(0,0,0,0);
      return s;
    } else {
      const s = new Date(now);
      s.setDate(1 - s.getDay());
      s.setHours(0,0,0,0);
      return s;
    }
  }
  function weekDays(start: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }

  function openAddEvent(d: Date) {
    selectedDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
    newEventTitle = '';
    newEventCategory = categories[0].name;
    newEventColor = categories[0].color;
    showAddEventModal = true;
  }
  function addEvent() {
    if (!selectedDay || !newEventTitle.trim()) return;
    
    const ev: CalEvent = {
      id: nextId++,
      title: newEventTitle.trim(),
      dateISO: selectedDay.toISOString(),
      color: newEventColor,
      category: newEventCategory
    };
    
    events = [...events, ev];
    persist();
    showAddEventModal = false;
    checklistStore.complete('add_event');
  }
  function delEvent(id: number) {
    events = events.filter(e => e.id !== id);
    persist();
  }
  function onCategoryChange() {
    const c = categories.find(c => c.name === newEventCategory);
    if (c) newEventColor = c.color;
  }
  
  function toggleView() {
    viewType = viewType === 'monthly' ? 'weekly' : 'monthly';
    checklistStore.complete('view_monthly');
  }
  
  $: eventsForDate = (d: Date | null): CalEvent[] => {
    if (!d) return [];
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    return events.filter(e => {
      const ed = new Date(e.dateISO);
      return ed.getFullYear()===y && ed.getMonth()===m && ed.getDate()===day;
    });
  };

  $: chartData = (() => {
    const y = current.getFullYear(), m = current.getMonth();
    const tally: Record<string, number> = {};
    for (const e of events) {
      const d = new Date(e.dateISO);
      if (d.getFullYear()===y && d.getMonth()===m) {
        tally[e.category] = (tally[e.category] ?? 0) + 1;
      }
    }
    const total = Object.values(tally).reduce((a,b)=>a+b,0);
    if (!total) return [];
    let angle = 0;
    return Object.entries(tally).map(([category, count]) => {
      const pct = count/total;
      const start = angle;
      angle += pct*360;
      const col = categories.find(c=>c.name===category)?.color ?? '#999';
      return { category, count, percentage: (pct*100).toFixed(1), color: col, startAngle: start, endAngle: angle };
    });
  })();

  $: if (chartType) {
    checklistStore.complete('view_chart');
  }

  function polar(cx:number, cy:number, r:number, deg:number) {
    const rad = (deg-90)*Math.PI/180;
    return { x: cx + r*Math.cos(rad), y: cy + r*Math.sin(rad) };
  }
  function piePath(start:number, end:number) {
    const cx=150, cy=150, r=120;
    const s = polar(cx,cy,r,end);
    const e = polar(cx,cy,r,start);
    const large = end-start <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
  }
</script>

<UnifiedChecklist />


<TutorialPopup
  bind:this={tutorialComponent}
  tutorialKey="calendar"
  steps={tutorialSteps}
  autoStart={false}
/>

<!-- Content -->
<div class="content">
  <div class="header">
    <h1>Calendar</h1>
    <input type="search" class="search-bar" placeholder="Search..." />
  </div>

  <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 30px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;gap:15px;">
      <div style="display:flex;align-items:center;gap:20px;">
        <button aria-label="Previous month" on:click={prevMonth} style="background:#03440C;color:white;border:none;width:36px;height:36px;border-radius:8px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">‹</button>
        <div style="font-size:20px;font-weight:700;color:#03440C;min-width:200px;text-align:center;">
          {monthNames[current.getMonth()]} {current.getFullYear()}
        </div>
        <button aria-label="Next month" on:click={nextMonth} style="background:#03440C;color:white;border:none;width:36px;height:36px;border-radius:8px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">›</button>
        <button aria-label="Today" on:click={goToday} style="background:#667eea;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Today</button>
      </div>

      <div style="display:flex;gap:12px;align-items:center;">
        <button aria-label="Calendar options" style="background:#03440C;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;">Calendar View
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
        </button>

        <button aria-label="Toggle monthly or weekly view" on:click={toggleView} style="background:#03440C;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;">
          {viewType==='monthly' ? 'Monthly' : 'Weekly'} View
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
        </button>

        <div style="position:relative;display:inline-block;">
          <select aria-label="Chart type" bind:value={chartType} style="background:#03440C;color:white;border:none;padding:10px 35px 10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;appearance:none;">
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Graph</option>
          </select>
          <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:10px;">
      {#each dayNames as name}
        <div style="text-align:center;font-weight:700;color:#03440C;padding:10px;font-size:14px;">{name}</div>
      {/each}
    </div>

    {#if viewType === 'monthly'}
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
        {#each gridDays() as d}
          <div style="min-height:100px;background:{d ? (isTodayDate(d) ? '#eef2ff' : 'white') : '#f9fafb'};border:{isTodayDate(d) ? '2px solid #667eea' : '1px solid #e5e7eb'};border-radius:8px;padding:8px;position:relative;">
            {#if d}
              <div style="font-weight:{isTodayDate(d) ? '700' : '600'};color:{isTodayDate(d) ? '#667eea' : '#374151'};font-size:14px;margin-bottom:5px;">{d.getDate()}</div>
              <div style="display:flex;flex-direction:column;gap:3px;">
                {#each eventsForDate(d) as ev}
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:700;color:rgba(0,0,0,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.1);background:{ev.color};">
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{ev.title}</span>
                    <button aria-label="Delete event" on:click={() => delEvent(ev.id)} style="background:rgba(0,0,0,0.2);border:none;color:white;width:16px;height:16px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;padding:0;">×</button>
                  </div>
                {/each}
              </div>
              <button aria-label="Add event" on:click={() => openAddEvent(d)} style="position:absolute;bottom:8px;right:8px;width:24px;height:24px;border-radius:50%;background:#667eea;color:white;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">+</button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">
        {#each weekDays(startOfWeekForCurrentMonth(current)) as d}
          <div style="min-height:140px;background:{isTodayDate(d) ? '#eef2ff' : 'white'};border:{isTodayDate(d) ? '2px solid #667eea' : '1px solid #e5e7eb'};border-radius:8px;padding:12px;position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="font-weight:700;color:#03440C">{dayNames[d.getDay()]}</div>
              <div style="font-weight:600;color:#374151">{d.getDate()}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              {#each eventsForDate(d) as ev}
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 10px;border-radius:8px;font-size:12px;font-weight:700;color:rgba(0,0,0,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.1);background:{ev.color};">
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{ev.title}</span>
                  <button aria-label="Delete event" on:click={() => delEvent(ev.id)} style="background:rgba(0,0,0,0.2);border:none;color:white;width:18px;height:18px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;padding:0;">×</button>
                </div>
              {/each}
            </div>
            <button aria-label="Add event" on:click={() => openAddEvent(d)} style="position:absolute;bottom:10px;right:10px;width:28px;height:28px;border-radius:50%;background:#667eea;color:white;border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;">+</button>
          </div>
        {/each}
      </div>
    {/if}

    {#if chartData.length > 0}
      <div style="margin-top:40px;padding-top:30px;border-top:2px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
          <h2 style="color:#03440C;margin:0;font-size:22px;font-weight:700;">{monthNames[current.getMonth()]} {current.getFullYear()} - Analytics</h2>
        </div>

        {#if chartType === 'pie'}
          <div style="display:flex;gap:80px;align-items:center;justify-content:center;padding:20px 0;">
            <svg width="300" height="300" viewBox="0 0 300 300" style="filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
              {#each chartData as s}
                <path d={piePath(s.startAngle, s.endAngle)} fill={s.color} stroke="white" stroke-width="2" />
                <text
                  x={150 + Math.cos(((s.startAngle + s.endAngle)/2 - 90) * Math.PI / 180) * 80}
                  y={150 + Math.sin(((s.startAngle + s.endAngle)/2 - 90) * Math.PI / 180) * 80}
                  text-anchor="middle"
                  fill="white"
                  font-size="14"
                  font-weight="bold"
                >{s.percentage}%</text>
              {/each}
              <circle cx="150" cy="150" r="60" fill="white"/>
            </svg>

            <div style="display:flex;flex-direction:column;gap:20px;">
              {#each chartData as s}
                <div style="display:flex;align-items:center;gap:15px;padding:12px 16px;border-radius:8px;background:#f8f9fa;">
                  <div style="width:40px;height:40px;border-radius:6px;flex-shrink:0;background:{s.color};"></div>
                  <div>
                    <div style="font-weight:700;font-size:15px;color:#111;">{s.category}</div>
                    <div style="font-size:13px;color:#6c757d;">{s.count} events ({s.percentage}%)</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div style="display:flex;gap:80px;align-items:center;justify-content:center;padding:20px 0;">
            <svg width="500" height="300" viewBox="0 0 500 300" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
              <line x1="50" y1="20" x2="50" y2="250" stroke="#333" stroke-width="2"/>
              <line x1="50" y1="250" x2="480" y2="250" stroke="#333" stroke-width="2"/>
              {#each chartData as s, i}
                {@const barWidth = 60}
                {@const barSpacing = 80}
                {@const x = 80 + i*barSpacing}
                {@const maxH = 220}
                {@const maxCount = Math.max(...chartData.map(d => d.count), 1)}
                {@const h = (s.count / maxCount) * maxH}
                {@const y = 250 - h}
                <rect x={x} y={y} width={barWidth} height={h} fill={s.color} rx="4" />
                <text x={x + barWidth/2} y={y - 5} text-anchor="middle" fill="#333" font-size="14" font-weight="bold">{s.count}</text>
                <text x={x + barWidth/2} y="270" text-anchor="middle" fill="#333" font-size="12">{s.category.length > 8 ? s.category.slice(0,8)+'...' : s.category}</text>
              {/each}
            </svg>

            <div style="display:flex;flex-direction:column;gap:20px;">
              {#each chartData as s}
                <div style="display:flex;align-items:center;gap:15px;padding:12px 16px;border-radius:8px;background:#f8f9fa;">
                  <div style="width:40px;height:40px;border-radius:6px;flex-shrink:0;background:{s.color};"></div>
                  <div>
                    <div style="font-weight:700;font-size:15px;color:#111;">{s.category}</div>
                    <div style="font-size:13px;color:#6c757d;">{s.count} events ({s.percentage}%)</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div style="margin-top:40px;padding:30px;text-align:center;color:#6c757d;border-top:2px solid #e5e7eb;">
        <p style="font-size:16px;margin:0;">No events this month. Add some events to see analytics!</p>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body) { margin: 0; }
  .sidebar {
    width: 70px; background: #03440C; display:flex; flex-direction:column; align-items:center;
    padding:20px 0; position:fixed; height:100vh; z-index:1000;
  }
  .sidebar-header { margin-bottom:40px; }
  .sidebar-nav { display:flex; flex-direction:column; gap:20px; }
  .nav-item { width:50px; height:50px; border-radius:12px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; }
  .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.2); }
  .content { padding:20px 40px; min-height:100vh; background:#ABDE9D; }
  .header { background:#03440C; padding:15px 30px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; }
  .header h1 { color:white; font-size:24px; margin:0; }
  .search-bar { padding:8px 16px; border-radius:20px; border:none; width:300px; font-size:14px; }
  @media (max-width: 768px) {
    .content { margin-left:0; padding:15px 20px; }
    .sidebar { width:100%; height:auto; position:fixed; bottom:0; top:auto; flex-direction:row; padding:10px 0; justify-content:space-around; }
    .sidebar-header { display:none; }
    .sidebar-nav { flex-direction:row; gap:10px; }
  }
</style>

{#if showAddEventModal}
  <div on:click={() => showAddEventModal=false} style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:2000;">
    <div on:click|stopPropagation style="background:white;border-radius:20px;width:90%;max-width:450px;box-shadow:0 25px 50px rgba(0,0,0,0.25);overflow:hidden;">
      <div style="padding:20px 30px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;background:#f9fafb;">
        <h3 style="margin:0;font-size:18px;">Add Event - {selectedDay?.toLocaleDateString()}</h3>
        <button aria-label="Close add event" on:click={() => showAddEventModal=false} style="background:none;border:none;font-size:24px;cursor:pointer;color:#6b7280;">✕</button>
      </div>
      <div style="padding:30px;">
        <div style="margin-bottom:20px;">
          <label for="evt-title" style="display:block;margin-bottom:8px;font-weight:600;color:#374151;font-size:14px;">Event Title</label>
          <input
            id="evt-title"
            type="text"
            bind:value={newEventTitle}
            placeholder="Enter event title..."
            style="width:100%;padding:10px 15px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;"
          />
        </div>

        <div style="margin-bottom:20px;">
          <label for="evt-category" style="display:block;margin-bottom:8px;font-weight:600;color:#374151;font-size:14px;">Category</label>
          <select
            id="evt-category"
            bind:value={newEventCategory}
            on:change={onCategoryChange}
            style="width:100%;padding:10px 15px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box;"
          >
            {#each categories as c}
              <option value={c.name}>{c.name}</option>
            {/each}
          </select>
        </div>

        <div style="margin-bottom:20px;">
          <label for="evt-color" style="display:block;margin-bottom:8px;font-weight:600;color:#374151;font-size:14px;">Color</label>
          <input
            id="evt-color"
            type="color"
            bind:value={newEventColor}
            style="width:100%;height:50px;padding:5px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;cursor:pointer;"
          />
        </div>
      </div>

      <div style="padding:20px 30px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;background:#f9fafb;">
        <button aria-label="Add event" on:click={addEvent} style="padding:10px 24px;background:#667eea;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Add Event</button>
      </div>
    </div>
  </div>
{/if}
