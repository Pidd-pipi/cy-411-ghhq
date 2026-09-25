import { Body, Controller, Get, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ActivityCategory } from '../constants/activity';
import { ErrorCodes } from '../constants/errorCodes';
import { RequireAuth } from '../middlewares/auth';
import { RoleGuard, Roles } from '../middlewares/roleCheck';
import { FactorInput, FactorService } from '../services/factorService';
import { AppError } from '../utils/AppError';
import { logTemplate } from '../utils/logger';

@Controller('factors')
@UseGuards(RequireAuth, RoleGuard)
export class FactorController {
  constructor(private readonly factorService: FactorService) {}

  @Get()
  list(@Query('category') category?: ActivityCategory, @Query('region') region?: string) {
    return this.factorService.list(category, region);
  }

  @Post()
  @Roles('admin')
  async create(@Req() request: Request, @Body() body: FactorInput) {
    request.auditEntity = 'CarbonFactor';
    request.auditAction = 'CarbonFactor create';
    logTemplate('info', 'FACTOR_LIST_START');
    try {
      return await this.factorService.create(body);
    } catch (error: any) {
      logTemplate('error', 'FACTOR_CREATE_FAILED', { id: 0, field: 'CarbonFactor.effective_from', reason: error.message });
      throw new AppError(error.code || ErrorCodes.VALIDATION_FAILED, `CarbonFactor[id=0] controller create failed: effective_from ${error.message}`, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}
