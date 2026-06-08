import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AnalyzeDocumentCommand,
  AnalyzeExpenseCommand,
  AnalyzeIDCommand,
  DetectDocumentTextCommand,
  Query,
  TextractClient,
  UnsupportedDocumentException,
} from '@aws-sdk/client-textract';

const SUPPORTED_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'tif',
  'tiff',
]);

@Injectable()
export class TextractService {
  private readonly client: TextractClient;

  constructor(private readonly config: ConfigService) {
    this.client = new TextractClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async detectDocumentText(s3Key: string) {
    this.assertSupportedFormat(s3Key);

    const command = new DetectDocumentTextCommand({
      Document: {
        S3Object: {
          Bucket: this.config.getOrThrow<string>('AWS_S3_BUCKET'),
          Name: s3Key,
        },
      },
    });

    try {
      const response = await this.client.send(command);
      const lines = (response.Blocks ?? [])
        .filter((block) => block.BlockType === 'LINE' && block.Text)
        .map((block) => block.Text as string);

      return {
        lines,
        text: lines.join('\n'),
        lineCount: lines.length,
      };
    } catch (error) {
      if (error instanceof UnsupportedDocumentException) {
        throw new BadRequestException(
          'Unsupported document format for Textract. Use PDF, PNG, JPEG, or TIFF.',
        );
      }
      throw error;
    }
  }

  private assertSupportedFormat(s3Key: string): void {
    const extension = s3Key.split('.').pop()?.toLowerCase() ?? '';
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        `Unsupported file extension ".${extension || '?'}". Textract accepts PDF, PNG, JPEG, and TIFF only.`,
      );
    }
  }
    async analyzeForm(s3Key: string) {
    return this.analyzeDocument(s3Key, ['FORMS']);
  }

  async analyzeStatement(s3Key: string) {
    return this.analyzeDocument(s3Key, ['TABLES']);
  }

  async analyzeId(s3Key: string) {
    this.assertSupportedFormat(s3Key);

    const command = new AnalyzeIDCommand({
      DocumentPages: [
        {
          S3Object: {
            Bucket: this.config.getOrThrow<string>('AWS_S3_BUCKET'),
            Name: s3Key,
          },
        },
      ],
    });

    return await this.client.send(command);
  }

  async analyzeExpense(s3Key: string) {
    this.assertSupportedFormat(s3Key);

    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: this.config.getOrThrow<string>('AWS_S3_BUCKET'),
          Name: s3Key,
        },
      },
    });

    return await this.client.send(command);
  }

  private async analyzeDocument(
    s3Key: string,
    featureTypes: ('FORMS' | 'TABLES')[],
  ) {
    this.assertSupportedFormat(s3Key);

    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: this.config.getOrThrow<string>('AWS_S3_BUCKET'),
          Name: s3Key,
        },
      },
      FeatureTypes: featureTypes,
    });

    try {
      return await this.client.send(command);
    } catch (error) {
      if (error instanceof UnsupportedDocumentException) {
        throw new BadRequestException(
          'Unsupported document format for Textract. Use PDF, PNG, JPEG, or TIFF.',
        );
      }
      throw error;
    }
  }
  async analyzeWithQueries(s3Key: string, queries: Query[]) {
    this.assertSupportedFormat(s3Key);

    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: this.config.getOrThrow<string>('AWS_S3_BUCKET'),
          Name: s3Key,
        },
      },
      FeatureTypes: ['QUERIES'],
      QueriesConfig: {
        Queries: queries,
      },
    });

    return await this.client.send(command);
  }
}