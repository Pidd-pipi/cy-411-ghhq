import { ActivityCategory } from '../constants/activity';
import { CarbonFactor } from '../types/entities';
import { request } from '../utils/request';

export interface FactorPayload {
  category: ActivityCategory;
  subType: string;
  factorValue: number;
  unit: string;
  region: string;
  effectiveFrom: string;
}

export function fetchFactors(params?: { category?: ActivityCategory; region?: string }): Promise<CarbonFactor[]> {
  return request.get('/factors', { params });
}

export function createFactor(payload: FactorPayload): Promise<{ factor: CarbonFactor }> {
  return request.post('/factors', payload);
}
