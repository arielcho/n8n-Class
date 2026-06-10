import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'textract_query_answers' })
export class TextractQueryAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @Column({ name: 'document_type_code', type: 'text' })
  documentTypeCode: string;

  @Column({ type: 'text' })
  alias: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text', nullable: true })
  value?: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  confidence: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}