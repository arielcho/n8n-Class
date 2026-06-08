import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Clase01Controller } from './clase01/clase01.controller';
import { Clase01Service } from './clase01/clase01.service';
import { RawDocumentText } from '../entities/raw-document-text.entity';
import { TextractService } from './clase01/textract.service';
import { Clase02Controller } from './clase02/clase02.controller';
import { Clase02Service } from './clase02/clase02.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([RawDocumentText])],
  controllers: [Clase01Controller, Clase02Controller],
  providers: [Clase01Service, Clase02Service, TextractService],
})
export class Modulo1Module {}
