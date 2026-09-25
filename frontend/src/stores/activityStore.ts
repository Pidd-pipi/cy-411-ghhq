import { create } from 'zustand';
import { createActivity, fetchActivities, fetchActivitySummary, updateActivity, ActivityPayload } from '../api/activity';
import { ActivityCategory } from '../constants/activity';
import { Activity } from '../types/entities';

interface ActivityStore {
  rows: Activity[];
  total: number;
  byCategory: { category: ActivityCategory; value: number }[];
  loading: boolean;
  load: (filters?: { category?: ActivityCategory; start?: string; end?: string }) => Promise<void>;
  loadSummary: (range: { start: string; end: string }) => Promise<void>;
  add: (payload: ActivityPayload) => Promise<void>;
  update: (id: number, payload: Partial<ActivityPayload>) => Promise<void>;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  rows: [],
  total: 0,
  byCategory: [],
  loading: false,
  async load(filters) {
    set({ loading: true });
    const rows = await fetchActivities(filters);
    set({ rows, loading: false });
  },
  async loadSummary(range) {
    const summary = await fetchActivitySummary(range);
    set({ total: summary.total, byCategory: summary.byCategory, rows: summary.rows });
  },
  async add(payload) {
    await createActivity(payload);
    await get().load();
  },
  async update(id, payload) {
    await updateActivity(id, payload);
    await get().load();
  }
}));

