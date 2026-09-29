# Institution approved reference dataset

This directory contains no documents or fabricated samples. Populate it only with documents whose reference status has been confirmed through an authorized institution/source workflow and whose use has been approved under applicable privacy and retention rules.

The optional Isolation Forest trainer learns a feature distribution from reviewed reference records. It does not learn a `fake` class, produce a probability of fraud, or replace issuer/source checks. Do not pool institutions or document types unless the training and validation design explicitly accounts for those differences.

Create a CSV outside version control with these columns:

`reference_verified,page_count,ocr_mean_confidence,text_block_count,ocr_character_count,field_candidate_count,metadata_timestamp_delta,recompression_difference_mean,page_aspect_ratio`

Every row must have `reference_verified=true`; at least 30 rows are required. Keep a separate, institution-approved holdout set for evaluation before using an artifact. Model artifacts are trusted executable inputs: only load artifacts produced by an authorized training pipeline.

Example invocation (after preparing the private dataset):

```powershell
python -m app.ml.train_anomaly --input C:\secure-data\reference-features.csv --output models\anomaly.joblib
```

No training dataset, weights, or performance claim is bundled with this project. Until independently validated artifacts and data are supplied, inference reports `NOT_CONFIGURED`.
