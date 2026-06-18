# Azure Migration Plan

## Document Overview

This document is the actionable migration plan for moving the US-Tax application from Firebase Hosting (frontend) and local/Firebase-coupled deployment (backend) to Microsoft Azure. It is a **two-phase plan**:

- **Phase 1** — Compute & hosting migration only. Move the Quarkus backend to **Azure Container Apps** and the Angular frontend to **Azure Static Web Apps**. Keep Firebase Authentication. Keep Cloud Firestore as the database (backend will call it cross-cloud for now). Keep Azure Document Intelligence in place.
- **Phase 2** — Database migration from Cloud Firestore to **Azure SQL Database Serverless**, with Hibernate L2 caching via Azure Cache for Redis.

Phase 1 is the priority and unblocks Phase 2. Phase 1 is intentionally scoped to **compute and hosting only** so that the move to Azure can be completed and validated independently of the much larger relational-schema-design work.

**Document version:** 1.0
**Date:** 2026-05-24
**Owner:** Ali Muhammad

---

## 1. Current State

| Component | Today | Notes |
|---|---|---|
| Frontend | Angular 21 + PrimeNG SPA | Built locally with `ng build`; not yet deployed to Firebase Hosting at production cadence |
| Backend | Quarkus 3.30.6 / Java 17 | Currently run with `./mvnw quarkus:dev` against local environment |
| Database | Cloud Firestore | Backend uses the Firestore Admin SDK with a service-account JSON pointed to by `GOOGLE_APPLICATION_CREDENTIALS` |
| Authentication | Firebase Authentication | Email-link sign-in flow in Angular; backend validates Firebase ID tokens |
| OCR / AI | Azure Document Intelligence | Already in use; the only existing Azure dependency |
| Secrets | Local `.env` files + the service-account JSON on disk | Not centralized |
| CI/CD | None automated for the backend; frontend deploy is manual | Will be set up in Phase 1 |

The two repos under `C:\us-tax`:
- `C:\us-tax\us-tax-be` — Quarkus backend
- `C:\us-tax\us-tax-ui` — Angular frontend

---

## 2. Target State After Phase 1

```
                          ┌──────────────────────────────┐
   User (US)  ─────────►  │ Azure Front Door (Standard)  │  (optional in Phase 1;
                          │ or single-origin custom DNS  │   can defer to Phase 2)
                          └───────┬──────────────┬───────┘
                                  │              │
                            /  static            /api/*  dynamic
                                  │              │
                                  ▼              ▼
                  ┌──────────────────────┐    ┌──────────────────────┐
                  │ Azure Static Web Apps│    │ Azure Container Apps │
                  │ (Angular SPA)        │    │ (Quarkus backend)    │
                  └──────────────────────┘    │ Min replicas: 0      │
                                              │ Max replicas: 5      │
                                              │ Image: quarkus-jvm   │
                                              └──────────┬───────────┘
                                                         │
                                ┌────────────────────────┼────────────────────────┐
                                ▼                        ▼                        ▼
                  ┌──────────────────────┐    ┌──────────────────────┐  ┌──────────────────┐
                  │ Cloud Firestore      │    │ Azure Document       │  │ Firebase Auth    │
                  │ (CROSS-CLOUD,        │    │ Intelligence         │  │ (CROSS-CLOUD,    │
                  │  same as today)      │    │ (already in Azure)   │  │  JWT validation) │
                  └──────────────────────┘    └──────────────────────┘  └──────────────────┘
```

Two cross-cloud dependencies remain in Phase 1 — **Firestore** (data) and **Firebase Auth** (identity). Firestore disappears in Phase 2; Firebase Auth is intentionally retained.

---

## 3. Target State After Phase 2

```
                            ┌──────────────────────┐         ┌──────────────────┐
                            │ Azure Container Apps │ ──────► │ Azure SQL DB     │
                            │ (Quarkus backend)    │         │ Serverless       │
                            │ JPA + Hibernate L2   │         │ (auto-pause)     │
                            └──────────┬───────────┘         └──────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Azure Cache for Redis│
                            │ (Hibernate L2 store) │
                            └──────────────────────┘
```

Cloud Firestore is decommissioned. The only retained cross-cloud dependency is Firebase Authentication.

---

# PHASE 1 — Compute & Hosting Migration

## 4. Phase 1 Goals and Non-Goals

