import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetJobRunCommand,
  GlueClient,
  StartJobRunCommand,
} from '@aws-sdk/client-glue';

@Injectable()
export class GlueService {
  constructor(private readonly config: ConfigService) {
  }

  async startCleanJob(args: {
    applicationId: string;
    inputKey: string;
    outputKey: string;
  }) {
    const jobName = this.config.getOrThrow<string>('AWS_GLUE_CLEAN_JOB_NAME');
    const stagingBucket = this.config.getOrThrow<string>(
      'AWS_GLUE_STAGING_BUCKET',
    );

    const command = new StartJobRunCommand({
      JobName: jobName,
      Arguments: {
        '--BUCKET': stagingBucket,
        '--APPLICATION_ID': args.applicationId,
        '--INPUT_KEY': args.inputKey,
        '--OUTPUT_KEY': args.outputKey,
        '--CONFIDENCE_THRESHOLD': '80',
      },
    });

    const response = await this.client().send(command);

    return {
      jobName,
      jobRunId: response.JobRunId!,
    };
  }

  async getJobStatus(jobName: string, jobRunId: string) {
    const response = await this.client().send(
      new GetJobRunCommand({
        JobName: jobName,
        RunId: jobRunId,
        PredecessorsIncluded: false,
      }),
    );

    return response.JobRun?.JobRunState ?? 'UNKNOWN';
  }

  private client() {
    return new GlueClient({
      region: this.config.getOrThrow<string>('AWS_GLUE_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('GLUE_AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>(
          'GLUE_AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }
}
