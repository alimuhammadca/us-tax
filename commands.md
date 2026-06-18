# Dev Commands

## Backend (Quarkus)
```powershell
cd C:\us-tax\us-tax-be
.\run-dev.ps1
```

## Frontend (Angular with API proxy)
```powershell
cd C:\us-tax\us-tax-ui
ng serve --proxy-config proxy.conf.json
```

## Deploy (Claude Code Skill)

A `/deploy` skill is available at `C:\us-tax\us-tax-be\.claude\commands\deploy.md`.
Type `/deploy` in Claude Code to automatically run all deployment steps (Cloud Build → Cloud Run → Angular build → Firebase Hosting → history update) in the correct order.

---

## Deploy Backend to Cloud Run

```powershell
cd C:\us-tax\us-tax-be

# Step 1 — Build JAR + Docker image via Cloud Build and push to Artifact Registry
& "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit --config cloudbuild.yaml .

# Step 2 — Deploy the new image to Cloud Run
& "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy us-tax-be `
  --image us-central1-docker.pkg.dev/us-tax-ebeb9/cloud-run-source-deploy/us-tax-be:latest `
  --region us-central1 `
  --platform managed
```

**Service URL:** `https://us-tax-be-15721879944.us-central1.run.app`  
`cloudbuild.yaml` runs `./mvnw -B -DskipTests package` then builds from `src/main/docker/Dockerfile.jvm`.

---

## Deploy Frontend to Firebase Hosting

```powershell
cd C:\us-tax\us-tax-ui

# Step 1 — Production Angular build (outputs to dist/us-tax-ui/browser)
npm run build

# Step 2 — Push to Firebase Hosting (project: us-tax-ebeb9)
firebase deploy --only hosting
```

**Hosting URL:** `https://us-tax-ebeb9.web.app`  
`firebase.json` points `public` at `dist/us-tax-ui/browser` with a catch-all rewrite to `/index.html`.

---

## Delete all Firebase Auth users
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\us-tax-ebeb9-firebase-adminsdk-fbsvc-bae3d320bb.json"
cd C:\us-tax\tools\firestore-admin
node delete-all-auth-users.js
```
Dry run (lists users without deleting): append `--dry-run`

---

## Seed sample messages for a user (Messages dialog)

```powershell
cd C:\us-tax\us-tax-be\tools\nuke
node seed-messages.js `
  --project us-tax-ebeb9 `
  --credentials "C:\us-tax-ebeb9-firebase-adminsdk-fbsvc-bae3d320bb.json" `
  --phone "+19056193359"
```

Writes 5 sample messages to `users/{uid}/messages` for the user identified by phone number, where the uid is resolved via `admin.auth().getUserByPhoneNumber()`. The user must have signed in to the app at least once so Firebase Auth has a record for that phone. Re-running appends another batch (Firestore auto-IDs avoid collisions). Cleanup: delete from the in-app Messages dialog or via Firebase Console.

`--project` and `--credentials` accept any service account with Firestore + Firebase Auth access; `--phone` must be in E.164 format (e.g. `+19056193359`). The seeder lives in `tools/nuke/` only because `firebase-admin` is already installed there — functionally it's a sibling tool to the nuke script.

---

## Inspect a user's messages directly in Firestore

```powershell
cd C:\us-tax\us-tax-be\tools\nuke
node check-messages.js `
  --project us-tax-ebeb9 `
  --credentials "C:\us-tax-ebeb9-firebase-adminsdk-fbsvc-bae3d320bb.json" `
  --phone "+19056193359"
```

Reads `users/{uid}/messages` for the user identified by phone number and prints each document's id, `createdAt` (epoch ms), and `subject`. Useful for confirming seed/delete behavior without going through the app.

---

## Fetch a backend URL as a specific user (mint and use a Firebase ID token)

```powershell
cd C:\us-tax\us-tax-be\tools\nuke
node fetch-as-user.js `
  --project us-tax-ebeb9 `
  --credentials "C:\us-tax-ebeb9-firebase-adminsdk-fbsvc-bae3d320bb.json" `
  --phone "+19056193359" `
  --url "http://localhost:8080/api/messages" `
  --api-key "AIzaSyCPZwHv-6bbElRgo3g75Ezc256kGl3GC2s"
```

Uses `admin.auth().createCustomToken(uid)` to mint a custom token for the user, exchanges it via Identity Toolkit `signInWithCustomToken` (requires the public web `--api-key`, same as `firebase.config.ts`), then calls `--url` with `Authorization: Bearer <idToken>`. Prints the HTTP status and response body. Useful for diagnosing "browser shows empty data" by confirming what the backend actually returns to that user — separates frontend/bundle issues from backend/auth issues.

