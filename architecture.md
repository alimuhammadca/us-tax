# Application Architecture

## Document Overview

This document captures the target architecture for migrating an Angular-based application from Firebase/Firestore to Microsoft Azure. It records the architectural decisions made, the rationale behind each choice, the resulting technology stack, and the considerations that should guide implementation and operation.

**Document version:** 1.0
**Last updated:** May 2026
**Status:** Approved — Ready for implementation

---

## 1. Background and Context

### 1.1 Current State

The application currently runs entirely on Google Firebase:

- **Frontend:** Angular single-page application hosted on Firebase Hosting
- **Database:** Cloud Firestore (NoSQL document database)
- **Authentication:** Firebase Authentication
- **Backend logic:** Limited; most operations occur client-side against Firestore

### 1.2 Motivation for Change

Two primary factors drove the architectural review:

1. **Performance limitations with Firestore** for the application's query patterns, particularly for relational data access where multiple document reads and client-side joins were required.
2. **Integration with Azure Document Intelligence**, which the application already uses for document processing. Keeping data and compute in the same cloud avoids cross-cloud egress costs and reduces latency for document workflows.

### 1.3 Workload Characteristics

These characteristics shaped every technology selection in this document:

- **Geographic scope:** United States only — no multi-region distribution requirements
- **Usage pattern:** Highly seasonal — approximately 2 to 3 months of peak usage per year
- **Peak load:** Thousands of simultaneous users during peak season
- **Off-season load:** Minimal to zero traffic for 9 to 10 months annually
- **Data model:** Relational, with structured user data spanning multiple related entities

The seasonal nature of the workload made scale-to-zero economics a primary evaluation criterion.

---

## 2. Architecture Overview

### 2.1 High-Level Diagram

```
                          ┌──────────────────────────────┐
   User (US)  ─────────►  │  Azure Front Door Standard   │
                          │  - CDN edge caching          │
                          │  - SSL termination           │
                          │  - Path-based routing        │
                          │  - Basic DDoS protection     │
                          └──────────────┬───────────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
                  /  (static assets)            /api/*  (dynamic)
                          │                             │
                          ▼                             ▼
              ┌──────────────────────┐      ┌──────────────────────┐
              │ Azure Static Web Apps│      │ Azure Container Apps │
              │ (Angular SPA origin) │      │ (Quarkus native)     │
              └──────────────────────┘      │ Min: 0  Max: 20      │
                                            └──────────┬───────────┘
                                                       │
                              ┌────────────────────────┼─────────────────────────┐
                              ▼                        ▼                         ▼
                  ┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
                  │ Azure SQL DB     │    │ Azure Cache for Redis│    │ Azure Document   │
                  │ Serverless       │    │ Standard tier        │    │ Intelligence     │
                  │ (auto-pause)     │    │ (Hibernate L2 cache) │    │ (existing)       │
                  └──────────────────┘    └──────────────────────┘    └──────────────────┘

   User authentication flow (separate from API flow):
   Angular ──► Firebase Authentication (Google Cloud) ──► returns JWT
   Quarkus validates JWT signature against Firebase JWKS endpoint
```

### 2.2 Component Summary

| Layer | Component | Purpose |
|-------|-----------|---------|
| Edge | Azure Front Door Standard | CDN, SSL, routing, basic security |
| Frontend hosting | Azure Static Web Apps (Free tier) | Origin for Angular SPA |
| Backend compute | Azure Container Apps | Hosts Quarkus API, scales 0–N |
| Database | Azure SQL Database Serverless | Relational data store with auto-pause |
| Cache | Azure Cache for Redis Standard | Distributed L2 cache for Hibernate |
| Authentication | Firebase Authentication (retained) | User identity, login flows |
| AI / OCR | Azure Document Intelligence | Document processing (existing) |
| Container registry | Azure Container Registry | Stores Quarkus container images |
| Secrets | Azure Key Vault | Connection strings, API keys, passwords |
| Observability | Application Insights | Logs, metrics, distributed tracing |

