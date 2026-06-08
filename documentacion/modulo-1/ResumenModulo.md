# Módulo 1: De Documentos a Decisiones

**La ruta inteligente para la evaluación crediticia**


## Resumen del módulo (visión global)

Aprenderás a construir un **flujo de evaluación crediticia** sobre AWS, expuesto como **API REST en NestJS**:

1. **Extraer** datos de documentos bancarios reales (solicitudes, identidad, estados de cuenta, colillas) con **Amazon Textract** y S3.
2. **Transformar y limpiar** esos datos con **AWS Glue** (PySpark), generando un dataset en Parquet listo para machine learning.
3. **Entrenar y desplegar** dos modelos en **SageMaker**: uno para **riesgo de mora** (regresión logística) y otro para **monto de crédito** (XGBoost).
4. **Explicar** las decisiones con **SageMaker Clarify** (SHAP), en lenguaje útil para riesgo y cumplimiento (**ASFI Bolivia**).
5. **Integrar** todo en endpoints de justificación y un pipeline end-to-end, desplegable en **Docker / Render**.


---

## Documentos de referencia para el caso de crédito

Durante el módulo trabajaremos con documentos similares a los que suelen aparecer en un trámite de crédito bancario o crédito de vivienda. La idea es usarlos como **documentos de práctica** para extracción, limpieza, validación y modelado.



### Documentos que pueden formar parte del expediente

| Categoría | Documentos posibles | Uso en el curso |
|-----------|---------------------|-----------------|
| Identidad | Documento de identidad del solicitante y cónyuge | `AnalyzeID`, validación de identidad |
| Solicitud | Formulario de solicitud de crédito | FORMS, pares clave-valor |
| Situación familiar | Certificado de soltería o documento equivalente, si corresponde | Validación complementaria |
| Ingresos dependientes | Boletas de salario, certificado de trabajo, extracto de Gestora/AFP, extractos de cuenta sueldo | Extracción de ingresos y antigüedad laboral |
| Ingresos independientes | NIT, licencia de funcionamiento, formularios de impuestos, extractos bancarios | Respaldo de actividad económica e ingresos |
| Historial financiero | Extractos de deudas, comprobantes de pago, reporte de obligaciones | Cálculo de endeudamiento |
| Vivienda social | Certificado de no propiedad o declaración jurada de única vivienda | Validación de elegibilidad |
| Inmueble / garantía | Título de propiedad, folio real actualizado, tradicional decenal, plano de ubicación, certificado catastral | Análisis de garantía hipotecaria |
| Impuestos del inmueble | Comprobantes de pago de impuestos de gestiones anteriores | Verificación documental |
| Vendedor | Documento de identidad de vendedores | Validación de partes |
| Valoración | Avalúo del inmueble o presupuesto de obra | Estimación de valor y monto financiable |

### Ejemplos útiles para crear documentos de laboratorio

- Solicitud de crédito hipotecario.
- Documento de identidad.
- Certificado de trabajo.
- Boleta de pago.
- Extracto de cuenta bancaria.
- Formulario de impuestos o constancia NIT.
- Certificado de no propiedad.
- Folio real.
- Certificado catastral.
- Comprobante de pago de impuestos del inmueble.
- Avalúo del inmueble o presupuesto de obra.

Estos documentos permitirán practicar distintas capacidades de Textract:

- texto simple (`DetectDocumentText`);
- formularios y pares clave-valor (`AnalyzeDocument` con FORMS);
- tablas (`AnalyzeDocument` con TABLES);
- documentos de identidad (`AnalyzeID`);
- documentos personalizados con consultas (`Queries`).

---

## Unidades y tecnologías

| # | Unidad | Clases | Horas (este curso) | Tecnologías |
|---|--------|--------|-------------------|-------------|
| 1 | Amazon Textract con NestJS | 1–3 | 9 h | Amazon Textract, NestJS, AWS S3 |
| 2 | Transformación con AWS Glue | 4–5 | 6 h | AWS Glue, PySpark, Amazon Athena, S3 |
| 3 | Modelado con SageMaker | 6–8 | 9 h | SageMaker Studio, Scikit-learn, XGBoost |
| 4 | Explicabilidad con SageMaker Clarify | 9–11 | 8 h | SageMaker Clarify, SHAP, NestJS |


---

## Qué verás en cada clase

### Unidad 1 — Amazon Textract con NestJS (clases 1–3)

Extraer datos de documentos bancarios y exponerlos vía API REST.

#### Clase 1 — Introducción a AWS Textract y configuración del entorno · 3 h

| | |
|---|---|
| **Controlador** | `Clase01Controller` — `POST /modulo1/clase01/textract/text` |

**Objetivos:** Comprender Textract y su uso en banca; configurar NestJS para consumir la API; primera extracción de texto de un documento simple.

**Teoría:** Qué es Textract (`DetectDocumentText`, `AnalyzeDocument`, `AnalyzeExpense`, `AnalyzeID`); OCR tradicional vs análisis inteligente; tipos de documentos bancarios; precios; arquitectura NestJS (módulos, servicios, inyección de dependencias).