---

# Deploy to Azure (Phase 1)

This is the new deployment path. **Cloud Run / Firebase Hosting sections above are kept for rollback only — they are no longer the active deploy path.**

## Resource reference

All resources live in resource group **`ocr`** in **Central US**. Suffix `9u14g` makes globally-unique names predictable; persisted in `C:\us-tax\.azure-suffix`.

| Component | Name | URL / Notes |
|---|---|---|
| Resource Group | `ocr` | Shared with Document Intelligence (`TaxStatements`) |
| Log Analytics | `log-ustax-dev` | 30-day retention |
| Application Insights | `appi-ustax-dev` | Workspace-based on `log-ustax-dev` |
| Container Apps Env | `cae-ustax-dev` | Consumption |
| Container Registry | `acrustaxdev9u14g.azurecr.io` | Basic, admin disabled, MI pulls only |
| Key Vault | `kv-ustax-dev-9u14g` | RBAC mode |
| Container App | `ca-ustax-be` | https://ca-ustax-be.ashydesert-7408eba4.centralus.azurecontainerapps.io |
| Static Web App | `swa-ustax-ui` | **https://www.taxbeans.com** (custom domain) — default host `purple-flower-0e823c610.7.azurestaticapps.net` |

**Key Vault secrets** (referenced by the Container App via `secretref:`):
- `firestore-credentials` — Firebase service-account JSON (multi-line)
- `document-intelligence-key` — Azure Cognitive Services key
- `firebase-project-id` — `us-tax-ebeb9`
- `appinsights-connection-string` — App Insights OTLP endpoint info

**Managed identity**: `ca-ustax-be` has a system-assigned MI with these roles:
- `AcrPull` on `acrustaxdev9u14g`
- `Key Vault Secrets User` on `kv-ustax-dev-9u14g`
- `Cognitive Services User` on `TaxStatements`

## Azure CLI on this machine

`az` isn't on the PATH by default. Either run from a fresh PowerShell where you've added it, or prefix every session:

```powershell
$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
az account show --output table   # confirm subscription 'us-tax' is active
```

---

## Rebuild and redeploy the backend (most common operation)

After backend code changes — full cycle ~5 minutes:

```powershell
$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
cd C:\us-tax\us-tax-be

# Pick a tag — sha-short or timestamp keeps revisions distinguishable
$tag = (Get-Date).ToString("yyyyMMdd-HHmm")

# 1) Build the image in Azure (no local docker/Maven needed)
az acr build `
  --registry acrustaxdev9u14g `
  --image "ustax-be:$tag" `
  --image "ustax-be:latest" `
  --file src/main/docker/Dockerfile.azure `
  .

# 2) Roll the Container App to the new image (creates a new revision; old one drains)
az containerapp update `
  --name ca-ustax-be `
  --resource-group ocr `
  --image "acrustaxdev9u14g.azurecr.io/ustax-be:$tag"

# 3) Smoke test
$fqdn = az containerapp show -n ca-ustax-be -g ocr --query properties.configuration.ingress.fqdn -o tsv
Invoke-WebRequest -Uri "https://$fqdn/q/health/ready" -UseBasicParsing
```

The build runs cloud-side (Maven 3.9 + JDK 17 first stage, ubi9 openjdk-21 runtime second stage). First build was ~4 min; subsequent builds reuse layers and run faster.

---

## Redeploy the frontend

The frontend deploys automatically via GitHub Actions on every push to `main`:

```powershell
cd C:\us-tax\us-tax-ui
# Make changes, then:
git push origin main
# Watch the build at: https://github.com/alimuhammadca/us-tax-ui/actions
```

The workflow (`.github/workflows/azure-static-web-apps.yml`) runs `npm ci` + `ng build --configuration production` and uploads `dist/us-tax-ui/browser` to SWA.

Manual deploy without git push (rarely needed):
```powershell
cd C:\us-tax\us-tax-ui
npm run build -- --configuration production
# Need the SWA CLI tool: npm install -g @azure/static-web-apps-cli
swa deploy ./dist/us-tax-ui/browser --deployment-token "<paste from az>"
# Token: az staticwebapp secrets list -n swa-ustax-ui -g ocr --query properties.apiKey -o tsv
```

---

## Common ops

### Tail backend logs (live)
```powershell
az containerapp logs show -n ca-ustax-be -g ocr --follow --tail 50 --format text
```

