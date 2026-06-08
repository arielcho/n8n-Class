# Clase 6: SageMaker, Machine Learning básico y modelo de riesgo

| | |
|---|---|
| **Clase** | 6 de 11 |
| **Duración** | 3 horas |
| **Controlador** | `Clase06Controller` |
| **Endpoints** | `POST /modulo1/clase06/sagemaker/train-risk`, `GET /modulo1/clase06/sagemaker/train-risk/:jobName`, `GET /modulo1/clase06/sagemaker/models/risk/metrics` |

## Objetivos

Al terminar esta sesión podrás:

- Entender la diferencia entre clasificación, regresión y clustering.
- Entrenar un modelo de **clasificación** de riesgo con regresión logística.
- Generar datos sintéticos coherentes con crédito hipotecario.
- Ejecutar el entrenamiento desde notebook de SageMaker y desde NestJS.
- Consultar métricas del modelo desde la API.

---

## Parte teórica

### Tipos comunes de modelos

| Tipo | Pregunta que responde | Ejemplo |
|------|------------------------|---------|
| Clasificación | ¿A qué clase pertenece? | Riesgo alto o bajo |
| Regresión | ¿Qué valor numérico tendrá? | Monto recomendado |
| Clustering | ¿Qué grupos naturales existen? | Segmentos de clientes |

En esta clase usamos **clasificación**:

```txt
¿Este file tiene riesgo alto de incumplimiento?
```

### Regresión logística

La regresión logística se llama "regresión", pero normalmente se usa para **clasificación binaria**.

Entrada:

```json
{
  "debt_to_income_ratio": 0.38,
  "loan_to_value_ratio": 0.76,
  "payment_to_income_ratio": 0.30,
  "employment_stability_score": 80,
  "banking_capacity_score": 75,
  "credit_history_score": 90
}
```

Salida:

```json
{
  "risk_probability": 0.18,
  "risk_level": "LOW"
}
```

### Datos sintéticos

No tenemos datos históricos reales. Por eso generamos un dataset sintético con reglas explicables:

- mayor deuda sobre ingreso aumenta riesgo;
- mayor cuota estimada sobre ingreso aumenta riesgo;
- mora previa aumenta riesgo;
- más estabilidad laboral reduce riesgo;
- mejor historial reduce riesgo.

Esto no representa una política bancaria real. Sirve para aprender el flujo de ML.

---

## Parte práctica

### 1. Genera el dataset sintético

En la raíz del proyecto usa el archivo:

```txt
generate_synthetic_mortgage_dataset.py
```

Ejecuta:

```bash
python generate_synthetic_mortgage_dataset.py --rows 2000 --output synthetic_mortgage_dataset.csv
```

Sube el CSV a S3:

```txt
s3://TU_BUCKET/ml/synthetic/synthetic_mortgage_dataset.csv
```

### 2. Notebook en SageMaker Studio

En SageMaker Studio crea un notebook y ejecuta:

```python
import pandas as pd

df = pd.read_csv("s3://TU_BUCKET/ml/synthetic/synthetic_mortgage_dataset.csv")
df.head()
```

Revisa las columnas:

```python
df[[
    "debt_to_income_ratio",
    "loan_to_value_ratio",
    "payment_to_income_ratio",
    "employment_stability_score",
    "banking_capacity_score",
    "credit_history_score",
    "default_flag",
]].describe()
```

Entrena:

```python
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, confusion_matrix

features = [
    "debt_to_income_ratio",
    "loan_to_value_ratio",
    "payment_to_income_ratio",
    "employment_stability_score",
    "banking_capacity_score",
    "credit_history_score",
]

X = df[features]
y = df["default_flag"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = Pipeline([
    ("scaler", StandardScaler()),
    ("logistic", LogisticRegression(class_weight="balanced", max_iter=1000)),
])

model.fit(X_train, y_train)
probabilities = model.predict_proba(X_test)[:, 1]
predictions = (probabilities >= 0.5).astype(int)

auc = roc_auc_score(y_test, probabilities)
print("AUC:", auc)
print(confusion_matrix(y_test, predictions))
```

### 3. Entrenamiento como script

Usa el archivo de raíz:

```txt
train_risk_logistic.py
```

En local:

```bash
python train_risk_logistic.py \
  --train synthetic_mortgage_dataset.csv \
  --model-dir model-risk \
  --metrics risk_metrics.json
```

En SageMaker, ese archivo se puede usar como script de entrenamiento de scikit-learn.

Sube las métricas al bucket para que la API pueda leerlas:

```bash
aws s3 cp risk_metrics.json s3://TU_BUCKET/ml/metrics/risk_metrics.json
```

