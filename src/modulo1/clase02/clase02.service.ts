import { Injectable } from '@nestjs/common';
import { Block } from '@aws-sdk/client-textract';
import { TextractService } from '../clase01/textract.service';

type FieldResult = {
  field: string;
  value: string;
  confidence: number;
};

type TableResult = {
  rows: string[][];
};

@Injectable()
export class Clase02Service {
  constructor(private readonly textract: TextractService) {}

  async analyzeForm(body: { fileName: string }) {
    const response = await this.textract.analyzeForm(body.fileName);
    const fields = this.parseKeyValues(response.Blocks ?? []);

    return {
      fileName: body.fileName,
      fieldCount: fields.length,
      fields,
    };
  }

  async analyzeId(body: { fileName: string }) {
    const response = await this.textract.analyzeId(body.fileName);
    const fields = (response.IdentityDocuments ?? [])
      .flatMap((document) => document.IdentityDocumentFields ?? [])
      .map((field) => ({
        field: field.Type?.Text ?? 'UNKNOWN',
        value: field.ValueDetection?.Text ?? '',
        confidence: field.ValueDetection?.Confidence ?? 0,
      }))
      .filter((field) => field.value);

    return {
      fileName: body.fileName,
      fieldCount: fields.length,
      fields,
    };
  }

  async analyzeStatement(body: { fileName: string }) {
    const response = await this.textract.analyzeStatement(body.fileName);
    const tables = this.parseTables(response.Blocks ?? []);

    return {
      fileName: body.fileName,
      tableCount: tables.length,
      tables,
    };
  }

  async analyzePayslip(body: { fileName: string }) {
    const response = await this.textract.analyzeExpense(body.fileName);
    const documents = response.ExpenseDocuments ?? [];

    const summary = documents.flatMap((document) =>
      (document.SummaryFields ?? []).map((field) => ({
        field: field.Type?.Text ?? field.LabelDetection?.Text ?? 'UNKNOWN',
        label: field.LabelDetection?.Text ?? '',
        value: field.ValueDetection?.Text ?? '',
        confidence: field.ValueDetection?.Confidence ?? 0,
      })),
    );

    const lineItems = documents.flatMap((document) =>
      (document.LineItemGroups ?? []).flatMap((group) =>
        (group.LineItems ?? []).map((item) =>
          (item.LineItemExpenseFields ?? []).map((field) => ({
            field: field.Type?.Text ?? field.LabelDetection?.Text ?? 'UNKNOWN',
            label: field.LabelDetection?.Text ?? '',
            value: field.ValueDetection?.Text ?? '',
            confidence: field.ValueDetection?.Confidence ?? 0,
          })),
        ),
      ),
    );

    return {
      fileName: body.fileName,
      summary,
      lineItems,
    };
  }

  private parseKeyValues(blocks: Block[]): FieldResult[] {
    const blockMap = new Map<string, Block>();
    for (const block of blocks) {
      if (block.Id) {
        blockMap.set(block.Id, block);
      }
    }

    const keyBlocks = blocks.filter(
      (block) =>
        block.BlockType === 'KEY_VALUE_SET' &&
        block.EntityTypes?.includes('KEY'),
    );

    return keyBlocks
      .map((keyBlock) => {
        const valueBlock = this.findValueBlock(keyBlock, blockMap);

        return {
          field: this.getTextFromBlock(keyBlock, blockMap),
          value: valueBlock ? this.getTextFromBlock(valueBlock, blockMap) : '',
          confidence: Math.min(
            keyBlock.Confidence ?? 0,
            valueBlock?.Confidence ?? keyBlock.Confidence ?? 0,
          ),
        };
      })
      .filter((item) => item.field || item.value);
  }

  private findValueBlock(keyBlock: Block, blockMap: Map<string, Block>) {
    const valueRelation = keyBlock.Relationships?.find(
      (relationship) => relationship.Type === 'VALUE',
    );
    const valueId = valueRelation?.Ids?.[0];
    return valueId ? blockMap.get(valueId) : undefined;
  }

  private parseTables(blocks: Block[]): TableResult[] {
    const blockMap = new Map<string, Block>();
    for (const block of blocks) {
      if (block.Id) {
        blockMap.set(block.Id, block);
      }
    }

    return blocks
      .filter((block) => block.BlockType === 'TABLE')
      .map((table) => {
        const childIds =
          table.Relationships?.find(
            (relationship) => relationship.Type === 'CHILD',
          )?.Ids ?? [];

        const cells = childIds
          .map((id) => blockMap.get(id))
          .filter((block): block is Block => block?.BlockType === 'CELL')
          .sort(
            (a, b) =>
              (a.RowIndex ?? 0) - (b.RowIndex ?? 0) ||
              (a.ColumnIndex ?? 0) - (b.ColumnIndex ?? 0),
          );

        const rows: string[][] = [];
        for (const cell of cells) {
          const rowIndex = (cell.RowIndex ?? 1) - 1;
          const columnIndex = (cell.ColumnIndex ?? 1) - 1;
          rows[rowIndex] ??= [];
          rows[rowIndex][columnIndex] = this.getTextFromBlock(cell, blockMap);
        }

        return { rows };
      });
  }

  private getTextFromBlock(block: Block, blockMap: Map<string, Block>): string {
    const childIds =
      block.Relationships?.find((relationship) => relationship.Type === 'CHILD')
        ?.Ids ?? [];

    return childIds
      .map((id) => blockMap.get(id))
      .filter((child): child is Block => Boolean(child))
      .map((child) => {
        if (child.BlockType === 'WORD') {
          return child.Text ?? '';
        }
        if (
          child.BlockType === 'SELECTION_ELEMENT' &&
          child.SelectionStatus === 'SELECTED'
        ) {
          return 'X';
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
}
