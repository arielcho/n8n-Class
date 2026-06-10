import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ApplicationDocument } from '../entities/application-document.entity';
import { ApplicationExtractedData } from '../entities/application-extracted-data.entity';
import { CreditApplication } from '../entities/credit-application.entity';
import { DocumentType } from '../entities/document-type.entity';
import { RawDocumentText } from '../entities/raw-document-text.entity';
import { TextractQueryAnswer } from '../entities/textract-query-answer.entity';
import { TextractResult } from '../entities/textract-result.entity';
import { Clase01Controller } from './clase01/clase01.controller';
import { Clase01Service } from './clase01/clase01.service';
import { TextractService } from './clase01/textract.service';
import { Clase02Controller } from './clase02/clase02.controller';
import { Clase02Service } from './clase02/clase02.service';
import { Clase03Controller } from './clase03/clase03.controller';
import { Clase03Service } from './clase03/clase03.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      RawDocumentText,
      CreditApplication,
      ApplicationDocument,
      DocumentType,
      TextractResult,
      TextractQueryAnswer,
      ApplicationExtractedData,
    ]),
  ],
  controllers: [Clase01Controller, Clase02Controller, Clase03Controller],
  providers: [Clase01Service, Clase02Service, Clase03Service, TextractService],
  exports: [Clase03Service],
})
export class Modulo1Module {}
