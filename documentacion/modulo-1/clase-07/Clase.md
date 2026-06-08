# Clase 7: SageMaker y modelo de monto recomendado con XGBoost

| | |
|---|---|
| **Clase** | 7 de 11 |
| **Duración** | 3 horas |
| **Controlador** | `Clase07Controller` |
| **Endpoints** | `POST /modulo1/clase07/sagemaker/train-amount`, `GET /modulo1/clase07/sagemaker/train-amount/:jobName`, `GET /modulo1/clase07/sagemaker/models/amount/metrics`, `GET /modulo1/clase07/sagemaker/models/compare` |

## Objetivos

Al terminar esta sesión podrás:

- Diferenciar clasificación y regresión con el mismo caso hipotecario.
- Entrenar un modelo de **regresión** para monto recomendado.
- Usar XGBoost con datos tabulares de crédito.
- Probar el entrenamiento desde notebook y desde NestJS.
- Comparar métricas del modelo de riesgo y del modelo de monto.

---

## Parte teórica

### Qué responde este modelo

Clase 6:

```txt
¿Cuál es el riesgo de incumplimiento?
```

Clase 7:

```txt
¿Qué monto recomendado tiene sentido para este file?
```

Por eso este modelo es de **regresión**: devuelve un número.

### XGBoost

XGBoost construye muchos árboles pequeños. Cada árbol intenta corregir errores de los anteriores. Es fuerte para datos tabulares y relaciones no lineales.

Entrada:

```json
{
  "net_monthly_income": 8500,
  "monthly_debt_payment": 1800,
  "property_value": 600000,
  "requested_amount": 450000,
  "credit_history_score": 90
}
```

Salida:

```json
{
  "recommended_amount": 420000
}
```

### Métricas de regresión

| Métrica | Qué indica |
|---------|------------|
| RMSE | Error promedio penalizando errores grandes |
| MAE | Error absoluto promedio |
| R2 | Qué tanto explica el modelo la variación del monto |

No usamos AUC ni KS aquí porque esas son métricas de clasificación.

---

## Parte práctica

### 1. Notebook en SageMaker Studio

Usa el mismo dataset sintético generado en Clase 6:

```python
import pandas as pd

df = pd.read_csv("s3://TU_BUCKET/ml/synthetic/synthetic_mortgage_dataset.csv")
```

Entrena XGBoost:

```python
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

features = [
    "net_monthly_income",
    "monthly_debt_payment",
    "property_value",
    "requested_amount",
    "requested_term_months",
    "debt_to_income_ratio",
    "loan_to_value_ratio",
    "payment_to_income_ratio",
    "employment_stability_score",
    "banking_capacity_score",
    "credit_history_score",
]

X = df[features]
y = df["recommended_amount"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = XGBRegressor(
    objective="reg:squarederror",
    n_estimators=180,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    random_state=42,
)

model.fit(X_train, y_train)
predictions = model.predict(X_test)

print("RMSE:", mean_squared_error(y_test, predictions, squared=False))
print("MAE:", mean_absolute_error(y_test, predictions))
print("R2:", r2_score(y_test, predictions))
```

### 2. Entrenamiento como script

Usa el archivo de raíz:

```txt
train_amount_xgboost.py
```

En local:

```bash
python train_amount_xgboost.py \
  --train synthetic_mortgage_dataset.csv \
  --model-dir model-amount \
  --metrics amount_metrics.json
```

Sube las métricas al bucket para que la API pueda leerlas:

```bash
aws s3 cp amount_metrics.json s3://TU_BUCKET/ml/metrics/amount_metrics.json
```

### 3. Variables de entorno

```env
SAGEMAKER_AMOUNT_TRAINING_IMAGE=
SAGEMAKER_AMOUNT_METRICS_KEY=ml/metrics/amount_metrics.json
```

Esta clase reutiliza `SAGEMAKER_BUCKET` y `SAGEMAKER_ROLE_ARN` configurados en la Clase 6.