### 4. Instala SDK y variables de entorno

Instala el SDK de SageMaker:

```bash
npm install @aws-sdk/client-sagemaker
```

Agrega:

```env
SAGEMAKER_RISK_TRAINING_IMAGE=
SAGEMAKER_ROLE_ARN=
SAGEMAKER_BUCKET=
SAGEMAKER_RISK_METRICS_KEY=ml/metrics/risk_metrics.json
```

El endpoint de NestJS usa `CreateTrainingJob`. Para que ese entrenamiento ejecute `train_risk_logistic.py`, la imagen indicada en `SAGEMAKER_RISK_TRAINING_IMAGE` debe contener o ejecutar ese script. En el notebook puedes entrenar primero de forma manual; luego el endpoint reproduce el patrón asíncrono de entrenamiento.

### 5. Crea `SageMakerTrainingService`

Archivo: `src/modulo1/clase06/sagemaker-training.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateTrainingJobCommand,
  DescribeTrainingJobCommand,
  SageMakerClient,
} from '@aws-sdk/client-sagemaker';

@Injectable()
export class SageMakerTrainingService {
  private readonly client: SageMakerClient;

  constructor(private readonly config: ConfigService) {
    this.client = new SageMakerClient({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async startRiskTraining() {
    const bucket = this.config.getOrThrow<string>('SAGEMAKER_BUCKET');
    const jobName = `risk-logistic-${Date.now()}`;

    await this.client.send(
      new CreateTrainingJobCommand({
        TrainingJobName: jobName,
        RoleArn: this.config.getOrThrow<string>('SAGEMAKER_ROLE_ARN'),
        AlgorithmSpecification: {
          TrainingImage: this.config.getOrThrow<string>('SAGEMAKER_RISK_TRAINING_IMAGE'),
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
          S3OutputPath: `s3://${bucket}/ml/models/risk/`,
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

  async describeTrainingJob(jobName: string) {
    const response = await this.client.send(
      new DescribeTrainingJobCommand({ TrainingJobName: jobName }),
    );

    return {
      jobName,
      status: response.TrainingJobStatus,
      failureReason: response.FailureReason,
    };
  }
}
```

### 6. Crea `Clase06Service`

Archivo: `src/modulo1/clase06/clase06.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SageMakerTrainingService } from './sagemaker-training.service';

@Injectable()
export class Clase06Service {
  private readonly s3: S3Client;

  constructor(
    private readonly config: ConfigService,
    private readonly training: SageMakerTrainingService,
  ) {
    this.s3 = new S3Client({
      region: this.config.getOrThrow<string>('AWS_REGION'),
    });
  }

  async startRiskTraining() {
    return await this.training.startRiskTraining();
  }

  async getRiskTrainingStatus(jobName: string) {
    return await this.training.describeTrainingJob(jobName);
  }

  async getRiskMetrics() {
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.config.getOrThrow<string>('SAGEMAKER_BUCKET'),
        Key: this.config.getOrThrow<string>('SAGEMAKER_RISK_METRICS_KEY'),
      }),
    );

    return JSON.parse(await response.Body!.transformToString());
  }
}
```

### 7. Crea el controller

Archivo: `src/modulo1/clase06/clase06.controller.ts`

```typescript
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { Clase06Service } from './clase06.service';

@Controller('modulo1/clase06')
@UseGuards(ApiKeyGuard)
export class Clase06Controller {
  constructor(private readonly clase06: Clase06Service) {}

  @Post('sagemaker/train-risk')
  async trainRisk() {
    return await this.clase06.startRiskTraining();
  }

  @Get('sagemaker/train-risk/:jobName')
  async getTrainingStatus(@Param('jobName') jobName: string) {
    return await this.clase06.getRiskTrainingStatus(jobName);
  }

  @Get('sagemaker/models/risk/metrics')
  async getRiskMetrics() {
    return await this.clase06.getRiskMetrics();
  }
}
```

### 8. Actualiza `Modulo1Module`

Agrega `Clase06Controller`, `Clase06Service` y `SageMakerTrainingService`.

### 9. Prueba

```bash
curl -X POST http://localhost:3000/modulo1/clase06/sagemaker/train-risk \
  -H "x-api-key: test1" \
  -H "x-api-secret: pass1"
```

```bash
curl http://localhost:3000/modulo1/clase06/sagemaker/train-risk/JOB_NAME \
  -H "x-api-key: test1" \
  -H "x-api-secret: pass1"
```

## Recursos

- [Amazon SageMaker](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html)
- [Scikit-learn LogisticRegression](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
- [SageMaker Training Jobs](https://docs.aws.amazon.com/sagemaker/latest/dg/how-it-works-training.html)