**Goals**
1. Quarkus backend runs in Azure Container Apps, reachable via HTTPS, scaling 0→N replicas.
2. Angular frontend served from Azure Static Web Apps with proper SPA routing.
3. Frontend calls backend via HTTPS; backend validates Firebase JWTs on every authenticated request.
4. Backend continues to call Cloud Firestore for all data operations (no code/data changes required).
5. Backend continues to call Azure Document Intelligence (same as today).
6. Secrets (Firestore service-account JSON, Document Intelligence key, Firebase project ID) are stored in **Azure Key Vault** and consumed via managed identity.
7. CI/CD pipelines exist for both backend (container build + push + deploy) and frontend (build + deploy).
8. Application Insights captures logs, metrics, and traces from the backend.

**Non-goals (deferred to Phase 2 or later)**
- Changing the database (Firestore stays).
- Eliminating cross-cloud Firestore calls.
- Adding Hibernate, JPA, Redis, or any caching layer.
- Front Door / WAF / advanced edge — can be added in Phase 1c if needed; otherwise defer.
- Production scale-tuning (replica count, vCore tuning — Phase 2).
- Multi-region — out of scope per the architecture document.

## 5. Phase 1 Architecture Decisions

These follow the master `architecture.md` but are restated here in the Phase-1 context.

| Decision | Phase 1 choice | Why |
|---|---|---|
| Backend image type | **JVM image first**, native image later | JVM image is faster to build, easier to debug, and "good enough" for Phase 1. Native compilation can be added in Phase 1d once the deployment pipeline is stable. |
| Container Apps scale rule | HTTP concurrency, min 0 / max 5 | Conservative ceiling for the migration; raise after load testing in Phase 2. |
| Edge layer | **Defer Front Door** to Phase 1c (optional) | Static Web Apps and Container Apps both have direct HTTPS endpoints. Front Door adds value but is not blocking. Use Static Web Apps' built-in proxy to route `/api/*` to the Container App until then. |
| Authentication | Continue to use the **Firebase Admin SDK** to verify tokens in the backend | The application already uses it. Switching to SmallRye JWT can be a Phase 2 cleanup. Avoids touching auth code in Phase 1. |
| Database access | **No change** — same `GOOGLE_APPLICATION_CREDENTIALS` flow, with the JSON sourced from Key Vault | Phase 1 must not change application-level data access. |
| Secrets | **Key Vault + Container Apps secret refs** | The Container App reads secrets at startup and exposes them as env vars to the Quarkus process. |
| Identity | System-assigned **managed identity** on Container Apps for ACR pull, Key Vault read, Document Intelligence call | No service-principal passwords stored anywhere. |
| Region | **East US** (or whichever Azure region currently hosts the Document Intelligence resource) | Co-locate compute with the existing Azure dependency to minimize latency. |
| CORS | Backend allows the Static Web Apps domain explicitly | Required because frontend and backend are on different hostnames until Front Door is added. |

## 6. Phase 1 Sub-Phases

### Phase 1a — Infrastructure foundation (~1–2 days)

Provision the Azure resources once, by hand initially using `az` CLI; capture the steps in a Bicep template at the end of this sub-phase so the resources can be torn down and recreated.

**Resources to create** (single resource group, e.g. `rg-ustax-prod`):

| Resource | SKU / tier | Notes |
|---|---|---|
| Resource Group | — | Container for everything below |
| Azure Container Registry | Basic | Stores the Quarkus image |
| Container Apps Environment | Consumption | One environment hosts one or more Container Apps |
| Container App (`ustax-be`) | Empty placeholder | Created here, image deployed in Phase 1b |
| Azure Static Web App (`ustax-ui`) | Free | Connected to the GitHub repo for `us-tax-ui` |
| Azure Key Vault | Standard | Stores secrets (see §7.3) |
| Log Analytics Workspace | Pay-as-you-go | Backing store for Application Insights |
| Application Insights | Workspace-based | Linked to the Log Analytics workspace; backend sends telemetry here |

**Networking**: defer custom virtual networks. Use the default Container Apps Environment (publicly-routable) and the default Static Web Apps endpoint. Lock down later if compliance requires it.

**Managed identities and RBAC**:
- Enable system-assigned managed identity on the Container App.
- Grant the Container App's identity:
  - `AcrPull` on the Container Registry
  - `Key Vault Secrets User` on the Key Vault
  - `Cognitive Services User` on the Document Intelligence resource (if using AAD auth) — or skip and continue to use the key from Key Vault

**Exit criteria**: `az resource list -g rg-ustax-prod` shows all resources; all identities/roles configured; Key Vault is empty but ready.

### Phase 1b — Backend containerization and first deploy (~2–3 days)

