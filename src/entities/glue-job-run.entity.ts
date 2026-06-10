import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'glue_job_runs' })
export class GlueJobRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @Column({ name: 'job_name', type: 'text' })
  jobName: string;

  @Column({ name: 'job_run_id', type: 'text' })
  jobRunId: string;

  @Column({ name: 'job_type', type: 'text' })
  jobType: string;

  @Column({ type: 'text', default: 'STARTING' })
  status: string;

  @Column({ name: 'input_path', type: 'text', nullable: true })
  inputPath?: string;

  @Column({ name: 'output_path', type: 'text', nullable: true })
  outputPath?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
