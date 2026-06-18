# Desktop Application Exploration

This note captures early desktop-application options for the `us-tax` project. It is exploratory only. No migration is planned at this time.

## Feasibility

The current application is a good candidate for desktop conversion because it already has a clear frontend/backend split:
- Angular UI in `us-tax-ui`
- Quarkus backend in `us-tax-be`

The main desktop architecture options are:
- `Electron`: fastest path, best if the goal is to keep most of the existing web application structure intact.
- `Tauri`: lighter runtime and usually a stronger long-term desktop shell if the Angular frontend can communicate cleanly with the bundled backend.
- `Native shell + embedded backend`: bundle the Quarkus service locally and host the Angular application inside the desktop wrapper.

## Main Migration Concerns

The difficult parts are not mainly the UI rewrite. The bigger concerns are:
- packaging and installers
- local authentication and secure secret storage
- replacing Firestore and Firebase Auth
- backend process lifecycle management
- local file and PDF access
- auto-update strategy
- Windows/macOS code signing and distribution

## Firestore Replacement

If this web application is converted into a desktop application, the most practical Firestore replacement is likely `SQLite`.

Why `SQLite` is the best first option:
- embedded local database with no cloud dependency
- good fit for single-user desktop usage
- easy to bundle with Electron or Tauri
- supports transactional structured storage for tax returns, interview answers, forms, and computed outputs

Recommended replacement stack:
- `Firestore` -> `SQLite`
- `Firebase Auth` -> local application profile plus OS credential store / keychain
- Firestore document/blob storage -> local filesystem storage, with paths recorded in SQLite

## Likely Mapping For This Project

Possible mapping from the current app to a desktop model:
- taxpayer, return, interview, and computed tax data -> SQLite tables
- YAML form definitions -> keep as files
- generated PDFs, attachments, and imports -> local app-data directory
- login/session model -> local user profile, optionally protected by PIN or password

## If Sync Is Needed Later

If multi-device sync is ever needed, the options would change:
- local-first: use `SQLite` now and add sync later
- cloud-backed desktop: use `PostgreSQL` behind an API
- hybrid: `SQLite` local cache plus a sync service

## Commercial Licensing

If this product is ever sold as desktop software, the preferred licensing model is a server-backed entitlement system rather than a purely local license-key check.

Recommended model:
- sell an annual license per tax year, such as `2025 Desktop` or `2026 Desktop`
- use a Merchant of Record for checkout, billing, tax collection, and compliance
- run an application-owned licensing service that issues signed entitlements
- allow offline use after activation, with periodic revalidation

Reasoning:
- a pure local license key is too easy to bypass
- a pure always-online subscription check is too fragile for tax software
- tax customers usually expect one clear purchase for a filing season and the ability to keep working offline

### Suggested Sales Structure

A simple starting model would be:
- `Basic`: 1 return, 1 device
- `Standard`: 3 returns, 2 devices
- `Pro/Preparer`: more returns and more devices

This should likely be sold per tax year rather than as a generic monthly SaaS plan.

### Suggested Technical Licensing Design

Backend licensing service:
- add a licensing module in the backend
- track `customers`, `licenses`, `activations`, `entitlements`, and `webhook/payments`
- issue signed license tokens after successful activation

Signed token should include:
- license id
- product tier or edition
- tax year
- expiration date
- activation id
- device fingerprint hash

Desktop app behavior:
- first launch asks for account sign-in or license credentials
- app sends activation request to backend
- backend returns a signed token
- app stores the token locally and validates it offline
- app revalidates periodically, such as every 7 to 30 days
- app allows a grace period if the licensing server is temporarily unreachable

### Anti-Abuse Controls

Keep the controls practical instead of aggressive:
- limit activations by plan
- allow customers to deactivate an old device
- monitor obvious overuse patterns
- avoid invasive DRM behavior
- do not break an already-activated user just because they are briefly offline

## Vendor Options

Practical vendor options include:
- `Lemon Squeezy` plus an application-owned entitlement service
- `Paddle` plus an application-owned entitlement service
- `Stripe` plus an application-owned entitlement service and a separate tax/compliance strategy
- `Cryptlex` if a more off-the-shelf node-locked licensing platform is preferred

A Merchant of Record approach is attractive because it offloads payment liability, refunds, chargebacks, and sales-tax handling.

## Reverse Engineering Protection

Reverse engineering cannot be fully prevented for software that runs on a customer machine. The realistic goal is to make it expensive, incomplete, and commercially unattractive.

### Core Principles

Recommended protection principles:
- keep the most sensitive business logic on a server whenever possible
- never embed private signing keys or permanent secrets in the desktop app
- use signed entitlements instead of editable local feature flags
- treat obfuscation as a delay tactic, not a true security boundary

### Practical Protection Layers

If this project is commercialized as a desktop product, practical protection should include:
- server-issued signed license or entitlement tokens
- public-key verification in the client
- short-lived access tokens where online access is needed
- code signing for the application and update packages
- signed update verification inside the app
- local tamper checks around licensing and update validation
- symbol stripping and code obfuscation where the platform allows it
- moving sensitive local enforcement into a native layer rather than plain JavaScript when possible