**Goal**: get a Quarkus image building, pushed to ACR, and running on Container Apps. The image talks to Firestore and Document Intelligence successfully.

**Steps**:
1. **Add a Dockerfile** to `us-tax-be/`. Start from the official Quarkus JVM Dockerfile (`src/main/docker/Dockerfile.jvm`). Make sure it copies `target/quarkus-app/` after `./mvnw package`.
2. **Externalize the config**: any value currently in `application.properties` or hard-coded that depends on the environment — Document Intelligence endpoint, Firebase project ID, etc. — should read from an env var via `${VAR_NAME}`.
3. **Add health endpoints**: Quarkus's SmallRye Health (`quarkus-smallrye-health`) is already common in Quarkus apps. If not present, add the extension; this provides `/q/health/live` and `/q/health/ready` automatically.
4. **Build and push the image**:
   ```bash
   ./mvnw clean package -DskipTests
   az acr login --name <acr-name>
   docker build -f src/main/docker/Dockerfile.jvm -t <acr>.azurecr.io/ustax-be:0.1.0 .
   docker push <acr>.azurecr.io/ustax-be:0.1.0
   ```
5. **Put secrets in Key Vault**:
   - `firestore-credentials` → the contents of the service-account JSON file (one secret, JSON string)
   - `document-intelligence-key` → the existing key
   - `firebase-project-id` → the Firebase project ID (could also be a plain env var; this keeps it together)
6. **Wire secrets and env vars on the Container App**:
   - Use Container Apps' secret-reference syntax to pull from Key Vault using the managed identity. Define Container App secrets like `firestore-creds` and map them to env vars (`GOOGLE_APPLICATION_CREDENTIALS_JSON`, etc.).
   - For the Firestore service-account file specifically: write the JSON to `/etc/firestore-credentials.json` in the container via a startup hook, then set `GOOGLE_APPLICATION_CREDENTIALS=/etc/firestore-credentials.json`. Alternatively, use the Firestore SDK's ability to consume credentials JSON directly from a string (less common but supported by some libraries). If implementing the hook is fiddly, the easier path is to store the JSON as a multi-line secret and have the container's entrypoint script write it to disk.
7. **Deploy**:
   ```bash
   az containerapp update \
     --name ustax-be \
     --resource-group rg-ustax-prod \
     --image <acr>.azurecr.io/ustax-be:0.1.0
   ```
8. **Smoke test**:
   - `curl https://<container-app-fqdn>/q/health/ready` returns 200
   - Hit a real endpoint that exercises Firestore and confirm a response
   - Trigger a Document Intelligence call and confirm it works
9. **Wire up Application Insights**:
   - Add the `quarkus-opentelemetry` extension or the Application Insights agent. Set `APPLICATIONINSIGHTS_CONNECTION_STRING` from Key Vault.
   - Verify a sample request appears in App Insights Live Metrics.

**Exit criteria**: backend responds to authenticated and unauthenticated requests on its Container App URL; Firestore reads/writes succeed; Document Intelligence calls succeed; App Insights receives traffic.

### Phase 1c — Frontend deployment (~1–2 days)

**Goal**: Angular app builds via GitHub Actions and deploys to Azure Static Web Apps. It calls the backend's Container App URL successfully.

**Steps**:
1. **Connect Static Web App to GitHub**: when creating the Static Web App (Phase 1a) or after, link to the `us-tax-ui` repo. Azure creates a GitHub Actions workflow under `.github/workflows/azure-static-web-apps-<id>.yml` and a deployment token.
2. **Configure the build**:
   - App location: `/`
   - Output location: `dist/us-tax-ui/browser` (Angular 21 outputs to `browser/` subfolder when using application builder)
   - API location: leave blank (no Azure Functions API)
3. **Configure API base URL**: the Angular app currently uses `proxy.conf.json` in dev. In production, it needs to know the backend URL. Add an `environment.prod.ts` (if not present) with:
   ```ts
   export const environment = {
     production: true,
     apiBaseUrl: 'https://<container-app-fqdn>',
   };
   ```
   Update any service that uses `/api/` to prefix with `environment.apiBaseUrl`. Alternatively, configure Static Web Apps' `staticwebapp.config.json` to proxy `/api/*` to the Container App (preferred — keeps the Angular code unchanged):
   ```json
   {
     "routes": [
       { "route": "/api/*", "rewrite": "https://<container-app-fqdn>/api/{*}" }
     ],
     "navigationFallback": {
       "rewrite": "/index.html",
       "exclude": ["/api/*", "/*.{js,css,png,jpg,svg,ico}"]
     }
   }
   ```
   The proxy-via-config approach is cleaner: no CORS, no env-var rewiring; the existing Angular code "just works."