**Práctica:** Proyecto NestJS; `@aws-sdk/client-textract` y S3; `TextractService`; subir PDF a S3; `DetectDocumentText`; parsear bloques `LINE`/`WORD`; endpoint REST; actividad con documento propio.

---

#### Clase 2 — Formularios, identidades, tablas y documentos financieros · 3 h

| | |
|---|---|
| **Controlador** | `Clase02Controller` |

**Endpoints:** `POST .../textract/form` (FORMS), `.../id` (AnalyzeID), `.../statement` (TABLES), `.../payslip` (AnalyzeExpense).

**Objetivos:** Pares clave-valor en formularios; documentos de identidad; tablas en estados de cuenta; colillas con AnalyzeExpense; un endpoint por tipo de documento.

**Teoría:** Bloques `PAGE`, `LINE`, `WORD`, `KEY_VALUE_SET`, `TABLE`, `CELL`; `FeatureTypes` FORMS y TABLES; campos AnalyzeID; AnalyzeExpense (LineItem, Summary, Vendor); confianza y umbrales; procesamiento asíncrono `StartDocumentAnalysis` para documentos grandes.

**Práctica:** `parseKeyValues()`, `parseTable()`; mapeo de cédula/ID; cuatro endpoints; pruebas Postman con documentos reales; comparar casos de baja confianza.

---

#### Clase 3 — Textract Queries y expediente hipotecario · 3 h

| | |
|---|---|
| **Controlador** | `Clase03Controller` |

**Endpoints:** `POST .../credit-files`, `POST .../credit-files/:applicationId/process`, `GET .../credit-files/:applicationId`.

**Objetivos:** Crear el file del cliente; registrar documentos de un crédito hipotecario; usar Textract Queries para extraer datos personales, laborales, ingresos, banca, solicitud y endeudamiento; guardar resultados en base de datos.

**Teoría:** Queries vs `AnalyzeID`; limitaciones del carné boliviano con `AnalyzeID`; diseño de queries por documento; modelo de datos para solicitudes, documentos, resultados, respuestas y datos consolidados.

**Práctica:** Migraciones y entidades para `credit_applications`, `application_documents`, `textract_results`, `textract_query_answers` y `application_extracted_data`; `Clase03Service`; creación y procesamiento del expediente hipotecario.

---

### Unidad 2 — Transformación con AWS Glue (clases 4–5)

Refinar datos extraídos: limpieza, normalización y feature engineering para ML.

#### Clase 4 — AWS Glue para limpiar el expediente hipotecario · 3 h

| | |
|---|---|
| **Controlador** | `Clase04Controller` |

**Endpoints:** `POST .../credit-files`, `POST .../credit-files/clean`, `GET .../credit-files/:applicationId/clean-status`.

**Objetivos:** Usar Glue para limpiar y homologar los datos extraídos; convertir fechas, montos y booleanos; registrar un perfil limpio del cliente.

**Teoría:** Glue como capa de transformación; patrón asíncrono con `StartJobRun` y `GetJobRun`; diferencia entre extracción y limpieza; calidad de datos y campos faltantes.

**Práctica:** Endpoint unificado que recibe documentos, crea el expediente, procesa Textract y lanza Glue; script Python Shell para normalizar datos; tabla `clean_credit_profiles`; polling del job.

---

#### Clase 5 — Transformación avanzada y feature engineering con Glue · 3 h

| | |
|---|---|
| **Controlador** | `Clase05Controller` |

**Endpoints:** `POST .../credit-files/features`, `GET .../credit-files/:applicationId/features-status`, `GET .../credit-files/:applicationId/features`.

**Objetivos:** Crear variables derivadas para crédito hipotecario; generar un set de features por expediente; preparar datos para SageMaker.

**Teoría:** Feature engineering; ratios y scores sintéticos; diferencia entre datos limpios, features y etiquetas; advertencia sobre reglas didácticas no bancarias.

**Práctica:** Job Glue para generar `debt_to_income_ratio`, `loan_to_value_ratio`, `payment_to_income_ratio`, `employment_stability_score`, `banking_capacity_score`, `credit_history_score` y `synthetic_risk_label`; guardar en `credit_feature_sets`.

---

### Unidad 3 — Modelado con SageMaker (clases 6–8)

Entrenar y desplegar modelos de riesgo y monto de crédito.

#### Clase 6 — SageMaker, Machine Learning básico y modelo de riesgo · 3 h

| | |
|---|---|
| **Controlador** | `Clase06Controller` |

**Endpoints:** `POST .../sagemaker/train-risk`, `GET .../train-risk/:jobName`, `GET .../models/risk/metrics`.

**Objetivos:** Introducir clasificación, regresión y clustering; generar datos sintéticos coherentes con crédito hipotecario; entrenar regresión logística para riesgo.

**Teoría:** Tipos de modelos de ML; regresión logística como clasificador; datos sintéticos explicables; AUC, matriz de confusión, precision y recall.