### Architecture Guidance

For stronger code protection:
- prefer `Tauri` over `Electron` if reducing JavaScript exposure is important
- keep licensing and entitlement issuance on the server
- keep private cryptographic keys only on controlled infrastructure
- place the most sensitive local checks in native code or a lower-level runtime instead of frontend JavaScript

### What To Avoid

Effort is usually wasted on:
- heavy DRM that harms legitimate customers
- client-only license checks
- storing secrets in bundled config or environment files
- assuming minification meaningfully protects source logic

### Practical Goal

The realistic goal is not to make reverse engineering impossible. The goal is to protect licensing, signing keys, update trust, and the highest-value business logic well enough that paying is easier than bypassing.

## Current Recommendation

For this specific project, the most practical desktop direction appears to be:
- desktop shell using `Electron` or `Tauri`
- `SQLite` replacing Firestore
- local filesystem for uploaded and generated tax documents
- OS secure storage for secrets
- server-backed commercial licensing with signed offline-capable entitlements
- checkout and billing through a Merchant of Record if the product is commercialized
- layered anti-reverse-engineering protections focused on licensing, secrets, and update integrity

This recommendation is exploratory only and should not be treated as a current migration plan.

## JavaFX As A Desktop UI Option

`JavaFX` is technically viable, but for this project it is usually not the best migration path.

Why it is usually a poor fit here:
- the current frontend is already built in `Angular`
- moving to JavaFX would require a full frontend rewrite
- it would break the easiest path to sharing UI work between web and desktop
- it would force the tax interview flows, validation, and component behavior to be rebuilt in a different UI stack

When JavaFX would make sense:
- the product is intentionally becoming desktop-only
- a full native-Java UI stack is preferred over a web UI
- the team accepts the cost of a complete rewrite

Current recommendation if desktop is pursued:
- keep the `Angular` frontend
- use `Tauri` as the preferred desktop shell
- use `Electron` only if it is chosen for faster familiarity or ecosystem reasons
- do not use `JavaFX WebView` as a wrapper around the Angular app, because that usually keeps the downsides of both approaches

## How Updates Would Work With Angular + Tauri

With `Angular + Tauri`, application updates work like desktop application package updates, not like web-app redeploys.

Typical update flow:
1. build the Angular frontend into static assets
2. bundle those assets into the Tauri desktop application
3. publish a new desktop version
4. the installed app checks an update endpoint
5. if a newer version exists, Tauri downloads the signed update artifact
6. Tauri verifies the artifact with the embedded public key
7. the update is installed and the application restarts

Practical implications:
- the Angular frontend is updated together with the desktop shell
- if a backend sidecar is bundled locally, it should be updated as part of the same release
- local user data should live outside the install directory so updates do not overwrite returns, PDFs, or attachments
- local `SQLite` schema migrations should run on startup after a successful update
- versioning should keep frontend, backend, and database schema aligned in a single release

Preferred update model for this project:
- release one atomic desktop package containing the UI, shell, and any bundled backend components
- sign update artifacts
- host either a static update manifest or a dynamic update endpoint
- treat desktop updates as full application releases rather than partial frontend-only patches

## Protecting Frontend Code And Database Design

If the software runs on a customer machine, it is not possible to fully prevent reverse engineering of the frontend code or the local database design.

A determined user can eventually inspect:
- bundled JavaScript and frontend assets
- local database files
- runtime memory
- IPC traffic between frontend and native/backend layers

The realistic objective is to make reverse engineering difficult, partial, and commercially unattractive.

### Practical Protection Strategy

Recommended protections if this project becomes a desktop app:
- keep the most sensitive tax logic and licensing logic on a server whenever possible
- keep `Angular` focused on presentation rather than sensitive computation
- move sensitive local enforcement into `Rust` commands or native code instead of frontend TypeScript
- use `SQLCipher` instead of plain `SQLite` if local database encryption is needed
- store secrets and encryption keys in secure storage, not in frontend code
- use OS secure storage or a secure secret-management layer such as `Stronghold`
- sign updates and binaries
- obfuscate frontend assets only as a delay tactic, not as a security boundary

### Important Limits

Important constraints to accept:
- minification and obfuscation do not truly protect frontend logic
- local database encryption protects the file at rest, but not against a determined reverse engineer once the app unlocks it
- if the app must run fully offline with all business logic on-device, secrecy is materially weaker than in a web-first architecture

### Strongest Practical Direction

If code and schema secrecy matter strongly in a future desktop version, the strongest practical desktop design would be:
- `Angular` for presentation only
- `Tauri` with a `Rust` layer for sensitive local operations
- `SQLCipher` for encrypted local data storage
- secrets stored outside the frontend bundle
- server-backed licensing and signed entitlements
- signed update packages

If maximum secrecy is the main priority, keeping the most sensitive logic on controlled server infrastructure remains stronger than any fully offline desktop design.