---

## 3. Architectural Decisions

This section documents each major decision, alternatives considered, and the rationale for selection.

### 3.1 Cloud Provider: Microsoft Azure

**Decision:** Migrate to Azure rather than AWS, remain on GCP, or pursue a multi-cloud architecture.

**Alternatives considered:** Google Cloud Platform (staying with the existing provider), AWS.

**Rationale:**
- Azure Document Intelligence is already a core dependency. Hosting the rest of the stack in Azure eliminates cross-cloud egress costs and reduces latency for document-processing workflows.
- Cross-cloud architectures introduce operational complexity, dual billing, and network egress fees that are difficult to predict at scale.
- Azure's serverless offerings (Container Apps, SQL Serverless) align well with the seasonal workload pattern.

### 3.2 Backend Compute: Azure Container Apps

**Decision:** Deploy the Quarkus backend to Azure Container Apps with native-compiled images.

**Alternatives considered:**
- Azure App Service (for Java or for Containers)
- Azure Kubernetes Service (AKS)
- Azure Functions

**Rationale:**
- **Scale to zero:** Container Apps can scale to zero replicas during the 9–10 idle months, eliminating compute costs in the off-season. App Service requires an always-on plan ($70+/month baseline) and does not scale to zero.
- **Automatic scale-out:** During peak, Container Apps scales replicas based on HTTP traffic, CPU, memory, or custom KEDA metrics.
- **Quarkus native image fit:** Quarkus + GraalVM native compilation produces sub-second cold starts and ~50 MB memory footprints, making scale-to-zero genuinely viable without poor first-request experiences.
- **Operational simplicity:** Built on Kubernetes (KEDA + Dapr) internally, but no cluster management required. AKS introduces operational burden disproportionate to a single-service backend.
- **Functions rejected** because Quarkus's value (reactive programming model, build-time optimizations, REST stack) is largely lost in the Azure Functions Java runtime.

### 3.3 Database: Azure SQL Database Serverless

**Decision:** Use Azure SQL Database in the Serverless compute tier as the primary relational database.

**Alternatives considered:**
- Azure Database for PostgreSQL Flexible Server
- Azure Database for MySQL Flexible Server
- Azure Cosmos DB for PostgreSQL
- Azure SQL Managed Instance

**Rationale:**
- **Auto-pause economics:** Serverless tier auto-pauses after a configurable idle period (typically 1 hour) and resumes on the first incoming connection. During the 9–10 off-months, storage is the only cost.
- **Auto-scale within a vCore range:** Compute scales between minimum and maximum vCore settings based on load, with per-second billing during active periods.
- **No multi-region requirement:** Spanner-class and Cosmos-class globally-distributed databases are unnecessary for a US-only application and would significantly increase cost.
- **PostgreSQL was a strong alternative** but Azure SQL Serverless's auto-pause behavior is more mature than PostgreSQL Flexible Server's stop/start capabilities for this exact use case.

### 3.4 Caching Strategy: Hibernate L2 Cache with Distributed Backing

**Decision:** Implement Hibernate second-level caching using Redisson as the JCache provider, backed by Azure Cache for Redis. All Container App replicas share the same Redis instance.

**Alternatives considered:**
- Manual eager-load pattern (build a UserContextService that loads everything on login into Redis explicitly)
- Quarkus Cache extension with `@CacheResult` annotations
- Local in-memory caching only (Caffeine on each replica)
- Materialized views in Azure SQL
- Embedded Infinispan in replicated mode

