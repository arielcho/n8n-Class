import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCreditDocumentQueryCandidates1780961000000
  implements MigrationInterface
{
  name = 'UpdateCreditDocumentQueryCandidates1780961000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = process.env.DATABASE_SCHEMA ?? 'public';
    const q = `"${schema}"`;

    await this.updateQueries(queryRunner, q, 'CERTIFICADO_TRABAJO', [
      { Text: 'What is the employee name?', Alias: 'employee_name_q1', TargetAlias: 'employee_name' },
      { Text: 'Who is the worker or employee mentioned in the certificate?', Alias: 'employee_name_q2', TargetAlias: 'employee_name' },
      { Text: 'What person does this employment certificate refer to?', Alias: 'employee_name_q3', TargetAlias: 'employee_name' },
      { Text: 'What is the employer or company name?', Alias: 'employer_name_q1', TargetAlias: 'employer_name' },
      { Text: 'What company issues this employment certificate?', Alias: 'employer_name_q2', TargetAlias: 'employer_name' },
      { Text: 'What organization certifies the employment?', Alias: 'employer_name_q3', TargetAlias: 'employer_name' },
      { Text: 'What is the employee job title or position?', Alias: 'job_title_q1', TargetAlias: 'job_title' },
      { Text: 'What position, role, or cargo does the employee have?', Alias: 'job_title_q2', TargetAlias: 'job_title' },
      { Text: 'What is the employment start date or employment tenure?', Alias: 'employment_tenure_q1', TargetAlias: 'employment_tenure' },
      { Text: 'How long has the employee worked at the company?', Alias: 'employment_tenure_q2', TargetAlias: 'employment_tenure' },
      { Text: 'What is the monthly salary or income?', Alias: 'declared_salary_q1', TargetAlias: 'declared_salary' },
      { Text: 'What salary, sueldo, haber, or remuneration is stated?', Alias: 'declared_salary_q2', TargetAlias: 'declared_salary' },
    ]);

    await this.updateQueries(queryRunner, q, 'BOLETA_PAGO', [
      { Text: 'What is the net monthly income or take-home pay?', Alias: 'net_monthly_income_q1', TargetAlias: 'net_monthly_income' },
      { Text: 'What is the liquid payable amount or net pay?', Alias: 'net_monthly_income_q2', TargetAlias: 'net_monthly_income' },
      { Text: 'What amount is shown as liquido pagable?', Alias: 'net_monthly_income_q3', TargetAlias: 'net_monthly_income' },
      { Text: 'What is the gross monthly income?', Alias: 'gross_monthly_income_q1', TargetAlias: 'gross_monthly_income' },
      { Text: 'What is the total earned amount or total ingresos?', Alias: 'gross_monthly_income_q2', TargetAlias: 'gross_monthly_income' },
      { Text: 'What is the total payroll deductions?', Alias: 'payroll_discounts_q1', TargetAlias: 'payroll_discounts' },
      { Text: 'What is the total descuentos or deductions amount?', Alias: 'payroll_discounts_q2', TargetAlias: 'payroll_discounts' },
      { Text: 'What month and year does the payslip correspond to?', Alias: 'payslip_month_q1', TargetAlias: 'payslip_month' },
      { Text: 'What is the payroll period, periodo, month, or gestion?', Alias: 'payslip_month_q2', TargetAlias: 'payslip_month' },
    ]);

    await this.updateQueries(queryRunner, q, 'EXTRACTO_BANCARIO', [
      { Text: 'What is the ending balance?', Alias: 'ending_balance_q1', TargetAlias: 'ending_balance' },
      { Text: 'What is the final balance, saldo final, or current balance?', Alias: 'ending_balance_q2', TargetAlias: 'ending_balance' },
      { Text: 'What is the balance at the end of the statement period?', Alias: 'ending_balance_q3', TargetAlias: 'ending_balance' },
      { Text: 'What is the average monthly balance?', Alias: 'average_monthly_balance_q1', TargetAlias: 'average_monthly_balance' },
      { Text: 'What is the average balance or saldo promedio?', Alias: 'average_monthly_balance_q2', TargetAlias: 'average_monthly_balance' },
      { Text: 'What is the total deposits or credits?', Alias: 'total_deposits_q1', TargetAlias: 'total_deposits' },
      { Text: 'What is the total amount of abonos, deposits, or income movements?', Alias: 'total_deposits_q2', TargetAlias: 'total_deposits' },
      { Text: 'What is the total withdrawals or debits?', Alias: 'total_withdrawals_q1', TargetAlias: 'total_withdrawals' },
      { Text: 'What is the total amount of cargos, debits, withdrawals, or expenses?', Alias: 'total_withdrawals_q2', TargetAlias: 'total_withdrawals' },
    ]);

    await this.updateQueries(queryRunner, q, 'FORMULARIO_SOLICITUD_CREDITO', [
      { Text: 'What is the requested loan amount?', Alias: 'requested_amount_q1', TargetAlias: 'requested_amount' },
      { Text: 'What amount of credit, monto solicitado, or loan amount is requested?', Alias: 'requested_amount_q2', TargetAlias: 'requested_amount' },
      { Text: 'What is the amount the applicant wants to borrow?', Alias: 'requested_amount_q3', TargetAlias: 'requested_amount' },
      { Text: 'What is the requested loan term in months?', Alias: 'requested_term_months_q1', TargetAlias: 'requested_term_months' },
      { Text: 'What plazo, term, or number of months is requested?', Alias: 'requested_term_months_q2', TargetAlias: 'requested_term_months' },
      { Text: 'What is the loan purpose or destination?', Alias: 'loan_purpose_q1', TargetAlias: 'loan_purpose' },
      { Text: 'What is the purpose, destino, or use of the requested credit?', Alias: 'loan_purpose_q2', TargetAlias: 'loan_purpose' },
      { Text: 'What is the declared property value?', Alias: 'property_value_q1', TargetAlias: 'property_value' },
      { Text: 'What is the property appraisal value, valor del inmueble, or home value?', Alias: 'property_value_q2', TargetAlias: 'property_value' },
    ]);

    await this.updateQueries(queryRunner, q, 'REPORTE_CREDITICIO_SIMULADO', [
      { Text: 'What is the total reported debt?', Alias: 'reported_total_debt_q1', TargetAlias: 'reported_total_debt' },
      { Text: 'What is the total debt, saldo de deuda, or outstanding debt?', Alias: 'reported_total_debt_q2', TargetAlias: 'reported_total_debt' },
      { Text: 'What is the total monthly debt payment?', Alias: 'monthly_debt_payment_q1', TargetAlias: 'monthly_debt_payment' },
      { Text: 'What is the monthly installment, cuota mensual, or monthly payment?', Alias: 'monthly_debt_payment_q2', TargetAlias: 'monthly_debt_payment' },
      { Text: 'How many active loans are there?', Alias: 'active_loan_count_q1', TargetAlias: 'active_loan_count' },
      { Text: 'What is the number of active credits, loans, or operaciones vigentes?', Alias: 'active_loan_count_q2', TargetAlias: 'active_loan_count' },
      { Text: 'Are there late payments or delinquencies?', Alias: 'has_late_payments_q1', TargetAlias: 'has_late_payments' },
      { Text: 'Does the report mention mora, overdue payments, arrears, or default?', Alias: 'has_late_payments_q2', TargetAlias: 'has_late_payments' },
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = process.env.DATABASE_SCHEMA ?? 'public';
    const q = `"${schema}"`;

    await this.updateQueries(queryRunner, q, 'CERTIFICADO_TRABAJO', [
      { Text: 'What is the employee name?', Alias: 'employee_name' },
      { Text: 'What is the employer name?', Alias: 'employer_name' },
      { Text: 'What is the employee job title?', Alias: 'job_title' },
      { Text: 'What is the employment tenure?', Alias: 'employment_tenure' },
      { Text: 'What is the monthly salary?', Alias: 'declared_salary' },
    ]);

    await this.updateQueries(queryRunner, q, 'BOLETA_PAGO', [
      { Text: 'What is the net monthly income?', Alias: 'net_monthly_income' },
      { Text: 'What is the gross monthly income?', Alias: 'gross_monthly_income' },
      { Text: 'What is the total payroll deductions?', Alias: 'payroll_discounts' },
      { Text: 'What month does the payslip correspond to?', Alias: 'payslip_month' },
    ]);

    await this.updateQueries(queryRunner, q, 'EXTRACTO_BANCARIO', [
      { Text: 'What is the ending balance?', Alias: 'ending_balance' },
      { Text: 'What is the average monthly balance?', Alias: 'average_monthly_balance' },
      { Text: 'What is the total deposits?', Alias: 'total_deposits' },
      { Text: 'What is the total withdrawals or debits?', Alias: 'total_withdrawals' },
    ]);

    await this.updateQueries(queryRunner, q, 'FORMULARIO_SOLICITUD_CREDITO', [
      { Text: 'What is the requested loan amount?', Alias: 'requested_amount' },
      { Text: 'What is the requested loan term in months?', Alias: 'requested_term_months' },
      { Text: 'What is the loan purpose?', Alias: 'loan_purpose' },
      { Text: 'What is the declared property value?', Alias: 'property_value' },
    ]);

    await this.updateQueries(queryRunner, q, 'REPORTE_CREDITICIO_SIMULADO', [
      { Text: 'What is the total reported debt?', Alias: 'reported_total_debt' },
      { Text: 'What is the total monthly debt payment?', Alias: 'monthly_debt_payment' },
      { Text: 'How many active loans are there?', Alias: 'active_loan_count' },
      { Text: 'Are there late payments or delinquencies?', Alias: 'has_late_payments' },
    ]);
  }

  private async updateQueries(
    queryRunner: QueryRunner,
    quotedSchema: string,
    code: string,
    queries: Record<string, string>[],
  ) {
    await queryRunner.query(
      `UPDATE ${quotedSchema}."document_types" SET "queries" = $1::jsonb WHERE "code" = $2`,
      [JSON.stringify(queries), code],
    );
  }
}
