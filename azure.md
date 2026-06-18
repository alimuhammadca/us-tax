# Azure Resources

Operational reference for the Azure infrastructure backing `us-tax-be`. Updated as resources are created, modified, or retired. Companion to `commands.md` (which holds the runbook commands) and `azure_plan.md` (which holds the original cost / sizing rationale).

## Active subscription / RG

| Item | Value |
|---|---|
| Subscription | `us-tax` (id `3c5f0280-2804-4028-836f-7416e981dfb5`) |
| Tenant | `57106123-eb08-4a49-8689-a89834556d59` |
| Resource group | `ocr` |
| Region | `centralus` |
| Naming suffix | `9u14g` (stored at `C:\us-tax\.azure-suffix`) |

## Database — PostgreSQL Flexible Server (current as of 2026-06-16)

**Migrated from Azure SQL Server (`sql-ustax-9u14g`) on 2026-06-16** to cut cost. The old MSSQL SKU (`GP_S_Gen5` Serverless) costs ~$5/mo idle but $150-400/mo active; Burstable B2ms Postgres is a flat ~$30/mo always-on, which is cheaper as soon as the household sees any sustained traffic.

| Item | Value |
|---|---|
| Resource name | `pg-ustax-9u14g` |
| Type | Microsoft.DBforPostgreSQL/flexibleServers |
| Tier | Burstable |
| SKU | `Standard_B2ms` (2 vCore, 8 GiB RAM) |
| Storage | 32 GB |
| PG version | 16 |
| FQDN | `pg-ustax-9u14g.postgres.database.azure.com` |
| Port | 5432 |
| Database | `ustaxdb` |
| Admin user | `pgadmin` |
| Admin password | Key Vault secret `pg-admin-password` (kv `kv-ustax-dev-9u14g`) |
| JDBC URL | Key Vault secret `pg-jdbc-url` — `jdbc:postgresql://pg-ustax-9u14g.postgres.database.azure.com:5432/ustaxdb?sslmode=require` |
| Firewall — Azure services | `AllowAllAzureServicesAndResourcesWithinAzureIps_2026-6-16_23-26-53` (0.0.0.0) — covers the Container App's outbound IPs |
| Firewall — operator IP | `AllowMyClient-20260616` — `76.65.17.99` |

### Provisioning commands (already executed 2026-06-16)

```powershell
# Register provider (idempotent; first-time only)
az provider register -n Microsoft.DBforPostgreSQL --wait

# Server + database
$pgPassword = '<generated 32-char alphanumeric + symbols, stored in KV pg-admin-password>'
az postgres flexible-server create `
  -g ocr -n pg-ustax-9u14g -l centralus `
  --tier Burstable --sku-name Standard_B2ms `
  --storage-size 32 --version 16 `
  --admin-user pgadmin --admin-password $pgPassword `
  --public-access 0.0.0.0 `
  --yes
az postgres flexible-server db create -g ocr -s pg-ustax-9u14g -d ustaxdb

# Operator firewall
az postgres flexible-server firewall-rule create -g ocr -n pg-ustax-9u14g `
  --rule-name "AllowMyClient-20260616" `
  --start-ip-address 76.65.17.99 --end-ip-address 76.65.17.99

# Secrets
az keyvault secret set --vault-name kv-ustax-dev-9u14g --name pg-admin-password --value $pgPassword
az keyvault secret set --vault-name kv-ustax-dev-9u14g --name pg-jdbc-url `
  --value "jdbc:postgresql://pg-ustax-9u14g.postgres.database.azure.com:5432/ustaxdb?sslmode=require"
```

### Cost notes

| Item | Monthly (Central US) |
|---|---|
| B2ms compute | ~$26 |
| 32 GB storage | ~$3 |
| 7-day backups | included |
| **Total** | **~$30/mo flat** |

vs. retired MSSQL `sql-ustax-9u14g`:
| Item | Monthly |
|---|---|
| GP_S_Gen5 storage (idle) | ~$5 |
| Compute (when active, varies on use) | $150-400 |

The flat Postgres bill wins as soon as the app sees real traffic.

### Connect / inspect

```powershell
# Open a psql shell from your laptop (requires the firewall rule above):
az postgres flexible-server connect -n pg-ustax-9u14g -u pgadmin -d ustaxdb `
  --admin-password (az keyvault secret show --vault-name kv-ustax-dev-9u14g --name pg-admin-password --query value -o tsv)

# Or via standard psql:
$pgPassword = az keyvault secret show --vault-name kv-ustax-dev-9u14g --name pg-admin-password --query value -o tsv
$env:PGPASSWORD = $pgPassword
psql -h pg-ustax-9u14g.postgres.database.azure.com -U pgadmin -d ustaxdb --set=sslmode=require
```

