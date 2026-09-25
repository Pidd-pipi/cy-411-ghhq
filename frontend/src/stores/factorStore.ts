import { create } from 'zustand';
import { createFactor, FactorPayload, fetchFactors } from '../api/factor';
import { ActivityCategory } from '../constants/activity';
import { CarbonFactor } from '../types/entities';

interface FactorStore {
  rows: CarbonFactor[];
  loading: boolean;
  load: (filters?: { category?: ActivityCategory; region?: string }) => Promise<void>;
  addVersion: (payload: FactorPayload) => Promise<void>;
}

export const useFactorStore = create<FactorStore>((set, get) => ({
  rows: [],
  loading: false,
  async load(filters) {
    set({ loading: true });
    const rows = await fetchFactors(filters);
    set({ rows, loading: false });
  },
  async addVersion(payload) {
    await createFactor(payload);
    await get().load();
  }
}));