**Rationale:**
- **Automatic write invalidation:** When entities are updated through Hibernate, the L2 cache automatically invalidates affected entries. This was an explicit requirement.
- **Distributed by design:** All replicas read from and write to the same Redis instance, guaranteeing cache coherency across the dynamic Container Apps replica pool. Local-only caches would silently produce stale data across replicas.
- **Native Quarkus integration:** Quarkus provides first-class Hibernate ORM support; the `@Cache` annotation model is declarative and keeps service-layer code clean.
- **Reuses planned infrastructure:** Azure Cache for Redis was already part of the planned stack; using it as the L2 backing avoids running a separate Infinispan deployment.
- **Embedded Infinispan rejected** because clustered mode requires inter-replica networking (JGroups) that is awkward to configure on Container Apps' stateless model.
- **Manual eager-load rejected** because cache invalidation would need to be hand-written on every write path, creating long-term maintenance burden and bug surface.

### 3.5 Frontend Hosting: Azure Static Web Apps

**Decision:** Host the Angular production build on Azure Static Web Apps (Free tier), serving as the origin behind Azure Front Door.

**Alternatives considered:**
- Azure Blob Storage with static website hosting
- Keep Firebase Hosting as the origin

**Rationale:**
- **Purpose-built for SPAs:** Native SPA fallback routing, automatic GitHub Actions integration, framework detection (auto-runs `ng build`).
- **Free tier is sufficient:** 100 GB bandwidth per month, 2 custom domains, 3 staging environments — sufficient for current scale.
- **In-Azure origin:** Eliminates cross-cloud egress from Firebase Hosting that would have occurred if frontend stayed on GCP.
- **Blob Storage rejected** because it lacks built-in CI/CD and SPA-specific features without additional configuration.
- **Firebase Hosting rejected** because keeping it would split billing across two clouds and re-introduce cross-cloud egress.

### 3.6 Edge / CDN: Azure Front Door Standard

**Decision:** Use Azure Front Door Standard tier as the single edge entry point for both frontend assets and API traffic.

**Alternatives considered:**
- Azure Front Door Premium
- Azure CDN Standard from Edgio (announced for retirement)
- No edge layer (direct access to Static Web Apps and Container Apps)

**Rationale:**
- **Unified edge:** One product handles CDN, SSL termination, custom domain, path-based routing, and basic DDoS protection.
- **Single domain for all traffic:** `/` routes to Static Web Apps (Angular), `/api/*` routes to Container Apps (Quarkus). Eliminates CORS configuration overhead.
- **Cost-appropriate:** Standard tier (~$35/month baseline) is well-suited to the workload. Premium (~$330/month) adds managed WAF rule sets and Private Link, which are not required for the current threat model and scale.
- **Azure CDN options rejected:** Edgio offering is being retired; the Akamai offering was already retired. Azure Front Door is the path Microsoft is steering customers to.
- **Edge layer rejected** would mean direct public exposure of origins, no edge caching for Angular static assets, and no unified SSL/domain management.

### 3.7 Authentication: Retain Firebase Authentication

**Decision:** Continue using Firebase Authentication for user identity. The Quarkus backend validates Firebase-issued JWTs locally using Google's public keys via SmallRye JWT.

**Alternatives considered:**
- Migrate to Azure AD B2C / Microsoft Entra External ID
- Migrate to Auth0 or another third-party identity provider
- Build authentication into the Quarkus backend

**Rationale:**
- **Migration scope containment:** Auth migration is independently risky; bundling it with the data and compute migration multiplies risk. Keeping Firebase Auth isolates this migration to data and APIs.
- **Cost-effective:** Firebase Auth's free tier covers most usage levels.
- **Stateless JWT validation:** Quarkus validates JWT signatures locally against cached public keys. No per-request call to Firebase is required, minimizing cross-cloud egress.
- **Future-flexible:** Auth provider can be migrated later as a separate project if requirements change.

**Accepted trade-offs:**
- A small cross-cloud dependency remains. JWKS public keys are fetched periodically; login flows occur against Firebase. Cost impact is minimal (cents per month).
- Firebase Auth becomes a single point of failure independent of Azure. If Firebase Auth has an outage, new logins fail (existing sessions continue until token expiry).

