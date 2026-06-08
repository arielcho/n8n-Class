import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Clase02Service } from './clase02.service';

@Controller('modulo1/clase02')
@UseGuards(ApiKeyGuard)
export class Clase02Controller {
  constructor(private readonly clase02: Clase02Service) {}

  @Post('textract/form')
  async analyzeForm(@Body() body: { fileName: string }) {
    return await this.clase02.analyzeForm(body);
  }

  @Post('textract/id')
  async analyzeId(@Body() body: { fileName: string }) {
    return await this.clase02.analyzeId(body);
  }

  @Post('textract/statement')
  async analyzeStatement(@Body() body: { fileName: string }) {
    return await this.clase02.analyzeStatement(body);
  }

  @Post('textract/payslip')
  async analyzePayslip(@Body() body: { fileName: string }) {
    return await this.clase02.analyzePayslip(body);
  }
}
