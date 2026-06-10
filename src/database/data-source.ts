import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { ApiClient } from '../entities/api-client.entity';
import { ApplicationDocument } from '../entities/application-document.entity';
import { ApplicationExtractedData } from '../entities/application-extracted-data.entity';
import { CleanCreditProfile } from '../entities/clean-credit-profile.entity';
import { CreditApplication } from '../entities/credit-application.entity';
import { DocumentType } from '../entities/document-type.entity';
import { GlueJobRunEntity } from '../entities/glue-job-run.entity';
import { RawDocumentText } from '../entities/raw-document-text.entity';
import { TextractQueryAnswer } from '../entities/textract-query-answer.entity';
import { TextractResult } from '../entities/textract-result.entity';

config();

const schema = process.env.DATABASE_SCHEMA ?? 'public';
const rawDatabaseUrl = process.env.DATABASE_URL ?? '';

export function resolvePostgresConnection(url: string): {
  url: string;
  ssl: false | { rejectUnauthorized: boolean };
} {
  if (process.env.DATABASE_SSL === 'false') {
    return { url, ssl: false };
  }

  const needsSsl =
    process.env.DATABASE_SSL === 'true' ||
    url.includes('sslmode=require') ||
    url.includes('supabase.com');

  if (!needsSsl) {
    return { url, ssl: false };
  }

  const cleanUrl = url
    .replace(/([?&])sslmode=[^&]*&?/, '$1')
    .replace(/[?&]$/, '');

  return {
    url: cleanUrl,
    ssl: { rejectUnauthorized: false },
  };
}

const { url: databaseUrl, ssl } = resolvePostgresConnection(rawDatabaseUrl);

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  schema,
  entities: [
    ApiClient,
    RawDocumentText,
    DocumentType,
    CreditApplication,
    ApplicationDocument,
    TextractResult,
    TextractQueryAnswer,
    ApplicationExtractedData,
    CleanCreditProfile,
    GlueJobRunEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  ssl,
});
