# Authentication Redesign — Password + Phone-SMS 2FA

**Status:** approved direction, implementation starting 2026-07-15.
**Owner decision:** primary factor = **email + password**; second factor = **phone SMS** (Firebase
Identity Platform MFA). No data migration (development, single user → clean cutover).

---

## 1. Why

Current login is **Firebase Phone Auth (SMS one-time code) as the *sole* factor**. Weaknesses:

1. **Single-factor SMS** — SIM-swap / interception / OTP-phishing all defeat it (worst risk for an
   app holding SSNs / W-2s / bank info; SMS is a *restricted* authenticator per NIST 800-63B).
2. **Account enumeration** — `GET /profiles/exists?phone=` is `@PermitAll` (ProfileResource:88) and
   the sign-in UI says *"No account found for this phone number,"* letting anyone enumerate customers.
3. **Tokens in `localStorage`** — XSS can read the ID + long-lived refresh token (accepted risk for
   now; see §7 Out-of-scope for the session-cookie follow-up).
4. **No server-side revocation / session control**.

**What is already sound:** backend verifies every request's Firebase ID token via the **Firebase
Admin SDK** (`quarkus.google.cloud.firebase.auth.enabled=true`) — real signature/issuer/aud/expiry
checks. We keep this.

## 2. Target model

- **First factor:** Firebase **Email/Password** (Identity Platform password policy + email-enumeration
  protection enabled in console).
- **Second factor:** **Phone SMS** enrolled via Firebase MFA (`multiFactor().enroll(...)`).
- **Enrollment is mandatory:** a newly created account must enrol a phone second factor before it can
  reach the app (guarded route).
- Sign-in: `signInWithEmailAndPassword` → Firebase throws `auth/multi-factor-auth-required` →
  resolve with an SMS code → signed-in ID token now carries `firebase.sign_in_second_factor: "phone"`.
- Backend token verification is **unchanged**; optionally require the `sign_in_second_factor` claim on
  sensitive endpoints.

> **Trade-off noted:** SMS-as-second-factor still carries SIM-swap risk *on the second factor*; TOTP
> would be strictly stronger and free. This design leaves room to add TOTP as an *additional* second
> factor later (same enrollment plumbing) — see §7.

## 3. Console prerequisites (done by owner — see chat 2026-07-15)

Identity Platform enabled; Email/Password provider on; password policy + email-enumeration protection
on; **SMS multi-factor** enabled with **US-only SMS region policy** (toll-fraud guard); test
email+password created; test phone `+1 905-619-3359` / `123456` kept (works as MFA test number).
App Check (reCAPTCHA) optional — wire the site key if provided.

## 4. Frontend changes (Angular + Firebase Web SDK)

**`service/auth.service.ts`** — replace the phone-only API with:
- `signUp(email, password, profile)` → `createUserWithEmailAndPassword` → `sendEmailVerification` →
  save profile via `PUT /profiles/me`.
- `signIn(email, password)` → `signInWithEmailAndPassword`; on `auth/multi-factor-auth-required`
  return the `MultiFactorResolver` for the challenge step.
- `startPhoneEnrollment(phone, recaptcha)` / `completePhoneEnrollment(verificationId, code, label)`
  → `multiFactor(user).getSession()` → `PhoneAuthProvider.verifyPhoneNumber` →
  `multiFactor(user).enroll(PhoneMultiFactorGenerator.assertion(cred), label)`.
- `sendMfaChallenge(resolver, recaptcha)` / `resolveMfa(resolver, verificationId, code)`.
- `sendPasswordReset(email)`; keep `getIdToken()`, `signOut()`, `getProfile()`.
- **Remove:** `checkProfileExists`, `sendPhoneCode`, `confirmPhoneCode`, `pendingProfile` phone flow.

**Components:**
- `auth-sign-in.component.ts` → email + password; on MFA-required → route to the SMS challenge screen.
- `auth-sign-up.component.ts` → email + password + profile (first/last/phone) → then **force phone
  enrollment**.
- `auth-verify-code.component.ts` → dual purpose: MFA **enrollment** (sign-up) and MFA **challenge**
  (sign-in), driven by a mode flag / router state.
- New small **security panel** (change password, re-enrol phone, "sign out everywhere") — can follow.
- `auth.guards.ts` → add an **`mfaEnrolledGuard`** (block the app until `multiFactor(user).enrolledFactors`
  is non-empty; redirect to enrollment).

## 5. Backend changes (Quarkus)

- **Delete** `GET /profiles/exists` (`@PermitAll`) — the enumeration oracle; no longer called.
- (Recommended, low-cost) `RoleService`-style **`AuthAdminResource.signOutEverywhere`** →
  `FirebaseAuth.revokeRefreshTokens(uid)`; and verify sensitive endpoints with the Admin SDK
  `checkRevoked=true`. *(Confirm whether the quarkiverse extension exposes a revocation-check hook;
  if not, this is a follow-up.)*
- Optionally require `firebase.sign_in_second_factor == "phone"` on admin/support + data-export
  endpoints.

## 6. Tests

- **UI unit:** rewrite `auth.service.spec` (new flows), keep `auth.guards.spec` + add `mfaEnrolledGuard`.
- **E2E:** update `e2e/tests/helpers/auth.ts` → sign in with **test email+password**, then resolve the
  **MFA SMS challenge with the test phone code**. This is the shared sign-in path used by
  `clearUserData`, so every spec inherits it → run a **full regression** after.
- Consider the **Firebase Auth Emulator** for deterministic MFA e2e (optional).

## 7. Out of scope (candidate follow-ups)

- **HttpOnly Firebase session cookies** (`createSessionCookie`) to remove the localStorage/XSS
  exposure — the biggest remaining hardening; deferred to keep this change focused.
- **TOTP** as an additional/preferred second factor.
- **Breach/leaked-password** check (HIBP k-anonymity) — not a native Firebase toggle.
- Rate limiting on auth endpoints + auth audit log + CSP/HSTS headers.

## 8. Rollout

Single dev user, no production data → **clean cutover** (delete the phone-only flow outright; the one
existing account re-registers with email+password + enrolls its phone). Land FE + BE + e2e as one
coherent change on a feature branch; full regression before merge.
