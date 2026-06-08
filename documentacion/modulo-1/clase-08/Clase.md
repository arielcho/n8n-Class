# Clase 8: SageMaker Endpoints y evaluación automática del file

| | |
|---|---|
| **Clase** | 8 de 11 |
| **Duración** | 3 horas |
| **Controlador** | `Clase08Controller` |
| **Endpoints** | `POST /modulo1/clase08/credit-files/:applicationId/evaluate`, `POST /modulo1/clase08/models/risk`, `POST /modulo1/clase08/models/amount` |

## Objetivos

Al terminar esta sesión podrás:

- Entender qué es un endpoint de inferencia en SageMaker.
- Invocar el modelo de riesgo y el modelo de monto desde NestJS.
- Evaluar automáticamente un file ya registrado en base de datos.
- Combinar dos predicciones en una respuesta final.
- Preparar el resultado para explicabilidad con Clarify.

---

## Parte teórica

### Entrenar no es lo mismo que inferir

| Acción | Qué hace |
|--------|----------|
| Entrenamiento | Aprende patrones desde datos históricos o sintéticos |
| Inferencia | Usa un modelo entrenado para evaluar un caso nuevo |

En esta clase ya no entrenamos. Usamos los modelos entrenados en Clase 6 y 7.

### Evaluación final del file

Entrada:

```txt
applicationId
```

El backend busca las features en `credit_feature_sets`, invoca ambos modelos y devuelve:

```json
{
  "risk": {
    "probability": 0.18,
    "level": "LOW"
  },
  "amount": {
    "requested": 450000,
    "recommended": 420000
  },
  "decision": "REVIEW"
}
```

Importante: el `featuresPayload` debe conservar tanto las variables derivadas de Clase 5 como los campos base que necesita el modelo de monto: ingreso, deuda mensual, valor del inmueble, monto solicitado y plazo.

---

## Parte práctica

### 1. Despliega endpoints en SageMaker

Nombres sugeridos:

```env
SAGEMAKER_ENDPOINT_RISK=credit-risk-classifier
SAGEMAKER_ENDPOINT_AMOUNT=credit-amount-regressor
```

En SageMaker:

1. Crea modelo desde el artefacto de Clase 6.
2. Crea endpoint config.
3. Crea endpoint `credit-risk-classifier`.
4. Repite para el modelo de Clase 7 con `credit-amount-regressor`.
5. Espera estado `InService`.

### 2. Instala SDK runtime

```bash
npm install @aws-sdk/client-sagemaker-runtime
```

### 3. Crea `SageMakerRuntimeService`

Archivo: `src/modulo1/clase08/sagemaker-runtime.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InvokeEndpointCommand,
  SageMakerRuntimeClient,
} from '@aws-sdk/client-sagemaker-runtime';

@Injectable()
export class SageMakerRuntimeService {
  private readonly client: SageMakerRuntimeClient;

  constructor(private readonly config: ConfigService) {
    this.client = new SageMakerRuntimeClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async invoke(endpointName: string, values: number[]) {
    const response = await this.client.send(
      new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: 'text/csv',
        Body: Buffer.from(values.join(',')),
      }),
    );

    const text = Buffer.from(response.Body!).toString('utf-8');
    return Number(text.trim());
  }
}
```

### 4. Crea `Clase08Service`