**Práctica:** `generate_synthetic_mortgage_dataset.py`; notebook en SageMaker; `train_risk_logistic.py`; endpoints NestJS para training job, estado y métricas.

---

#### Clase 7 — SageMaker y modelo de monto recomendado con XGBoost · 3 h

| | |
|---|---|
| **Controlador** | `Clase07Controller` |

**Endpoints:** `POST .../sagemaker/train-amount`, `GET .../train-amount/:jobName`, `GET .../models/amount/metrics`, `GET .../models/compare`.

**Objetivos:** Entrenar un modelo de regresión para monto recomendado; comparar clasificación vs regresión; usar XGBoost con datos tabulares.

**Teoría:** Regresión como predicción numérica; gradient boosting; XGBoost; RMSE, MAE y R2; diferencia entre métricas de clasificación y regresión.

**Práctica:** Notebook SageMaker con XGBoost; `train_amount_xgboost.py`; endpoints para iniciar entrenamiento, consultar estado, leer métricas y comparar ambos modelos.

---

#### Clase 8 — SageMaker Endpoints y evaluación automática del file · 3 h

| | |
|---|---|
| **Controlador** | `Clase08Controller` |

**Endpoints:** `POST .../credit-files/:applicationId/evaluate`, `POST .../models/risk`, `POST .../models/amount`.

**Objetivos:** Desplegar ambos modelos como endpoints; invocarlos desde NestJS; evaluar un file ya registrado usando sus features.

**Teoría:** Entrenamiento vs inferencia; SageMaker real-time endpoints; orden de features; costos; decisión combinada didáctica.

**Práctica:** `SageMakerRuntimeService`; `InvokeEndpoint`; buscar `credit_feature_sets` por `applicationId`; invocar riesgo y monto; devolver `PRE_APPROVE_FOR_REVIEW`, `REVIEW_AMOUNT` o `REJECT_OR_MANUAL_REVIEW`.

---

### Unidad 4 — Explicabilidad con SageMaker Clarify (clases 9–11)

SHAP, transparencia y cumplimiento; API de justificación e integración final.

#### Clase 9 — Clarify: explicabilidad del modelo de clasificación · 3 h

| | |
|---|---|
| **Controlador** | `Clase09Controller` |

**Endpoints:** `POST .../explain/risk/run`, `GET .../explain/risk/report`, `POST .../explain/risk/case`.

**Objetivos:** SHAP en crédito; Clarify para Modelo 1; interpretación bajo requisitos ASFI.

**Teoría:** Explicabilidad en banca (ASFI, Ley 393); SHAP global vs local; summary plot, force plot; sesgos (DPL, DI, DPPL).

**Práctica:** `SageMakerClarifyProcessor`; baseline; reportes en S3; top variables; force plot (aprobado/rechazado/borderline); justificación legible para cliente rechazado; análisis de sesgo.

---

#### Clase 10 — Clarify: explicabilidad del modelo de regresión · 3 h

| | |
|---|---|
| **Controlador** | `Clase10Controller` |

**Endpoints:** `POST .../explain/amount/run`, `GET .../explain/amount/report`, `GET .../explain/compare`.

**Objetivos:** Clarify en XGBoost; comparar explicabilidad entre modelos; reportes de transparencia para auditoría.

**Teoría:** SHAP en regresión vs clasificación; Partial Dependence Plots; estructura de reporte ASFI; explicar monto sugerido.

**Práctica:** Clarify Modelo 2; dependence plot `debt_to_income_ratio` vs monto; tabla top 5 variables por modelo; PDF automatizado; caso de discrepancia entre modelos y regla de negocio.

---

#### Clase 11 — API de justificación, integración final y presentaciones · 2 h

| | |
|---|---|
| **Controlador** | `Clase11Controller` |

**Endpoints:** `POST .../explain/risk`, `.../explain/amount`, `.../explain/full`, `POST .../pipeline/full`, `GET .../clase11/health` (+ `GET /health` global).

**Objetivos:** Endpoints con explicaciones SHAP legibles; integrar Clarify con evaluación en tiempo real; pipeline completo Textract → Glue → SageMaker → Clarify → API; demo end-to-end; presentación de proyectos.

**Teoría (condensada):** Servicio de explicabilidad en producción; SHAP on-demand vs batch; formato para oficiales de crédito; logging y auditoría; consideraciones producción (ASFI, cifrado S3, VPC, costos endpoints); vista previa Módulo 2 (n8n + LLM).

**Práctica:** `ClarifyService` + `formatExplanation()`; pipeline orquestado; demo en vivo con documentos de prueba; presentaciones breves (5–7 min); criterios: Textract, Glue, métricas (AUC ≥ 0,75), Clarify, API/Docker.

---

## Cómo usar este material

1. Lee este README para la visión del módulo.
2. Antes de cada sesión, abre `clase-XX/README.md` (alumnos).
3. Implementa en tu `esqueleto/` siguiendo la parte práctica.
4. Despliega con `esqueleto/DEPLOY.md` cuando el Docker esté publicado.