### Tail logs from a specific revision (e.g. troubleshooting a bad deploy)
```powershell
$rev = az containerapp revision list -n ca-ustax-be -g ocr --query "sort_by([],&properties.createdTime)[-1].name" -o tsv
az containerapp logs show -n ca-ustax-be -g ocr --revision $rev --tail 200 --format text
```

### List revisions and traffic split
```powershell
az containerapp revision list -n ca-ustax-be -g ocr `
  --query "[].{name:name, active:properties.active, replicas:properties.replicas, traffic:properties.trafficWeight, health:properties.healthState, state:properties.runningState}" `
  --output table
```

### Force a restart (e.g. after a secret rotation)
```powershell
# Container App secrets are evaluated at startup. Use a no-op env var bump
# (e.g. timestamp) to force a new revision to roll out:
$bump = (Get-Date).ToString("yyyyMMddHHmmss")
az containerapp update -n ca-ustax-be -g ocr --set-env-vars "DEPLOY_STAMP=$bump"
```

### Rotate the Document Intelligence key
```powershell
# 1. Rotate in Azure portal: TaxStatements → Keys and Endpoint → regenerate
# 2. Push the new key to Key Vault (creates a new version; latest is auto-used)
az keyvault secret set --vault-name kv-ustax-dev-9u14g --name document-intelligence-key --value "<new-key>"
# 3. Force the Container App to pick it up
$bump = (Get-Date).ToString("yyyyMMddHHmmss")
az containerapp update -n ca-ustax-be -g ocr --set-env-vars "DEPLOY_STAMP=$bump"
```

### Update CORS to add a new origin
```powershell
# NOTE: --set-env-vars REPLACES the whole CORS_ORIGINS value, so list the full current set + the new origin.
# Current set (Firebase-Hosting origins dropped 2026-05-28 — hosting is decommissioned; only Firebase Auth remains):
az containerapp update -n ca-ustax-be -g ocr `
  --set-env-vars "CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,https://purple-flower-0e823c610.7.azurestaticapps.net,https://taxbeans.com,https://www.taxbeans.com,<new-origin>"