---

## 4. Detailed Component Configuration

### 4.1 Azure Container Apps

| Setting | Value | Rationale |
|---------|-------|-----------|
| Minimum replicas | 0 | Scale to zero off-season |
| Maximum replicas | 20 (initial) | Bounded by Azure SQL connection limits |
| Scaling rule | HTTP concurrent requests | Target ~50 concurrent requests per replica |
| Container image | Quarkus native (GraalVM) | Fast cold starts, low memory |
| Health probes | `/q/health/live`, `/q/health/ready` | SmallRye Health endpoints |
| Identity | System-assigned managed identity | Used for Azure SQL and Key Vault access |
| Region | East US or Central US | Closest to US user base |

### 4.2 Azure SQL Database Serverless

| Setting | Value | Rationale |
|---------|-------|-----------|
| Tier | General Purpose Serverless | Auto-pause/resume capability |
| vCore range | 2 to 8 (configurable) | Scales with peak demand |
| Auto-pause delay | 1 hour | Balance between cold starts and cost |
| Backup retention | 7 days (default) | Suitable for application data; adjust per recovery objectives |
| Authentication | Microsoft Entra ID via managed identity | Avoids storing connection passwords |
| Encryption | TDE enabled (default) | At-rest encryption |

**Connection limits:** Azure SQL allows approximately 30 connections per vCore. At 8 vCores, the practical ceiling is ~240 concurrent connections. With 20 replicas at 10 connections each (Quarkus default pool sizing), the math works at 200 connections.

### 4.3 Azure Cache for Redis

| Setting | Value | Rationale |
|---------|-------|-----------|
| Tier (off-season) | Standard C1 (1 GB) | 99.9% SLA, replication |
| Tier (peak season) | Standard C2 (2.5 GB) | Scale up before season starts |
| TLS | Required (port 6380) | Default secure configuration |
| Connection mode | Single-server via Redisson | Hibernate L2 backing |
| Eviction policy | volatile-lru | Evict expired keys when memory pressure occurs |

**Why year-round, not peak-only:** Once Redis is the Hibernate L2 cache, it must be available whenever the backend serves traffic. Cost is approximately $105/month off-season; this can be optimized by deleting and recreating the instance off-season if needed (saves ~$1,000/year at the cost of operational ritual).

### 4.4 Azure Front Door Standard

| Setting | Value | Rationale |
|---------|-------|-----------|
| Tier | Standard | CDN + routing + basic WAF |
| Custom domain | (to be assigned) | Single domain for both origins |
| Routing rules | `/api/*` → Container Apps; `/*` → Static Web Apps | Path-based routing |
| Caching: `/index.html` | No cache | Always reflect latest deployed version |
| Caching: `/*.{js,css}` | 1 year, immutable | Angular hash-cache-busts filenames |
| Caching: `/api/*` | Bypass | Dynamic responses |

### 4.5 Quarkus Application Configuration

Key settings:

```properties
# Database
quarkus.datasource.db-kind=mssql
quarkus.datasource.jdbc.url=${DB_URL}
quarkus.datasource.jdbc.max-size=10
quarkus.datasource.jdbc.min-size=2

# Hibernate L2 cache
quarkus.hibernate-orm.second-level-caching-enabled=true
quarkus.hibernate-orm.unsupported-properties."hibernate.cache.region.factory_class"=org.redisson.hibernate.RedissonRegionFactory
quarkus.hibernate-orm.unsupported-properties."hibernate.cache.redisson.config"=redisson.yaml
quarkus.hibernate-orm.unsupported-properties."hibernate.cache.use_query_cache"=true

# Firebase JWT validation
mp.jwt.verify.publickey.location=https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com
mp.jwt.verify.issuer=https://securetoken.google.com/YOUR_PROJECT_ID
mp.jwt.verify.audiences=YOUR_PROJECT_ID
smallrye.jwt.verify.algorithm=RS256
smallrye.jwt.verify.key-cache.refresh-interval=10M

# Health
quarkus.smallrye-health.root-path=/q/health
```

