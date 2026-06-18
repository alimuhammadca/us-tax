# OCR / Statement Extraction Sketch

Status: exploratory only. No code changes yet.

## Goal

Support statement upload and field extraction without:
- managing queues,
- building a separate extraction service,
- storing uploaded PDFs or images long-term,
- retaining raw OCR payloads beyond the live request.

## Recommended Architecture

Keep OCR inside the existing `Quarkus` backend and call Azure Document Intelligence directly through its REST APIs.

```text
Angular UI
   |
   | upload file
   v
Quarkus Backend
   |- validate file
   |- call Azure Document Intelligence REST API
   |- poll for completion
   |- normalize extracted fields into existing statement schemas
   |- return draft extracted data to UI
   |
   |- save only reviewed statement data to Firestore
   v
Firestore
```

This design intentionally avoids:
- queue infrastructure,
- background workers,
- object storage for source documents,
- a persistent OCR document repository.

## User Flow

1. User opens a statement form such as `W-2` or `1099-INT`.
2. User uploads a PDF or image.
3. Angular sends the file to a backend extraction endpoint.
4. Quarkus validates the file and sends the bytes to Azure Document Intelligence.
5. Quarkus polls Azure until analysis completes.
6. Quarkus maps Azure output into the application's existing statement field ids.
7. Backend returns draft extracted data to the UI.
8. UI shows the extracted values for user review and editing.
9. User corrects any issues and clicks save.
10. Backend saves only the reviewed structured statement entry through the normal statement flow.

## Backend Module Sketch

Within `us-tax-be`, the OCR path should be split logically into these modules:

- `StatementExtractionResource`
  - HTTP endpoints for analyze and save-reviewed flows.
- `AzureDocumentIntelligenceClient`
  - raw REST communication with Azure.
- `StatementExtractionService`
  - validation, orchestration, polling, and error handling.
- `StatementNormalizationService`
  - conversion from Azure response shape into internal statement data.
- statement-specific mappers
  - `W2ExtractionMapper`
  - `Form1099IntExtractionMapper`
  - `Form1099DivExtractionMapper`
  - `Form1099RExtractionMapper`

## Endpoint Sketch

Recommended initial endpoints:

```text
POST /api/statement-extraction/analyze
POST /api/statement-extraction/save-reviewed
```

Optional later:

```text
GET /api/statement-extraction/supported-types
```

## Analyze Request

Multipart request should include:
- `file`
- `statementType` optional
  - examples: `w-2`, `1099-int`, `1099-div`, or `auto`
- `personId` optional if spouse/dependent routing is needed later

## Analyze Response

The backend should return a draft extraction result shaped for the existing app, for example:

```text
- detectedStatementType
- extractionStatus
- candidateFields
- confidenceByField
- warnings
- providerReferenceId (transient only if needed)
```

Important rule:
- `candidateFields` should use the application's existing statement field names, not Azure's raw response names.

## Save-Reviewed Request

The reviewed-save request should include:

```text
- statementType
- reviewedFields
- personId
- existingEntryId optional
```

The reviewed-save path should persist data exactly like a normal statement entry save so that the current compute flow remains unchanged.

## Persistence Rules

Do not persist:
- uploaded source files,
- raw PDFs or images,
- raw Azure OCR responses.

Persist only:
- final reviewed structured statement data.

This keeps the architecture simple and aligns with the requirement not to retain uploaded user documents.

## Fit With Current Repo

The existing backend already has:
- `StatementFormCatalog`
- `/api/statements/{formId}`
- statement entry save/load flows
- `TaxReturnComputeService` consuming saved statement data

Because of that, OCR should be implemented only as a feeder into the current statement model.

Practical consequence:
- extraction returns a draft,
- user reviews it,
- approved values are saved as a normal statement entry,
- `TaxReturnComputeService` continues unchanged.

## Frontend Sketch

Each supported statement form can gain an OCR-assisted workflow:

- `Upload document`
- `Review extracted data`
- `Apply to form`

Simplest UX:
- upload the file,
- show a processing state,
- populate the current statement form with extracted values,
- highlight low-confidence fields,
- let the user edit and save normally.

This avoids building a separate large review interface.

## Operational Tradeoff

This approach is simpler, but extraction requests will be slower than ordinary saves because Azure processing is asynchronous and must be polled.

That tradeoff is acceptable if:
- uploads are occasional,
- users can tolerate a short wait,
- bulk ingestion is not required.

## Guardrails

- enforce file type and size limits before calling Azure,
- prefer in-memory streaming,
- if temporary files are unavoidable, delete them immediately,
- do not log document contents,
- do not auto-save extracted values without user review,
- keep manual entry available when extraction fails.

## Recommended Starting Point

Start with:
- one OCR module inside the existing Quarkus backend,
- direct Azure REST integration,
- no queue,
- no stored uploaded documents,
- review-before-save,
- persistence only for normalized reviewed statement data.