4. **Configure CORS on the backend** (only needed if NOT using the Static Web Apps proxy):
   ```properties
   quarkus.http.cors=true
   quarkus.http.cors.origins=https://<swa-default-hostname>
   quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
   quarkus.http.cors.headers=accept,authorization,content-type
   ```
5. **Push a commit**: GitHub Actions runs `ng build`, uploads the `dist/` output to the Static Web App.
6. **Smoke test**:
   - Visit the Static Web App URL; the Angular shell loads.
   - Log in via Firebase Auth; verify JWT is sent to backend; backend validates and returns data.
   - Navigate between routes; verify SPA fallback works (deep links don't 404).

**Exit criteria**: production-grade end-to-end flow — user lands on SWA URL, logs in via Firebase, frontend calls backend via `/api/*`, backend pulls data from Firestore, response renders. No CORS or routing errors in the browser console.

### Phase 1d — Hardening and CI/CD polish (~1–2 days)

By this point the system works end-to-end. This sub-phase consolidates operational concerns.

1. **Backend CI/CD**: create a GitHub Actions workflow in `us-tax-be` that, on push to `main`:
   - Runs `./mvnw test`
   - Builds the Docker image
   - Pushes to ACR with both `:latest` and `:<short-sha>` tags
   - Updates the Container App revision via `az containerapp update`
2. **Versioning**: every Container App revision is immutable; deploying a new image creates a new revision. Set the App to single-revision mode for simplicity, or multi-revision if blue/green is desired.
3. **Custom domain** (optional in Phase 1):
   - Configure a custom domain on Static Web Apps (e.g. `app.ustax.com`).
   - The Static Web App handles SSL automatically.
   - The Container App can use a subdomain (`api.ustax.com`) or stay on the default `*.azurecontainerapps.io` URL if accessed only via the SWA proxy.
4. **Switch to Quarkus native image** (optional optimization):
   - Add the GraalVM-based Dockerfile (`src/main/docker/Dockerfile.native`).
   - Build with `./mvnw package -Dnative -Dquarkus.native.container-build=true`.
   - The image is ~50 MB instead of ~250 MB; cold-start drops from a few seconds to under 1 second.
   - Defer if it complicates the build pipeline; not blocking.
5. **Alerts**: enable basic Application Insights alerts:
   - HTTP 5xx rate > 1% over 5 minutes
   - Container App scaling failures
   - Container restarts above a small threshold per hour
6. **Document the runbook** in `C:\us-tax\runbook.md`:
   - How to roll back a Container App revision
   - How to update a Key Vault secret
   - How to read App Insights logs
   - How to redeploy the frontend (push to `main`)

**Exit criteria**: a push to `main` on either repo results in a deployed change automatically; alerts are live; the runbook is written.

## 7. Phase 1 Detailed Reference

### 7.1 Quarkus image notes

The Quarkus JVM Dockerfile typically looks like:

```dockerfile
FROM registry.access.redhat.com/ubi9/openjdk-17:1.20
ENV LANGUAGE='en_US:en'
COPY --chown=185 target/quarkus-app/lib/ /deployments/lib/
COPY --chown=185 target/quarkus-app/*.jar /deployments/
COPY --chown=185 target/quarkus-app/app/ /deployments/app/
COPY --chown=185 target/quarkus-app/quarkus/ /deployments/quarkus/
EXPOSE 8080
USER 185
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"
```

For the Firestore credentials, the cleanest pattern in Container Apps is to:
1. Store the JSON as a Container Apps secret (`firestore-creds`).
2. Reference it as an env var in the App: `GOOGLE_APPLICATION_CREDENTIALS_JSON` = `secretref:firestore-creds`.
3. Add a tiny entrypoint shell script that writes `$GOOGLE_APPLICATION_CREDENTIALS_JSON` to a file, sets `GOOGLE_APPLICATION_CREDENTIALS` to that file path, then exec's the JVM. Two lines of shell.

### 7.2 Container Apps configuration

| Setting | Phase 1 value | Notes |
|---|---|---|
| Min replicas | 0 | Scale to zero off-season |
| Max replicas | 5 | Conservative; raise after Phase 2 load testing |
| Scaling rule | HTTP concurrency, target 50 | Default is reasonable; tune later |
| CPU per replica | 0.5 vCPU | Quarkus JVM is comfortable here |
| Memory per replica | 1.0 GiB | Headroom for the JVM heap |
| Health: liveness | `/q/health/live`, every 10 s | SmallRye Health endpoint |
| Health: readiness | `/q/health/ready`, every 10 s | Container Apps probes this before routing traffic |
| Ingress | External, HTTPS, target port 8080 | Public endpoint |
| Identity | System-assigned managed identity | For ACR pull, Key Vault, Document Intelligence |

### 7.3 Key Vault contents (Phase 1)

| Secret name | Source | Used by |
|---|---|---|
| `firestore-credentials` | The current GCP service-account JSON | Backend, mounted into the container |
| `document-intelligence-key` | The existing Azure Cognitive Services key | Backend (could be replaced by AAD auth later) |
| `firebase-project-id` | The Firebase project ID | Backend (for JWT audience claim validation) |
| `appinsights-connection-string` | Application Insights instance | Backend (for telemetry) |

All consumed via Container Apps secret references; Key Vault is accessed using the Container App's managed identity.

### 7.4 GitHub Actions sketch (backend)

```yaml
name: build-and-deploy-backend
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - run: ./mvnw -B clean package -DskipTests
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - run: |
          az acr login --name $ACR_NAME
          docker build -f src/main/docker/Dockerfile.jvm -t $ACR_NAME.azurecr.io/ustax-be:${{ github.sha }} .
          docker push $ACR_NAME.azurecr.io/ustax-be:${{ github.sha }}
          az containerapp update -n ustax-be -g rg-ustax-prod --image $ACR_NAME.azurecr.io/ustax-be:${{ github.sha }}
```

Use OIDC federation (no long-lived secrets) between GitHub and Azure for `azure/login`.

### 7.5 Phase 1 cost estimate

| Component | Off-season | Peak |
|---|---:|---:|
| Container Apps (consumption) | ~$0 | $80–$200 |
| Static Web Apps Free | $0 | $0 |
| Azure Container Registry (Basic) | $5 | $5 |
| Key Vault | ~$1 | ~$1 |
| Application Insights | ~$5 | $10–$30 |
| Cross-cloud egress to Firestore | small | $5–$20 |
| **Subtotal** | **~$11** | **~$100–$255** |

Cross-cloud egress for Firestore reads/writes is the unusual line item in Phase 1; it disappears in Phase 2 when Firestore is replaced by Azure SQL.

## 8. Phase 1 Cutover Strategy

The application is not yet live on Firebase Hosting in production, so cutover is straightforward:

1. Deploy backend to Container Apps and frontend to Static Web Apps. Both have working public URLs.
2. Run an internal beta on those URLs for 1–2 weeks. Real Firestore data; real Firebase Auth.
3. Configure DNS (`app.ustax.com`) to point to the Static Web Apps endpoint.
4. Announce production cutover. Existing Firebase Hosting (if any) becomes a redirect.

Rollback: revert DNS to the previous endpoint; the Container App and Static Web App stay up. No data is touched in Phase 1, so rollback is risk-free.

## 9. Phase 1 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Firestore latency from Azure | Medium | Medium | Co-locate Container App with the existing Document Intelligence region; consider Firestore region (typically multi-region) is already optimized. Tolerable in Phase 1; goes away in Phase 2. |
| Service-account JSON exposure | Low | High | Stored only in Key Vault; never committed to git; mounted ephemerally in the container. |
| Cold start latency at start of peak season | Medium | Medium | Run a smoke test from a scheduled job before peak; if latency is unacceptable, switch to native image (Phase 1d) or set `min replicas = 1`. |
| CORS misconfiguration if SWA proxy not used | Medium | Medium | Use the SWA `staticwebapp.config.json` proxy; eliminates CORS entirely. |
| Container Apps cold start blocking the first user | Low | Low | JVM cold start is ~3–5 s; users experiencing this is rare during peak (when replicas are warm). |
| Cross-cloud egress cost surprises | Low | Low | Bounded by data volume; monitor in Azure Cost Management. |
| ACR cache or rate-limit issues | Low | Medium | Basic SKU has soft rate limits; upgrade to Standard if hit. |

---

# PHASE 2 — Database Migration to Azure SQL Serverless

## 10. Phase 2 Goals and Scope

**Goal**: replace Cloud Firestore with Azure SQL Database (Serverless tier) as the system of record. Introduce Hibernate ORM with second-level caching via Azure Cache for Redis.

**Trigger to start Phase 2**: Phase 1 has been running stably for at least 4 weeks; no significant Firestore-related incidents; team has bandwidth for what is essentially a rewrite of the data access layer.

**Phase 2 is substantially larger than Phase 1** — it touches the data access layer, requires schema design, and requires a real data migration. Plan for several weeks of work.

## 11. Phase 2 Sub-Phases

### Phase 2a — Schema design

1. **Inventory every Firestore collection** in use. The current codebase shows (from `CLAUDE.md`):
   - `users/{uid}/{formId}` (personal forms)
   - `users/{uid}/w-2`, `users/{uid}/1099-int`, … (statement entries per form type)
   - User-level metadata (auth state)
2. **Decide on relational shape**:
   - One `users` table keyed by Firebase UID.
   - One `personal_forms` table per form (or a single polymorphic table with `form_type` + JSON payload column — pragmatic for an app where forms are mostly stored and retrieved as units).
   - One `statement_entries` table per form type (or unified with a discriminator).
   - Dependent entities (`users/{uid}/dependents/{depId}/{formId}`) modeled with foreign keys to the dependent record.
3. **Pragmatic shortcut**: rather than fully normalizing every YAML field into columns, store the form payload as `NVARCHAR(MAX)` JSON. SQL Server has native JSON functions if querying is ever needed. This trades some query-ability for migration speed. Revisit per-column normalization once the schema is in production.
4. **Indexes**: at minimum, `(user_uid, form_id)` on personal forms; `(user_uid, statement_type)` on statement entries; `(user_uid)` on user-scoped queries.
5. **Compute output storage**: the `Form1040` and related output objects are computed, not user input. Decide whether to persist computed output or recompute on demand. Recomputing is the safer default — output objects are large and change with every recompute.

### Phase 2b — Backend refactor

1. Add the `quarkus-jdbc-mssql` and `quarkus-hibernate-orm` extensions.
2. Configure the datasource via env vars; use Azure SQL with Microsoft Entra managed-identity authentication (no password).
3. Introduce JPA entities mirroring the schema designed in 2a.
4. Build a **repository abstraction** in front of Firestore today, so the swap is one implementation change. (If this abstraction doesn't exist, this is part of the refactor.)
5. Add a **dual-write / dual-read** mode for the migration window:
   - Writes go to both Firestore and Azure SQL.
   - Reads happen from Firestore (primary) but compare to SQL for divergence-detection.
   - This is the safest migration pattern; it does add complexity. Alternative: do a single hard cutover after a verified bulk import.

### Phase 2c — Caching layer

1. Provision Azure Cache for Redis (Standard C1).
2. Add the Redisson + JCache + Hibernate L2 dependencies to the backend.
3. Configure Hibernate L2 caching per `architecture.md` §4.5.
4. Annotate cacheable entities with `@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)`.
5. Verify cache coherency with a multi-replica test (write on replica A, immediately read on replica B; both should see the new value).

### Phase 2d — Data migration tooling

1. Write a Firestore export script (Node.js with `firebase-admin` SDK, or use Firestore's managed `gcloud firestore export` to a GCS bucket).
2. Transform exported documents to relational rows. The transformation logic depends entirely on the schema choices in 2a; if JSON payloads are stored, the transformation is largely structural (renaming, flattening one or two levels).
3. Bulk-import into Azure SQL using `bcp` or the `sqlpackage` tool. For datasets under ~1 GB, a `sqlcmd` batch script is fine.
4. **Verification**: compare row counts and a hash of each user's serialized form data between Firestore and SQL.

### Phase 2e — Cutover

1. Stop writes to Firestore (feature-flag in the backend).
2. Final delta-export from Firestore; apply to SQL.
3. Switch backend reads to SQL (feature-flag).
4. Run in single-source mode for 1–2 weeks; keep Firestore as a read-only backup.
5. Decommission Firestore: delete collections, revoke service account, remove `firestore-credentials` secret from Key Vault.

## 12. Phase 2 New Infrastructure

| Resource | SKU | Notes |
|---|---|---|
| Azure SQL Database | General Purpose Serverless, 2–8 vCores | Auto-pause after 1 h |
| Azure Cache for Redis | Standard C1 (1 GB) | Required for Hibernate L2 coherency |

## 13. Phase 2 Cost Estimate (incremental over Phase 1)

| Component | Off-season | Peak |
|---|---:|---:|
| Azure SQL Serverless | ~$5 (storage only) | $150–$400 |
| Azure Cache for Redis | $105 | $105 |
| **Phase 2 incremental** | **~$110** | **~$255–$505** |

Combined Phase 1 + Phase 2 cost is close to the figure in `architecture.md` §5.

## 14. Phase 2 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema gets it wrong; rework required | Medium | High | Start with JSON payloads (low normalization); evolve over time |
| Data divergence during dual-write window | Medium | High | Continuous reconciliation script; reads from Firestore only until cutover |
| Cache stampede after cutover | Medium | High | Pre-warm cache via scripted reads of common entities |
| SQL connection pool exhaustion | Medium | High | Cap Container App replicas; monitor Agroal metrics; raise vCores in peak |
| Hibernate L2 misses for native queries | Medium | Medium | Code-review discipline; use `@CacheRetrieveMode.BYPASS` only where intended |
| Firestore decommission window too short | Low | High | Keep Firestore read-only for 30 days minimum after cutover |

---

# Cross-Phase Concerns

## 15. Authentication (Both Phases)

Firebase Authentication stays. The Quarkus backend continues to validate Firebase ID tokens. The recommended path:

- **Phase 1**: continue using the Firebase Admin SDK if that's what the backend uses today. It's a known quantity; don't change it during the migration.
- **Phase 2 (optional)**: switch to SmallRye JWT validation against Firebase's JWKS endpoint, as described in `architecture.md` §3.7. This removes the Firebase Admin SDK as a runtime dependency for token verification. Pure-cleanup; not required.

## 16. Document Intelligence

- Currently the backend calls Azure Document Intelligence using endpoint + key.
- **Phase 1**: continue with the key, stored in Key Vault. No code changes needed.
- **Phase 2 (optional cleanup)**: switch to managed-identity authentication (`Cognitive Services User` role). Removes a secret from Key Vault.

## 17. Observability

Application Insights captures everything from Phase 1 onward:

- Request rate, latency, dependency calls (Firestore, Document Intelligence)
- Errors and exceptions
- Custom metrics if the backend emits them
- In Phase 2, add Hibernate cache stats (`quarkus.hibernate-orm.statistics=true`) and SQL connection pool metrics (Agroal exposes these natively)

## 18. Security

- All secrets in Key Vault.
- All connections HTTPS (TLS 1.2+).
- Managed identities for ACR, Key Vault, Document Intelligence (and SQL in Phase 2).
- No service-principal credentials stored in GitHub Actions; use OIDC federation.
- Container App ingress is public; consider restricting to Static Web Apps' egress IPs in a hardening pass (low priority).

## 19. Open Questions to Resolve Before Phase 1 Starts

1. **Azure region**: confirm the region of the existing Document Intelligence resource. The Container App and Key Vault should match it.
2. **Domain name**: ✅ RESOLVED (2026-05-29) — production domain is **taxbeans.com**. `www.taxbeans.com` is canonical (SWA custom domain + managed TLS); apex `taxbeans.com` 301-forwards to www via GoDaddy Domain Forwarding. DNS stays at GoDaddy (no Azure DNS; GoDaddy lacks ALIAS so the apex can't serve directly). See `commands.md` → "Custom domain (taxbeans.com)".
3. **GitHub vs Azure DevOps**: Static Web Apps integrates natively with both, but the workflow snippets in this plan assume GitHub Actions. Confirm.
4. **Firebase project**: is the existing Firebase project the one we'll continue to use, or will Phase 1 also migrate to a new Firebase project?
5. **JVM vs native image at the start**: confirm we're starting with JVM image in Phase 1b (the plan assumes JVM, with native as an optional 1d enhancement).
6. **CORS approach**: use the Static Web Apps proxy (recommended) or expose the Container App directly and configure CORS in Quarkus? The plan recommends the proxy.

## 20. Implementation Sequence Summary

| Phase | Sub-phase | Estimated duration | Blocking dependency |
|---|---|---:|---|
| 1 | 1a — Infrastructure | 1–2 days | Azure subscription access |
| 1 | 1b — Backend deploy | 2–3 days | 1a complete |
| 1 | 1c — Frontend deploy | 1–2 days | 1b complete (or in parallel if SWA proxy not used) |
| 1 | 1d — CI/CD + hardening | 1–2 days | 1b and 1c complete |
| 2 | 2a — Schema design | 1 week | Phase 1 stable for 4+ weeks |
| 2 | 2b — Backend refactor | 2–3 weeks | 2a complete |
| 2 | 2c — Caching | 3–5 days | 2b complete |
| 2 | 2d — Data migration | 1–2 weeks | 2b complete |
| 2 | 2e — Cutover | 1 week (including dual-running) | 2c and 2d complete |

**Total estimated wall-clock**: Phase 1 ≈ 1–2 weeks; Phase 2 ≈ 6–8 weeks; total ≈ 2 months of part-time work or 3–4 weeks of focused work.

---

## 21. Execution Status (updated 2026-05-25)

This section records what was actually built versus the plan above. The
plan sections (esp. §11 Phase 2 Sub-Phases) document the original
strategy — including options like JSON-payload normalization shortcut
and dual-write — that were ultimately not chosen.

### Phase 1 — COMPLETE (2026-Q1)

All sub-phases (1a infrastructure, 1b backend deploy, 1c frontend deploy,
1d CI/CD) shipped. Backend at `https://ca-ustax-be.ashydesert-7408eba4.centralus.azurecontainerapps.io`;
frontend at **https://www.taxbeans.com** (custom domain; default SWA host `purple-flower-0e823c610.7.azurestaticapps.net`). CORS
used instead of SWA linked-backend proxy (SWA Free tier).

### Phase 2a — COMPLETE (2026-05-17)

Azure SQL Database Serverless provisioned at
`sql-ustax-9u14g.database.windows.net` / DB `ustaxdb` (GP_S_Gen5_2,
auto-pause 60 min). Container App MSI granted `db_owner` via T-SQL run
through `SqlConnection.AccessToken`. `SqlHealthResource` verified MSI
auth in production. Agroal acquisition timeout raised to 60s for
auto-pause wake.

### Phase 2b — Steps 1–5c COMPLETE (2026-05-25)

**Path diverged from §11.2a's "pragmatic shortcut" recommendation.** The
plan suggested storing form payloads as `NVARCHAR(MAX)` JSON to ship
faster. User chose **full normalization across all three domains**
(input, statement entries, output) instead. Final schema:

| Metric | Value |
|---:|---|
| Liquibase changesets applied | 200 |
| Base tables in `ustaxdb` | 193 |
| ↳ core (`app_user`/`profile`/`dependent`/etc.) | 7 |
| ↳ reference lookups | 6 |
| ↳ personal forms (`pf_*`) | 47 |
| ↳ statement entries (`se_*`) | 60 |
| ↳ output / computed (`out_*`) | 71 |
| ↳ Liquibase tracking | 2 |

Tooling chosen:

- **Liquibase** (over Flyway) — XML master changelog + 9 SQL V-files
  (`db/changelog/changes/V1..V9.sql`). Migrates at startup.
- **Hibernate ORM Panache** — added to pom; entities currently exist
  only for V1 tables (10 of 193). Validate mode set to `none` until
  type alignment lands in 5d.
- **No dual-write** — user-selected. SQL becomes authoritative when 5d
  rewires the services; Firestore is read/written until then.

Local-dev auth divergence from production:

- Production: `authentication=ActiveDirectoryMSI` (Container App MI;
  works via Phase 2a setup).
- Local dev: `accessToken` passed via
  `quarkus.datasource.jdbc.additional-jdbc-properties` from an
  `az account get-access-token` call in `run-dev.ps1`. The driver's
  built-in `ActiveDirectoryDefault` flow has classloader-visibility
  issues with msal4j under Quarkus dev mode — bypassed entirely with
  this approach.

Phase 2b schema design artifacts (live in `C:\us-tax\`, outside any git
repo):

- `data_model.md` — discovery / domain map
- `data_model_personal_identity.md`, `..._credits.md`, `..._income.md`,
  `data_model_statements.md` — input-form field inventories (~2,500 lines)
- `data_model_output_1040.md`, `data_model_output_specialforms.md` —
  output-class inventories (~1,950 lines)
- `data_model_schema.md` — entity catalog (2,482 lines)
- `data_model_er.md` — Mermaid ER diagrams (720 lines)
- `data_model_validation.md` — Step 4 cross-checks (442 lines)

Phase 2b deferred items:

- **Step 5d (next session)**: Hibernate type alignment + write ~183
  remaining `@Entity` classes + repositories + rewire services
  (Profile/Dependent/UserMessage/Support/PersonalData/Statement/TaxReturn
  + `TaxReturnComputeService`) from Firestore to SQL.
- **Step 5e**: cutover — remove Firestore read/write code from migrated
  services; keep `firebase-admin` only for auth-token validation.

### Phase 2c, 2d — REVISED OR DROPPED

- **2c Caching layer (Redis L2)**: user explicitly de-scoped at the
  start of Phase 2 (recorded in earlier session). Not in the current
  plan.
- **2d Data migration**: user explicitly de-scoped because the
  application is not yet in production. No Firestore data to migrate.
  The "SQL-only from 5b" decision (recorded above) means new writes go
  to SQL only; old Firestore data, if any, will be discarded.

---

*End of document.*