### Backend wiring

Container App env vars (set in Phase 5 of the migration, see "Migration log" below):
- `PG_JDBC_URL` ← secret ref `pg-jdbc-url`
- `PG_ADMIN_PASSWORD` ← secret ref `pg-admin-password`

`application.properties` profile-by-profile:
- `quarkus.datasource.db-kind=postgresql`
- `%prod.quarkus.datasource.jdbc.url=${PG_JDBC_URL}` + `username=pgadmin` + `password=${PG_ADMIN_PASSWORD}`
- `%dev.quarkus.datasource.devservices.image-name=postgres:16-alpine`
- `quarkus.hibernate-orm.dialect=org.hibernate.dialect.PostgreSQLDialect`

## Retired — Azure SQL Server `sql-ustax-9u14g`

Deleted **2026-06-17** (Phase 7 of the Postgres migration). Recorded here for posterity.

| Item | Last-known value |
|---|---|
| Resource | `sql-ustax-9u14g.database.windows.net` |
| Database | `ustaxdb` (GP_S_Gen5 Serverless) |
| Auth | `authentication=ActiveDirectoryDefault` locally, `ActiveDirectoryMSI` in prod |
| KV secret | `sql-connection-string` (soft-deleted 2026-06-17 14:23 UTC) |
| Container App env | `SQL_CONNECTION_STRING` (removed in Phase 5) |
| Container App secret | `sql-connection-string` (removed in Phase 7) |
| Deletion command | `az sql server delete -g ocr -n sql-ustax-9u14g --yes` |

## Migration log — MSSQL → Postgres (2026-06-16)

Phase | Action | Status
---|---|---
1 | Provision Postgres + KV secrets + firewall | ✅ 2026-06-16
2 | Translate 75 Liquibase migrations (NVARCHAR→VARCHAR, BIT→BOOLEAN, DATETIMEOFFSET→TIMESTAMPTZ, IDENTITY→GENERATED ALWAYS, MERGE→INSERT ON CONFLICT, SYSUTCDATETIME→NOW(), 6 trigger files TSQL→PL/pgSQL) | ✅ 2026-06-17
3 | Backend config swap (pom.xml, application.properties, Java entity columnDefinitions) | ✅ 2026-06-17
4 | `mvn test` 1246 green + push | ✅ 2026-06-17 (commit `d25febd`)
5 | Container App env wiring + rebuild + deploy | ✅ 2026-06-17 (revision `ca-ustax-be--0000087`, image `ustax-be:pg-20260617-0947`)
6 | User runs e2e against Postgres, iterate on translation bugs | ✅ 2026-06-17 (8 PG-fix commits + ~20 follow-up e2e UI catch-ups; backend log clean — no remaining PG errors. Pre-existing test drift documented in `c:\us-tax\e2e-errors.md`.)
7 | `az sql server delete -g ocr -n sql-ustax-9u14g --yes` | ✅ 2026-06-17

## Other resources in `ocr` (unchanged by this migration)

| Resource | Name | Purpose |
|---|---|---|
| Container App | `ca-ustax-be` | Backend runtime |
| Container App Env | `cae-ustax-dev` | Workload profile |
| Container Registry | `acrustaxdev9u14g` | Backend image registry |
| Static Web App | `swa-ustax-ui` | Angular hosting (custom domain `www.taxbeans.com`) |
| Key Vault | `kv-ustax-dev-9u14g` | Secrets for backend |
| Cognitive Services | `TaxStatements` | Document Intelligence (OCR) |
| Log Analytics | `log-ustax-dev` | Backing store for App Insights |
| App Insights | `appi-ustax-dev` | Backend telemetry |

See `commands.md` for the runbook commands that touch these resources.
