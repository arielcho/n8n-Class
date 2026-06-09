import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Block } from '@aws-sdk/client-textract';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApplicationDocument } from '../../entities/application-document.entity';
import { ApplicationExtractedData } from '../../entities/application-extracted-data.entity';
import { CreditApplication } from '../../entities/credit-application.entity';
import { DocumentQuery, DocumentType } from '../../entities/document-type.entity';
import { TextractQueryAnswer } from '../../entities/textract-query-answer.entity';
import { TextractResult } from '../../entities/textract-result.entity';
import { TextractService } from '../clase01/textract.service';

type CreateCreditFileBody = {
  applicantExternalId?: string;
  applicantName?: string;
  documents: {
    documentType: string;
    fileName: string;
  }[];
};

type ParsedAnswer = {
  alias: string;
  targetAlias: string;
  question: string;
  value: string;
  confidence: number;
  selectedFrom?: string;
};

@Injectable()
export class Clase03Service {
  constructor(
    private readonly textract: TextractService,
    @InjectRepository(CreditApplication)
    private readonly applications: Repository<CreditApplication>,
    @InjectRepository(ApplicationDocument)
    private readonly documents: Repository<ApplicationDocument>,
    @InjectRepository(DocumentType)
    private readonly documentTypes: Repository<DocumentType>,
    @InjectRepository(TextractResult)
    private readonly textractResults: Repository<TextractResult>,
    @InjectRepository(TextractQueryAnswer)
    private readonly queryAnswers: Repository<TextractQueryAnswer>,
    @InjectRepository(ApplicationExtractedData)
    private readonly extractedData: Repository<ApplicationExtractedData>,
  ) {}

  async createCreditFile(body: CreateCreditFileBody) {
    if (!body.documents?.length) {
      throw new BadRequestException('documents is required');
    }

    const codes = body.documents.map((item) => item.documentType.toUpperCase());
    const existingTypes = await this.documentTypes.find({
      where: { code: In(codes), isActive: true },
    });
    const validCodes = new Set(existingTypes.map((item) => item.code));
    const invalidCode = codes.find((code) => !validCodes.has(code));

    if (invalidCode) {
      throw new BadRequestException(`Unknown documentType: ${invalidCode}`);
    }

    const application = await this.applications.save(
      this.applications.create({
        applicantExternalId: body.applicantExternalId,
        applicantName: body.applicantName,
        status: 'DOCUMENTS_REGISTERED',
      }),
    );

    const documents = await this.documents.save(
      body.documents.map((item) =>
        this.documents.create({
          applicationId: application.id,
          documentTypeCode: item.documentType.toUpperCase(),
          fileName: item.fileName,
          s3Key: item.fileName,
          status: 'PENDING',
        }),
      ),
    );

    return {
      applicationId: application.id,
      status: application.status,
      documents,
    };
  }

  async processCreditFile(applicationId: string) {
    const application = await this.getApplication(applicationId);
    const documents = await this.documents.find({ where: { applicationId } });

    if (!documents.length) {
      throw new BadRequestException('The credit file has no documents');
    }

    const processed: unknown[] = [];

    for (const document of documents) {
      const documentType = await this.getDocumentType(document.documentTypeCode);
      const textractQueries = this.toTextractQueries(documentType.queries);
      await this.clearPreviousTextractData(applicationId, document.id);

      const response = await this.textract.analyzeWithQueries(
        document.s3Key,
        textractQueries,
      );
      const candidateAnswers = this.parseQueryAnswers(
        response.Blocks ?? [],
        documentType.queries,
      );
      const answers = this.selectBestAnswers(candidateAnswers);

      await this.textractResults.save(
        this.textractResults.create({
          applicationId,
          documentId: document.id,
          documentTypeCode: document.documentTypeCode,
          status: 'SUCCEEDED',
          rawResponse: response,
          summary: {
            answerCount: answers.length,
            candidateCount: candidateAnswers.length,
            averageConfidence: this.averageConfidence(answers),
          },
        }),
      );

      await this.queryAnswers.save(
        answers.map((answer) =>
          this.queryAnswers.create({
            applicationId,
            documentId: document.id,
            documentTypeCode: document.documentTypeCode,
            alias: answer.targetAlias,
            question: answer.question,
            value: answer.value,
            confidence: answer.confidence,
          }),
        ),
      );

      await this.documents.update(document.id, {
        status: 'PROCESSED',
        processedAt: new Date(),
      });

      processed.push({
        documentId: document.id,
        documentType: document.documentTypeCode,
        answers,
      });
    }

    await this.rebuildExtractedData(applicationId);
    await this.applications.update(application.id, {
      status: 'TEXTRACT_COMPLETED',
    });

    return {
      applicationId,
      status: 'TEXTRACT_COMPLETED',
      processed,
    };
  }

  async getCreditFile(applicationId: string) {
    const application = await this.getApplication(applicationId);
    const documents = await this.documents.find({ where: { applicationId } });
    const extractedData = await this.extractedData.findOne({
      where: { applicationId },
    });

    return {
      application,
      documents,
      extractedData,
    };
  }

