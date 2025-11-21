import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  page: 'tasks' | 'countdown' | 'calendar';
}

const defaultChecklist: ChecklistItem[] = [
  // Task Board items
  { id: 'add_task', text: 'Add a new task', completed: false, page: 'tasks' },
  { id: 'view_task', text: 'View task details', completed: false, page: 'tasks' },
  { id: 'add_subtask', text: 'Add a subtask', completed: false, page: 'tasks' },
  
  // Countdown/Timer items
  { id: 'set_timer', text: 'Set a time on the countdown', completed: false, page: 'countdown' },
  { id: 'start_timer', text: 'Start the countdown timer', completed: false, page: 'countdown' },
  { id: 'stop_timer', text: 'Stop/pause the countdown timer', completed: false, page: 'countdown' },
  
  // Calendar items
  { id: 'add_event', text: 'Add a new event', completed: false, page: 'calendar' },
  { id: 'view_monthly', text: 'View monthly or weekly view', completed: false, page: 'calendar' },
  { id: 'view_chart', text: 'View pie chart or bar graph', completed: false, page: 'calendar' }
];

function createChecklistStore() {
  const stored = browser ? localStorage.getItem('unified_checklist') : null;
  const initial = stored ? JSON.parse(stored) : defaultChecklist;
  
  const { subscribe, set, update } = writable<ChecklistItem[]>(initial);
  
  return {
    subscribe,
    complete: (itemId: string) => {
      update(items => {
        const updated = items.map(item =>
          item.id === itemId ? { ...item, completed: true } : item
        );
        if (browser) localStorage.setItem('unified_checklist', JSON.stringify(updated));
        return updated;
      });
    },
    reset: () => {
      set(defaultChecklist);
      if (browser) localStorage.removeItem('unified_checklist');
    },
    isAllComplete: (items: ChecklistItem[]) => items.every(item => item.completed)
  };
}

export const checklistStore = createChecklistStore();
