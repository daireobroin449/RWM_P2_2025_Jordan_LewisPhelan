import { writable } from 'svelte/store';

function createTaskStore() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => {
      update(n => {
        const newValue = n + 1;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('availableTrees', newValue.toString());
        }
        return newValue;
      });
    },
    decrement: () => {
      update(n => {
        const newValue = Math.max(0, n - 1);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('availableTrees', newValue.toString());
        }
        return newValue;
      });
    },
    load: () => {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('availableTrees');
        if (saved) {
          set(parseInt(saved, 10));
        }
      }
    },
    set
  };
}

export const availableTreesStore = createTaskStore();