Entities use `@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)` for cacheable types. Reference data uses `READ_ONLY`. High-write tolerant data uses `NONSTRICT_READ_WRITE`.

---

## 5. Cost Estimates

Cost figures are estimates based on observed pricing as of mid-2026. Actual costs vary with usage, region, and Azure pricing changes.

| Component | Off-season (monthly) | Peak season (monthly) |
|-----------|---------------------:|----------------------:|
| Azure Container Apps | ~$0 | $150 – $400 |
| Azure SQL Serverless | ~$5 | $200 – $500 |
| Azure Cache for Redis (Standard C1 → C2) | $105 | $140 |
| Azure Front Door Standard | $35 | $50 – $120 |
| Azure Static Web Apps (Free tier) | $0 | $0 – $9 |
| Azure Container Registry | $5 | $5 |
| Key Vault, Application Insights | $5 | $10 – $30 |
| **Subtotal** | **~$155** | **~$555 – $1,200** |

**Not included:** Azure Document Intelligence usage (variable, depends on documents processed), Firebase Authentication (typically free at expected user volumes).

---

## 6. Implementation Roadmap

Recommended phasing:

**Phase 1 — Infrastructure foundation**
- Provision Azure resources via Bicep or Terraform
- Set up Azure Container Registry, Key Vault, networking
- Configure managed identities and RBAC
- Validate deploy pipeline (GitHub Actions or Azure DevOps)

**Phase 2 — Backend skeleton**
- Stand up minimal Quarkus app on Container Apps
- Connect to Azure SQL with managed identity authentication
- Verify basic CRUD against test schema (no caching yet)

**Phase 3 — Authentication integration**
- Add SmallRye JWT to Quarkus
- Configure Firebase JWKS endpoint and validation
- Implement JIT user provisioning service
- Test with real Firebase tokens

**Phase 4 — Caching layer**
- Provision Azure Cache for Redis
- Add Redisson + JCache dependencies
- Annotate entities with `@Cache`
- Validate multi-replica cache coherency (deploy 2 replicas, run write-on-A/read-on-B test)

**Phase 5 — Frontend migration**
- Stand up Azure Static Web Apps with Angular build pipeline
- Add HTTP interceptor in Angular for Firebase ID token injection
- Switch Angular services from Firestore SDK calls to REST calls against Quarkus

**Phase 6 — Edge layer**
- Configure Azure Front Door with both origins
- Set up custom domain and SSL
- Configure caching rules and routing
- Test end-to-end traffic flow

**Phase 7 — Data migration**
- Build Firestore export script
- Transform documents to relational schema
- Bulk import to Azure SQL
- Verify foreign-key integrity using Firebase UIDs

**Phase 8 — Load testing**
- Use Azure Load Testing or k6 to simulate peak traffic
- Validate cache hit rate ≥ 80%, connection pool not exhausted
- Tune replica counts, Redis tier, and SQL vCore range

**Phase 9 — Cutover**
- Update DNS to point to Front Door
- Monitor for 1–2 weeks in dual-running mode (Firestore as read-only backup)
- Decommission Firestore and Firebase Hosting (Firebase Auth retained)

---

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cache stampede at start of peak season | Medium | High | Pre-warm cache by calling common read endpoints before season opens |
| Azure SQL connection pool exhaustion | Medium | High | Cap Container Apps replicas; monitor connection count; scale vCores during peak |
| Stale data across replicas | Low (with distributed cache) | High | Verified via multi-replica test; all writes go through Hibernate |
| Native query bypassing cache | Medium | Medium | Code review discipline; manual cache eviction where native SQL is necessary |
| Firebase Auth outage | Low | High (no new logins) | Document in runbook; existing sessions unaffected until token expiry |
| Cold start latency from scale-to-zero | Medium | Medium | Quarkus native image keeps cold starts under 1 second; pre-warm before season |
| Schema migrations invalidating cached entries | Medium | Medium | Flush cache regions on deploy; include version in region names |
| Redis maintenance window | Low | Medium | Schedule for off-peak hours; Hibernate falls back to DB reads automatically |
| Cross-cloud Firebase Auth dependency | Low | Medium | Cache JWKS keys aggressively; degrade gracefully if JWKS endpoint unreachable |

