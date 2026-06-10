import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Clase04Service } from './clase04.service';

@Controller('modulo1/clase04')
@UseGuards(ApiKeyGuard)
export class Clase04Controller {
  constructor(private readonly clase04: Clase04Service) {}

  @Post('credit-files')
  async createProcessAndCleanCreditFile(
    @Body()
    body: {
      applicantExternalId?: string;
      applicantName?: string;
      documents: { documentType: string; fileName: string }[];
    },
  ) {
    return await this.clase04.createProcessAndCleanCreditFile(body);
  }

  @Post('credit-files/clean')
  async cleanCreditFile(@Body() body: { applicationId: string }) {
    return await this.clase04.cleanCreditFile(body);
  }

  @Get('credit-files/:applicationId/clean-status')
  async getCleanStatus(@Param('applicationId') applicationId: string) {
    return await this.clase04.getCleanStatus(applicationId);
  }
}