Archivo: `src/modulo1/clase08/clase08.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditFeatureSet } from '../../entities/credit-feature-set.entity';
import { SageMakerRuntimeService } from './sagemaker-runtime.service';

@Injectable()
export class Clase08Service {
  constructor(
    private readonly config: ConfigService,
    private readonly runtime: SageMakerRuntimeService,
    @InjectRepository(CreditFeatureSet)
    private readonly featureSets: Repository<CreditFeatureSet>,
  ) {}

  async evaluateCreditFile(applicationId: string) {
    const featureSet = await this.featureSets.findOne({ where: { applicationId } });
    if (!featureSet) {
      throw new NotFoundException('Features not found. Run Clase 5 first.');
    }

    const features = featureSet.featuresPayload as Record<string, number>;
    this.assertRequiredFeatures(features);
    const riskProbability = await this.predictRisk(features);
    const recommendedAmount = await this.predictAmount(features);
    const requestedAmount = Number(features.requested_amount ?? 0);

    return {
      applicationId,
      risk: {
        probability: riskProbability,
        level: riskProbability >= 0.6 ? 'HIGH' : riskProbability >= 0.35 ? 'MEDIUM' : 'LOW',
      },
      amount: {
        requested: requestedAmount,
        recommended: recommendedAmount,
      },
      decision: this.makeDecision(riskProbability, requestedAmount, recommendedAmount),
    };
  }

  async predictRisk(features: Record<string, number>) {
    const values = [
      features.debt_to_income_ratio,
      features.loan_to_value_ratio,
      features.payment_to_income_ratio,
      features.employment_stability_score,
      features.banking_capacity_score,
      features.credit_history_score,
    ].map(Number);

    return await this.runtime.invoke(
      this.config.getOrThrow<string>('SAGEMAKER_ENDPOINT_RISK'),
      values,
    );
  }

  async predictAmount(features: Record<string, number>) {
    const values = [
      features.net_monthly_income,
      features.monthly_debt_payment,
      features.property_value,
      features.requested_amount,
      features.requested_term_months,
      features.debt_to_income_ratio,
      features.loan_to_value_ratio,
      features.payment_to_income_ratio,
      features.employment_stability_score,
      features.banking_capacity_score,
      features.credit_history_score,
    ].map(Number);

    return await this.runtime.invoke(
      this.config.getOrThrow<string>('SAGEMAKER_ENDPOINT_AMOUNT'),
      values,
    );
  }

  private makeDecision(riskProbability: number, requested: number, recommended: number) {
    if (riskProbability >= 0.6) return 'REJECT_OR_MANUAL_REVIEW';
    if (requested > recommended) return 'REVIEW_AMOUNT';
    return 'PRE_APPROVE_FOR_REVIEW';
  }

  private assertRequiredFeatures(features: Record<string, number>) {
    const required = [
      'net_monthly_income',
      'monthly_debt_payment',
      'property_value',
      'requested_amount',
      'requested_term_months',
      'debt_to_income_ratio',
      'loan_to_value_ratio',
      'payment_to_income_ratio',
      'employment_stability_score',
      'banking_capacity_score',
      'credit_history_score',
    ];

    const missing = required.filter((key) => features[key] === undefined || features[key] === null);
    if (missing.length) {
      throw new NotFoundException(`Missing features: ${missing.join(', ')}`);
    }
  }
}
```

### 5. Crea el controller

Archivo: `src/modulo1/clase08/clase08.controller.ts`

```typescript
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Clase08Service } from './clase08.service';

@Controller('modulo1/clase08')
@UseGuards(ApiKeyGuard)
export class Clase08Controller {
  constructor(private readonly clase08: Clase08Service) {}

  @Post('credit-files/:applicationId/evaluate')
  async evaluateCreditFile(@Param('applicationId') applicationId: string) {
    return await this.clase08.evaluateCreditFile(applicationId);
  }

  @Post('models/risk')
  async predictRisk(@Body() body: { features: Record<string, number> }) {
    return { probability: await this.clase08.predictRisk(body.features) };
  }

  @Post('models/amount')
  async predictAmount(@Body() body: { features: Record<string, number> }) {
    return { recommendedAmount: await this.clase08.predictAmount(body.features) };
  }
}
```

### 6. Actualiza `Modulo1Module`

Agrega:

```typescript
import { CreditFeatureSet } from '../entities/credit-feature-set.entity';
import { Clase08Controller } from './clase08/clase08.controller';
import { Clase08Service } from './clase08/clase08.service';
import { SageMakerRuntimeService } from './clase08/sagemaker-runtime.service';
```

Incluye `CreditFeatureSet` en `TypeOrmModule.forFeature([...])`.

### 7. Prueba

```bash
curl -X POST http://localhost:3000/modulo1/clase08/credit-files/APPLICATION_ID/evaluate \
  -H "x-api-key: test1" \
  -H "x-api-secret: pass1"
```

## Recursos

- [SageMaker real-time endpoints](https://docs.aws.amazon.com/sagemaker/latest/dg/realtime-endpoints.html)
- [InvokeEndpoint](https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_runtime_InvokeEndpoint.html)
- [SageMaker pricing](https://aws.amazon.com/sagemaker/pricing/)
