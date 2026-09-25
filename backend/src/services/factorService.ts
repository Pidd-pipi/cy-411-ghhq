import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { IsNull, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Or, Repository } from 'typeorm';
import { ActivityCategory } from '../constants/activity';
import { ErrorCodes } from '../constants/errorCodes';
import { Messages } from '../constants/messages';
import { CarbonFactor } from '../models/carbonFactor';
import { AppError } from '../utils/AppError';
import { logTemplate } from '../utils/logger';

export interface FactorInput {
  category: ActivityCategory;
  subType: string;
  factorValue: number;
  unit: string;
  region: string;
  effectiveFrom: string;
}

@Injectable()
export class FactorService {
  constructor(@InjectRepository(CarbonFactor) private readonly factorRepo: Repository<CarbonFactor>) {}

  async list(category?: ActivityCategory, region?: string) {
    logTemplate('info', 'FACTOR_LIST_START');
    return this.factorRepo.find({
      where: {
        ...(category ? { category } : {}),
        ...(region ? { region } : {})
      },
      order: { category: 'ASC', region: 'ASC', subType: 'ASC', effectiveFrom: 'ASC' }
    });
  }

  async findMatching(category: ActivityCategory, subType: string, region: string, recordDate: string) {
    const factor = await this.factorRepo.findOne({
      where: {
        category,
        subType,
        region,
        effectiveFrom: LessThanOrEqual(recordDate),
        effectiveTo: Or(IsNull(), MoreThanOrEqual(recordDate))
      },
      order: { effectiveFrom: 'DESC' }
    });
    if (!factor) {
      logTemplate('warn', 'FACTOR_VERSION_NOT_FOUND', { category, subType, region, recordDate });
      throw new AppError(
        ErrorCodes.FACTOR_VERSION_NOT_FOUND,
        `CarbonFactor[category=${category}] read failed: sub_type ${subType} region ${region} record_date ${recordDate} no effective version`,
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
    return factor;
  }

  async create(input: FactorInput) {
    if (!Object.values(ActivityCategory).includes(input.category)) {
      logTemplate('warn', 'FACTOR_CREATE_FAILED', { id: 0, field: 'CarbonFactor.category', reason: 'invalid enum' });
      throw new AppError(ErrorCodes.ACTIVITY_CATEGORY_INVALID, `CarbonFactor[category=${input.category}] create failed: category invalid`);
    }
    if (!input.effectiveFrom || !dayjs(input.effectiveFrom).isValid()) {
      logTemplate('warn', 'FACTOR_CREATE_FAILED', { id: 0, field: 'CarbonFactor.effective_from', reason: 'missing or invalid date' });
      throw new AppError(ErrorCodes.VALIDATION_FAILED, `CarbonFactor[category=${input.category}] create failed: effective_from invalid`);
    }
    const effectiveFrom = dayjs(input.effectiveFrom).format('YYYY-MM-DD');
    const duplicate = await this.factorRepo.findOne({
      where: { category: input.category, subType: input.subType, region: input.region, effectiveFrom }
    });
    if (duplicate) {
      logTemplate('warn', 'FACTOR_CREATE_FAILED', { id: duplicate.id, field: 'CarbonFactor.effective_from', reason: `duplicate version on ${effectiveFrom}` });
      throw new AppError(
        ErrorCodes.FACTOR_VERSION_DUPLICATE,
        `CarbonFactor[id=${duplicate.id}] create failed: effective_from ${effectiveFrom} duplicate for sub_type ${input.subType} region ${input.region}`,
        HttpStatus.CONFLICT
      );
    }
    const previous = await this.factorRepo.find({
      where: {
        category: input.category,
        subType: input.subType,
        region: input.region,
        effectiveFrom: LessThan(effectiveFrom),
        effectiveTo: Or(IsNull(), MoreThanOrEqual(effectiveFrom))
      }
    });
    const previousEnd = dayjs(effectiveFrom).subtract(1, 'day').format('YYYY-MM-DD');
    for (const old of previous) {
      old.effectiveTo = previousEnd;
      await this.factorRepo.save(old);
      logTemplate('info', 'FACTOR_VERSION_CLOSED', { id: old.id, effectiveTo: previousEnd });
    }
    const next = await this.factorRepo.findOne({
      where: { category: input.category, subType: input.subType, region: input.region, effectiveFrom: MoreThan(effectiveFrom) },
      order: { effectiveFrom: 'ASC' }
    });
    const saved = await this.factorRepo.save(
      this.factorRepo.create({
        category: input.category,
        subType: input.subType,
        factorValue: String(input.factorValue),
        unit: input.unit,
        region: input.region,
        effectiveFrom,
        effectiveTo: next ? dayjs(next.effectiveFrom).subtract(1, 'day').format('YYYY-MM-DD') : null
      })
    );
    logTemplate('info', 'FACTOR_CREATE_SUCCESS', { id: saved.id, category: saved.category, region: saved.region, effectiveFrom: saved.effectiveFrom });
    return { message: Messages.FACTOR_CREATED, factor: saved };
  }
}
