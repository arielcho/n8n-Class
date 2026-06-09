import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'textract_results' })
export class TextractResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @Column({ name: 'document_type_code', type: 'text' })
  documentTypeCode: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ name: 'raw_response', type: 'jsonb' })
  rawResponse: unknown;

  @Column({ type: 'jsonb' })
  summary: unknown;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