  private async getApplication(applicationId: string) {
    const application = await this.applications.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application not found: ${applicationId}`);
    }

    return application;
  }

  private async getDocumentType(code: string) {
    const documentType = await this.documentTypes.findOne({
      where: { code, isActive: true },
    });

    if (!documentType) {
      throw new BadRequestException(`Unknown documentType: ${code}`);
    }

    if (!documentType.queries.length) {
      throw new BadRequestException(`documentType ${code} has no queries`);
    }

    return documentType;
  }

  private async clearPreviousTextractData(
    applicationId: string,
    documentId: string,
  ) {
    await this.queryAnswers.delete({ applicationId, documentId });
    await this.textractResults.delete({ applicationId, documentId });
  }

  private toTextractQueries(queries: DocumentQuery[]) {
    return queries.map((query) => ({
      Text: query.Text,
      Alias: query.Alias,
      Pages: query.Pages,
    }));
  }

  private parseQueryAnswers(
    blocks: Block[],
    configuredQueries: DocumentQuery[],
  ): ParsedAnswer[] {
    const targetAliasByAlias = new Map(
      configuredQueries.map((query) => [
        query.Alias,
        query.TargetAlias ?? query.Alias,
      ]),
    );
    const resultBlocks = blocks.filter(
      (block) => block.BlockType === 'QUERY_RESULT',
    );

    return resultBlocks.map((result) => {
      const query = blocks.find((block) =>
        block.Relationships?.some(
          (relationship) =>
            relationship.Type === 'ANSWER' &&
            relationship.Ids?.includes(result.Id ?? ''),
        ),
      );

      return {
        alias: query?.Query?.Alias ?? query?.Query?.Text ?? 'unknown',
        targetAlias:
          targetAliasByAlias.get(query?.Query?.Alias ?? '') ??
          query?.Query?.Alias ??
          query?.Query?.Text ??
          'unknown',
        question: query?.Query?.Text ?? '',
        value: result.Text ?? '',
        confidence: Number((result.Confidence ?? 0).toFixed(2)),
      };
    });
  }

  private selectBestAnswers(candidates: ParsedAnswer[]) {
    const bestByTargetAlias = new Map<string, ParsedAnswer>();

    for (const candidate of candidates) {
      if (!candidate.value?.trim()) continue;

      const current = bestByTargetAlias.get(candidate.targetAlias);
      if (!current || candidate.confidence > current.confidence) {
        bestByTargetAlias.set(candidate.targetAlias, {
          ...candidate,
          selectedFrom: candidate.alias,
          alias: candidate.targetAlias,
        });
      }
    }

    return [...bestByTargetAlias.values()];
  }

  private async rebuildExtractedData(applicationId: string) {
    const answers = await this.queryAnswers.find({ where: { applicationId } });
    const grouped = this.groupAnswers(answers);
    const confidenceValues = answers.map((answer) => Number(answer.confidence));

    const payload = {
      applicationId,
      personalData: grouped.PERSONAL,
      employmentData: grouped.EMPLOYMENT,
      incomeData: grouped.INCOME,
      bankingData: grouped.BANKING,
      loanRequestData: grouped.LOAN_REQUEST,
      creditHistoryData: grouped.CREDIT_HISTORY,
      confidenceSummary: {
        average: this.average(confidenceValues),
        minimum: confidenceValues.length ? Math.min(...confidenceValues) : 0,
      },
    };

    const existing = await this.extractedData.findOne({
      where: { applicationId },
    });
    await this.extractedData.save(
      existing
        ? { ...existing, ...payload }
        : this.extractedData.create(payload),
    );
  }

  private groupAnswers(answers: TextractQueryAnswer[]) {
    const groups: Record<string, Record<string, unknown>> = {
      PERSONAL: {},
      EMPLOYMENT: {},
      INCOME: {},
      BANKING: {},
      LOAN_REQUEST: {},
      CREDIT_HISTORY: {},
    };

    for (const answer of answers) {
      const category = this.categoryFromDocumentType(answer.documentTypeCode);
      groups[category][answer.alias] = {
        value: answer.value,
        confidence: Number(answer.confidence),
      };
    }

    return groups;
  }

  private categoryFromDocumentType(code: string) {
    if (code === 'CARNET_IDENTIDAD_BOLIVIANO') return 'PERSONAL';
    if (code === 'CERTIFICADO_TRABAJO') return 'EMPLOYMENT';
    if (code === 'BOLETA_PAGO') return 'INCOME';
    if (code === 'EXTRACTO_BANCARIO') return 'BANKING';
    if (code === 'FORMULARIO_SOLICITUD_CREDITO') return 'LOAN_REQUEST';
    if (code === 'REPORTE_CREDITICIO_SIMULADO') return 'CREDIT_HISTORY';
    return 'PERSONAL';
  }

  private averageConfidence(answers: ParsedAnswer[]) {
    return this.average(answers.map((answer) => answer.confidence));
  }

  private average(values: number[]) {
    if (!values.length) return 0;
    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / values.length).toFixed(2));
  }
}
