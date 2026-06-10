import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBolivianIdentityQueryCandidates1780960000000
  implements MigrationInterface
{
  name = 'UpdateBolivianIdentityQueryCandidates1780960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = process.env.DATABASE_SCHEMA ?? 'public';
    const q = `"${schema}"`;

    await queryRunner.query(`
      UPDATE ${q}."document_types"
      SET "queries" = '[
        { "Text": "What is the identity document number?", "Alias": "identity_number_q1", "TargetAlias": "identity_number" },
        { "Text": "What number appears after No.?", "Alias": "identity_number_q2", "TargetAlias": "identity_number" },
        { "Text": "What is the full name of the person?", "Alias": "full_name_q1", "TargetAlias": "full_name" },
        { "Text": "What name appears after A:?", "Alias": "full_name_q2", "TargetAlias": "full_name" },
        { "Text": "What is the birth date of the person?", "Alias": "birth_date_q1", "TargetAlias": "birth_date" },
        { "Text": "What date appears after Nacido el?", "Alias": "birth_date_q2", "TargetAlias": "birth_date" },
        { "Text": "What is the expiration date?", "Alias": "identity_expiration_date_q1", "TargetAlias": "identity_expiration_date" },
        { "Text": "What date appears after Expira el?", "Alias": "identity_expiration_date_q2", "TargetAlias": "identity_expiration_date" }
      ]'::jsonb
      WHERE "code" = 'CARNET_IDENTIDAD_BOLIVIANO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = process.env.DATABASE_SCHEMA ?? 'public';
    const q = `"${schema}"`;

    await queryRunner.query(`
      UPDATE ${q}."document_types"
      SET "queries" = '[
        { "Text": "What is the identity document number?", "Alias": "identity_number" },
        { "Text": "What is the full name of the person?", "Alias": "full_name" },
        { "Text": "What date appears after Nacido el?", "Alias": "birth_date" },
        { "Text": "What date appears after Expira el?", "Alias": "identity_expiration_date" }
      ]'::jsonb
      WHERE "code" = 'CARNET_IDENTIDAD_BOLIVIANO'
    `);
  }
}
