
// src/mockData.ts - Mock task data for testing

import type { TaskData } from './types';

export const mockTasks: TaskData[] = [
  {
    id: 1,
    title: 'VPX Project',
    color: '#FFD700',
    startDate: '01/11',
    dueDate: '05/12',
    status: 'In Progress',
    notes: 'Main video production project',
    subTasks: [
      { id: 101, title: 'Presentation', status: 'Done', addedAfterPlanning: false },
      { id: 102, title: 'Rough Videos', status: 'In Progress', addedAfterPlanning: false },
      { id: 103, title: 'Final Videos', status: 'To-Do', addedAfterPlanning: false }
    ],
    planningPosition: { x: 100, y: 100 },
    isReady: false
  },
  {
    id: 2,
    title: 'Design System',
    color: '#00FFFF',
    startDate: '10/11',
    dueDate: '20/12',
    status: 'Not Started',
    notes: 'Create unified design language',
    subTasks: [
      { id: 201, title: 'Color Palette', status: 'To-Do', addedAfterPlanning: false },
      { id: 202, title: 'Typography', status: 'To-Do', addedAfterPlanning: false },
      { id: 203, title: 'Component Library', status: 'To-Do', addedAfterPlanning: false }
    ],
    planningPosition: { x: 350, y: 100 },
    isReady: false
  },
  {
    id: 3,
    title: '3D Modelling',
    color: '#FF00FF',
    startDate: '15/11',
    dueDate: '30/12',
    status: 'In Progress',
    notes: 'Character and environment assets',
    subTasks: [
      { id: 301, title: 'Character Models', status: 'In Progress', addedAfterPlanning: false },
      { id: 302, title: 'Environment Props', status: 'To-Do', addedAfterPlanning: false }
    ],
    planningPosition: { x: 600, y: 100 },
    isReady: false
  },
  {
    id: 4,
    title: 'Backend API',
    color: '#FF6B6B',
    startDate: '01/12',
    dueDate: '15/01',
    status: 'Not Started',
    notes: 'RESTful API development',
    subTasks: [
      { id: 401, title: 'Database Schema', status: 'To-Do', addedAfterPlanning: false },
      { id: 402, title: 'Authentication', status: 'To-Do', addedAfterPlanning: false },
      { id: 403, title: 'Endpoints', status: 'To-Do', addedAfterPlanning: false }
    ],
    planningPosition: { x: 100, y: 300 },
    isReady: false
  },
  {
    id: 5,
    title: 'Testing Suite',
    color: '#4ECDC4',
    startDate: '20/12',
    dueDate: '31/01',
    status: 'Not Started',
    notes: 'Comprehensive testing coverage',
    subTasks: [
      { id: 501, title: 'Unit Tests', status: 'To-Do', addedAfterPlanning: false },
      { id: 502, title: 'Integration Tests', status: 'To-Do', addedAfterPlanning: false },
      { id: 503, title: 'E2E Tests', status: 'To-Do', addedAfterPlanning: false }
    ],
    planningPosition: { x: 350, y: 300 },
    isReady: false
  },
  {
    id: 6,
    title: 'Documentation',
    color: '#95E1D3',
    startDate: '01/01',
    dueDate: '15/02',
    status: 'Not Started',
    notes: 'User and developer documentation',
    subTasks: [],
    planningPosition: { x: 600, y: 300 },
    isReady: false
  }
];

export default mockTasks;