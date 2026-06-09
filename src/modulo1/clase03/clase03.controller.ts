import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Clase03Service } from './clase03.service';

@Controller('modulo1/clase03')
@UseGuards(ApiKeyGuard)
export class Clase03Controller {
  constructor(private readonly clase03: Clase03Service) {}

  @Post('credit-files')
  async createCreditFile(
    @Body()
    body: {
      applicantExternalId?: string;
      applicantName?: string;
      documents: { documentType: string; fileName: string }[];
    },
  ) {
    return await this.clase03.createCreditFile(body);
  }

  @Post('credit-files/:applicationId/process')
  async processCreditFile(@Param('applicationId') applicationId: string) {
    return await this.clase03.processCreditFile(applicationId);
  }

  @Get('credit-files/:applicationId')
  async getCreditFile(@Param('applicationId') applicationId: string) {
    return await this.clase03.getCreditFile(applicationId);
  }
}
