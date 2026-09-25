import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ActivityCategory } from '../constants/activity';
import { ErrorCodes } from '../constants/errorCodes';
import { Messages } from '../constants/messages';
import { CarbonFactor } from '../models/carbonFactor';
import { AppError } from '../utils/AppError';
import { logTemplate } from '../utils/logger';

dayjs.extend(customParseFormat);

export interface FactorInput {
  category: ActivityCategory;
  subType: string;
  factorValue: number;
  unit: string;
  region: string;
  effectiveFrom: string;
}

export interface FactorVersion extends CarbonFactor {
  effectiveTo: string | null;
}

@Injectable()
export class FactorService {
  constructor(@InjectRepository(CarbonFactor) private readonly factorRepo: Repository<CarbonFactor>) {}

  async list(category?: ActivityCategory, region?: string): Promise<FactorVersion[]> {
    logTemplate('info', 'FACTOR_LIST_START');
    const factors = await this.factorRepo.find({
      where: {
        ...(category ? { category } : {}),
        ...(region ? { region } : {})
      },
      order: { category: 'ASC', region: 'ASC', subType: 'ASC', effectiveFrom: 'DESC' }
    });
    return factors.map((factor) => {
      const next = factors.find(
        (candidate) =>
          candidate.category === factor.category &&
          candidate.subType === factor.subType &&
          candidate.region === factor.region &&
          dayjs(candidate.effectiveFrom).isAfter(dayjs(factor.effectiveFrom))
      );
      return { ...factor, effectiveTo: next ? dayjs(next.effectiveFrom).subtract(1, 'day').format('YYYY-MM-DD') : null };
    });
  }

  async findEffectiveAt(category: ActivityCategory, subType: string, region: string, recordDate: string) {
    const date = dayjs(recordDate).format('YYYY-MM-DD');
    const factor = await this.factorRepo.findOne({
      where: { category, subType, region, effectiveFrom: LessThanOrEqual(date) },
      order: { effectiveFrom: 'DESC' }
    });
    if (!factor) {
      logTemplate('warn', 'FACTOR_VERSION_MISSING', { id: 0, category, subType, region, recordDate: date });
      throw new AppError(
        ErrorCodes.FACTOR_NOT_FOUND,
        `CarbonFactor[category=${category} sub_type=${subType} region=${region}] effective read failed: no version available at record_date ${date}`
      );
    }
    logTemplate('info', 'FACTOR_VERSION_RESOLVED', { id: factor.id, category, region, effectiveFrom: factor.effectiveFrom, recordDate: date });
    return factor;
  }

  async create(input: FactorInput) {
    if (!Object.values(ActivityCategory).includes(input.category)) {
      logTemplate('warn', 'FACTOR_CREATE_FAILED', { id: 0, field: 'CarbonFactor.category', reason: 'invalid enum' });
      throw new AppError(ErrorCodes.ACTIVITY_CATEGORY_INVALID, `CarbonFactor[category=${input.category}] create failed: category invalid`);
    }
    if (!input.effectiveFrom || !dayjs(input.effectiveFrom, 'YYYY-MM-DD', true).isValid()) {
      logTemplate('warn', 'FACTOR_CREATE_FAILED', { id: 0, field: 'CarbonFactor.effective_from', reason: 'invalid date' });
      throw new AppError(
        ErrorCodes.FACTOR_DATE_INVALID,
        `CarbonFactor[category=${input.category}] create failed: effective_from ${input.effectiveFrom} must be YYYY-MM-DD`
      );
    }
    const effectiveFrom = dayjs(input.effectiveFrom).format('YYYY-MM-DD');
    const duplicate = await this.factorRepo.findOne({
      where: { category: input.category, subType: input.subType, region: input.region, effectiveFrom }
    });
    if (duplicate) {
      logTemplate('warn', 'FACTOR_CREATE_FAILED', {
        id: duplicate.id,
        field: 'CarbonFactor.effective_from',
        reason: `duplicate version at ${effectiveFrom}`
      });
      throw new AppError(
        ErrorCodes.FACTOR_VERSION_DUPLICATE,
        `CarbonFactor[id=${duplicate.id}] create failed: ${input.region} ${input.category}/${input.subType} already has a version effective from ${effectiveFrom}`
      );
    }
    const saved = await this.factorRepo.save(
      this.factorRepo.create({
        category: input.category,
        subType: input.subType,
        factorValue: String(input.factorValue),
        unit: input.unit,
        region: input.region,
        effectiveFrom
      })
    );
    logTemplate('info', 'FACTOR_CREATE_SUCCESS', { id: saved.id, category: saved.category, region: saved.region, effectiveFrom });
    return { message: Messages.FACTOR_CREATED, factor: saved };
  }
}