---

## 8. Observability

**Application Insights** is the primary observability platform.

Required signals:

- **Request rate and latency** per endpoint
- **Hibernate cache hit/miss ratio** (via `quarkus.hibernate-orm.statistics=true`)
- **Database connection pool utilization** (Agroal metrics)
- **Redis memory usage and eviction count** (Azure Cache for Redis metrics)
- **Container Apps replica count over time** (correlated with traffic)
- **Cold start frequency and duration** (Quarkus startup metrics)
- **JWT validation failures** (potential auth issues or key rotation gaps)

**Recommended alerts:**

- Cache hit rate below 60% for 15 minutes
- Redis memory usage above 85%
- Azure SQL connection pool exhausted (failed connection attempts)
- Container Apps scaling failures
- HTTP 5xx error rate above 1% over 5 minutes

---

## 9. Security Considerations

- **Authentication:** Firebase Auth issues JWTs; Quarkus validates locally. No password storage in Azure.
- **Secrets:** All connection strings, API keys, and credentials stored in Azure Key Vault. Container Apps accesses Key Vault via managed identity.
- **Database access:** Azure SQL authenticated via Microsoft Entra ID managed identity, not username/password.
- **TLS:** Enforced everywhere. Front Door terminates SSL; Container Apps and Azure SQL require TLS; Redis uses port 6380 with TLS.
- **Network exposure:** Only Front Door is publicly exposed. Static Web Apps and Container Apps origins should be restricted to Front Door's IP ranges where possible.
- **WAF:** Front Door Standard includes basic DDoS protection. Premium tier should be reconsidered if threat model changes (managed WAF rule sets, bot protection).
- **Cross-cloud trust:** Firebase JWKS public keys are fetched over HTTPS; the trust boundary is the Firebase project ID configured in `mp.jwt.verify.audiences`.

---

## 10. Open Questions and Future Considerations

The following items are out of scope for the initial migration but should be revisited:

- **Auth provider migration:** Whether to eventually consolidate authentication into Azure (Entra External ID) once the data migration is stable.
- **WAF upgrade to Front Door Premium:** If user-facing threats increase, or if compliance requirements demand managed rule sets.
- **Multi-region or DR strategy:** Currently single-region. Disaster recovery posture should be defined (RPO/RTO targets).
- **Off-season Redis decommissioning:** Whether the operational cost of deleting and recreating Redis off-season is worth the ~$1,000/year savings.
- **Database read replicas:** If read traffic during peak exceeds what a single Azure SQL instance can handle even with caching, geo-replicated read replicas can be introduced.
- **Native query cache invalidation strategy:** If application logic increasingly relies on native SQL for performance, a formal cache invalidation pattern (event-driven, via Redis pub/sub) should be designed.

---

## 11. Decision Log Summary

| # | Decision | Date |
|---|----------|------|
| 1 | Migrate from Firebase/Firestore to Azure | May 2026 |
| 2 | Use Azure Container Apps for Quarkus backend | May 2026 |
| 3 | Use Azure SQL Database Serverless | May 2026 |
| 4 | Use Hibernate L2 cache with Redisson + Azure Cache for Redis | May 2026 |
| 5 | Use Azure Front Door Standard as edge/CDN | May 2026 |
| 6 | Use Azure Static Web Apps for Angular hosting | May 2026 |
| 7 | Retain Firebase Authentication; validate JWTs in Quarkus | May 2026 |

---

*End of document.*