Igual que en la clase anterior, `SAGEMAKER_AMOUNT_TRAINING_IMAGE` debe apuntar a una imagen capaz de ejecutar `train_amount_xgboost.py` si vas a lanzar el entrenamiento desde el endpoint de NestJS.

### 4. Extiende `SageMakerTrainingService`

Archivo: `src/modulo1/clase06/sagemaker-training.service.ts`

```typescript
  async startAmountTraining() {
    const bucket = this.config.getOrThrow<string>('SAGEMAKER_BUCKET');
    const jobName = `amount-xgboost-${Date.now()}`;

    await this.client.send(
      new CreateTrainingJobCommand({
        TrainingJobName: jobName,
        RoleArn: this.config.getOrThrow<string>('SAGEMAKER_ROLE_ARN'),
        AlgorithmSpecification: {
          TrainingImage: this.config.getOrThrow<string>('SAGEMAKER_AMOUNT_TRAINING_IMAGE'),
          TrainingInputMode: 'File',
        },
        InputDataConfig: [
          {
            ChannelName: 'train',
            DataSource: {
              S3DataSource: {
                S3DataType: 'S3Prefix',
                S3Uri: `s3://${bucket}/ml/synthetic/`,
                S3DataDistributionType: 'FullyReplicated',
              },
            },
          },
        ],
        OutputDataConfig: {
          S3OutputPath: `s3://${bucket}/ml/models/amount/`,
        },
        ResourceConfig: {
          InstanceType: 'ml.m5.large',
          InstanceCount: 1,
          VolumeSizeInGB: 10,
        },
        StoppingCondition: {
          MaxRuntimeInSeconds: 3600,
        },
      }),
    );

    return { jobName };
  }
```

### 5. Crea `Clase07Service`

Archivo: `src/modulo1/clase07/clase07.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SageMakerTrainingService } from '../clase06/sagemaker-training.service';

@Injectable()
export class Clase07Service {
  private readonly s3: S3Client;

  constructor(
    private readonly config: ConfigService,
    private readonly training: SageMakerTrainingService,
  ) {
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async startAmountTraining() {
    return await this.training.startAmountTraining();
  }

  async getAmountTrainingStatus(jobName: string) {
    return await this.training.describeTrainingJob(jobName);
  }

  async getAmountMetrics() {
    return await this.readJson(this.config.getOrThrow<string>('SAGEMAKER_AMOUNT_METRICS_KEY'));
  }

  async compareModels() {
    return {
      riskModel: await this.readJson(this.config.getOrThrow<string>('SAGEMAKER_RISK_METRICS_KEY')),
      amountModel: await this.getAmountMetrics(),
    };
  }

  private async readJson(key: string) {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.config.getOrThrow<string>('SAGEMAKER_BUCKET'),
        Key: key,
      }),
    );

    return JSON.parse(await response.Body!.transformToString());
  }
}
```

### 6. Crea el controller

Archivo: `src/modulo1/clase07/clase07.controller.ts`

```typescript
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Clase07Service } from './clase07.service';

@Controller('modulo1/clase07')
@UseGuards(ApiKeyGuard)
export class Clase07Controller {
  constructor(private readonly clase07: Clase07Service) {}

  @Post('sagemaker/train-amount')
  async trainAmount() {
    return await this.clase07.startAmountTraining();
  }

  @Get('sagemaker/train-amount/:jobName')
  async getTrainingStatus(@Param('jobName') jobName: string) {
    return await this.clase07.getAmountTrainingStatus(jobName);
  }

  @Get('sagemaker/models/amount/metrics')
  async getAmountMetrics() {
    return await this.clase07.getAmountMetrics();
  }

  @Get('sagemaker/models/compare')
  async compareModels() {
    return await this.clase07.compareModels();
  }
}
```

### 7. Actualiza `Modulo1Module`

Agrega `Clase07Controller` y `Clase07Service`. Mantén `SageMakerTrainingService`.

## Recursos

- [XGBoost en SageMaker](https://docs.aws.amazon.com/sagemaker/latest/dg/xgboost.html)
- [XGBRegressor](https://xgboost.readthedocs.io/)
- [Regression metrics](https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics)