```

### Get SWA deployment token (for GitHub secret rotation)
```powershell
az staticwebapp secrets list -n swa-ustax-ui -g ocr --query properties.apiKey -o tsv
```

### Custom domain (taxbeans.com) — set up 2026-05-29

Live at **https://www.taxbeans.com** (canonical). DNS stays at **GoDaddy** (not Azure DNS). GoDaddy has no `ALIAS`/`ANAME`, so the apex can't serve from the SWA directly — hence `www` is canonical and the apex 301-forwards to it.

- **`www`** is the SWA custom domain. GoDaddy `CNAME www → purple-flower-0e823c610.7.azurestaticapps.net`, then:
  ```powershell
  az staticwebapp hostname set -n swa-ustax-ui -g ocr --hostname www.taxbeans.com --validation-method cname-delegation
  ```
  Azure auto-validates the CNAME and issues a managed TLS cert (status → `Ready`). The CNAME must already exist or it errors `CNAME Record is invalid`.
- **apex `taxbeans.com`** uses GoDaddy **Domain Forwarding** (301, "Forward only", no masking) → `https://www.taxbeans.com`. It is **not** a SWA custom domain. GoDaddy points the apex A-records at its forwarding servers (`15.197.142.173` / `3.33.152.147`) and provisions the redirect's TLS.
- **CORS**: `https://taxbeans.com` + `https://www.taxbeans.com` are in `ca-ustax-be` `CORS_ORIGINS` (see "Update CORS" above).
- **Firebase**: `taxbeans.com` + `www.taxbeans.com` added to Authentication → Authorized domains (required for phone-OTP).
- **Verify**: `curl -sL -o /dev/null -w "%{url_effective} %{http_code}" https://taxbeans.com` → `https://www.taxbeans.com/ 200`. (Apex `curl -I`/HEAD returns 405 from GoDaddy's forwarder — use GET.)

### Open App Insights live metrics
```powershell
# Just visit https://portal.azure.com/#@/resource/subscriptions/<sub>/resourceGroups/ocr/providers/microsoft.insights/components/appi-ustax-dev/quickPulse
# Or query logs via:
az monitor app-insights query -g ocr --apps appi-ustax-dev --analytics-query "requests | take 50" --output table
```

---

## First-time provisioning (one-shot, kept here for disaster recovery)

If everything in `ocr` were lost, this is the order that worked. Each `az provider register` is idempotent.

```powershell
$env:Path = "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin;" + $env:Path
$rg = "ocr"; $loc = "centralus"
$suffix = -join ((97..122) + (48..57) | Get-Random -Count 5 | ForEach-Object { [char]$_ })
$suffix | Out-File C:\us-tax\.azure-suffix -NoNewline -Encoding ascii

# Register providers BEFORE creating resources that use them (avoids first-create errors)
az provider register -n Microsoft.OperationalInsights --wait
az provider register -n microsoft.insights --wait
az provider register -n Microsoft.App --wait                # Container Apps
az provider register -n Microsoft.ContainerRegistry --wait
az provider register -n Microsoft.KeyVault --wait
az provider register -n Microsoft.Web --wait                # Static Web Apps
az extension add --name containerapp --upgrade --only-show-errors

# Resource group already exists (ocr); skip if creating new
# az group create -n $rg -l $loc

# Log Analytics + App Insights
az monitor log-analytics workspace create -g $rg -n log-ustax-dev -l $loc
$la = az monitor log-analytics workspace show -g $rg -n log-ustax-dev --query id -o tsv
az monitor app-insights component create --app appi-ustax-dev -l $loc -g $rg --workspace $la

# Container Apps Environment, ACR, Key Vault
$laCustomerId = az monitor log-analytics workspace show -g $rg -n log-ustax-dev --query customerId -o tsv
$laKey        = az monitor log-analytics workspace get-shared-keys -g $rg -n log-ustax-dev --query primarySharedKey -o tsv
az containerapp env create -n cae-ustax-dev -g $rg -l $loc --logs-workspace-id $laCustomerId --logs-workspace-key $laKey
az acr create -n "acrustaxdev$suffix" -g $rg -l $loc --sku Basic --admin-enabled false
az keyvault create -n "kv-ustax-dev-$suffix" -g $rg -l $loc --enable-rbac-authorization true

# Placeholder Container App (real image deployed later)
az containerapp create -n ca-ustax-be -g $rg `
  --environment cae-ustax-dev `
  --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" `
  --target-port 80 --ingress external `
  --min-replicas 0 --max-replicas 5 --cpu 0.5 --memory 1.0Gi `
  --system-assigned

# Capture identities and grant roles
$caPrincipal = az containerapp show -n ca-ustax-be -g $rg --query identity.principalId -o tsv
$me          = az ad signed-in-user show --query id -o tsv
$acrId       = az acr show -n "acrustaxdev$suffix" -g $rg --query id -o tsv
$kvId        = az keyvault show -n "kv-ustax-dev-$suffix" -g $rg --query id -o tsv
$docIntelId  = az cognitiveservices account show -n TaxStatements -g $rg --query id -o tsv
az role assignment create --assignee $caPrincipal --role AcrPull                       --scope $acrId
az role assignment create --assignee $caPrincipal --role "Key Vault Secrets User"      --scope $kvId
az role assignment create --assignee $caPrincipal --role "Cognitive Services User"     --scope $docIntelId
az role assignment create --assignee $me          --role "Key Vault Secrets Officer"  --scope $kvId

# Tell the Container App to use its MI for ACR auth (separate step!)
az containerapp registry set -n ca-ustax-be -g $rg --server "acrustaxdev$suffix.azurecr.io" --identity system

# Put secrets in Key Vault
$creds = "C:\us-tax-ebeb9-firebase-adminsdk-fbsvc-bae3d320bb.json"   # GCP service account
az keyvault secret set --vault-name "kv-ustax-dev-$suffix" --name firestore-credentials       --file $creds
az keyvault secret set --vault-name "kv-ustax-dev-$suffix" --name document-intelligence-key   --value "<actual-key>"
az keyvault secret set --vault-name "kv-ustax-dev-$suffix" --name firebase-project-id         --value "us-tax-ebeb9"
$aiConn = az monitor app-insights component show -g $rg --app appi-ustax-dev --query connectionString -o tsv
az keyvault secret set --vault-name "kv-ustax-dev-$suffix" --name appinsights-connection-string --value $aiConn

# Wire Container App secret refs and env vars
$kvUri = "https://kv-ustax-dev-$suffix.vault.azure.net/secrets"
az containerapp secret set -n ca-ustax-be -g $rg --secrets `
  "firebase-project-id=keyvaultref:$kvUri/firebase-project-id,identityref:system" `
  "firestore-credentials=keyvaultref:$kvUri/firestore-credentials,identityref:system" `
  "document-intelligence-key=keyvaultref:$kvUri/document-intelligence-key,identityref:system" `
  "appinsights-connection-string=keyvaultref:$kvUri/appinsights-connection-string,identityref:system"

az containerapp ingress update -n ca-ustax-be -g $rg --target-port 8080
az containerapp update -n ca-ustax-be -g $rg `
  --image "acrustaxdev$suffix.azurecr.io/ustax-be:latest" `
  --set-env-vars `
    "FIREBASE_PROJECT_ID=secretref:firebase-project-id" `
    "GOOGLE_APPLICATION_CREDENTIALS_JSON=secretref:firestore-credentials" `
    "AZURE_DOCUMENT_INTELLIGENCE_KEY=secretref:document-intelligence-key" `
    "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://taxstatements.cognitiveservices.azure.com/" `
    "CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,https://us-tax-ebeb9.web.app,https://us-tax-ebeb9.firebaseapp.com" `
    "APPLICATIONINSIGHTS_CONNECTION_STRING=secretref:appinsights-connection-string"

# Static Web App
az staticwebapp create -n swa-ustax-ui -g $rg -l $loc --sku Free
$swaHost = az staticwebapp show -n swa-ustax-ui -g $rg --query defaultHostname -o tsv
# Update Container App CORS to add the SWA host:
az containerapp update -n ca-ustax-be -g $rg --set-env-vars `
  "CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,https://us-tax-ebeb9.web.app,https://us-tax-ebeb9.firebaseapp.com,https://$swaHost"
# Print deployment token (add to GitHub repo as AZURE_STATIC_WEB_APPS_API_TOKEN)
az staticwebapp secrets list -n swa-ustax-ui -g $rg --query properties.apiKey -o tsv
```

---

## Gotchas (hard-won lessons from the first deploy)

1. **Register resource providers BEFORE creating resources** — first `az containerapp create` triggered an in-flight registration and then a subsequent `az containerapp show` failed with "Subscription is not registered for Microsoft.App". Solution: explicit `az provider register --wait` for each provider up front.

2. **`COPY --chmod=755 ...` requires BuildKit** — ACR Build runs Docker without BuildKit by default. Replace with a separate `RUN chmod 755 <file>` line. This bit `Dockerfile.azure` on the first build.

3. **`AcrPull` role alone isn't enough** — even with the role assigned, the Container App needs to be explicitly told to use the managed identity for registry auth via `az containerapp registry set --identity system`. Symptom was "UNAUTHORIZED: authentication required" when updating to a private-ACR image.

4. **`--set-env-vars` silently drops on a failed `update`** — when the first `az containerapp update` failed (due to the ACR auth issue), the env vars I'd included in that command were NOT preserved when the next `update` succeeded with just `--image`. Always verify env vars with `az containerapp show --query "properties.template.containers[0].env"` after a failed update. Re-apply env vars in a follow-up `update` if needed.

5. **`.dockerignore` allowlist breaks multistage Maven builds** — Quarkus's default `.dockerignore` is `* !target/...` (deny-all + allow build artifacts). The multistage `Dockerfile.azure` needs `pom.xml`, `src/`, `.mvn/`, `mvnw` in the build context. Switched to denylist style (block `.git/`, `.idea/`, `node_modules/`, etc.; everything else allowed).

6. **Quarkus property `${VAR}` with no default** — if the env var isn't set, Quarkus startup fails fast with `Failed to load config value of type ... for: <key>`. Useful: it surfaces missing config immediately rather than at first request.

7. **SWA Free tier doesn't support external linked backends** — the `staticwebapp.config.json` `routes[].rewrite` syntax cannot proxy to an external URL on Free tier. To avoid the $9/mo Standard tier upgrade, configure CORS on the backend and have the Angular app call the Container App URL directly (which is what we did). The Standard tier proxy would eliminate CORS — possible upgrade path later.

8. **SWA default hostname is random** — `purple-flower-0e823c610.7.azurestaticapps.net`. Custom domain now configured (2026-05-29): **www.taxbeans.com** (GoDaddy CNAME + apex 301-forwarding) — see "Custom domain (taxbeans.com)" above. If the SWA is ever recreated (new random hostname), re-point the GoDaddy `www` CNAME and re-validate.

9. **Windows env vars not inherited into PowerShell launched by Claude** — `$env:GOOGLE_APPLICATION_CREDENTIALS` was empty in a fresh PS session even though the user had it set in `run-dev.ps1`. Use `[Environment]::GetEnvironmentVariable('NAME','User')` to read user-scope env vars, or hardcode known paths.

10. **The Container App health probe `/q/health/ready` reports Firestore connectivity** — `quarkus-google-cloud-firestore` exposes a `firestore-ready` health check automatically. A `200` response with `firestore-ready: UP` confirms the cross-cloud auth flow (Key Vault secret → entrypoint script writes file → `GOOGLE_APPLICATION_CREDENTIALS` → Firestore SDK) is working end-to-end.
