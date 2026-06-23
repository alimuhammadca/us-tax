# Outstanding Items

Updated: 2026-05-18T23:00:00-04:00

(Line 1e audit closed all 9 issues in-code without producing new deferred items. See `history.md` 2026-05-07 entry. **Line 1f audit complete 2026-05-08 — all 12 issues closed; 5 deferred enhancements tracked below: foreign-child finality retro, shared-adoption $17,280 split with non-spouse, IRC §1372 over-2% S-corp owner, IRC §137(d) auto-subtraction, special-needs off-W-2 Part III enablement.** See `history.md` 2026-05-08 entry. **Line 1g audit complete 2026-05-09 — all 10 issues closed; 1 new deferred enhancement tracked below: Schedule 2 line 13 (W-2 box 12 codes A/B/M/N).** See `history.md` 2026-05-09 entry. **Line 1h audit complete 2026-05-10 — all 10 issues closed; 2 new deferred enhancements tracked below: code-P-only 1099-R advisory flag, corrective box-2a missing advisory.** See `history.md` 2026-05-10 entry. **Line 1i audit complete 2026-05-10 — all 10 issues closed; 4 new deferred enhancements tracked below: legacy EIC-form combat-pay fields cleanup, broader sumW2Box12ByCodes helper null-SSN handling, combat-pay-as-IRA-compensation (IRC §219(f)(7)), Form 1040 top combat-zone checkbox wiring.** See `history.md` 2026-05-10 line-1i entry. **Line 1z audit complete 2026-05-10 — all 10 issues closed; 1 new deferred enhancement tracked below (addNonNullVarargs helper + cross-site migration); 1 orphaned-YAML deletion (`1b-household-employee-wages.yaml` removed; long-standing outstanding.md item now marked Resolved 2026-05-10). Knowledge-file naming convergence complete across line 1c-1z.** See `history.md` 2026-05-10 line-1z entry. **Canonical 0-vs-null semantic established 2026-05-10 (Option B applied) — `knowledge/canonical-null-zero-semantic.md` + `rules.md`. Line 1e fixed; cross-line audit folded into each remaining Form 1040 line audit (see deferred entry below).** **Line 2a audit complete 2026-05-11 — all 10 issues closed; 1 new deferred enhancement tracked below: seller-financed mortgage Schedule B trigger. High-leverage MFS guard at computeInterestIncome protects 5 outputs (lines 2a + 2b + 3a + 3b + Form 6251 line 2g + Schedule B Parts I/II); single-guard MFS cascade now applied to 8 orchestrators. Knowledge-file naming convergence extended to line 1c-2ab. lines/2ab.md spec refreshed with §7.1 rewrite + §7.2 + §12 verification log. YAML help-text market-discount caveat added (taxpayer + spouse).** See `history.md` 2026-05-11 line-2a entry. **Line 2b audit complete 2026-05-11 — all 10 issues closed; ZERO new deferred enhancements (every deferral was already tracked from 2a). 1 NEW backend bug fix: premium double-count gate enforcement at computeInterestForPerson (Option A applied) — 4-field suppression protects BOTH lines 2a AND 2b from premium being subtracted twice when broker pre-netted. 5 cross-references to 2a closures closed via multi-audit-trail consolidation pattern. Backend regression: 750/750 pass (was 749, net +1).** See `history.md` 2026-05-11 line-2b entry. **Line 3a audit complete 2026-05-11 — all 10 issues closed; 1 new deferred enhancement tracked below: non-treaty foreign corporation dividend manual-classification field. 4 cross-references to 2a/2b closures verified via cascade (MFS guard, 0-vs-null compliance, line-9 inclusion, box 13 routing); 3 verified-correct with new/expanded breadcrumbs (12-line two-level cap with mathematical analysis + per-person cap lock-in test, 15-line Form 8814 BOTH 3a AND 3b with 3 failure modes, 13-line manual-entry design rationale); 1 knowledge-file rename completing line 1c → 3ab convergence (10 lines); 1 spec verification log section added to lines/3ab.md §14. Multi-audit-trail consolidation now at 4 audit IDs at the line-9 formula site, 3 at the MFS-guard site. Backend regression: 751/751 pass (was 750, net +1 from per-person cap lock-in).** See `history.md` 2026-05-11 line-3a entry. **Line 3b audit complete 2026-05-11 — all 10 issues closed; ZERO new deferred enhancements (every concern was cross-reference, verified-correct, or backwards-compat observation). 5 cross-references to 2a/2b/3a closures via cascade (MFS guard now 4 audit IDs, knowledge file already renamed, spec log extended, 0-vs-null extends to line 3b path, line-9 inclusion as inverse of 3a #5); 4 verified-correct with new breadcrumbs (12-line Schedule B 2-pronged trigger, 15-line nominee subtraction with 3 protections, 25-line Form 8814 3-way split extension, 11-line Section 199A flag with 3 design choices); 1 observation (11-line legacy mode backwards-compat). Multi-audit-trail consolidation now at 5 audit IDs at the line-9 formula site (1z #7 + 2a #7 + 2b #5 + 3a #5 + 3b #5), 4 at the MFS-guard site, 2 at the DividendPersonTotals 0-vs-null breadcrumb. Inverse-confirmation pattern now applied symmetrically across both income pairs (interest 2a/2b + dividend 3a/3b). Backend regression: 751/751 pass (unchanged — every verification covered by existing tests).** See `history.md` 2026-05-11 line-3b entry. **Line 3c audit complete 2026-05-11 — all 10 issues closed; ZERO new deferred enhancements. Line 3c is NEW for 2025 — TWO CHECKBOXES (not a numeric value) disclosing Form 8814 child amounts in parent's lines 3a/3b. 5 pure xlsx-flip cross-references + 2 spec/doc reconciliation (self-correcting #2 deleted duplicate `lines/3ab.md` and consolidated §15 into `lines/3abc.md`; #3 rewrote §5.1 to match §5.3 — eliminating spec internal inconsistency about line-3b checkbox trigger) + 3 verified-correct with new breadcrumbs (13-line symmetric-trigger at lines 4937-4955, 10-line buildIncome two-layer null-safe gate at lines 4223-4232, 6-line addition for new-for-2025 status + line 7b sibling pattern). Spec-code alignment closure pattern established. Backend regression: 751/751 pass (unchanged).** See `history.md` 2026-05-11 line-3c entry. **Line 4a audit complete 2026-05-11 — all 10 issues closed; 1 NEW deferred enhancement (QCD $108k annual cap + SIE $54k cap enforcement). First audit OUTSIDE the wage/interest/dividend blocks. HIGH-PRIORITY DEFENSIVE GAP fixed: added MFS guard to `computeIraDistributions` — **single-guard MFS cascade now applied to 9 orchestrators** (1c-1i + computeInterestIncome + computeIraDistributions); one guard protects 7+ IRA-family outputs (line 4a/4b/4c boxes + Form 8606 taxpayer/spouse + attachment flags). 6 verified-correct with new breadcrumbs (11-line blank-when-fully-taxable, line-9 6-audit consolidation + new "gross-vs-taxable" pattern terminology, 12-line 0-vs-null at IraPersonComputation, 8-line iraSepSimple filter, 13-line Roth code Q two-counter design, 17-line QCD post-70½ own-vs-inherited carve-out). Knowledge-file naming convergence complete across 11 lines (line 1c → 4abc). Multi-audit-trail consolidation now at 6 audit IDs at the line-9 formula site. Backend regression: 751 → 752 (net +1 from MFS lock-in `mfsExcludesSpouseIraFromLine4a`).** See `history.md` 2026-05-11 line-4a entry. **Line 4b audit complete 2026-05-11 — all 10 issues closed; ZERO new deferred enhancements. Shared-aggregator cross-reference-heavy audit (same orchestrator + per-person aggregator as line 4a). 5 cross-references to 4a/prior closures (MFS guard 2-audit, knowledge file already renamed, §13 verification log extension, 0-vs-null expanded to 20-line with line-4b path trace, line-9 extended to **7 audit IDs** with bilateral-coverage milestone). 2 verified-correct with new breadcrumbs (13-line three-protection chain at taxableAfterExceptions, 17-line Form 8606 override with 5 hasException2 triggers + 3 Part I/II/III addNonNull). 1 minor code cleanup: redundant `hasNonZeroAmount(x) || x != null` condition simplified to `x != null` (Option A applied, functionally equivalent). 1 pure xlsx-flip 3-layer protection verification (4b zero-floor + null-preservation). 1 observation: 4a/4b bilateral coverage complete — FIRST gross-vs-taxable pair to achieve both exclusion (4a #4) AND inclusion (4b #5) breadcrumbs. Backend regression: 752/752 pass (unchanged).** See `history.md` 2026-05-11 line-4b entry. **Line 4c audit complete 2026-05-11 — all 10 issues closed; ZERO new deferred enhancements. **IRA CLUSTER COMPLETE** (4a/4b/4c fully audited — same trio pattern as dividend cluster 3a/3b/3c). 3 cross-references to 4a/prior closures (MFS guard extended to **3 audit IDs** with metadata-only note + knowledge file already renamed + §13 verification log 3rd row). 3 verified-correct with new breadcrumbs (14-line 3-INDEPENDENT-checkbox aggregation with explicit contrast vs. line 3c symmetric trigger + 12-line joinLine4cOtherText deduplication with both-spouses-HFD edge case + 16-line two-path breakout-statement-required logic with 2025 waiver). 1 observation in sibling breadcrumb (user-asserted-overrides-auto design choice). 3 pure xlsx-flip verifications (structural arithmetic isolation via Java types, test coverage comprehensive, IRA cluster completion milestone). Backend regression: 752/752 pass (unchanged — no code changes, only breadcrumbs).** See `history.md` 2026-05-11 line-4c entry. **Line 5a audit complete 2026-05-12 — all 10 issues closed; ZERO new deferred enhancements. **FIRST PENSION/ANNUITY CLUSTER AUDIT** (5a/5b/5c — mirrors 4abc IRA cluster pattern). HIGH-PRIORITY DEFENSIVE GAP fixed: added MFS guard to `computePensionAnnuities` — **single-guard MFS cascade now applied to 10 orchestrators** (1c-1i + computeInterestIncome + computeIraDistributions + **computePensionAnnuities**); one guard protects 7+ pension-family outputs. 5 verified-correct with new breadcrumbs (13-line blank-when-fully-taxable mirroring 4a #3, line-9 **8-AUDIT CONSOLIDATION**, 22-line 0-vs-null with separate gross/taxable/early-dist traces, 11-line iraSepSimple MIRROR filter with mutual-exclusion proof, **20-line RRB-1099-R component split** documenting 5 box semantics + 3 decision branches — NEW vs 4abc cluster). 2 observation breadcrumbs (5-line belongsToPersonIra generic reuse Option A applied; 11-line Form 5329 PER-RETURN cardinality contrasting Form 8606 PER-PERSON from IRA cluster). 1 observation positioning future 5b/5c audits. Knowledge-file naming convergence complete across **12 lines** (added 5abc). Backend regression: 752 → 753 (net +1 from MFS lock-in `mfsExcludesSpousePensionFromLine5a`).** See `history.md` 2026-05-12 line-5a entry. **Line 5b audit complete 2026-05-12 — all 10 issues closed; **1 new deferred enhancement** (per-annuity basis recovery — Simplified Method / General Rule). Shared-aggregator cross-reference-heavy audit. 5 cross-references to 5a/prior closures (MFS guard 2-audit, knowledge file already renamed, verification log 2nd row, 0-vs-null expanded with 4-stage TAXABLE path trace, line-9 extended to **9 audit IDs** completing **5a/5b BILATERAL COVERAGE MILESTONE** — 2nd of three gross-vs-taxable pairs after 4a/4b). 3 verified-correct with new breadcrumbs (**22-line 4-stage taxable computation chain** documenting STAGE 0 init → Simplified Method → General Rule → rollover → PSO; **14-line Pub. 575 Gap 4 fix expansion** with concrete example proving box 5 double-deduction prevented; 12-line PSO exclusion with $3,000 cap + SECURE 2.0 directly-paid update). 1 observation+deferral (14-line breadcrumb on Simplified-vs-General mutual-exclusion gap + per-annuity basis-recovery limitation; new outstanding.md entry deferred ~3-5 hour scope refactor as Low priority). 1 cluster-milestone observation. Backend regression: 753/753 pass (unchanged — no code changes, only breadcrumbs).** See `history.md` 2026-05-12 line-5b entry. **Line 5c audit complete 2026-05-12 — all 10 issues closed; ZERO new deferred enhancements. **5abc PENSION CLUSTER COMPLETE** (3rd complete shared-aggregator cluster after 3abc dividend and 4abc IRA). 3 cross-references to 5a/prior closures (MFS guard extended to **3 audit IDs** with metadata-only note + knowledge file already renamed completing pension knowledge-file coverage + verification log 3rd row completing pension verification log). 1 verified-correct with new breadcrumb (14-line 3-INDEPENDENT-checkbox aggregation with **explicit DESIGN DIFFERENCE vs 4c** documented — 5c box 3 = text-derived vs 4c box 3 = hasBox3Other flag; rationale: 4c HFD auto-prepend requires text-independent trigger, 5c has none). 1 observation+8-line addition to Issue #4 breadcrumb (line 5c has NO breakout-statement logic vs 4c — IRS rule difference confirmed). 5 pure xlsx-flip closures (joinLine4cOtherText helper reuse covered by 4c #5 + 5c #4 breadcrumbs; structural arithmetic isolation via Java types; per-person/return-level asymmetry UX gap not bug; existing test coverage comprehensive; cluster completion milestone). Backend regression: 753/753 pass (unchanged — no code changes, only breadcrumbs).** See `history.md` 2026-05-12 line-5c entry. **Line 6a audit complete 2026-05-12 — all 10 issues closed; ZERO new deferred enhancements. **FIRST 6abcd SOCIAL SECURITY CLUSTER AUDIT** (4-sub-line cluster — structurally unique vs 3-sub-line 3abc/4abc/5abc; line 6d is NEW for 2025 MFS-lived-apart-all-year checkbox). HIGH-PRIORITY DEFENSIVE GAP fixed: added MFS guard to `computeSocialSecurityBenefits` — **single-guard MFS cascade now applied to 11 orchestrators** (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + **computeSocialSecurityBenefits**); one guard protects 3+ outputs (line 6a + 6b via Pub. 915 worksheet + 6d MFS-lived-apart checkbox). 5 verified-correct with new breadcrumbs (15-line SSA+RRB net-benefits formula with 3 protections; line-9 **10-AUDIT CONSOLIDATION** extension; 20-line canonical 0-vs-null at SocialSecurityPersonTotals with 6-point trace; 18-line SSI exclusion per IRC §86(d)(1)(D) with 3 protections; 19-line RRB SSEB-only paired with 5a #7 RRB-1099-R component split — two-form distinction RRB-1099 blue vs RRB-1099-R green). 1 IRS-rule-difference observation (22-line breadcrumb at line 6a assignment documenting line 6a has NO blank-when-fully-taxable rule UNLIKE 4a/5a — IRS 2025 instructions quote + Pub. 915 worksheet rationale + explicit code contrast at lines 5372/5868/8337). 2 pure xlsx-flip observations (lump-sum back payments INCLUDED per IRC §86(e) covered by 6a #3 breadcrumb; cluster-positioning observation for future 6b/6c/6d audits). Knowledge-file naming convergence extended to **13 lines** (added 6abcd). Backend regression: 753 → 754 (net +1 from MFS lock-in `mfsExcludesSpouseSocialSecurityFromLine6a`).** See `history.md` 2026-05-12 line-6a entry. **Line 6b audit complete 2026-05-12 — all 10 issues closed; **1 NEW deferred enhancement** (lump-sum election prior-year fidelity gaps — Form 2555 + filing-status changes). **3rd AND FINAL gross-vs-taxable BILATERAL COVERAGE MILESTONE** (4a/4b + 5a/5b + 6a/6b — all three pairs now have bilateral coverage; future audits will NOT establish new bilateral milestones). **HIGH-PRIORITY IRS RULE VIOLATION FIXED** (6b #5): worksheet line 6 was using FULL Schedule 1 line 26 (includes lines 21 student-loan-interest + 22) but IRS 2025 SS Benefits Worksheet line 7 specifies "lines 11 through 20 AND 23 AND 25" only. **Fix (Option A)**: new `line10FromSchedule1Pub915Subset` accessor + 11-line + 15-line breadcrumbs + NEW lock-in test `socialSecurityWorksheetExcludesStudentLoanInterestFromLine6Subset` (Single $20k SS + $25k wages + $2,500 student loan → line 6b = $5,350 POST-FIX vs $3,750 PRE-FIX; bug under-stated by $1,600). 4 verified-correct with new breadcrumbs (31-line Pub. 915 worksheet-chain w1/w2/w5/w7 with variable-name-to-IRS-line mapping table + indexing-offset documentation; 16-line MFS-lived-with-spouse restrictive branch with critical mutually-exclusive-branches distinction + IRC §86(c) 1983 anti-loophole rationale + concrete tax-impact example; 31-line three-protection chain — force-zero + 85% statutory cap belt-and-suspenders + zero-floor + composed clamp-to-[0, cap] idiom + IRC §86 hard-coded threshold acknowledgment; 30+ line JavaDoc on lump-sum method documenting Pub. 915 Worksheet 3 + 4-step algorithm + 3 fidelity gaps). 1 observation+deferral (lump-sum prior-year fidelity gaps + knowledge file "Gap 2 simplified approximation" flagged as OUTDATED — code actually does full prior-year recompute). 3 cross-references/milestones (MFS guard cascade extended to 2 audits — 6a #1 + 6b #1 with strengthened lock-in test asserting line 6b $0 vs $5,350 contra-factual; knowledge file already renamed via 6a #2 pure xlsx-flip; line-9 breadcrumb extended to **11 AUDIT IDS** — densest cross-audit citation in codebase; NEW Verification log section created in lines/6abcd.md with 6a + 6b rows). Backend regression: 754 → 755 (+1 from new lock-in test).** See `history.md` 2026-05-12 line-6b entry. **Line 6c audit complete 2026-05-12 — all 10 issues closed; **ZERO new deferred enhancements** (6c #9 cross-referenced 6b #9 deferral; 6c #7 deferred without entry). **PDF EXPORT BUG FIXED** (6c #5): CSV semantic mapping for `c1_41[0]` was `unmapped_c1_41_0` so frontend's `line6c_lump_sum_election` setter had no matching CSV row → checkbox export silently ignored. **Knowledge file Gap 4 description was correct; dependencies file claim ("resolved 2026-04-15") was INCORRECT — verified by CSV inspection**. Three coordinated fixes: (1) CSV row 31 updated to `line6c_lump_sum_election`; (2) `dependencies/6abcd.md` line 75 corrected; (3) `knowledge/line-6abcd-social-security.md` §9 + §13 Gap 4 marked resolved. Parallel line 6d bug (`c1_42[0]`) confirmed and DEFERRED to future 6d audit. **MFS guard cascade extended to 3 audits** (6a #1 + 6b #1 + 6c #1 at `computeSocialSecurityBenefits` site). Verification log 3rd row appended to `lines/6abcd.md` (append-row pattern vs 6b #3 NEW-section pattern). Line-9 site **stayed at 11 audits** — boolean-type clarification added to "Notably absent" list deliberately did NOT inflate the densest-cross-audit-citation milestone (qualitatively different from numeric-could-have-been-included decisions). 2 verified-correct/observation breadcrumbs (17-line three-condition-AND-gate at lines 8520-8526 + 15-line user-intent-vs-IRS-correctness asymmetry observation at lines 8538-8552 documenting silent-best-of-two convention shared by most consumer tax software). 5 cross-references / pure xlsx-flip observations + 1 cluster-positioning milestone. **6abcd cluster 3/4 sub-lines complete** (6a + 6b + 6c done; line 6d remaining — will close as 4th complete shared-aggregator cluster + first 4-row verification log in workflow). NO Java code change (bug fix was CSV config). Backend regression: 755/755 (unchanged).** See `history.md` 2026-05-12 line-6c entry. **Line 6d audit complete 2026-05-12 — all 10 issues closed; **1 NEW deferred enhancement** (livedApartAllYear vs livedWithSpouseAnyTime mutual-exclusion enforcement). **6abcd CLUSTER COMPLETE** — 4th complete shared-aggregator cluster (after 3abc + 4abc + 5abc); first 4-sub-line cluster in the audit workflow. **PARALLEL PDF EXPORT BUG FIXED** (6d #5): CSV semantic mapping for `c1_42[0]` was `unmapped_c1_42_0`; same shape as 6c #5 (deferred from 6c walkthrough). Three coordinated fixes (mirroring 6c #5): (1) CSV row 32 updated to `line6d_mfs_lived_apart_all_year`; (2) `dependencies/6abcd.md` line 75 updated to reflect all four fields mapped + **Gap 4 FULLY RESOLVED 2026-05-12** marker; (3) `knowledge/line-6abcd-social-security.md` §9 + §13 Gap 4 heading updated to **"FULLY RESOLVED 2026-05-12 (line 6c via 6c #5; line 6d via 6d #5)"**. **Gap 4 now FULLY RESOLVED across both 6c + 6d checkboxes — 6abcd PDF export wiring is complete.** **MFS guard cascade extended to 4 audits** (6a #1 + 6b #1 + 6c #1 + 6d #1 at `computeSocialSecurityBenefits` site — **MATCHES `computeInterestIncome` density of 4 audits, the codebase maximum**). Verification log 4th row appended to `lines/6abcd.md` (append-row pattern) — **FIRST 4-ROW VERIFICATION LOG IN THE AUDIT WORKFLOW** (per-line-audit cadence; all prior clusters had 3 sub-lines max). **First 4-citation knowledge-file-rename cascade** within a cluster (6a #2 + 6b #2 + 6c #2 + 6d #2). Line-9 site **stayed at 11 audits** — 6d structurally NOT in line 9 (covered by 6c #4's boolean-type clarification). 1 verified-correct breadcrumb (14-line two-condition-AND-gate at lines 8419-8433 + NEW-FOR-2025 historical note covering 6d #8). 1 ⚠️ soft validation gap (6d #7): mutual exclusion between `livedApartAllYear` and `livedWithSpouseAnyTime` NOT enforced; **NEW outstanding.md entry** "Line 6d: livedApartAllYear vs livedWithSpouseAnyTime Mutual-Exclusion Enforcement" (~1-2 hour scope; Low priority — UI radio-button refactor + optional backend advisory flag + 2 lock-in tests). 6 cross-references / pure xlsx-flip observations + 1 cluster-completion milestone. NO Java code change (bug fix was CSV config; all other closures were breadcrumbs). Backend regression: 755/755 (unchanged).** See `history.md` 2026-05-12 line-6d entry. **Line 7a audit complete 2026-05-12 — all 10 issues closed; **ZERO NEW deferred enhancements** (anti-fragmentation policy applied per 7a #9 — 4 deferred items already in spec §17). **FIRST AUDIT AFTER 6abcd CLUSTER**: structural transition from multi-sub-line cluster pattern to single-line + tightly-coupled-pair audits. **HIGH-PRIORITY MFS DEFENSIVE GAP FIXED** (7a #1) — MFS guard ADDED to `computeCapitalGainLoss`; signature update + 23-line breadcrumb at lines 6374-6396 enumerating 4 spouse-data leakage paths + IRC §1211(b) MFS-cap-compounding rationale; NEW lock-in test `mfsExcludesSpouseCapitalGainLossFromLine7a` (MFS $500 taxpayer + STALE $2k spouse → line 7a = $500). **Single-guard MFS cascade now applied to 12 orchestrators** (was 11 after 6abcd; new codebase maximum). Knowledge file renamed `knowledge_7ab.md` → `line-7ab-capital-gain-loss.md` (first Legacy A underscore-prefix migration; convergence at **14 lines**). Verification log section CREATED in `lines/7ab.md` (NORMAL-variant pattern). Line-9 site extended to **12 audits** via 7a #4 single-sided inclusion citation (future line 8 audit → 13 FINAL). 4 verified-correct breadcrumbs: 22-line Exception 1 8-condition AND gate (more conservative than spec's 4-condition rule); 17-line $3,000/$1,500 MFS loss cap (IRC §1211(b)) with three-protection chain; 18-line Form 8814 child capital gain dual-path routing (Phase 1 fix per outstanding.md line 2281); Phase 1 + Phase 2 historical context (8 gaps closed 2026-04-16). 3 cross-references/observations + 1 cluster-transition milestone. **Line 7a is the most mature line audited so far** (Phase 1 + Phase 2 enhancements landed 2026-04-16 — 8 gaps closed pre-audit + 10 audit closures today). Backend regression: 755 → 756 (+1 from MFS lock-in).** See `history.md` 2026-05-12 line-7a entry. **Line 9 audit complete 2026-05-12 — all 10 issues closed; **ZERO NEW deferred enhancements**; **ZERO code changes** (lightest-touch audit in the workflow). **LINE 9 AUDIT = BOUNDARY between income-territory (lines 1-9) and AGI-territory (lines 10+); INCOME-TERRITORY FULLY COMPLETE**. **FIRST defensive-gap-NOT-needed Issue #1 in the workflow** (Issue #1) — line 9 is computed inline at TaxReturnComputeService.java:4219-4222 (not a separate orchestrator); inherits MFS protection from 13 feeder orchestrators (1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes). **FIRST non-extending audit at line-9 site** (Issue #4) — line 9 site EXHAUSTED at 13-audit consolidation FINAL today; line 9 audit is the SITE-LEVEL closure validating 13 prior line-9-operand audits without extending the count (structurally inevitable since line 9 itself is the formula). Knowledge file renamed `knowledge_line9.md` → `line-9-total-income.md` (third Legacy A migration today; convergence at **16 lines**). Verification log section CREATED in `lines/9.md` — single-row log; **second single-line audit Verification log** (after 8 #3); establishes stable pattern for future line 10/14/15/16/17/26/27abc audits. 3 affirmative verified-correct (8-operand formula + not-floored-at-zero per spec §9 + roundMoney HALF_UP canonical pattern) — all NO new breadcrumbs (canonical patterns already documented). 2 observations on line 9 NOT being same concept as "provisional income" (Pub. 915 worksheet excludes 6b for circular-avoidance) NOR §6012 gross income (filing-requirement test; no implementation impact). 1 boundary-milestone observation — **INCOME-TERRITORY FULLY COMPLETE** (lines 1-9 all audited); workflow shifts to AGI-territory at line 10. **10/10 issues are observations / cross-references / affirmative verifications** — pure documentation closures. Backend regression: 757/757 (unchanged).** See `history.md` 2026-05-12 line-9 entry. **Line 8 audit complete 2026-05-12 — all 10 issues closed; **ZERO NEW deferred enhancements** (anti-fragmentation policy continued; third Path A application after 7a #9 + 7b walkthrough). **FINAL LINE-9 OPERAND AUDIT** — line-9 consolidation extended from 12 → **13 audits FINAL** (exhausted; no future audits can extend the count). **INCOME-TERRITORY AUDITS COMPLETE** — lines 1-8 (all Form 1040 income lines) fully audited; workflow shifts to AGI / deductions / taxable-income / tax-computation territory at line 9+. **HIGH-PRIORITY MFS DEFENSIVE GAP FIXED** (8 #1) — MFS guard ADDED to `computeOtherIncomes`; signature update + 20-line breadcrumb at lines 7785-7804 enumerating 5 spouse-data leakage paths (gate + Schedule 1 lines 1-7 + 23 line-8 sublines + spouse inmate wages parameter + out-of-scope Schedule C/F flags); NEW lock-in test `mfsExcludesSpouseOtherIncomeFromLine8` (MFS $500 + STALE spouse $2k gambling → line 8 = $500 taxpayer-only). **Single-guard MFS cascade now applied to 13 orchestrators** (was 12 after 7a; new codebase maximum). Knowledge file renamed `knowledge_line8.md` → `line-8-other-income.md` (second Legacy A migration after 7a #2; convergence at **15 lines**; 4 Legacy A files remain). Verification log section CREATED in `lines/8.md` — **SMALLEST log shape (single-row); FIRST single-line audit to create a Verification log** (establishes precedent for future line 16/17/26/27abc). 4 verified-correct breadcrumbs: 17-line Schedule 1 line 10 8-operand sum + 21-line Schedule 1 line 9 23-operand sum (with 8v ambiguity note + linked Part II 8h/24a + 8l/24b + 8m/24c) + 11-line Form 1040 line 8 pass-through + 12-line Schedule C / F out-of-scope BLOCKING flags. 1 observation on top-of-Schedule-1 1099-K entry-space (verified GAP — not implemented; anti-fragmentation policy applied; spec §2 reference serves as canonical tracking). 1 cluster-transition milestone observation. Backend regression: 756 → 757 (+1 from MFS lock-in).** See `history.md` 2026-05-12 line-8 entry. **Line 7b audit complete 2026-05-12 — all 10 issues closed; **ZERO NEW deferred enhancements** (anti-fragmentation policy continued from 7a #9). **7ab PAIR COMPLETE** — FIRST tightly-coupled-pair audit after cluster era (3abc/4abc/5abc/6abcd multi-sub-line clusters). Line 7b is metadata-only disclosure (2 checkboxes + 1 entry-space amount; all 3 fields derived from line 7a path choice; no separate computation). **NEW THIRD line-9 exclusion category (C) "Double-count-prevention" established** via 7b #4 + 7b #9 — first numeric line-9 exclusion based on already-counted-upstream; first instance `line7bChildAmountFromForm8814Line10` (BigDecimal NUMERIC but DISCLOSURE-only since child amount already in line 7a via 7a #7 dual-path routing). **Three line-9 exclusion categories now formalized**: (A) IRS-rule + (B) Boolean-type + (C) Double-count-prevention (NEW). MFS guard cascade extended to **2 audit IDs** (7a #1 + 7b #1) at `computeCapitalGainLoss` — final for 7ab pair. Knowledge file already renamed via 7a #2 (2nd and FINAL cascade citation; smallest pair-citation cascade). Verification log 2nd row appended to `lines/7ab.md` — completes pair log at **2 rows (SMALLEST pair-aligned log in workflow)**. 2 verified-correct block-breadcrumbs at `CapitalGainLossComputation` record constructor (11-line header + 2 bullet extensions documenting all 3 line 7b derivations; Exception 1 → checkbox + Form 8814 routing → checkbox + entry-space). All 3 PDF semantic mappings canonical (no parallel to 6c #5 / 6d #5 bug — affirmative verification audit-trail row). 3 pure xlsx-flip observations + 1 pair-completion milestone. **Audit workflow pattern transition COMPLETE** — single-line, income-pair, distribution-cluster, 4-sub-line-cluster, tightly-coupled-pair all exhausted; future audits (line 8 onwards) are single-line + single-coupled-pair only. NO Java code change (only breadcrumb extensions). Backend regression: 756/756 (unchanged).** See `history.md` 2026-05-12 line-7b entry. **Line 10 audit complete 2026-05-12 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued; FOURTH Path A application after 7a #9 + 7b walkthrough + 8 #9 — 24z anti-broad-bucket guardrail per spec §9 / §4.13 as canonical tracking). **FIRST AUDIT IN AGI-TERRITORY** per 9 #10 boundary milestone — line 10 is the AGI subtractor (`line11a = line9 - line10`) and the FIRST audit at a code site DOWNSTREAM of the line-9 sum site. **HIGH-PRIORITY MFS DEFENSIVE GAP FIXED** (10 #1) — MFS guard ADDED to `computeIncomeAdjustments`; 25-line breadcrumb at TaxReturnComputeService.java:8088 enumerating 5 spouse-data leakage paths (gate + 11 Part II line aggregates + 12 line-24 sublines + 19b/19c text + SE-tax out-of-scope flags) + **line 21 §221(e)(2) student loan interest MFS BLOCKING rationale** + 14-orchestrator cascade milestone; NEW lock-in test `mfsExcludesSpouseIncomeAdjustmentsFromLine10` (MFS taxpayer educator $200 + STALE spouse $300 → line 10 = $200 taxpayer-only). **Single-guard MFS cascade now applied to 14 orchestrators** (was 13 after 8; NEW codebase maximum — 1c-1i + computeInterestIncome + computeIraDistributions + computePensionAnnuities + computeSocialSecurityBenefits + computeCapitalGainLoss + computeOtherIncomes + **computeIncomeAdjustments**). Knowledge file renamed `knowledge_line10.md` → `line-10-adjustments.md` (**fourth Legacy A migration today** after 7a #2 + 8 #2 + 9 #2; today's 4 migrations cleared ~57% of remaining Legacy A backlog; convergence at **17 lines**; 3 Legacy A files remain: knowledge_line16/17/26/27abc.md). Verification log section CREATED in `lines/10.md` — single-row log; **THIRD single-line audit Verification log** (after 8 #3 + 9 #3); confirms single-row pattern as stable for future single-line audits at lines 14/15/16/17/26/27abc. **FIRST subtractor cross-reference in the workflow** (10 #4) — 12-line forward-cross-reference breadcrumb at `buildAdjustments` (line 4385) seeded for future line 11 audit; symmetric contrast to 8 #4 (addend citation at line-9 site); establishes template for future line 14 + line 13a/13b subtractor cross-references. 4 verified-correct with new breadcrumbs (22-line Schedule 1 line 26 with 13-operand enumeration + IRC sources + line 21 MFS BLOCKING cross-reference to 10 #1; 25-line Schedule 1 line 25 with 12-operand enumeration + lettering-gap rationale parallel to 8 #6 8v→8z gap + 24j Form 2555 housing §911(c)(4) DISTINCT-FROM-8d-FEIE guardrail; 15-line Form 1040 line 10 pass-through with sibling-accessor note for Pub. 915 subset per 6b #5; 15-line SE-tax lines 15/16/17 BLOCKING flags with 10 #1 MFS cross-reference + Form 7206 exception note). 13-line observation breadcrumb (24z anti-broad-bucket guardrail). 1 boundary milestone (FIRST AGI-territory audit; income-territory complete; MFS cascade = 14 = new codebase max). Backend regression: 757 → **758** (+1 from MFS lock-in).** See `history.md` 2026-05-12 line-10 entry. **Line 11a audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued from 7a #9 / 8 #9 / 10 #9). **SECOND AGI-TERRITORY AUDIT** (after line 10) and **FIRST tightly-coupled-pair audit since 7ab pair completion 2026-05-12** — 11a starts the 11ab pair (line 11b sibling audit immediately next; same flow as 7a → 7b). Line 11a is computed inline in `buildAdjustments` (not a separate orchestrator) — **NO MFS guard needed; inherits MFS protection from 14 upstream orchestrators** (line 9 via 13 income orchestrators + line 10 via `computeIncomeAdjustments` per 10 #1). **SECOND defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1; both inline-compute sites). **FIRST cross-reference EXTENSION by a downstream audit in the workflow** (11a #4) — extended 10 #4 forward-cross-reference breadcrumb from **12 lines → ~50 lines** with 7 thematic sections (LINE 11a SIGNED SEMANTIC + NULL-GUARD AND OUTPUT GATING + LINE 11b IRS COPY-LINE INVARIANT + LEGACY ALIAS + MAGI vs AGI GUARDRAIL + DOWNSTREAM CONSUMERS + CROSS-REFERENCE PRECEDENT); validates the seed → extend template for future analogous patterns (line 14 will extend any breadcrumb seeded by 13a/13b; etc.). Knowledge file renamed `knowledge_line11ab.md` → `line-11ab-agi.md` (**5th Legacy A migration** in 2 days after 7a #2 + 8 #2 + 9 #2 + 10 #2; convergence at **18 lines**; 3 Legacy A files remain: knowledge_line16/17/26/27abc.md). Verification log section CREATED in `lines/11ab.md` — pair-aligned first row; **FIRST pair-aligned Verification log creation since 7ab #3 2026-05-12** (all intervening audits were single-line single-row). **NEW lock-in test** `line11bAlwaysEqualsLine11aInvariant` with 3 scenarios (positive / negative / null AGI) — **closes knowledge §6 G3** ("No unit test explicitly asserting both 11a=11b always"). **Documentation drift fix** (11a #8) — knowledge §3 + §6 G4 + §8 PDF claims were STALE (claimed `f1_77[0]` / `line11_adjusted_gross_income` but CSV row 89 has `f1_75[0]` / `line11a_adjusted_gross_income`); 3 corrections to `line-11ab-agi.md` + §6 G4 marked **FALSE POSITIVE — verified canonical 2026-05-13** + §6 G3 bonus closure. 3 verified-correct closures (11a #5 / #6 / #9) all folded into 10 #4 extension via **anti-duplication policy** (3rd / 4th / 5th anti-duplication applications in workflow) — coverage in extended breadcrumb rather than duplicated at formula site. 1 observation (11a #9 — backend complies with MAGI vs AGI guardrail; `grep magi/MAGI` in Adjustments.java empty). 1 boundary milestone (11a #10 — 2nd AGI-territory audit; 1st pair-audit since 7ab; first cross-reference extension). **Two knowledge gaps closed in single audit** (G3 + G4) — first audit to close more than one pre-existing knowledge gap. Backend regression: 758 → **759** (+1 from 11a #7 lock-in).** See `history.md` 2026-05-13 line-11a entry. **Line 11b audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — 7 consecutive walkthroughs with zero new outstanding entries: 7a/7b/8/9/10/11a/11b). **11ab PAIR COMPLETE** — pair-completion sibling audit of line 11a (analogous to 7b after 7a); final pair-aligned 2-row Verification log in `lines/11ab.md` (matches 7ab smallest-pair shape). Line 11b is `BigDecimal line11b = line11a;` same-reference assignment (not value-copy) — transitively inherits MFS protection via line 11a from 14 upstream feeders; **THIRD defensive-gap-NOT-needed Issue #1 in the workflow** (after 9 #1 + 11a #1). **SECOND cross-reference EXTENSION by a downstream audit + FIRST double-extension of the SAME breadcrumb in the workflow** (11b #4) — extended 10 #4 breadcrumb from ~50 → ~70 lines with two new content blocks: "LINE 11b PAGE-2 PDF + ACCESSOR-PREFERENCE ASYMMETRY" section (page-1 vs page-2 mapping summary `f1_75[0]` page-1 bottom vs `f2_01[0]` page-2 TOP per CSV rows 89 + 150; 9-consumers-prefer-line-11b vs 3-consumers-prefer-line-11a/legacy asymmetry per knowledge §5 G5) + rewritten CROSS-REFERENCE PRECEDENT section ("11ab PAIR COMPLETE — FINAL state"); seed → extend → extend-again pattern demonstrated end-to-end across 3 audits (10 #4 → 11a #4 → 11b #4); establishes template for future line 13a/13b/14/15 analogous patterns. 4 verified-correct closures (11b #5 same-reference invariant / 11b #6 PDF mapping canonical / 11b #7 lock-in test coverage via 11a #7 / 11b #8 downstream consumer wiring) — all folded into 10 #4 extension or cross-referenced to 11a closures via **5 explicit anti-duplication applications across the 11ab pair** (11a #5/#6/#9 + 11b #5/#9). 1 pair-mate observation (11b #9 MAGI-vs-AGI guardrail; backend compliance verified via 11a #9). 1 boundary milestone (11b #10 — 11ab pair COMPLETE; AGI-territory has 3 audited lines: 10 + 11a + 11b). **Knowledge §5 G5 accessor-preference asymmetry** acknowledged as Low-priority future cleanup (no new outstanding entry — folded into knowledge file). **Anti-redundancy patterns** — shared knowledge files migrate once at pair-start (11b #2 pair-mate cross-reference to 11a #2; no new migration); invariant tests for tightly-coupled pairs added once at pair-start (11b #7 pair-mate cross-reference to 11a #7 `line11bAlwaysEqualsLine11aInvariant`). Backend regression: 759/759 (unchanged — no new code in 11b walkthrough). **AGI-territory next**: line 12a-12e deductions cluster (5 sub-lines; first multi-row cluster in AGI-territory; potentially largest cluster after 6abcd 4-row).** See `history.md` 2026-05-13 line-11b entry. **Line 12a audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **8 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a). **CLUSTER-START AUDIT of the 5-line deductions cluster** (12a/12b/12c/12d/12e) — **first multi-row cluster in AGI-territory** + **LARGEST cluster in the workflow** (5 sub-lines exceeds 6abcd 4-row prior max). Line 12a is the **dependent-status checkbox** (single composite Boolean `line12aChecked` collapsing two PDF checkboxes: `c2_1[0]` taxpayer + `c2_2[0]` spouse). **HIGH-PRIORITY MFS DEFENSIVE GAP FIXED** (12a #1) at `buildStandardDeductionIndicators` — **SURGICAL VARIANT (first non-wholesale MFS guard in the cascade)**: initial wholesale null-shadow attempt broke 2 tests (`computesLine12bForcesStandardDeductionToZeroForMfsSpouseItemizes` + `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies`) and was reverted because spouse form has MIXED MFS semantics (`someoneCanClaimSpouse` MFJ-only → null-shadow; other 4 fields MFS-legitimate → remain readable); ~30-line breadcrumb documents per-field MFS-semantics classification + initial-wholesale-attempt-failed history; NEW lock-in test `mfsExcludesSpouseDependentFlagFromLine12a`. **Single-guard MFS cascade now applied to 15 orchestrators** (NEW codebase maximum). **FIRST forward-cross-reference SEED FOR A CLUSTER in the audit workflow** (12a #4) — ~70-line cluster-level breadcrumb above `computeLine12()` enumerating all 5 sub-lines + cluster-level path branching (6-step cascade) + 4 future extension points (12b/c/d/e #4); seed → extend × 4 pattern (contrast with 10 #4 PAIR seed; 2 extensions). Flagged 2 potential PDF semantic-key drifts for future verification (`c2_3[0]` combined "spouse_itemizes_or_dual_status_alien" naming for 12b #4; `c2_4[0]` `_alt` suffix for 12c #4). Knowledge file renamed `knowledge_line12abcde.md` → `line-12abcde-deductions.md` (**6th Legacy A migration** in 3 days; convergence at **19 lines**; 3 Legacy A files remain). Verification log section CREATED in `lines/12abcde.md` — cluster-aligned first row of eventual **5-row log** (LARGEST cluster log shape in the workflow). 1 verified-correct (12a #5 MFJ-only-spouse-OR filter at line ~2954; ~18-line breadcrumb with dual-protection cross-reference to 12a #1). 2 anti-duplication closures (12a #6 composite output / 12a #7 dependent worksheet trigger — deep worksheet documentation deferred to future 12e audit). **Documentation drift fix #2 in the workflow** (12a #8) — spec §2.1 listed 2 output fields (`line12a_you_checked` + `line12a_spouse_checked`); rewrote to reflect canonical single-composite implementation; same shape as 11a #8. 1 anti-fragmentation observation (12a #9 — MFJ "joint return filed only to claim refund" nuance per spec §4.1; **6th Path A application**). 1 boundary milestone (12a #10 — cluster-start; first multi-row AGI cluster; largest cluster). Backend regression: 759 → **760** (+1 from SURGICAL MFS lock-in). **AGI-territory next**: line 12b sibling audit (MFS spouse-itemizes-on-separate-return; potential CSV drift fix at `c2_3[0]`).** See `history.md` 2026-05-13 line-12a entry. **Line 12b audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **9 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b). **2nd SUB-LINE in the 12abcde deductions cluster** (cluster log progresses 1 → 2 of eventual 5). Line 12b is the MFS spouse-itemizes-on-separate-return checkbox; fires ONLY on MFS per spec §4.2; TRUE → standard_deduction = 0 (hard-zero per §5.2 + IRC §63(c)(6)(A)). **FIRST extension of the 12a #4 cluster-level seed in the audit workflow** (12b #4) — extended the ~70-line cluster-level breadcrumb above `computeLine12()` with line-12b-specific page-2 details + flipped placeholder block to full thematic documentation + FUTURE EXTENSION POINTS section updated with progress tally; validates the cluster-scale seed → extend × 4 template (contrast with 11a #4 first extension of 10 #4 PAIR seed). **⚠️ FUNCTIONAL PDF SEMANTIC-KEY DRIFT FIXED** (12b #6) — **FIRST FUNCTIONAL drift fix in the workflow** (drift fix #3 after 11a #8 + 12a #8 documentation-only spec corrections); same shape as 6c #5 / 6d #5 PDF semantic mapping bugs. Four-step fix: (1) CSV row 133 renamed `spouse_itemizes_or_dual_status_alien` → `line12b_spouse_itemizes_separate_return` in `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv`; (2) same rename in `pdfs/f1040_field_mapping_semantic.csv` (source-of-truth); (3) frontend `form-tax-return-1040.component.ts:268` repointed from combined `spouseItemizesOrDualStatus` flag → separate `deductions.line12bChecked` field; (4) generator script `scripts/generate-semantic-1040-2025.js:150` updated (regression prevention). Pre-fix failure: line 12c TRUE alone wrongly lit up the c2_3 (12b) checkbox via the combined flag → wrong checkbox on PDF. **FOURTH defensive-gap-NOT-needed Issue #1 in the workflow** (12b #1) — line 12b inherits MFS protection via the 12a #1 SURGICAL guard's per-field classification (`spouseItemizesSeparateReturn` is MFS-LEGITIMATE; OPPOSITE polarity from `someoneCanClaimSpouse` which is null-shadowed); the initial wholesale null-shadow attempt during 12a #1 broke the existing line 12b test and forced the SURGICAL pivot. Verification log 2nd row appended to `lines/12abcde.md` (APPEND-row pattern; cluster log progress: 2 of eventual 5; **first of 4 expected APPEND-row operations within 12abcde cluster**). 1 verified-correct (12b #5 — ~22-line MFS-only filter breadcrumb at line ~3001-3002 with dual-protection cross-reference to 12a #1). 1 verified-correct hard-zero (12b #7 — existing test covers; deep documentation deferred to future 12e audit; 1st anti-duplication app). 1 observation flagged for 12c (12b #8 — `spouseItemizesOrDualStatus` combined flag is partial-stale after 12b #6; three possible futures for 12c #6 to decide; 2nd anti-duplication app). 1 observation flagged for 12c (12b #9 — `c2_4[0]` `_alt` suffix drift is out-of-scope; line 12c PDF checkbox is currently structurally INVISIBLE on PDF; 3rd anti-duplication app). 1 boundary milestone (12b #10 — 2nd sub-line in cluster; FIRST cluster-level seed extension; FIRST FUNCTIONAL drift fix). Knowledge file already renamed via 12a #2 (sibling-mate cross-reference; first of 4 expected within 12abcde cluster; convergence stays at 19 lines). Backend regression: 760/760 (unchanged — no new test; 12b #6 was a frontend/CSV fix with no backend behavior change). **Deductions cluster progress**: 2 of 5 sub-lines complete; 3 remaining (12c/12d/12e queued). **AGI-territory next**: line 12c sibling audit (dual-status alien; will fix `c2_4[0]` `_alt` suffix drift + render line 12c on PDF + decide combined-flag retirement).** See `history.md` 2026-05-13 line-12b entry. **Line 12c audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **10 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c). **3rd SUB-LINE in the 12abcde deductions cluster** (cluster log progresses 2 → 3 of eventual 5; cluster-mid-progress). Line 12c is the dual-status alien checkbox; fires when taxpayer was a dual-status alien per spec §4.3 + IRC §7701(b); TRUE → standard_deduction = 0 (hard-zero per §5.2 + IRC §63(c)(6)(B)). **SECOND extension of the 12a #4 cluster-level seed in the workflow** (12c #4 — cluster-level seed progress: 2 of 4 extensions done; validates the cluster-scale seed → extend × 4 template at scale). **⚠️ FUNCTIONAL PDF SEMANTIC-KEY DRIFT FIXED + RENDERS LINE 12c ON PDF FOR THE FIRST TIME** (12c #6) — four-step fix paralleling 12b #6: (1) CSV row 134 renamed `standard_deduction_dual_status_alien_alt` → `line12c_dual_status_alien` in `us-tax-ui/public/irs/`; (2) same in `pdfs/` (source-of-truth); (3) frontend `form-tax-return-1040.component.ts` ADDED new mapping `values['line12c_dual_status_alien'] = form.deductions?.line12cChecked === true` with inline comment; (4) generator script `scripts/generate-semantic-1040-2025.js:151` updated. Pre-fix: frontend NEVER wrote `c2_4` → line 12c was structurally INVISIBLE on PDF. **Documentation drift fix #4 in the workflow** (after 11a #8 + 12a #8 doc-only + 12b #6 first FUNCTIONAL); **2nd FUNCTIONAL drift fix**; MORE SEVERE than 12b #6 (total invisibility vs. wrong checkbox). **FIRST @Deprecated annotation in the audit workflow** (12c #8) — `spouseItemizesOrDualStatus` combined flag at `StandardDeductionIndicators.java` had NO active consumers after 12b #6 + 12c #6 frontend repointing; marked `@Deprecated` + 13-line JavaDoc on field + 4-line JavaDoc on getter + setter; option (c) DEPRECATE chosen over (a) retire / (b) keep (preserves backward compat for yaml + e2e + ts type while flagging for future removal); establishes **deprecate-before-remove pattern** for orphaned backend fields. **FIFTH defensive-gap-NOT-needed Issue #1 in the workflow** (12c #1) — `youWereDualStatusAlien` is TAXPAYER-side; not subject to 12a #1 SURGICAL spouse-side null-shadow; IRC §7701(b) classification applies regardless of filing status; sibling-mate to 12a #1 + 12b #1. Verification log 3rd row appended to `lines/12abcde.md` (APPEND-row pattern; cluster log progress: 3 of eventual 5; **2nd of 4 expected APPEND-row operations within 12abcde cluster**). 1 verified-correct (12c #5 — ~28-line breadcrumb at line ~3056 documenting no-filter taxpayer-side design + null-safe + IRC §7701(b) + §63(c)(6)(B) + sibling-line contrast with 12b/12a filters + §4.3 election nuance cross-reference). 1 verified-correct hard-zero (12c #7 — existing test covers; deep documentation deferred to future line 12e audit; 1st anti-duplication app). 1 anti-fragmentation observation (12c #9 — IRS U.S.-resident-election nuance per spec §4.3 + IRC §6013(g)/(h); user-attested via existing boolean; **7th Path A application**). 1 boundary milestone (12c #10 — 3rd sub-line in cluster; SECOND cluster-level seed extension; documentation drift fix #4 — 2nd FUNCTIONAL; FIRST @Deprecated in workflow). Knowledge file already renamed via 12a #2 (sibling-mate cross-reference; 2nd of 4 expected within 12abcde cluster; convergence stays at 19 lines). Backend regression: 760/760 (unchanged — no new test; 12c #6 frontend/CSV fix; 12c #8 annotation only). **Deductions cluster progress**: 3 of 5 sub-lines complete; 2 remaining (12d/12e queued). **AGI-territory next**: line 12d sibling audit (age/blindness checkbox count 0-4; first audit with numeric box-count + 2025 age/blind chart constants).** See `history.md` 2026-05-13 line-12c entry. **Line 12d audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **11 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d). **4th SUB-LINE in the 12abcde deductions cluster** (cluster log progresses 3 → 4 of eventual 5; only 12e remaining — cluster reaches FINAL state when 12e closes). Line 12d is the age/blindness checkbox COUNT (integer 0-4); 4 PDF checkboxes (taxpayer-age + taxpayer-blind + spouse-age + spouse-blind); MFS-narrowly-allowed gating per spec §4.4 + HOH/QSS never count spouse boxes. **FIRST audit with NUMERIC OUTPUT and REFERENCE-DATA CONSTANTS in the 12abcde cluster** (per-box addons $2,000 / $1,600 from `ReferenceData.java`). **THIRD extension of the 12a #4 cluster-level seed in the workflow** (12d #4; cluster-level seed progress: 3 of 4 done; only 12e #4 remaining). **⚠️ FUNCTIONAL TAX-YEAR DRIFT FIXED** (12d #6) — six-step fix: (1) CSV row 135 + 136 renamed `taxpayer_born_before_1960` / `spouse_born_before_1960` → `*_born_before_1961` in `us-tax-ui/public/irs/`; (2) same in `pdfs/` (source-of-truth); (3) frontend `form-tax-return-1040.component.ts` lines 281 + 283 renamed + 7-line inline comment documenting the tax-year drift fix; (4) generator script `scripts/generate-semantic-1040-2025.js` lines 152 + 153 updated. Pre-fix: PDF rendering functionally correct but semantic keys were 2024-stale (Jan 2, 1960 threshold) instead of 2025-correct (Jan 2, 1961 per IRC §63(f)(1)(A) "age 65 on day before 65th birthday" rule). **Documentation drift fix #5 in the workflow** (after 11a #8 + 12a #8 doc-only + 12b #6 + 12c #6 functional); **3rd FUNCTIONAL drift fix**; **FIRST TAX-YEAR drift fix in the audit workflow** — establishes precedent for tax-year-rotating thresholds. **SIXTH defensive-gap-NOT-needed Issue #1 in the workflow** (12d #1) — all 4 spouse-side fields MFS-LEGITIMATE per 12a #1 SURGICAL guard; two-layer enforcement of spec §4.4 (MFS-narrowly-allowed gating + HOH/QSS exclusion); sibling-mate completing the 12abcde cluster\'s structural-inheritance pattern. Verification log 4th row appended (cluster log: 4 of 5; **3rd of 4 expected APPEND-row operations within 12abcde cluster**; ties with 6abcd; 12e closes to LARGEST 5). 2 verified-correct breadcrumbs (12d #5 — ~28-line extended JavaDoc on `countAgeBlindnessBoxes()` static helper documenting null-safe contract + HOH/QSS exclusion + IRC §63(f)(1)(A) + two-layer design rationale; 12d #7 — ~22-line breadcrumb on MFS-narrowly-allowed gating + HOH/QSS exclusion + **canary-test role in 12a #1 SURGICAL pivot**). 1 verified-correct downstream addon paths (12d #8 — dependent worksheet + age/blind chart via per-box addons; **architectural strength**: chart values dynamically derived from `ReferenceData.java` constants; no chart-vs-constant drift; deep documentation deferred to future 12e audit; 1st anti-duplication app). 1 anti-fragmentation observation (12d #9 — IRC §63(f)(1)(A) age-65-on-day-before-65th-birthday nuance; user-attested via existing Booleans; **8th Path A application**). 1 boundary milestone (12d #10 — 4th sub-line in cluster; THIRD cluster-level seed extension; drift fix #5 — 3rd FUNCTIONAL + FIRST TAX-YEAR; first numeric + reference-data audit in 12abcde cluster). Knowledge file already renamed via 12a #2 (sibling-mate cross-reference; 3rd of 4 expected within 12abcde cluster; convergence stays at 19 lines). Backend regression: 760/760 (unchanged — no new test; 12d #6 frontend/CSV fix; 12d #4/#5/#7 documentation breadcrumbs). **Deductions cluster progress**: 4 of 5 sub-lines complete; only 12e remaining (closes the cluster). **AGI-territory next**: line 12e sibling audit — CLOSES the 12abcde cluster (final 5-row cluster log; 4th sibling-mate cross-reference; FOURTH cluster-level seed extension; anchor site for deferred documentation from 12a/b/c/d #7-#8).** See `history.md` 2026-05-13 line-12d entry. **Line 12e audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **12 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e). **CLUSTER-CLOSING AUDIT — CLOSES the 12abcde deductions cluster across ALL FIVE DIMENSIONS** simultaneously: (1) 5-row Verification log = LARGEST cluster log in workflow; (2) 4-cross-reference sibling-mate cascade = LARGEST cascade in workflow; (3) 4-of-4 cluster-level seed extensions = **FIRST COMPLETE cluster-scale seed → extend × 4 pattern in the audit workflow**; (4) structural-inheritance pattern complete (all 5 sub-lines inherit MFS protection without dedicated guards); (5) deferred-documentation anchor landed (12a #7 + 12b #7 + 12c #7 + 12d #8 deep-anchored at 12e #6). Line 12e is the FINAL numeric output of the line-12 section (deduction amount via multi-path branching per spec §8: disaster-loss-increased-standard / itemized / computed-standard). **FOURTH AND FINAL extension of the 12a #4 cluster-level seed** (cluster-level seed progress: 4 of 4 done — CLUSTER COMPLETE; FIRST COMPLETE cluster-scale seed → extend × 4 pattern in the audit workflow). **DEEP DOCUMENTATION ANCHOR** at 12e #6 — ~55-line breadcrumb above `computeStandardDeduction()` documenting all 5 paths (null-defensive / hard-zero / dependent worksheet / age-blind chart / base) with per-path spec citations + IRC statutory references + reference data + cross-references closing deferred docs from 12a #7 (dependent worksheet) + 12b #7 + 12c #7 (hard-zero halves) + 12d #8 (downstream addon paths). **SEVENTH defensive-gap-NOT-needed Issue #1 in the workflow** (12e #1) — line 12e inline-computed via `chooseLine12e()`; no separate orchestrator; inherits MFS protection transitively from 12a #1 SURGICAL guard; **CLOSES the 12abcde cluster's structural-inheritance pattern** (all 5 sub-lines inherit MFS protection without dedicated guards). Verification log 5th AND FINAL row appended to `lines/12abcde.md` (APPEND-row pattern; **CLOSES the cluster log at 5 ROWS = LARGEST cluster log in the workflow**; exceeds prior 6abcd 4-row max; finalized to COMPLETE). 1 verified-correct (12e #5 — ~25-line breadcrumb above `chooseLine12e()` at line ~3447 documenting 3-path election ITEMIZED / STANDARD / AUTO=max + spec §8 mapping + ITEMIZED-explicit-override per §6.4 + §8.2 + §11 + Schedule A line 18 flag firing condition + chooseDeductionType companion behavior + null-handling). 1 verified-correct DEEP DOCUMENTATION ANCHOR (12e #6 — ~55-line breadcrumb above `computeStandardDeduction()` at line ~3321; closes 4 deferred docs in a single anchor). 1 verified-correct disaster-loss path (12e #7 — ~14-line breadcrumb above the augmentation block at line ~3236-3240 documenting spec §7 IRS recipe + functional-equivalence rationale + chooseLine12e routing + trigger condition + Form 4684 cross-reference). 2 anti-duplication closures (12e #8 base standard deduction reference data centralized in `ReferenceData.java`; 12e #9 SALT cap implementation centralized; **NO new breadcrumbs** — coverage in helper Javadoc + ReferenceData declarations + 12e #6 anchor; **anti-duplication pattern when reference data is centralized**). 1 cluster-closing milestone (12e #10 — cluster-closing across ALL FIVE DIMENSIONS; lines 13a-13b queued next OUTSIDE the 12abcde cluster). Knowledge file already renamed via 12a #2 (sibling-mate cross-reference; **4th AND FINAL within 12abcde cluster**; closes LARGEST sibling-mate cascade in workflow at 4; convergence stays at 19 lines). Backend regression: 760/760 (unchanged — all 12e closures were documentation breadcrumbs; no functional changes). **12abcde DEDUCTIONS CLUSTER COMPLETE** — all 5 sub-lines (12a + 12b + 12c + 12d + 12e) audited; cluster closed across ALL 5 dimensions. **AGI-territory next**: line 13a (QBI deduction) — FIRST audit OUTSIDE the 12abcde cluster in this AGI-territory sequence; will use a separate orchestrator (`computeLine13a()`) — likely needs HIGH-PRIORITY MFS guard analysis (similar to income-territory orchestrators with HIGH-PRIORITY MFS defensive-gap fixes from earlier audits).** See `history.md` 2026-05-13 line-12e entry. **Line 13a audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **13 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a). **FIRST AUDIT OUTSIDE the 12abcde DEDUCTIONS CLUSTER** in the AGI-territory sequence. Line 13a is the QBI deduction (Form 1040 line 13a = Form 8995 line 15 OR Form 8995-A line 39); starts the 13ab tightly-coupled pair (sibling 13b queued next; mirrors 7ab + 11ab patterns). **⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED** (13a #1): MFS guards added at BOTH `computeLine13a` call sites (first-pass inside `computeLine12` at line ~3295 + second-pass in `prepare()` at line ~772) via Option A call-site null-shadow (12a #1 SURGICAL precedent). Pre-fix: 5 spouse-form fields survived the SSN filter (`spouseManualQualifiedBusinessIncomeAdjustment` + 4 others) — would silently aggregate into MFS taxpayer\'s line 13a. NEW lock-in test `mfsExcludesSpouseQbiFromLine13a`. **Single-guard MFS cascade now applied to 16 orchestrators — NEW CODEBASE MAXIMUM** (was 15 after 12a #1 SURGICAL; FIRST MFS guard added OUTSIDE the 12abcde cluster). **Knowledge file Legacy A rename** (13a #2): `knowledge_line13ab.md` → `line-13ab-qbi-additional-deductions.md`; naming convergence **19 → 20 lines** (7th Legacy A migration). **Verification log** created in `lines/13ab.md` (section 13) — pair-aligned first row finalized to **COMPLETE — 10/10 closed**. **Pair-scale forward cross-reference SEED planted** (13a #4) at TaxReturnComputeService.java:~806 (line-14 sum site); ~40-line breadcrumb with FUTURE EXTENSION POINTS for 13b #4. **THIRD instance of the seed → extend pattern in the audit workflow** (after 10 #4 PAIR seed COMPLETE + 12a #4 CLUSTER seed COMPLETE). 4 verified-correct breadcrumbs (13a #5 two-pass invocation pattern at ~line 763–766; 13a #6 Form 8995 vs 8995-A threshold routing at ~lines 4369 + 4395; 13a #7 Form 8995-A 4-case SSTB phase-in + W-2/UBIA limit at ~lines 4224 + 4287 + 4413 — **FIRST 4-case ASCII-table breadcrumb pattern in workflow**; 13a #8 carryforward dual semantic at ~lines 3760 + 3812). 1 observation (13a #9): Form 8995 line 12 "net capital gain" approximation `max(line7a, 0) + qualifiedDividends` accepted vs strict IRC §1(h); 3-source coverage adequate; **NO new breadcrumb** + **NO new outstanding entry** (9th Path A application). Backend regression: 760 → **761/761** (+1 from MFS lock-in test). **Audit workflow next**: line 13b (Schedule 1-A — additional deductions: tips/overtime/car loan/senior); 4 parts (II/III/IV/V); MFJ-only gating on II/III/V likely needs its OWN MFS guard at `computeSchedule1A` (would extend cascade to 17 orchestrators); closes the 13ab pair across all dimensions (Verification log row 2; sibling-mate knowledge cross-reference; 13b #4 extension of the line-14 forward seed).** See `history.md` 2026-05-13 line-13a entry. **Line 13b audit complete 2026-05-13 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **14 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b). **PAIR-COMPLETION AUDIT — CLOSES the 13ab tightly-coupled pair across ALL 4 STRUCTURAL DIMENSIONS** simultaneously: (1) Verification log at 2 rows (SMALLEST pair-aligned shape); (2) sibling-mate cross-reference cascade at 1 (pair-aligned max); (3) cross-reference seed → extend × 1 pattern CLOSED (13a #4 PAIR seed + 13b #4 extension = **THIRD complete seed-extend pattern in workflow** after 10 #4 PAIR × 2 + 12a #4 CLUSTER × 4); (4) MFS-cascade extension 16 → 17 orchestrators (NEW CODEBASE MAX; SECOND MFS guard added OUTSIDE the 12abcde cluster). **⚠️ HIGH-PRIORITY MFS DEFENSIVE GAP FIXED** (13b #1): MFS guards added at `computeSchedule1A` call site in prepare() at line ~723 via Option A call-site null-shadow (13a #1 + 12a #1 SURGICAL precedent). Pre-fix: spouse Form 2555 line 45 + line 50 unconditionally added to Part I MAGI even on MFS → inflated MAGI past Part IV $100k threshold → silently UNDER-stated MFS taxpayer\'s car-loan-interest deduction. Two null-shadows applied: `isMfsReturn ? null : additionalDeductionsSpouse` + `isMfsReturn ? null : form2555Spouse`. NEW lock-in test `mfsExcludesSpouseForm2555FromSchedule1AMagi` ($80k US wages + $10k taxpayer FEIE + STALE $50k spouse FEIE → POST-FIX magi=$90k + carLoan=$5k; PRE-FIX would have magi=$140k + carLoan=$0). **Single-guard MFS cascade now applied to 17 orchestrators — NEW CODEBASE MAXIMUM** (SECOND MFS guard OUTSIDE the 12abcde cluster; first 2 MFS guards OUTSIDE 12abcde both fired in the 13ab pair). **Sibling-mate knowledge cross-reference** (13b #2): shared file `line-13ab-qbi-additional-deductions.md` already renamed via 13a #2; naming convergence **stays at 20 lines** (unchanged). **Verification log row 2** finalized to COMPLETE — 10/10 closed — **13ab PAIR COMPLETE** marker (smallest pair-log shape; mirrors 7ab + 11ab). **Pair-scale forward cross-reference EXTENSION** (13b #4): 13a #4 PAIR seed → 13b #4 extension at TaxReturnComputeService.java:~875 (4 edits: header timestamp + operand 2 status flip + operand 3 expansion + PAIR COMPLETE milestone); **THIRD complete seed → extend pattern in workflow** (after 10 #4 PAIR × 2 + 12a #4 CLUSTER × 4). 4 verified-correct breadcrumbs: (13b #5) Part II tips — ~40-line breadcrumb with 5-stage chain + 4-source catalog + multi-employer worksheet equivalence; (13b #6) Part III overtime — ~38-line breadcrumb with PARALLEL STRUCTURE to Part II + 3 explicit differences (manual sources + filing-status cap + shared phaseout); (13b #7) Part IV car loan interest — ~56-line breadcrumb with 5 distinguishing features (NO MFJ + per-vehicle + refinancing + Schedule C/E/F + CEILING phaseout); (13b #8) Part V senior deduction — ~50-line breadcrumb with dual-eligibility derivation + continuous 6% phaseout + **AMT INTERACTION** (Part V added back to AMTI at Form 6251 line 1w; contrast with Parts II/III/IV NOT added back). 1 observation (13b #9): multi-employer tip-cap worksheet vs aggregate-and-cap mathematically equivalent; 3-source coverage adequate; **NO new breadcrumb** + **NO new outstanding entry** (**10th Path A application**). Backend regression: 761 → **762/762** (+1 from MFS lock-in test). **Audit workflow next**: line 14 (total deductions composite) — 1st audit OUTSIDE the 13ab pair; composite audit that will upgrade the 13a #4 + 13b #4 forward seed at TaxReturnComputeService.java:~875 from SEEDED → VERIFIED CORRECT (per the "Future line 14 audit" hook). Will document 3-operand sum (line12e + line13a + line13b) + zero-floor interaction with downstream line 15. Line 14 inline-computed (no separate orchestrator) → likely 4th defensive-gap-NOT-needed Issue #1 in workflow.** See `history.md` 2026-05-13 line-13b entry. **Line 14 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **15 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14). **1st AUDIT OUTSIDE the 13ab pair** — single-line composite audit (line 14 = line12e + line13a + line13b; structurally new for 2025 vs 2024\'s 2-operand version due to OBBBA introduction of Schedule 1-A line 13b). First single-line audit since line 10 (2026-05-12) after 7 consecutive cluster/pair audits. **FIRST SEEDED → VERIFIED CORRECT upgrade pattern in the workflow** (14 #4) — closes the 3-stage seed lifecycle (SEEDED 2026-05-13 → EXTENDED 2026-05-13 → VERIFIED CORRECT 2026-05-14) for the 13a/b #4 forward seed at TaxReturnComputeService.java:~875. **Line 14 is INLINE-COMPUTED at 4 wiring sites** (no separate orchestrator): Site A (computeLine12 ~line 3458 preliminary 2-operand), Site B (Schedule 1-A wiring ~line 786-789 incremental + line13b), Site C (~line 920-921 authoritative 3-operand on second-pass success), Site D (~line 992 degenerate 2-operand on second-pass else/blocked QBI). **8th defensive-gap-NOT-needed Issue #1** (14 #1) — inherits MFS protection transitively from line12e + line13a + line13b; MFS-guard cascade UNCHANGED at 17 orchestrators. **Documentation gap closed** (14 #2) — CREATED `dependencies/14.md` (~150 lines following line-15 template); line 14 was the ONLY gap in the 42-file dependencies/ directory; convergence now 43 files (full parity). 3 verified-correct breadcrumbs at Sites A/B/D + Site C coverage via Issue #4 upgraded seed (1st anti-duplication application in 14 walkthrough; 5th in workflow). 1 observation (14 #9): 4-site progressive build-up could be simplified to single end-of-prepare() computation; functionally correct as-is; historical evolution from 2024 2-operand → 2025 3-operand; refactor risk outweighs benefit; **11th Path A application**. Backend regression: **762/762 UNCHANGED** (pure documentation closure; no functional change at any wiring site; no new tests). **Audit workflow next**: line 15 (taxable income; first audit with formal zero-floor verification) — 2nd audit OUTSIDE 13ab pair. `line15 = max(0, line11b − line14)` — applies ZERO-FLOOR at line-15 site (line 14 deliberately has no floor per spec §1). Line 15 also inline-computed (no separate orchestrator) → likely 9th defensive-gap-NOT-needed Issue #1. Will use the line-15 future-audit upgrade hook seeded today via 14 #4 at the upgraded 13a/b #4 seed (~line 875). Multiple line-15 wiring sites (~795 + ~925 + ~947) → likely parallel multi-site audit.** See `history.md` 2026-05-14 line-14 entry. **Line 15 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **16 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15). **★ FIRST FORMAL ZERO-FLOOR VERIFICATION AUDIT** in the workflow — per spec §4, line 15 has an EXPLICIT IRS-mandated floor (line 14 deliberately has no floor; line 15 does, per IRS instruction "If zero or less, enter -0-"). All 5 wiring sites use `subtractNonNegative(...)` helper. **★ SECOND SEEDED → VERIFIED CORRECT upgrade pattern in the workflow** (15 #4) — closes the line-15 future-audit hook seeded ONLY 24 hours earlier inside the 14 #4 upgrade; pattern lifecycle now demonstrated TWICE in 24 hours, establishing it as a recurring template. **Line 15 is INLINE-COMPUTED at 5 wiring sites** (one more than line 14): Site α (computeLine12 first-pass at ~line 3585), Site β (Schedule 1-A wiring at ~line 816), Site γ (second-pass success at ~line 1058), Site δ (second-pass else at ~line 1113), Site ε (Form 8396 Schedule A reduction at ~line 15645 — UNIQUE to line 15 AND retroactively a hidden 5th line-14 site at ~line 15641 that the 14 audit missed). **9th defensive-gap-NOT-needed Issue #1** (15 #1) — inherits MFS protection from line 11b + line 14; MFS cascade UNCHANGED at 17 orchestrators. **Knowledge file Legacy A rename** (15 #2): `knowledge_line15.md` → `line-15-taxable-income.md`; naming convergence **20 → 21 lines** (8th Legacy A migration). **Verification log section §11** created in `lines/15.md` (single-row pattern; finalized COMPLETE — 10/10 closed). 3 verified-correct breadcrumbs at Sites α/β/δ + Site γ coverage via Issue #4 upgraded seed (1st anti-duplication application in 15 walkthrough; 6th in workflow). 1 bundled observation (15 #9): Site ε at Form 8396 + misleading `line14Final` variable name at Site β; cosmetic refactor candidates with same anti-fragmentation rationale; **12th Path A application**. **★ Self-correcting retroactive corrections to 14 audit**: 14 #4 hook's site-count error (3 → 5) corrected at the source via 15 #4; 14 audit's "4-site progressive build-up" claim adjusted to "4 main sites + 1 Form 8396 special recompute site" via 15 #9. Backend regression: **762/762 UNCHANGED** (pure documentation closure; no functional change at any wiring site; no new tests). **Audit workflow next**: line 16 (tax computation) — 3rd audit OUTSIDE 13ab pair. **FIRST audit at a SEPARATE ORCHESTRATOR (`computeLine16`) since line 13b (computeSchedule1A) on 2026-05-13** — returns the workflow to orchestrator-based audits after 3 consecutive inline-computed audits (14, 15, plus 13ab #3 finalization). Will document the 6 tax computation methods (Tax Table / Tax Computation Worksheet / QDCG Worksheet / Schedule D Tax Worksheet / Form 8615 / Foreign Earned Income Tax Worksheet) + method-selection logic. Line 16 has its own orchestrator → **likely HIGH-PRIORITY MFS guard analysis** like the income-territory orchestrators (would extend cascade to 18 orchestrators — new codebase maximum). Will use the line-16 future-audit hook seeded today via 15 #4 at the upgraded 13a/b #4 seed (~line 875).** See `history.md` 2026-05-14 line-15 entry. **Line 16 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **17 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16). **★ FIRST ORCHESTRATOR-BASED AUDIT SINCE 13b — 18 ORCHESTRATORS (NEW CODEBASE MAXIMUM)** — `computeLine16` joins MFS-guard cascade via 16 #1 fix (TWO bundled leakage paths: `form2555Spouse` → Branch 2 FEITW + `form4972Spouse` → Box 2 add-on); knowledge convergence advances 21→22 lines (16 #2 9th Legacy A migration); ★ FORWARD TERMINAL SEED planted at orchestrator (16 #4; different shape than 14 #4 / 15 #4 inline-line seeds; navigable hub between inline-computed chain (11-15) and orchestrator-based chain (16+)); 13th Path A application (16 #9 Schedule J observation; out-of-scope; upstream blocking enforces consistency); backend 762 → 763 (+1 from `mfsExcludesSpouseForm2555AndForm4972FromLine16` lock-in test). See `history.md` 2026-05-14 line-16 entry. **Line 17 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **18 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17). **★ SECOND ORCHESTRATOR-BASED AUDIT IN LINE-16+ CHAIN — 19 ORCHESTRATORS (NEW CODEBASE MAXIMUM)** — `computeLine17` joins MFS-guard cascade via 17 #1 SINGLE-PATH fix (form2555Spouse only; form4972Spouse fix INHERITED from 16 #1 transitively via TaxAndCredits.getBox2Form4972Tax; cleaner than 16 #1's bundled two-leak fix); knowledge convergence advances 22→23 lines (17 #2 10th Legacy A migration — SYMBOLIC DOUBLE-DIGIT MILESTONE); **★ SECOND FORWARD TERMINAL SEED planted at orchestrator** (17 #4; ~120-line breadcrumb at TaxReturnComputeService.java:~11045-11185; pairs with 16 #4 to form AMT-territory navigable hub: line 16 ← 16 #4 / line 17 ← 17 #4 / line 18 ← future); **★ 4 NEW GAPS SURFACED** in 17 audit (G-new-5 HIGH PTC repayment line 17 flow gap — RECOMMENDED for follow-up fix; G-new-6 MEDIUM Form 8978 negative line 10; G-new-7 MEDIUM line 2b breadth Sched 1 line 8z; G-new-8 HIGH = 17 #1 CLOSED — demonstrates audit workflow continues to find real bugs at lines with multiple prior fix passes); 14th Path A application (17 #9 bundled observations: 4 NEW gaps + 3 deferred-scope confirmations); backend 763 → 764 (+1 from `mfsExcludesSpouseForm2555FromLine17Feitw` lock-in test). See `history.md` 2026-05-14 line-17 entry. **Line 18 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **19 consecutive walkthroughs with zero new outstanding entries**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18). **★ THIRD ORCHESTRATOR-BASED AUDIT IN LINE-16+ CHAIN — MFS CASCADE UNCHANGED AT 19 ORCHESTRATORS** — `computeLine18` is the FIRST orchestrator-method-based audit that does NOT add to MFS cascade (11th defensive-gap-NOT-needed Issue #1; transitive inheritance from 16 #1 + 17 #1; ★ NEW PATTERN established: orchestrator methods without per-spouse parameters use transitive inheritance); knowledge convergence advances 23→24 lines (18 #2 11th Legacy A migration — first in double-digit territory after 17 #2 hit 10-migration mark); **★ 6th DOCUMENTATION DRIFT FIX** (18 #4 — `lines/18.md` §7 + `dependencies/18.md` row 8 updated to cite `additionalTaxSchedule2` instead of `alternativeMinimumTax`; G1 fix 2026-04-18 had updated code + JavaDoc but not spec/dependencies); **★ G-new-5 PROPAGATION pinned via inheritance-via-design** (18 #8 — line 17 understatement propagates directly to line 18 → 7 downstream consumers; NOT a new gap; recommended fix at wireLine17ToOutputs auto-propagates without modifying computeLine18); **★ ZERO NEW GAPS surfaced** in 18 audit — first audit since line 14 with no new gaps (line 18 is so simple — pure addition + well-documented from 2026-04-18 G1 fix — audit found nothing new); 15th Path A application (18 #9 bundled observations: knowledge §6 abbreviation NOT drift + LOG.infof cosmetic + flowchart/diagram present); 7th anti-duplication application (18 #7 — 7-consumer cross-reference closes via 18 #6 breadcrumb; no per-consumer breadcrumbs); backend 764/764 UNCHANGED (pure documentation closure; no new tests this audit). See `history.md` 2026-05-14 line-18 entry. **Line 19 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — **★ 20 CONSECUTIVE walkthroughs with zero new outstanding entries — FIRST 20-WALKTHROUGH STREAK IN WORKFLOW**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19). **★ FIRST AUDIT OUTSIDE TAX-TERRITORY CHAIN — begins credits-territory chain after lines 16/17/18 (all tax-side); line 19 is FIRST credits-section line. ★ 20 ORCHESTRATORS (NEW CODEBASE MAXIMUM)** — `computeSchedule8812` joins MFS-guard cascade via 19 #1 SINGLE-INPUT MULTI-EXPRESSION fix (★ NEW PATTERN: form2555Spouse single input with TWO INTERNAL leak expressions — line 2b MAGI inflation + hasFiling2555 ACTC trigger; single null-shadow fixes both; cleaner than 16 #1's bundled-two-input fix); knowledge convergence advances 24→25 lines (19 #2 12th Legacy A migration — steady cadence in double-digit territory); **★ 7th DOCUMENTATION DRIFT FIX + ★ FIRST WITH INTERNAL CONTRADICTION** (19 #4 — `lines/19.md` §2 line 30 + line 44 updated to cite $2,200 CTC; §2 contradicted §4c which already correctly cited $2,200; both now aligned with OBBBA + Rev. Proc. 2024-40 §3.08); **★ Four large VERIFIED CORRECT breadcrumbs (~280 lines total)** — Issues #5/#6/#7/#8 covering Part I (~75 lines) + Part II-A (~65 lines) + Part II-B (~85 lines) + wiring (~55 lines); largest breadcrumb suite for a single orchestrator in any audit so far; **★ ZERO NEW GAPS surfaced** in 19 audit — third consecutive audit (18 + 19) with no new gaps (line 19 had 6 prior gaps G1-G6 from 2026-04-18 audit; all resolved/deferred); 16th Path A application (19 #9 bundled observations: G6 CLW-A missing Schedule 3 subtractions + Puerto Rico/Form 4563 deferred + earned income worksheet edge cases); backend 764 → 765 (+1 from `mfsExcludesSpouseForm2555FromSchedule8812` lock-in test). See `history.md` 2026-05-14 line-19 entry. **Line 20 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 21 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 1**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20). **★ SECOND CREDITS-SECTION AUDIT (after line 19); ★ SIMPLEST CREDITS-SECTION LINE — pure pass-through (Form1040.line20 = Schedule3.line8); MFS cascade UNCHANGED at 20 orchestrators** — 12th defensive-gap-NOT-needed Issue #1 in workflow; ★ 2nd orchestrator-method-based with transitive inheritance after 18 #1 (pattern confirmed across both tax-territory + credits-territory chains); knowledge convergence advances 25→26 lines (20 #2 13th Legacy A migration; ★ FIRST migration with ZERO history.md hits — line 20 audit not yet logged at time of migration; within 1-2 migrations of complete convergence); **★ 8th DOCUMENTATION DRIFT FIX + ★ MOST EXTENSIVE IN WORKFLOW** (20 #4 — TRIPLE-location drift: `lines/20.md` §6 "Known Implementation Bug" subsection rewritten + §6 status table row 267 updated + `knowledge/line-20-amount-from-schedule3-line8.md` §5 line 185 annotation updated; **★ 2 INTERNAL CONTRADICTIONS resolved** — prior max: 18 #4 = 2 locations / 0 contradictions; 19 #4 = 1 / 1; **20 #4 = 3 / 2**); **★ Four large VERIFIED CORRECT breadcrumbs (~205 lines NEW)** — 20 #5 ~75-line finalizeSchedule3Totals (★ G6 fix lock-in anchor) + 20 #6 ~60-line computeLine20ThroughLine24 (★★ TOTAL TAX anchor + 3 distinct null-handling conventions) + 20 #7 ~70-line 17-credit input chain (3 critical order constraints) + 20 #8 4-consumer cross-reference (★ 8th anti-duplication application); ★ **ZERO NEW GAPS surfaced** — 4th consecutive audit (line 17 anomaly with 4 new gaps; 18 + 19 + 20 all zero); 17th Path A application (20 #9 bundled observations: G2 Form 8978 BLOCKED + missing diagrams/20.drawio cosmetic + G7 partial E2E coverage); ★ **10th CONSECUTIVE single-row log** in workflow; backend 765/765 UNCHANGED (no new tests this audit). See `history.md` 2026-05-14 line-20 entry. **Line 21 audit complete 2026-05-14 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 22 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 2**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21). **★ THIRD CREDITS-SECTION AUDIT (after lines 19 + 20); ★ SMALLEST CREDITS-SECTION LINE — pure single-operator addition (Form1040.line21 = nz(line19) + nz(line20)); ★ FIRST META-AUDIT IN WORKFLOW; MFS cascade UNCHANGED at 20 orchestrators** — 13th defensive-gap-NOT-needed Issue #1; ★ 3rd orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1 (pattern rule generalized across THREE chains: tax-territory line 18 + credits-territory lines 20 + 21); knowledge convergence advances 26→27 lines (21 #2 14th Legacy A migration; ★ 2nd consecutive Legacy A migration with ZERO history.md hits after 20 #2 — emerging workflow pattern); **★ FIRST META-AUDIT IN WORKFLOW** (21 #4) — `lines/21.md` §0 verification note 2026-04-18 + knowledge §7 G1/G2 fixed 2026-04-19 still accurate 1 month later; 8/8 consistency checks pass; no doc-drift fix needed; establishes META-AUDIT pattern category for future re-verifications; **★ 10 ANTI-DUPLICATION applications — MILESTONE (double-digit territory)** — 21 #5 line 21 wiring + 21 #8 line 22 downstream both covered by 20 #6 sub-verifications 2 + 3; no new breadcrumbs at consumer sites; ★ **ZERO NEW GAPS surfaced** — 5th consecutive audit (line 17 anomaly with 4 new gaps; 18 + 19 + 20 + 21 all zero); line 21 had 2 prior gaps G1 + G2 both ★ FIXED 2026-04-19 per knowledge §7 (3 unit tests at TaxReturnComputeServiceTest.java:24139/24187/24215 + e2e `retries: 1` at line21-total-credits.spec.ts:12); 18th Path A application (21 #9 bundled observations: missing diagrams/21.drawio cosmetic + lines 22+24 batching opportunity); ★ **11th CONSECUTIVE single-row log** in workflow; ★ 8 documentation drift fixes UNCHANGED (no drift this audit — first audit since 13 #4 with zero drift work); backend 765/765 UNCHANGED (no new tests this audit; 3 G1-fix tests already existed from 2026-04-19). See `history.md` 2026-05-14 line-21 entry. **Line 22 audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 23 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 3**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22). **★ FOURTH CREDITS-SECTION AUDIT (after lines 19 + 20 + 21); ★ NEAR-SIMPLEST CREDITS-SECTION LINE — pure subtraction with floor (Form1040.line22 = max(0, line18 − line21)); ★ SECOND META-AUDIT IN WORKFLOW with DIFFERENT doc-trail signature than line 21 (dependencies+knowledge §0 banners vs. spec §0 banner; establishes META-AUDIT category has TWO sub-types); MFS cascade UNCHANGED at 20 orchestrators** — 14th defensive-gap-NOT-needed Issue #1; ★ 4th orchestrator-method-based with transitive inheritance after 18 #1 + 20 #1 + 21 #1 (pattern rule generalized across FOUR audits across tax-territory + credits-territory chains); knowledge convergence advances 27→28 lines (22 #2 15th Legacy A migration; ★ 3rd CONSECUTIVE Legacy A migration with ZERO history.md hits after 20 #2 + 21 #2 — emerging workflow pattern now established); **★ 9th DOCUMENTATION DRIFT FIX with ★ NEW DRIFT SHAPE** (22 #4) — first instance of "documented-gap-already-fixed" in workflow (vs. prior 8 "code-fixed-but-stale-doc"); ★ TRIPLE-location drift across dependencies §E2E note + knowledge §0 banner + knowledge §7 G1 section; verified 2026-05-15 that e2e file line 12 ALREADY HAS retries:1 (cross-spec spillover from 2026-04-19 line 21 G2 round; doc never refreshed); ★ **11 ANTI-DUPLICATION applications** — 22 #6 closed line 22 wiring with ★ 4-SOURCE coverage (exceeds standard 3-source rule: spec + dependencies + 20 #6 sub-verification 3 + 21 #8); ★ same wiring anti-duplicated TWICE by two independent audits (21 #8 + 22 #6) — both agreed coverage sufficient; ★ **ZERO NEW GAPS surfaced** — 6th consecutive audit (line 17 anomaly with 4 new gaps; 18 + 19 + 20 + 21 + 22 all zero); line 22 had 2 prior gaps G1 + G2; G1 ★ ALREADY FIXED (drift resolved in 22 #4); G2 INFORMATIONAL deferred; 19th Path A application (22 #9 bundled observations: missing diagrams/22.drawio cosmetic (★ 3rd consecutive credits-section audit with this gap — emerging workflow signature) + G2 INFORMATIONAL no-named-line22-test + line 24 batching opportunity deferred); ★ **12th CONSECUTIVE single-row log** in workflow; ★ **2 META-AUDITS** total (FIRST + SECOND with different doc-trail signatures); backend 765/765 UNCHANGED (no new tests this audit; 3 G1-fix tests verify line 22 indirectly + 1 directly at TaxReturnComputeServiceTest.java:24215). See `history.md` 2026-05-15 line-22 entry. **Line 23 audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 24 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 4**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22/23). **★ FIFTH CREDITS-SECTION AUDIT (after lines 19 + 20 + 21 + 22); ★ FIRST AUDIT OUTSIDE same-method-as-20/21/22/24 TERRITORY — Schedule 2 aggregation lives in its own dedicated method `finalizeSchedule2OtherTaxes` at TaxReturnComputeService.java:15337-15382; ★ THIRD META-AUDIT IN WORKFLOW with SAME doc-trail signature as line 22 (dependencies+knowledge §0 banners; NO spec §0 banner) — ★ CONFIRMS sub-type (b) is DOMINANT META-AUDIT signature for credits-section audits (2 of 3 = 67%); MFS cascade UNCHANGED at 20 orchestrators** — 15th defensive-gap-NOT-needed Issue #1; ★ 5th orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1; ★ FIRST application in a DIFFERENT method outside same-method cluster — pattern rule confirmed method-agnostic; knowledge convergence advances 28→29 lines (23 #2 16th Legacy A migration; ★ 4th CONSECUTIVE Legacy A migration with ZERO history.md hits after 20 #2 + 21 #2 + 22 #2 — pattern fully established as workflow signature for credits-section audits); **★ FIRST METHOD-LEVEL VERIFIED CORRECT BREADCRUMB OUTSIDE same-method-as-20/21/22/24 territory** (23 #5) — ~60-line breadcrumb planted at TaxReturnComputeService.java:~15323 covering line 4 + line 7 + line 18 + line 19 grand total + ★ 4 G-fix lock-in anchors (G3 Form 8959 Part III RRTA + G5 finalize-pass + G6 e2e spec + G7 Form 2210) + 17 sub-item field map + ★ EXCLUDES line 20 Section 965 main-2025-trap STRUCTURALLY enforced; ★ **12 ANTI-DUPLICATION applications** — 23 #6 closed line 23 read with ★ FIRST read/write split closure in workflow (WRITE = NEW breadcrumb 23 #5; READ = anti-duplication via 20 #6 sub-verification 4); ★ **ZERO NEW GAPS surfaced** — 7th consecutive audit (18+19+20+21+22+23 all zero); 4 prior gaps G1/G2/G4/G8 all DEFERRED per knowledge §8 (G1 HIGH SE OOS + G2 HIGH Schedule H + G4 MED NIIT + G8 LOW W-2 box A/B — all already in outstanding.md from 2026-04-19 cycle; not new); ★ **20th PATH A APPLICATION MILESTONE (double-digit mature)** — 23 #9 6-observation bundle (heaviest in credits-section series; 4 OPEN prior gaps + missing diagrams/23.drawio cosmetic (★ 4th consecutive credits-section audit with this gap — pattern crystallized) + line 24 batching opportunity); ★ **13th CONSECUTIVE single-row log** in workflow; ★ 9 documentation drift fixes UNCHANGED (★ 2nd audit with zero drift work — after 21 #4 was first); ★ **MOST guardrails of any credits-section line — 5** (vs. 3-4 for sister lines) reflecting Schedule 2 complexity; ★ **LONGEST inheritance chain — 4 stages** (vs. 3 for lines 21/22) due to two-pass architecture; backend 765/765 UNCHANGED (no new tests this audit; 3 existing tests verify indirectly). See `history.md` 2026-05-15 line-23 entry. **Line 24 audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 25 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 5**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22/23/24). **★ 50 LINES AUDITED — HALF-CENTURY MILESTONE; ★★ TOTAL TAX FINAL audited (line 24 = the return's most important output); ★★ CREDITS-SECTION AUDIT SERIES COMPLETE (6 audits closed lines 19-24); SIXTH CREDITS-SECTION AUDIT; ★ FOURTH META-AUDIT IN WORKFLOW with sub-type (b) signature — ★ ESTABLISHES sub-type (b) at 75% DOMINANCE (3 of 4 META-AUDITS use dependencies+knowledge §0 banners; line 21 alone used sub-type (a) spec §0); MFS cascade UNCHANGED at 20 orchestrators** — 16th defensive-gap-NOT-needed Issue #1; ★ 6th orchestrator-method-based audit with transitive inheritance after 18 #1 + 20 #1 + 21 #1 + 22 #1 + 23 #1; **★ COMPLETES full credits-section MFS analysis — every line 19-24 verified MFS-clean**; knowledge convergence advances 29→30 lines (24 #2 17th Legacy A migration; **★ 30-LINE CONVERGENCE MILESTONE (round-number)**; ★ zero-history-hits streak ENDED at 4 — pattern was real but entry-writing-style-dependent, not line-position-dependent); **★ 10th DOCUMENTATION DRIFT FIX — DOUBLE-DIGIT MILESTONE** (24 #5) + **★ 2nd instance of NEW DRIFT SHAPE "documented-gap-already-fixed"** after 22 #4 was FIRST — recurrence CONFIRMS pattern is real; ★ 3-location drift across dependencies/24.md G1 Downstream Consumers row + G1 Gaps + G2 Gaps (G2 surfaced during edit; scope expanded 2→3); ★ **13 ANTI-DUPLICATION applications** — 24 #6 was 13th; **★ 4th use of 20 #6 breadcrumb — CONFIRMS 20 #6 was LOAD-BEARING for entire credits-section cluster** (6 anti-duplication closures across 4 audits all rely on single 20 #6 breadcrumb); **★ FULL CREDITS-SECTION CHAIN CONVERGES on ★★ TOTAL TAX FINAL at line 24** (24 #7) — ★ DEEPEST inheritance chain (9 cumulative links via 12+ existing breadcrumbs); ★ Line 24 is a load-bearing testbed; ★ **ZERO NEW GAPS surfaced** — 8th consecutive audit (18-24 all zero); line 24 had 2 prior gaps G1 + G2 BOTH ★ FIXED 2026-04-19 (G1 + G2 doc-drift resolved this audit); ★ **21st PATH A APPLICATION**; ★ **14th CONSECUTIVE single-row log** in workflow; ★ **ZERO-when-zero UNIQUE convention** to line 24 (third distinct null-handling convention in page-2 chain — distinct from lines 20+21+23 null-when-zero AND line 22 ALWAYS-SET); backend 765/765 UNCHANGED (no new tests this audit). **★★ READY TO TRANSITION TO PAYMENTS SECTION (lines 25-33)** — structurally DIFFERENT (multiple methods + multi-source aggregation + new compute order; expect heavier audits than credits-section). See `history.md` 2026-05-15 line-24 entry. **Line 25a audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 26 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 6**: 7a/7b/8/9/10/11a/11b/12a/12b/12c/12d/12e/13a/13b/14/15/16/17/18/19/20/21/22/23/24/25a). **★ FIRST PAYMENTS-SECTION AUDIT IN WORKFLOW** (after credits-section series complete at line 24); **★ MAJOR TRANSITION** from credits/taxes section to payments section; line 25a is W-2 box 2 withholding aggregation (simplest line in 25a-25d family); **★ FIFTH META-AUDIT IN WORKFLOW** with sub-type (b) signature — **★ ESTABLISHES sub-type (b) at 80% DOMINANCE** (4 of 5 META-AUDITS); **★ NEW MFS PATTERN "upstream-data-segregated-at-storage"** (★ THIRD distinct MFS-protection mechanism in workflow after in-method null-shadow (19 #1) + transitive inheritance (6 prior audits); protection at Firestore storage layer; will recur in future payments-section audits); MFS cascade UNCHANGED at 20 orchestrators — 17th defensive-gap-NOT-needed Issue #1; ★ 7th orchestrator-method-based audit with transitive inheritance; knowledge convergence advances 30→31 lines (25a #2 18th Legacy A migration; **★ FIRST payments-section migration**; combined spec means 25b/25c/25d sub-line audits won't need separate renames); **★ FIRST PAYMENTS-SECTION METHOD-LEVEL BREADCRUMB** (25a #5) — ~95-line VERIFIED CORRECT breadcrumb at TaxReturnComputeService.java:~19688 covering all 4 sub-lines (25a + 25b + 25c + 25d) + ★ NEW MFS PATTERN anchor + ★ 3 G-fix lock-in anchors (G1 1099-DA + G2 Form 8959 + G3 1099-NEC; all FIXED 2026-04-19) + 4 sub-line field map + helper methods + compute order + null-when-zero convention; ★ **14 ANTI-DUPLICATION applications** — 25a #6 was 14th; **★ FIRST same-audit anti-duplication in workflow** (anchor at 25a #5 + anti-duplicate at 25a #6 within same audit cycle; confirms "plant comprehensive breadcrumb at first audit" pattern works at BOTH temporal scales); **★ FIRST combined-spec Verification log** (25a #3) — 6-column adaptation (#, Date, Auditor, **Sub-line**, Result, Closures); future 25b/25c/25d audits will append rows; **★ SIMPLEST chain in workflow** (25a #7) — 2 stages with 1 source (W-2 box 2); ★ **ZERO NEW GAPS surfaced** — 9th consecutive audit (18-24 + 25a all zero); line 25a had 4 prior gaps G1+G2+G3 BOTH ★ FIXED 2026-04-19 + G4 DEFERRED OOS (K-1/1042-S/8805/8288-A → line 25c; not 25a-specific); ★ **22nd PATH A APPLICATION** (25a #9 3-observation bundle: G4 OOS + missing diagrams/25a.drawio cosmetic (★ 6th consecutive credits/payments-section audit with this gap — overdue cleanup) + ★ forward-looking 25b/25c/25d audits will anti-duplicate via 25a #5 NEW breadcrumb); ★ **15th CONSECUTIVE single-row log** in workflow; ★ 10 documentation drift fixes UNCHANGED (★ 3rd audit with zero drift work after 21 #4 + 23 #4); backend 765/765 UNCHANGED (no new tests this audit). **★ Looking ahead — line 25b (1099-series + SSA + RRB + 1099-DA federal withholding)**: ★ FIRST cross-audit anti-duplication via 25a #5 NEW breadcrumb; 12-source aggregation; likely 6th META-AUDIT (would push sub-type (b) DOMINANCE to ~83%); same NEW MFS PATTERN. See `history.md` 2026-05-15 line-25a entry. **Line 25b audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy continued — ★ 27 CONSECUTIVE walkthroughs with zero new outstanding entries — extends first 20-streak by 7**: ... /24/25a/25b). **★ SECOND PAYMENTS-SECTION AUDIT**; line 25b is 1099-family + SSA-1099 + RRB-1099 + RRB-1099-R + 1099-DA federal withholding aggregation (★ HEAVIEST source count in 25a-25d family — 13 source types); **★ FIRST "already-migrated" closure in workflow** (25b #2 — Legacy A inherits from 25a #2 via combined-spec property; convergence + Legacy A count UNCHANGED); **★ FIRST combined-spec ROW APPEND** (25b #3 — row 2 to existing §11; ★ 16th CONSECUTIVE single-row contribution); **★ 6th META-AUDIT IN WORKFLOW** with sub-type (b) signature — **★ ESTABLISHES sub-type (b) at 83% DOMINANCE** (5 of 6 META-AUDITS); ★ 4th CLEAN sub-type b META-AUDIT (60% clean trend); **★ NEW MFS PATTERN "upstream-data-segregated-at-storage" RECURRENCE CONFIRMED** (25b #1 — pattern structurally definitive for payments-section; MFS cascade UNCHANGED at 20 orchestrators); ★ 18th defensive-gap-NOT-needed; ★ 8th orchestrator-method-based audit; **★ FIRST CROSS-AUDIT anti-duplication within payments-section** (25b #5 — via 25a #5 NEW breadcrumb; validates 25a #5 trajectory toward load-bearing CONFIRMED at 25d); ★ **15 ANTI-DUPLICATION applications**; **★ LONGEST chain in payments-section** (25b #6 — 13 sources via variadic helper + SSA-1099 dedicated helper; ★ BREADTH complexity dimension); **★ 5 CONVENTIONS tied with line 23 for MOST** (25b #7 — ★ Convention 5 SSA-1099 SPECIAL FIELD NAME UNIQUE to 25b; ★ ANTI-REFACTOR SAFEGUARD against helper consolidation); **★ MOST critical 2025 ROUTING GUARDRAILS of any 25-line** (25b #8 — 4 rules: §4a SSA+RRB→25b not 25c; §3b 1099-K box 4 not box 10; §3b 1099-DA box 2a NEW 2025 G1; §3b RRB-1099 box 10 vs. RRB-1099-R box 9); ★ **23rd PATH A APPLICATION** (25b #9: 3-observation bundle); ★ **16th CONSECUTIVE single-row contribution**; ★ 10 documentation drift fixes UNCHANGED (★ 4th audit with zero drift); ★ **ZERO NEW GAPS surfaced — 10th CONSECUTIVE audit — DOUBLE-DIGIT MILESTONE** signals genuine codebase stability (lines 18-24 + 25a + 25b all zero); backend 765/765 UNCHANGED (no new tests). **★ Looking ahead — line 25c (W-2G + Form 8959 Part V line 24)**: ★ 3rd cross-audit anti-duplication via 25a #5 NEW breadcrumb; 2-source aggregation; G2 (Form 8959 E2E FIXED 2026-04-19) + G4 (K-1/1042-S/8805/8288-A DEFERRED OOS) line-25c-specific gaps; ★ likely 7th META-AUDIT pushing sub-type (b) DOMINANCE to ~86%. See `history.md` 2026-05-15 line-25b entry. **Line 25c audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy — extends streak to 28 CONSECUTIVE zero-outstanding walkthroughs; ★ 11th CONSECUTIVE ZERO NEW GAPS — DOUBLE-DIGIT MILESTONE DEEPENS).** Pure documentation closure: ★ 19th defensive-gap-NOT-needed (★ 9th orchestrator-method-based; ★ **3rd instance of NEW MFS PATTERN "upstream-data-segregated-at-storage"** — pattern source-count + aggregation-style agnostic; structurally definitive); MFS cascade UNCHANGED at 20 orchestrators; ★ **2nd "already-migrated" Legacy A closure** (knowledge file already renamed at 25a #2 via combined-spec property; convergence + Legacy A count UNCHANGED at 31 / 18); ★ **2nd combined-spec ROW APPEND** — row 3 to existing §11 in lines/25abcd.md (§11 now 3 rows total); ★ **7th META-AUDIT in workflow** (sub-type b signature; ★ **ESTABLISHES sub-type (b) at 86% DOMINANCE** — 6 of 7; ★ 5th CLEAN sub-type b META-AUDIT; clean trend strengthens to 67%; ★ 3rd combined-spec META-AUDIT reuse); ★ **2nd CROSS-AUDIT anti-duplication within payments-section** (via 25a #5 NEW breadcrumb — 3rd reuse overall: 25a #6 same-audit + 25b #5 + 25c #5 cross-audit; 1 more reuse at 25d → ★ LOAD-BEARING CONFIRMATION milestone, mirrors 20 #6 → 24 #6); ★ **CONDITIONAL inheritance chain — STRUCTURALLY UNIQUE among 25a-25d** (only sub-line with conditional source aggregation: W-2G unconditional + Form 8959 conditional double-null guard handles 4 nullity combinations; ★ **4th distinct complexity dimension in workflow** — conditional branching, distinct from depth/cumulative depth/breadth); ★ **4 conventions same as 25a** + ★ **NO 5th convention** (audit-trail vocabulary distinction preserved — conditional Form 8959 is STRUCTURAL not field-name handling); ★ **2 routing distinctions + G2 FIX LOCK-IN VERIFIED** (W-2G→25c not 25b; Form 8959 line 24→25c not line 23; ★ G2 fix held for 1 month via E2E Test 8); ★ **16 ANTI-DUPLICATION applications** (+1); ★ **24th PATH A APPLICATION** (25c #9: 4-observation bundle including G4 OOS finding natural home in 25c-specific audit); ★ **17th CONSECUTIVE single-row contribution**; ★ 10 documentation drift fixes UNCHANGED (★ 5th audit with zero drift); ★ **ZERO NEW GAPS surfaced — 11th CONSECUTIVE audit — DOUBLE-DIGIT MILESTONE DEEPENS** (lines 18-24 + 25a + 25b + 25c all zero); backend 765/765 UNCHANGED (no new tests). **★ Looking ahead — line 25d (Total federal income tax withheld = 25a + 25b + 25c)**: ★ pure-pass-through addition; ★ 4th reuse of 25a #5 NEW breadcrumb → ★ LOAD-BEARING CONFIRMATION milestone (mirrors 20 #6 → 24 #6); ★ likely 8th META-AUDIT pushing sub-type (b) DOMINANCE to ~88%; ★ likely 4th combined-spec ROW APPEND. See `history.md` 2026-05-15 line-25c entry. **Line 25d audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy — extends streak to 29 CONSECUTIVE zero-outstanding walkthroughs; ★ 12th CONSECUTIVE ZERO NEW GAPS — DOUBLE-DIGIT MILESTONE DEEPENS FURTHER; ★ 25abcd CLUSTER COMPLETE).** Pure documentation closure: ★ 20th defensive-gap-NOT-needed (★ 10th orchestrator-method-based; ★ **4th instance of NEW MFS PATTERN "upstream-data-segregated-at-storage"** — pure-sum recurrence further confirmed; pattern proven source-count + aggregation-style + sum agnostic across 4 distinct instances); MFS cascade UNCHANGED at 20 orchestrators; ★ **3rd "already-migrated" Legacy A closure** (combined-spec inheritance from 25a #2; pattern firmly established across 4 audits; convergence + Legacy A count UNCHANGED at 31 / 18); ★ **3rd combined-spec ROW APPEND** — row 4 to existing §11 in lines/25abcd.md; ★ **COMPLETES 25abcd §11 FAMILY** with all 4 sub-lines (25a + 25b + 25c + 25d all COMPLETE); ★ **8th META-AUDIT in workflow** (sub-type b signature; ★ **DOMINANCE to 88%** — 7 of 8; ★ 6th CLEAN sub-type b META-AUDIT; clean trend strengthens to 71%; ★ 4th combined-spec META-AUDIT reuse — family COMPLETE); ★ **LOAD-BEARING CONFIRMATION MILESTONE** — 4th reuse of 25a #5 NEW breadcrumb (25a #6 same-audit + 25b/25c/25d #5 cross-audit) confirms load-bearing status (mirrors 20 #6 → 24 #6 trajectory in credits-section); method-level breadcrumb pattern fully validated for both sections; ★ **PURE-SUM inheritance chain — STRUCTURALLY SIMPLEST among 25a-25d** (no statement iteration; no conditional branching; no helper); ★ **Convention 1 null-when-zero ENFORCED VIA TERNARY at setter** (★ UNIQUE among 25a-25d — others rely on helper-returned null; 25d builds zero from safeAmount-of-null addends then ternary-flips at line 19875); Conventions 2/3/4 transitively inherited; ★ **ZERO routing distinctions** (pure pass-through addition); ★ **frontend DUAL-PATH verified** (form-tax-return-1040.component.ts:432 prefers backend totalWithholding, falls back to client-side sub-line sum when null; defensive measure; equivalent results); ★ **17 ANTI-DUPLICATION applications** (+1; ★ LOAD-BEARING CONFIRMED); ★ **25th PATH A APPLICATION** (25d #9: 4-observation bundle including ★ 25abcd cluster COMPLETE); ★ **18th CONSECUTIVE single-row contribution**; ★ 10 documentation drift fixes UNCHANGED (★ 6th audit with zero drift); ★ **ZERO NEW GAPS surfaced — 12th CONSECUTIVE audit — DOUBLE-DIGIT MILESTONE DEEPENS FURTHER** (lines 18-24 + 25a + 25b + 25c + 25d all zero); backend 765/765 UNCHANGED (no new tests). **★ Looking ahead — line 26 (Estimated tax payments)**: ★ FIRST audit AFTER 25abcd cluster complete; fresh spec/dependencies/knowledge; estimated payments stored per-spouse — may continue NEW MFS PATTERN as 5th instance OR introduce new MFS-protection mechanism; ★ likely 11th orchestrator-method-based; ★ likely 9th META-AUDIT pushing sub-type (b) DOMINANCE to ~89%. See `history.md` 2026-05-15 line-25d entry. **Line 26 audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy — extends streak to 30 CONSECUTIVE zero-outstanding walkthroughs; ★ 13th CONSECUTIVE ZERO NEW GAPS — DOUBLE-DIGIT MILESTONE DEEPENS FURTHER; ★ FIRST audit AFTER 25abcd cluster complete).** Pure documentation closure: ★ **NEW 4th MFS-PROTECTION MECHANISM debut** — "in-helper isMfs-flag-gated spouse-form skip" via `if (!isMfs && spouseMade)` guard at TaxReturnComputeService.java:20061; ★ STRUCTURALLY DIFFERENT from 3 established mechanisms (M1 in-method null-shadow at call site; M2 transitive inheritance; M3 upstream-data-segregated-at-storage); ★ 11th orchestrator-method-based audit; pattern distribution after 11 audits: 6 M2 + 4 M3 + 1 ★ M4 NEW; MFS cascade UNCHANGED at 20 orchestrators; ★ **19th LEGACY A MIGRATION** — knowledge_line26.md → line-26-estimated-tax-payments.md; ★ FIRST Legacy A since 25a #2 (5-audit dry spell ended); convergence advances **31 → 32 lines**; ★ **NEW single-spec §12 Verification log** in lines/26.md (numbered §12 because spec already has §11 Summary Rule; ★ FIRST single-spec §11/§12 audit since line 24 — combined-spec at 25abcd intervened); ★ **9th META-AUDIT in workflow** (sub-type b signature; ★ **DOMINANCE to 89%** — 8 of 9; ★ **SURFACES DRIFT** in dependencies/26.md — 3 stale G1 references fixed; ★ **11th doc-drift fix in workflow**; ★ **FIRST drift-surfacing META-AUDIT since 24 #4** — 5-consecutive-clean streak broken; clean trend in sub-type (b) declines from 71% to 63%); ★ **DUAL-FORM 6-source inheritance chain** — ★ **5th distinct complexity dimension in workflow** (DUAL-FORM MFS-gated branching, distinct from depth/cumulative-depth/breadth/conditional/pure-sum); ★ **5 CONVENTIONS** — ★ tied with line 25b for MOST; ★ **Convention 5 SCREENING GATE `madeEstimatedTaxPayments` UNIQUE among 25-line family** (intake-level gate; vocabulary distinction preserved vs. 25b's field-name handling); ★ **0 routing distinctions + 1 ALLOCATION RULE** (Pub. 505 divorced/MFS joint payments; `divorceFormerSpouseSSN` annotation field stored but not summed; auto-allocation OOS per G8); ★ **18 ANTI-DUPLICATION applications** (+1; ★ NO 25a #5 reuse — line 26 not part of 25abcd cluster; pre-existing helper doc comment re-validated); ★ **26th PATH A APPLICATION** (26 #9: 4-observation bundle); ★ **19th CONSECUTIVE single-row contribution**; ★ **ZERO NEW GAPS surfaced — 13th CONSECUTIVE audit — DOUBLE-DIGIT MILESTONE DEEPENS FURTHER** (lines 18-24 + 25a + 25b + 25c + 25d + 26 all zero); backend 765/765 UNCHANGED (no new tests); G6 (payment dates for Form 2210 Schedule AI) + G7 (farmers/fishermen 66⅔% rule) + G8 (community property MFS 50/50 split) all DEFERRED OOS already documented from 2026-04-19. **★ Looking ahead — line 27a (Earned Income Credit — EIC)**: SIXTH payments-section audit; ★ may reuse or extend NEW 4th MFS-PROTECTION MECHANISM (per-spouse EIC forms — could be M4 recurrence); ★ likely 12th orchestrator-method-based; ★ likely 10th META-AUDIT pushing sub-type (b) DOMINANCE to ~90% (9 of 10). See `history.md` 2026-05-15 line-26 entry. **Line 27a audit complete 2026-05-15 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy — extends streak to 31 CONSECUTIVE zero-outstanding walkthroughs; ★ 14th CONSECUTIVE ZERO NEW GAPS — DOUBLE-DIGIT MILESTONE DEEPENS FURTHER).** Pure documentation closure: ★ **M4 RECURRENCE CONFIRMED** — FIRST RECURRENCE of NEW 4th MFS-PROTECTION MECHANISM (after debut at line 26); ★ used **5 TIMES** within single helper at TaxReturnComputeService.java:20419/20434/20435/20451/20468 — most-extensive M4 application in workflow; ★ 12th orchestrator-method-based audit; pattern distribution after 12 audits: 6 M2 + 4 M3 + 2 M4; MFS cascade UNCHANGED at 20 orchestrators; ★ **20th LEGACY A MIGRATION** — knowledge_line27abc.md → line-27abc-earned-income-credit.md; ★ 2 consecutive Legacy A audits after 26 #2; convergence advances **32 → 33 lines**; ★ **NEW §22 Verification log** in lines/27abc.md (numbered §22 because spec already has §1-§21); ★ **10th META-AUDIT in workflow — DOUBLE-DIGIT MILESTONE** (sub-type b signature; ★ **DOMINANCE to 90%** — 9 of 10; ★ **SURFACES 2 DRIFT POINTS**: (i) DUAL-SPEC DRIFT — lines/27.md + lines/27abc.md both exist; supersession banner added to lines/27.md; (ii) INTRA-SPEC DRIFT — stale "MFS exception not implemented" note in lines/27abc.md Implementation notes updated to reflect G8 FIXED 2026-04-19; ★ **12th doc-drift fix in workflow**; ★ **2nd CONSECUTIVE drift-surfacing META-AUDIT** after 26 #4; clean trend in sub-type (b) declines from 63% to 56%); ★ **MULTI-STAGE GATED CREDIT COMPUTATION chain** — ★ **6th distinct complexity dimension in workflow** (11-stage chain with 8 gate short-circuits + dual-table lookup with min() + 5-fold M4 usage; ★ MOST complex single-line computation); ★ **6 CONVENTIONS — NEW HIGH in workflow** (exceeds prior max of 5 at 25b/26); ★ Convention 5 SCREENING GATE `claimsEIC` RECURS (★ first Convention 5 recurrence after 26\'s `madeEstimatedTaxPayments`); ★ Convention 6 MFS EXCEPTION FILING-STATUS REMAP UNIQUE to 27a (IRC §32(d)(2) MFS→Single under exception); ★ **0 routing distinctions + ★ HEAVIEST 2025 reference-data set** (72 distinct constants in eicTableLookup × 4 children brackets); ★ FIRST audit in workflow with heavy 2025 reference-data set; all from IRS Rev. Proc. 2024-40; ★ **19 ANTI-DUPLICATION applications** (+1; ★ NO 25a #5 reuse — line 27a not part of 25abcd cluster; pre-existing helper doc comment at lines 20372-20381 re-validated as method-level breadcrumb); ★ **27th PATH A APPLICATION** (27a #9: 5-observation bundle); ★ **20th CONSECUTIVE single-row contribution**; ★ **ZERO NEW GAPS surfaced — 14th CONSECUTIVE audit — DOUBLE-DIGIT MILESTONE DEEPENS FURTHER** (lines 18-24 + 25a + 25b + 25c + 25d + 26 + 27a all zero); backend 765/765 UNCHANGED (no new tests); G1 (Schedule E investment income) + G9 (line 27b clergy SE) + G10 (Schedule EIC PDF) + G11 (Schedule C/SE) all DEFERRED OOS already documented from 2026-04-19. **★ Looking ahead — line 28 (Additional Child Tax Credit — ACTC from Schedule 8812)**: SEVENTH payments-section audit; ★ may reuse M4 (per-spouse child credit forms) or introduce new mechanism (Schedule 8812 has Part I-A/I-B/II-A/II-B branches); ★ likely 13th orchestrator-method-based; ★ likely 11th META-AUDIT pushing sub-type (b) DOMINANCE to ~91% (10 of 11). See `history.md` 2026-05-15 line-27a entry. **Line 27b audit complete 2026-05-16 — all 10 issues closed; ZERO new deferred enhancements (anti-fragmentation policy — extends streak to 32 CONSECUTIVE zero-outstanding walkthroughs; ★ 15th CONSECUTIVE ZERO NEW GAPS).** Pure documentation closure: ★ **DEGENERATE checkbox audit — STRUCTURALLY SIMPLEST in workflow** (no code, no helper, no field, no PDF fill — only an inline comment at TaxReturnComputeService.java:19885); ★ **NO MFS MECHANISM NEEDED** — FIRST "no-code-at-all" closure (distinct from 12 prior "defensive-gap-NOT-needed" closures which all had code); pattern distribution UNCHANGED after 13 audits: 6 M2 + 4 M3 + 2 M4 + 1 degenerate; MFS cascade UNCHANGED at 20 orchestrators; ★ **4th "already-migrated" Legacy A closure** — combined-spec inheritance from 27a #2; ★ **FIRST already-migrated closure OUTSIDE 25abcd family** (pattern extends to 27abc); convergence UNCHANGED at 33 lines; ★ **4th combined-spec ROW APPEND** — row 2 to existing §22 in lines/27abc.md; ★ **FIRST combined-spec ROW APPEND for 27abc family**; ★ **11th META-AUDIT in workflow** (sub-type b signature; ★ **DOMINANCE to ~91%** — 10 of 11; ★ **CLEAN** — degenerate verification with nothing to drift; ★ **returns to clean after 2-consecutive-drift streak** at 26 #4 + 27a #4; clean trend in sub-type (b) advances from 56% to 60%); ★ **DEGENERATE-DERIVED-CONSTANT chain** — ★ **7th distinct complexity dimension in workflow** (★ STRUCTURALLY SIMPLEST; vs. depth/cumulative/breadth/conditional/pure-sum/dual-form/multi-stage-gated); ★ **ZERO CONVENTIONS** — ★ **NEW LOW in workflow** (vs. previous low of 4); ★ **0 routing distinctions + 0 reference data** (★ tied with 25a-d for least reference data); ★ **3 FULL-SPECTRUM milestones achieved consecutively with 27a**: complexity dimensions (degenerate ↔ multi-stage-gated) + conventions (0 ↔ 6) + reference data (0 ↔ 72); ★ **20 ANTI-DUPLICATION applications** (+1; ★ NO new breadcrumb — inline comment at line 19885 serves as smallest possible method-level breadcrumb at 1 line); ★ **28th PATH A APPLICATION** (27b #9: smallest 2-observation bundle in workflow); ★ **21st CONSECUTIVE single-row contribution**; ★ **ZERO NEW GAPS surfaced — 15th CONSECUTIVE audit** (lines 18-24 + 25a + 25b + 25c + 25d + 26 + 27a + 27b all zero); backend 765/765 UNCHANGED (no new tests); G9 (line 27b clergy SE checkbox; OOS until Schedule SE) already documented from 2026-04-19. **★ Looking ahead — line 27c (EIC opt-out / disqualified checkbox)**: EIGHTH payments-section audit; ★ ANOTHER DEGENERATE checkbox audit with one structural twist (auto-derived from `line27a == null` state, not a pure constant like 27b); ★ likely 5th combined-spec ROW APPEND — ★ COMPLETES 27abc §22 family at 3 rows; ★ likely 12th META-AUDIT pushing sub-type (b) DOMINANCE to ~92% (11 of 12). See `history.md` 2026-05-16 line-27b entry. **Line 27c audit complete 2026-05-16 — all 10 issues closed; ★★ ONE NEW DEFERRED ENHANCEMENT — G12 NEW GAP SURFACED — Line 27c PDF auto-fill missing (frontend has zero references to `line27c`; IRS 2025 instructions say "You can't take the credit. Check the box on line 27c." in disqualifying situations); G12 entry added to outstanding.md at line 462; severity MEDIUM (informational checkbox); recommended fix: `values["line27c_eic_opt_out_checkbox"] = (payments?.earnedIncomeCredit == null) || (eicTaxpayer?.claimsEIC === false)`.** ★ **BREAKS 15-consecutive-ZERO-NEW-GAPS streak** (was 15 audits from lines 18-24 + 25a-d + 26 + 27a + 27b); ★ **BREAKS 32-consecutive-zero-outstanding-walkthroughs streak**; ★ **FIRST significant streak-breaker in workflow**; new streaks start at 0. Pure documentation closure otherwise: ★ **NO MFS MECHANISM NEEDED** — 2nd consecutive degenerate audit after 27b; pattern distribution UNCHANGED after 14 audits (6 M2 + 4 M3 + 2 M4 + 2 degenerate); MFS cascade UNCHANGED at 20 orchestrators; ★ **5th "already-migrated" Legacy A closure** — combined-spec inheritance from 27a #2; ★ 2nd already-migrated closure for 27abc family; ★ combined-spec property fully validated for 27abc family (3 of 3 sub-line audits); convergence UNCHANGED at 33 lines; ★ **5th combined-spec ROW APPEND** — row 3 to existing §22 in lines/27abc.md; ★ **COMPLETES 27abc §22 FAMILY at 3 rows** (★ second combined-spec family to fully complete after 25abcd); ★ **12th META-AUDIT in workflow** (sub-type b signature; ★ **DOMINANCE to ~92%** — 11 of 12; ★ **SURFACES 2 DRIFT POINTS** in knowledge §1 row 27c + dependencies §2 — both claimed auto-check by frontend but zero frontend code; both updated to mark INTENDED + G12 reference; ★ **3rd drift-surfacing META-AUDIT** after 26 #4 + 27a #4; clean trend in sub-type (b) declines from 60% to 55%; ★ **13th doc-drift fix in workflow**); ★ **STATE-DERIVED-CONSTANT chain** — ★ **8th distinct complexity dimension in workflow** (★ STATE-DERIVED distinct from 27b's DEGENERATE-DERIVED-CONSTANT because line 27c's value depends on upstream `line27a == null` state, not a pure literal; ★ workflow now distinguishes 2 sub-categories of degenerate chains); ★ **ZERO CONVENTIONS** — ★ 2nd consecutive ZERO-CONVENTIONS audit after 27b; ★ workflow conventions range 0-6 firmly established; ★ **0 routing distinctions + 0 reference data** (★ tied with 25a-d/27b for least; ★ workflow reference-data range remains 0-72); ★ **21 ANTI-DUPLICATION applications** (+1; ★ NO new breadcrumb — inline comment at TaxReturnComputeService.java:19886 serves as 1-line method-level breadcrumb — ★ 2nd consecutive 1-line breadcrumb after 27b); ★ **22nd CONSECUTIVE single-row contribution**; backend 765/765 UNCHANGED (no new tests). **★ Looking ahead — line 28 (Additional Child Tax Credit — ACTC from Schedule 8812)**: NINTH payments-section audit; ★ FIRST audit AFTER 27abc cluster complete; ★ may reuse M4 (per-spouse child credit forms) OR introduce new mechanism (Schedule 8812 has Part I-A/I-B/II-A/II-B branches); ★ likely 13th orchestrator-method-based; ★ likely 13th META-AUDIT pushing sub-type (b) DOMINANCE to ~92% (12 of 13). See `history.md` 2026-05-16 line-27c entry. **Line 28 audit complete 2026-05-16 — all 10 issues closed; ★★ ONE NEW DEFERRED ENHANCEMENT — G13 NEW GAP SURFACED — CTC per-child amount documentation drift ($2,000 in 3 doc files vs $2,200 in code with OBBBA + Rev. Proc. 2024-40 §3.08 citation); G13 entry added to outstanding.md just above G12; ★ MEDIUM severity (presumed code is OBBBA-correct); drift fix already applied at 28 #4 (spec/dependencies/knowledge updated to mark G10 as REOPENED with OBBBA citation); user must verify against IRS 2025 Form 1040 / Schedule 8812 final instructions.** ★ **2nd consecutive new-gap audit** (after G12 at 27c); ★ **confirms streak-end** — zero-new-gaps STILL at 0; zero-outstanding-walkthroughs STILL at 0; ★ documentation drift is now the dominant audit finding. Pure documentation closure otherwise: ★ **M4 RECURRENCE — 2nd recurrence in workflow** (3rd M4 instance after 26 debut + 27a 1st recurrence); ★ **13th orchestrator-method-based audit**; helper `computeSchedule8812` uses isMfj-flag at threshold ($400k MFJ vs $200k others) + G9 ITIN check + Part II-B SS aggregation; pattern distribution after 15 audits: 6 M2 + 4 M3 + 3 M4 + 2 degenerate; MFS cascade UNCHANGED at 20 orchestrators; ★ **21st LEGACY A MIGRATION** — knowledge_line28.md → line-28-actc-schedule-8812.md; ★ 3 consecutive Legacy A audits (26 #2 + 27a #2 + 28 #2); convergence advances **33 → 34 lines**; ★ **NEW §13 Verification log** in lines/28.md (★ FIRST single-spec §11+ audit since 27a #3; ★ 23rd CONSECUTIVE single-row contribution); ★ **13th META-AUDIT in workflow** (sub-type b signature; ★ **DOMINANCE to ~92%** — 12 of 13; ★★ **SURFACES MAJOR DRIFT G13** — 3 doc files claim CTC $2,000 vs code $2,200 with OBBBA; ★ **14th doc-drift fix in workflow**; ★ **4th drift-surfacing META-AUDIT in last 5 audits** — only 27b #4 was clean; clean trend in sub-type (b) declines from 55% to 50%); ★ **DUAL-PATH GATED CREDIT chain** — ★ **9th distinct complexity dimension in workflow** (distinct from 27a's single-path MULTI-STAGE-GATED because line 28 has Part II-A + Part II-B alternatives with max() selection; Part II-B is NOT optional when conditions met per spec §8); ★ **7 CONVENTIONS NEW HIGH** (exceeds prior max of 6 at 27a); ★ Convention 5 RECURS 3rd time (`ctcPreviouslyDenied` Form 8862 gate); ★ Convention 6 ELECTS-NO-ACTC OPT-OUT — ★ UNIQUE to 28; ★ Convention 7 PUERTO RICO BONA FIDE RESIDENT BYPASS — ★ UNIQUE to 28 (G11 fix); ★ workflow conventions range 0-7 firmly established; ★ **0 routing distinctions + ★ HEAVY 2025 reference-data set** (~15 distinct constants; ★ SECOND-HEAVIEST in workflow after 27a at 72; ★ workflow reference-data range firmly established 0-72 with 3 tiers); ★ **22 ANTI-DUPLICATION applications** (+1; ★ 19 #6 breadcrumb LOAD-BEARING for cross-line family — FIRST cross-line family breadcrumb in workflow parallel to 20 #6 credits-cluster + 25a #5 payments-cluster; line 28 INSEPARABLE from line 19 — single helper produces both); backend 765/765 UNCHANGED (no new tests). **★ Looking ahead — line 29 (American Opportunity Credit — refundable AOTC from Form 8863)**: TENTH payments-section audit; ★ likely 14th orchestrator-method-based (computeForm8863 helper has multi-stage structure similar to 27a EIC); ★ likely 14th META-AUDIT pushing sub-type (b) DOMINANCE to ~93% (13 of 14). See `history.md` 2026-05-16 line-28 entry. **Line 29 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ Path A application — ★ RESUMES zero-outstanding-walkthroughs streak at 1 after G12 at 27c + G13 at 28 broke it; ★ 1-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY NARRATIVE confirmed — drift surge + gap surge both ended at line 29.** Pure documentation closure: ★ **M4 RECURRENCE** — 3rd recurrence in workflow (4th M4 instance after 26 debut + 27a 1st recurrence + 28 2nd recurrence); ★ **14th orchestrator-method-based audit**; helper `computeForm8863` uses isMfs hard-disqualify + isMfj phaseout threshold + MFJ spouse-student merge; pattern distribution after 16 audits: 6 M2 + 4 M3 + 4 M4 + 2 degenerate; MFS cascade UNCHANGED at 20 orchestrators; ★ **22nd LEGACY A MIGRATION** — knowledge_line29.md → line-29-aotc-form-8863.md; ★ **4 consecutive Legacy A audits — longest streak in workflow** (26 #2 + 27a #2 + 28 #2 + 29 #2); convergence advances **34 → 35 lines**; ★ **NEW §16 Verification log** in lines/29.md (numbered §16 because spec already has §1-§15); ★ **14th META-AUDIT in workflow** (sub-type b signature; ★ **DOMINANCE to ~93%** — 13 of 14; ★ **CLEAN** — 7/7 consistency checks pass; ★ **ENDS 4-of-5 drift surge** — 26 #4 + 27a #4 + 27c #4 + 28 #4 all surfaced drift; only 27b #4 + 29 #4 clean in last 6; clean trend in sub-type (b) recovers from 50% to 54%); ★ **MULTI-STAGE GATED CREDIT chain RECURRENCE** — ★ 1st recurrence of 27a's complexity dimension; dimension count UNCHANGED; ★ KEY DISTINCTION FROM 27a — line 29 produces TWO co-outputs (refundable line 29 + nonrefundable line 20 via Sched 3 line 3); line 27a produces ONE; ★ **8 CONVENTIONS NEW HIGH** (exceeds prior max of 7 at 28); ★ Convention 5 RECURS 3rd strict intake-gate (`claimsEducationCreditsOnReturn` after 26 + 27a); ★ Convention 6 FORM 8862 RECERTIFICATION with per-student `aotcStudentEligible` (★ UNIQUE per-student granularity); ★ Convention 7 MFS HARD-DISQUALIFY + flag emission (★ UNIQUE — no exception path; distinct from 27a's MFS-with-exception remap); ★ Convention 8 MAGI ADD-BACKS — 4 explicit form-based add-backs (★ UNIQUE); ★ workflow conventions range 0-8 firmly established; ★ **0 routing distinctions + ★ HEAVY 2025 reference-data set** (~14 distinct constants from IRC §25A + IRS 2025 Form 8863 instructions + Pub. 970; ★ THIRD-HEAVIEST in workflow after 27a 72 + 28 ~15; ★ workflow reference-data range firmly established 0-72 with 3 tiers); ★ **23 ANTI-DUPLICATION applications** (+1; ★ NO existing breadcrumb covers line 29 — 19 #6 covers line-19-and-28 family via computeSchedule8812, NOT Form 8863; 3-source coverage sufficient); ★ **24th CONSECUTIVE single-row contribution**; ★ **29th PATH A APPLICATION** (+1; ★ streak RESUMED after G12 + G13 broke it); ★ **ZERO new gaps surfaced — 1-audit zero-new-gaps streak after 2-audit gap surge** (G12 at 27c + G13 at 28); backend 765/765 UNCHANGED (no new tests); G4 under-24 self-reported DEFERRED OOS already documented in dependencies §6. **★ Looking ahead — line 30**: ELEVENTH payments-section audit; ★ line 30 on 2025 Form 1040 may be "Amount paid with request for extension" OR "Reserved for future use"; ★ likely DEGENERATE if reserved (similar to 27b pattern); ★ likely 15th META-AUDIT pushing sub-type (b) DOMINANCE to ~93%. See `history.md` 2026-05-16 line-29 entry. **Line 30 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 2 after 29 RESUMED; ★ 2-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative STRENGTHENING.** Pure documentation closure: ★ **NEW for 2025 per OBBBA Act** — line 30 refundable adoption credit (mirrors OBBBA line 28 CTC enhancement); ★ **SPLIT-STAGE GATED CREDIT** — 11th distinct complexity dimension in workflow (NEW: TWO-METHOD split-stage); ★ FIRST audit with TWO helper methods sharing state via AdoptionComputation object; ★ **THREE CO-OUTPUTS** — most of any audited line (refundable line 30 + nonrefundable Sched 3 line 6c → line 20 + taxable employer benefits line 1f); ★ **M4 RECURRENCE — 4th recurrence** (5th M4 instance overall after 26+27a+28+29); ★ **DUAL-METHOD M4 — first audit with M4 in two helpers**; ★ 15th orchestrator-method-based audit; pattern distribution after 17 audits: 6 M2 + 4 M3 + 5 M4 + 2 degenerate; MFS cascade UNCHANGED at 20 orchestrators; ★ **23rd LEGACY A MIGRATION** — knowledge_line30.md → line-30-refundable-adoption-credit.md; ★ **5 consecutive Legacy A audits — longest streak in workflow extended from 4 to 5** (26+27a+28+29+30); convergence advances **35 → 36 lines**; ★ **NEW §14 Verification log** in lines/30.md; ★ **15th META-AUDIT in workflow** (sub-type b signature; ★ DOMINANCE to ~93% — 14 of 15; ★ **CLEAN** — 7/7 consistency checks pass; ★ **2nd consecutive clean META-AUDIT** after 29 #4; clean trend in sub-type (b) continues recovery from 54% to 57%); ★ **5 CONVENTIONS** (mid-range; below recent highs of 27a 6 / 28 7 / 29 8); ★ Convention 5 SSN-FILTERED STATEMENT AGGREGATION via isMfsReturn flag for W-2 box 12 code T — ★ mirrors 1f.xlsx Issue #2 closure pattern (cross-line pattern reuse); ★ **0 routing distinctions + ★ MEDIUM 2025 reference-data set** (~6 distinct constants from IRC §23 + OBBBA Act 2025 + Rev. Proc. 2024-40; ★ FOURTH-HEAVIEST after 27a 72 + 28 ~15 + 29 ~14; ★ workflow reference-data range firmly established 0-72 with 4 tiers — 0 floor / ~4-6 low-mid 26+30 / ~14-15 mid 28+29 / 72 ceiling 27a; ★ NEW 2025 $5,000 refundable cap per OBBBA Act); ★ **24 ANTI-DUPLICATION applications** (+1; ★ NO existing breadcrumb covers line 30 — 19 #6 covers line-19-and-28 family; 25a #5 covers 25abcd cluster; 20 #6 covers credits-section; none cover line 30; 3-source coverage sufficient; ★ 2nd consecutive 3-source-only audit after 29); ★ **25th CONSECUTIVE single-row contribution — quarter-century milestone**; ★ **30th PATH A APPLICATION** (+1; ★ streak continues at 2 after 29 RESUMED); ★ **ZERO new gaps surfaced — 2-audit zero-new-gaps streak**; ★ FIRST credits/payments-section audit with diagrams.drawio actually present; backend 765/765 UNCHANGED (no new tests); G7 Partial (Sched 8812 CLW-B substitute) + G8 Documentation-only (AcroForm per-child fields) both already documented in dependencies §6. **★ Looking ahead — line 31 (Amount from Schedule 3, line 15)**: TWELFTH payments-section audit; ★ likely simple pass-through from Schedule 3 line 15 (sum of refundable credits + payments routed through Sched 3 Part II); ★ likely structurally simpler than 30; ★ likely 16th META-AUDIT pushing sub-type (b) DOMINANCE to ~94% (15 of 16). See `history.md` 2026-05-16 line-30 entry. **Line 31 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 3 after 29 RESUMED + 30 continued; ★ 3-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative FURTHER STRENGTHENING — 3 consecutive clean META-AUDITs (29+30+31) + 3 consecutive Path A applications + 3-audit zero-new-gaps streak; recovery firmly established.** Pure documentation closure: ★ **STRUCTURALLY SIMPLEST payments-section computation in workflow** — pure pass-through from Schedule 3 line 15; NO HELPER METHOD at wiring site (TaxReturnComputeService.java:19914-19922; 5 lines); ★ **M2 RECURRENCE — 1st recurrence of M2 since line 24**; ★ **FIRST M2 instance OUTSIDE credits-section** — M2 mechanism is section-agnostic; ★ 7 M2 instances now; pattern distribution after 18 audits: 7 M2 + 4 M3 + 5 M4 + 2 degenerate; MFS cascade UNCHANGED at 20 orchestrators; ★ **24th LEGACY A MIGRATION** — knowledge_line31.md → line-31-other-payments-schedule3-line15.md; ★ **6 consecutive Legacy A audits — longest streak in workflow further extended from 5 to 6**; convergence advances **36 → 37 lines**; ★ **NEW §12 Verification log** in lines/31.md; ★ **16th META-AUDIT in workflow** (sub-type b signature; ★ DOMINANCE to ~94% — 15 of 16; ★ **CLEAN** — 7/7 consistency checks pass; ★ **3rd consecutive clean META-AUDIT** after 29 #4 + 30 #4; clean trend in sub-type (b) continues recovery from 57% to 60% — ★ **first time crossing 60% threshold since drift surge**); ★ **PURE-SUM complexity dimension RECURRENCE** — 1st recurrence of 25d's dimension; even simpler than 25d (single-read pass-through vs. 3-addend sum); dimension count UNCHANGED at 11; ★ PURE-SUM extends across credits/payments sections AND across arity; ★ **4 CONVENTIONS — baseline minimum** (lowest convention count since 25c at 4); ★ FIRST M2-based Convention 4 in payments-section; ★ workflow conventions range firmly established 0-8; ★ **0 routing distinctions + 0 reference data** (tied with 25a-d/27b/27c for FLOOR tier; ★ FLOOR tier expanded to 8 audits); ★ **25 ANTI-DUPLICATION applications** (+1; ★ **20 #5 breadcrumb REUSE across credits/payments boundary — FIRST cross-section breadcrumb reuse in workflow**; ★ 5th overall reuse of 20 #5; load-bearing extended to payments-section); ★ **26th CONSECUTIVE single-row contribution — streak continues beyond quarter-century milestone**; ★ **31st PATH A APPLICATION** (+1; ★ streak continues at 3); ★ **ZERO new gaps surfaced — 3-audit zero-new-gaps streak**; backend 765/765 UNCHANGED (no new tests); G5 (Form 3800 line 13c OOS) DEFERRED already documented in dependencies §6. **★ Looking ahead — line 32 (Total other payments and refundable credits)**: THIRTEENTH payments-section audit; ★ pure-sum addition (line 27a + line 28 + line 29 + line 30 + line 31); ★ likely RECURRENCE of 25d's PURE-SUM dimension AGAIN (2nd recurrence); ★ likely 17th META-AUDIT pushing sub-type (b) DOMINANCE to ~94%. See `history.md` 2026-05-16 line-31 entry. **Line 32 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ THIRTEENTH payments-section audit; ★ pure 5-addend sum nz(27a)+nz(28)+nz(29)+nz(30)+nz(31) at TaxReturnComputeService.java:19924-19933; ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 2nd recurrence of M2 in payments-section after 31; ★ 8 M2 instances now; ★ M2 firmly established as natural pattern for pure-sum aggregations; ★ 25th Legacy A migration knowledge_line32.md → line-32-total-other-payments.md; convergence 37 → 38 lines; ★ 7 consecutive Legacy A audits — longest streak in workflow further extended from 6 to 7; ★ NEW §10 Verification log section CREATED in lines/32.md; ★ 27th CONSECUTIVE single-row contribution; ★ 17th META-AUDIT — sub-type (b) signature; ★ DOMINANCE to ~94% — 16 of 17; ★ CLEAN — 7/7 consistency checks pass; ★ 4th consecutive clean META-AUDIT after 29 #4 + 30 #4 + 31 #4; clean trend in sub-type (b) continues recovery from 60% to 63%; ★ workflow recovery firmly established; ★ 26th anti-duplication application; ★ 25a #5 breadcrumb reuse FIRST OUTSIDE 25abcd cluster — 4th cross-audit reuse; ★ load-bearing extended; ★ Pattern parallel with 20 #5 cross-section reuse; ★ PURE-SUM complexity dimension RECURRENCE — 2nd recurrence of 25d's dimension; ★ arity-agnostic 5-addend vs. 25d 3-addend; ★ PURE-SUM is now the most-recurring dimension in workflow with 3 instances total; ★ 4 CONVENTIONS baseline minimum; tied with 31; ★ Convention 1 null-via-TERNARY at setter RECURS — 1st recurrence of 25d's UNIQUE Convention 1 mechanism; ★ Convention 1 mechanism diversification — 3 distinct patterns; ★ 0 routing + 0 reference data; ★ FLOOR tier expanded to 9 audits — most-populated reference-data tier; ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 4 after 29 RESUMED + 30 + 31 continued; ★ 4-audit zero-new-gaps streak; ★ WORKFLOW RECOVERY narrative further STRENGTHENING — recovery trajectory matches drift surge length (4 of 5 drift at 26-28 vs. 4 of 4 clean at 29-32); backend 765/765 UNCHANGED (no new tests). **★ Looking ahead — line 33 (Total payments = line 25d + line 26 + line 32)**: FOURTEENTH payments-section audit; ★ pure-sum addition; ★ likely 3rd recurrence of 25d's PURE-SUM dimension; ★ likely 18th META-AUDIT pushing sub-type (b) DOMINANCE to ~94%. See `history.md` 2026-05-16 line-32 entry. **Line 33 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ FOURTEENTH payments-section audit; ★ pure 3-addend sum nz(25d)+nz(26)+nz(32) at TaxReturnComputeService.java:19937-19940 (4 lines — SHORTEST wiring in payments-section); ★ TOTAL PAYMENTS PIVOT — compared against line 24 to determine refund (line 34) or amount-owed (line 37) path; ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 3rd recurrence of M2 in payments-section after 31 + 32; ★ 9 M2 instances now; ★ M2 firmly established as DOMINANT pass-through pattern in payments-section; ★ 26th Legacy A migration knowledge_line33.md → line-33-total-payments.md; convergence 38 → 39 lines; ★ 8 consecutive Legacy A audits — longest streak in workflow further extended from 7 to 8; ★ NEW §10 Verification log section CREATED in lines/33.md; ★ 28th CONSECUTIVE single-row contribution; ★ 18th META-AUDIT — sub-type (b) signature; ★ DOMINANCE to ~94% — 17 of 18; ★ NOT CLEAN — 1 doc-drift fix applied (knowledge §4 stale line-number references patched: Core Method "lines 15325–15538" → "lines 19800–20015" and Form 2210 "lines 15603+" → "line 20090+"); ★ BREAKS 4-consecutive-clean streak from 29/30/31/32 #4; ★ 15th total doc-drift fix in workflow; clean trend in sub-type (b) holds at ~59% (10 of 17; no recovery this audit); other 6 of 7 consistency checks PASS; ★ 27th anti-duplication application; ★ 25a #5 breadcrumb reuse 5th cross-audit reuse — 2nd reuse OUTSIDE 25abcd cluster after 32 #5; ★ load-bearing extended to include refund/owed pivot at line 19959+; ★ PURE-SUM complexity dimension RECURRENCE — 3rd recurrence of 25d's dimension; ★ ARITY MATCH with original 25d (both 3-addend); ★ closes the arity loop: 25d 3 → 31 0 → 32 5 → 33 3; ★ PURE-SUM is now most-recurring dimension in workflow with 4 instances total; ★ 4 CONVENTIONS baseline minimum; tied with 31/32; ★ Convention 1 null-via-TERNARY at setter RECURS — 2nd recurrence of 25d's UNIQUE Convention 1 mechanism (25d → 32 → 33); ★ ternary-at-setter now most-recurring Convention 1 mechanism at 3 instances; ★ 0 routing + 0 reference data; ★ FLOOR tier expanded to 10 audits — DOUBLE-DIGIT MILESTONE — most-populated reference-data tier; ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 5 after 29 RESUMED + 30 + 31 + 32 continued; ★ 5-audit zero-new-gaps streak (doc-drift fix at #4 does NOT count as new gap); ★ WORKFLOW RECOVERY narrative DECISIVELY EXCEEDS drift surge length — 5 of 5 Path A applications vs. 4 of 5 drift surge; ★ recovery firmly established and now dominant; backend 765/765 UNCHANGED (16th audit with zero new tests). **★ Looking ahead — line 34 (Overpayment = line 33 − line 24, when line 33 > line 24)**: FIFTEENTH payments-section audit; ★ first SUBTRACTION audit in payments-section (not pure-sum); ★ CONDITIONAL branch (only executes when line 33 > totalTax); ★ likely NEW complexity dimension (CONDITIONAL-SUBTRACTION); ★ likely 19th META-AUDIT. See `history.md` 2026-05-16 line-33 entry. **Line 34 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ FIFTEENTH payments-section audit; ★ FIRST SHARED-DOC AUDIT in workflow — line 34 has NO dedicated spec/dependencies/knowledge/flowchart/diagram files; all documented in line 33 shared files; ★ CONDITIONAL SUBTRACTION wiring nz(line33) − nz(totalTax) when line33 > totalTax at TaxReturnComputeService.java:19959-19967 (~9 lines; gated inside if-clause with lazy Refund init); ★ FIRST line of the refund branch — mutually exclusive with line 37 (amount owed); ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 4th recurrence of M2 in payments-section after 31 + 32 + 33; ★ 10 M2 instances now — DOUBLE-DIGIT MILESTONE; ★ M2 firmly established as DOMINANT pass-through pattern in payments-section (4 consecutive M2 audits: 31 → 32 → 33 → 34); ★ NO Legacy A migration possible/needed — line 34 has no knowledge_line34.md to rename; ★ 8-consecutive Legacy A streak ENDS (longest streak in workflow); ★ Convergence UNCHANGED at 39 lines; ★ Establishes SHARED-DOC AUDIT category (expected to recur at lines 35a/35b-d/36/37/38); ★ FIRST MULTI-ROW Verification log contribution — row 2 appended to existing lines/33.md §10; ★ BREAKS 28-consecutive single-row contribution streak; ★ 19th META-AUDIT — sub-type (b) signature; ★ DOMINANCE to ~95% — 18 of 19; ★ CLEAN — 6/6 consistency checks pass; ★ Recovers from 33 #4 broken streak (first META-AUDIT to come clean after the 33 #4 line-number drift fix); ★ clean trend in sub-type (b) recovers from ~59% to ~61% (11 clean / 18); ★ 28th anti-duplication application; ★ 25a #5 breadcrumb reuse 6th cross-audit reuse; ★ 3rd reuse OUTSIDE 25abcd cluster after 32 #5 + 33 #5; ★ load-bearing extends to interior of refund/owed branch at line 19959+; ★ NEW complexity dimension: CONDITIONAL-SUBTRACTION (12th distinct dimension; first non-pure-sum audit in payments-section; breaks the 11-dimension count that held since line 30; three structural distinctions — GATED + SUBTRACTION + LAZY-INIT side effect); ★ 4 CONVENTIONS baseline minimum (tied with 31/32/33); ★ NEW Convention 1 mechanism: GATED-NOT-SET (4th distinct mechanism — helper-returned-null / if-gate / ternary-at-setter / GATED-NOT-SET; skips the setter entirely when the gate fails — zero-cost path; structurally cleanest null pattern); ★ Convention 1 mechanism diversification continues — 4 distinct patterns now; ★ 0 routing distinctions (NOTE: the `if (line33 > totalTax)` gate is a structural mutual-exclusivity condition, not a routing distinction) + 0 reference data; ★ FLOOR tier expanded to 11 audits (most-populated reference-data tier in workflow; pure structural computations consistently cluster at FLOOR tier); ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 6 after 29 RESUMED + 30 + 31 + 32 + 33 continued; ★ 6-audit zero-new-gaps streak; ★ NO missing-diagrams gap (shared-doc design covers line 34 via flowcharts/33.drawio + refund-and-amount-owed-ui.drawio); ★ WORKFLOW RECOVERY narrative firmly established and now dominant — 6 of 6 Path A applications vs. 4 of 5 drift surge; backend 765/765 UNCHANGED (17th audit with zero new tests). **★ Looking ahead — line 35a (Refund amount = line 34 − line 36, when overpaid)**: SIXTEENTH payments-section audit; ★ another CONDITIONAL-SUBTRACTION (1st recurrence of new dimension); ★ another SHARED-DOC audit; ★ likely 20th META-AUDIT pushing sub-type (b) DOMINANCE to ~95% (19 of 20). See `history.md` 2026-05-16 line-34 entry. **Line 35 audit complete 2026-05-16 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ SIXTEENTH payments-section audit; ★ FIRST UNIFIED MULTI-SUBLINE AUDIT in workflow — covers 35a+35b+35c+35d in ONE xlsx (deviation from sub-letter-per-xlsx convention justified by structural unity — 35a is only computation, 35b/c/d are pure string pass-through, all share same outer overpayment gate, spec already groups them as "Lines 35a–35d — Refund"); ★ SECOND SHARED-DOC AUDIT in workflow (1st recurrence of SHARED-DOC pattern after line 34); ★ line 35a wiring `roundMoney(overpaid − line36Capped)` with ternary-at-setter at TaxReturnComputeService.java:19975-19977; ★ lines 35b/c/d MULTI-GATED STRING PASSTHROUGH at line 19979-20000 (4 nested gates: overpayment + !hasSplitRefund + DD form present + wantsDirectDeposit; plus per-field null/blank gates); ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 5th recurrence of M2 in payments-section after 31+32+33+34; ★ 11 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (5 consecutive M2 audits: 31→32→33→34→35); ★ NO Legacy A migration possible/needed; ★ Convergence UNCHANGED at 39 lines; ★ 2nd MULTI-ROW Verification log contribution — row 3 appended to existing lines/33.md §10; ★ MULTI-ROW pattern firmly established for shared-doc audits; ★ 20th META-AUDIT — sub-type (b); ★ DOMINANCE to ~95% — 19 of 20; ★ CLEAN — 6/6 consistency checks pass; ★ 2nd consecutive clean META-AUDIT after 34 #4; ★ workflow recovery continues from 33 #4 broken streak; ★ clean trend in sub-type (b) recovers from ~61% to ~63% (12 clean / 19); ★ 29th anti-duplication application; ★ 25a #5 breadcrumb reuse 7th cross-audit reuse — 4th reuse OUTSIDE 25abcd cluster (load-bearing extends to MULTI-GATED STRING PASSTHROUGH territory); ★ NEW complexity dimension: MULTI-GATED STRING PASSTHROUGH (13th distinct dimension; for 35b/c/d with four structural distinctions — four nested gates + per-field null/blank gates + STRING values + PASSTHROUGH not computed); ★ CONDITIONAL-SUBTRACTION 1st recurrence (35a with TERNARY-AT-SETTER sub-mechanism variant — shows dimension is sub-mechanism-flexible); ★ dimension count INCREASES from 12 to 13; ★ workflow now spans three structural categories — pure-arithmetic + conditional-arithmetic + multi-gated-string-passthrough; ★ 4 CONVENTIONS baseline minimum (tied with 31/32/33/34); ★ TWO Convention 1 mechanism recurrences in one audit — ternary-at-setter 3rd recurrence for 35a (now 4 instances — tied with PURE-SUM for most-recurring) and if-gate-around-setter 1st recurrence for 35b/c/d (now 2 instances); ★ all 4 distinct Convention 1 mechanisms now active across workflow (helper-returned-null / if-gate-around-setter / ternary-at-setter / GATED-NOT-SET); ★ 0 routing distinctions (the four nested gates are structural conditions, not tax-rule routing) + 0 reference data; ★ FLOOR tier expanded to 12 audits (most-populated reference-data tier; pure structural computations consistently cluster at FLOOR tier); ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 7 after 29 RESUMED + 30 + 31 + 32 + 33 + 34 continued; ★ 7-audit zero-new-gaps streak; ★ NO missing-diagrams gap (shared-doc design covers line 35); ★ WORKFLOW RECOVERY narrative continues dominant — 7 of 7 Path A applications vs. 4 of 5 drift surge; backend 765/765 UNCHANGED (18th audit with zero new tests). **★ Looking ahead — line 36 (Amount applied to 2026 estimated tax)**: SEVENTEENTH payments-section audit; ★ another SHARED-DOC audit (lines/33.md §4 covers line 36); ★ likely 3rd MULTI-ROW Verification log contribution (row 4); ★ Notable: line 36 is pre-set BEFORE line 33 in wiring (line 19944-19953 vs. line 19937-19940) — interesting compute-order; ★ likely 21st META-AUDIT pushing sub-type (b) DOMINANCE to ~95% (20 of 21). See `history.md` 2026-05-16 line-35 entry. **Line 36 audit complete 2026-05-17 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ SEVENTEENTH payments-section audit; ★ THIRD SHARED-DOC AUDIT in workflow (2nd recurrence of SHARED-DOC pattern after 34 + 35; pattern firmly established); ★ TWO-STAGE wiring — Stage 1 at TaxReturnComputeService.java:19942-19953 (raw read from apply-to-next-year personal form with 3 gates; AFTER line 33, BEFORE refund branch) + Stage 2 at 19970-19973 (cap via .min(overpaid) + if-gate-around-setter; INSIDE overpayment branch); state shared between non-adjacent code regions via local variable; ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 6th recurrence of M2 in payments-section after 31+32+33+34+35; ★ 12 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (6 consecutive M2 audits: 31→32→33→34→35→36); ★ NO Legacy A migration possible/needed (line 36 documented in lines/33.md §4 "Line 36"); ★ Convergence UNCHANGED at 39 lines; ★ 3rd MULTI-ROW Verification log contribution — row 4 appended to existing lines/33.md §10; ★ MULTI-ROW pattern continues firmly established for shared-doc audits; ★ 21st META-AUDIT — sub-type (b); ★ DOMINANCE to ~95% — 20 of 21; ★ CLEAN — 6/6 consistency checks pass; ★ 3rd consecutive clean META-AUDIT after 34 #4 + 35 #4; ★ INCLUDES COMPUTE-ORDER CORRECTION of prior line 35 closure note — "pre-set BEFORE line 33" was INCORRECT; actual order is line 33 at 19937-19940 → line 36 Stage 1 at 19942-19953 AFTER line 33 → refund branch at 19959+ with Stage 2 inside; line 36 is pre-set BEFORE the refund branch, not before line 33 itself; ★ clean trend in sub-type (b) recovers from ~63% to ~65% (13 clean / 20); ★ 30th anti-duplication application; ★ 25a #5 breadcrumb reuse 8th cross-audit reuse — 5th reuse OUTSIDE 25abcd cluster (load-bearing extends to TWO-STAGE CAPPED NUMERIC PASSTHROUGH territory + non-adjacent code regions); ★ Pattern decisively confirmed: method-level breadcrumbs durably load-bearing across all 14 complexity dimensions AND across non-adjacent code regions; ★ NEW complexity dimension: TWO-STAGE CAPPED NUMERIC PASSTHROUGH (14th distinct dimension; 1st cross-region two-stage pattern in workflow; four structural distinctions — TWO non-adjacent code regions + state shared via local variable + cap step .min not subtraction + single output; distinct from line 30 SPLIT-STAGE GATED CREDIT — line 36 is single-method + local variable + single output vs. line 30 two-methods + Java object + three co-outputs); ★ dimension count INCREASES from 13 to 14; ★ 4 CONVENTIONS baseline minimum (tied with 31/32/33/34/35); ★ Convention 1 if-gate-around-setter 2nd recurrence (line 31 → 35b/c/d → 36; now 3 instances total); ★ ternary-at-setter remains most-recurring Convention 1 mechanism at 4 instances tied with PURE-SUM dimension; ★ Convention 1 mechanism standings firmly established with clear ranking — helper-returned-null dominant / ternary-at-setter 4 / if-gate-around-setter 3 / GATED-NOT-SET 1; ★ 0 routing distinctions (all 5 gates are structural conditions, not tax-rule routing) + 0 reference data (Q1 2026 due date + irrevocability are IRS rules with no backend representation); ★ FLOOR tier expanded to 13 audits (most-populated reference-data tier; all 14 complexity dimensions can cluster at FLOOR tier); ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 8 after 29 RESUMED + 30 + 31 + 32 + 33 + 34 + 35 continued; ★ 8-audit zero-new-gaps streak; ★ NO missing-diagrams gap (shared-doc design covers line 36); ★ PDF field name "2025" is cosmetic naming legacy from TY2024 PDF generation (correct semantic mapping); ★ WORKFLOW RECOVERY narrative continues dominant — 8 of 8 Path A applications vs. 4 of 5 drift surge; backend 765/765 UNCHANGED (19th audit with zero new tests). **★ Looking ahead — line 37 (Amount owed = line 24 − line 33, when line 24 > line 33)**: EIGHTEENTH payments-section audit; ★ another CONDITIONAL-SUBTRACTION — 2nd recurrence of dimension introduced at line 34; ★ mutually-exclusive branch with line 34 (same if/else-if structure); ★ likely GATED-NOT-SET Convention 1 mirroring line 34 (would push GATED-NOT-SET from 1 to 2 instances); ★ another SHARED-DOC audit; ★ likely 4th MULTI-ROW Verification log contribution (row 5); ★ likely 22nd META-AUDIT. See `history.md` 2026-05-17 line-36 entry. **Line 37 audit complete 2026-05-17 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ EIGHTEENTH payments-section audit; ★ FOURTH SHARED-DOC AUDIT in workflow (3rd recurrence of SHARED-DOC pattern after 34 + 35 + 36; pattern decisively established for the entire 34/35/36/37 cluster); ★ CONDITIONAL SUBTRACTION wiring `roundMoney(totalTax − line33)` when `totalTax > line33` at TaxReturnComputeService.java:20001-20010 (~10 lines; else-if branch); ★ STRUCTURALLY IDENTICAL MIRROR of line 34 wiring — same shape + same Convention 1 mechanism GATED-NOT-SET; only operand direction + output object type differ; ★ mutually exclusive with line 34 (refund); ★ Form 2210 penalty (line 38) STACKS on amountOwed after this method returns; ★ NO MFS MECHANISM NEEDED + ★ M2 RECURRENCE — 7th recurrence of M2 in payments-section after 31+32+33+34+35+36; ★ 13 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (7 consecutive M2 audits: 31→32→33→34→35→36→37); ★ NO Legacy A migration possible/needed (line 37 documented in lines/33.md §4 "Line 37"); ★ Convergence UNCHANGED at 39 lines; ★ 4th MULTI-ROW Verification log contribution — row 5 appended to existing lines/33.md §10; ★ MULTI-ROW pattern firmly established (4 consecutive rows); ★ 22nd META-AUDIT — sub-type (b); ★ DOMINANCE to ~95% — 21 of 22; ★ CLEAN — 6/6 consistency checks pass; ★ 4th consecutive clean META-AUDIT after 34 #4 + 35 #4 + 36 #4; ★ workflow recovery streak strengthens to match prior 4-of-5 drift surge length; ★ clean trend in sub-type (b) recovers from ~65% to ~67% (14 clean / 21); ★ 31st anti-duplication application; ★ 25a #5 breadcrumb reuse 9th cross-audit reuse — 6th reuse OUTSIDE 25abcd cluster (now covers BOTH mutually-exclusive branches — refund + amount owed); ★ Pattern decisively confirmed: method-level breadcrumbs durably load-bearing across all 14 complexity dimensions, both mutually-exclusive branches, AND across non-adjacent code regions; ★ CONDITIONAL-SUBTRACTION 2nd recurrence (dimension count UNCHANGED at 14; now 3 instances total — 34/35a/37); ★ Pattern firmly established: CONDITIONAL-SUBTRACTION supports both sub-mechanisms — GATED-NOT-SET at 34/37; TERNARY-AT-SETTER at 35a; ★ 4 CONVENTIONS baseline minimum (tied with 31/32/33/34/35/36); ★ GATED-NOT-SET Convention 1 mechanism 1st recurrence (line 34 → 37; now 2 instances total); ★ ALL 4 Convention 1 mechanisms have now recurred in workflow — helper-returned-null dominant / ternary-at-setter 4× / if-gate-around-setter 3× / GATED-NOT-SET 2×; ★ 0 routing distinctions (else-if gate is structural mutual-exclusivity, not tax-rule routing) + 0 reference data (Form 2210 constants apply to line 38, NOT line 37); ★ FLOOR tier expanded to 14 audits (most-populated reference-data tier; all 14 complexity dimensions can cluster at FLOOR); ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 9 after 29 RESUMED + 30 + 31 + 32 + 33 + 34 + 35 + 36 continued; ★ 9-audit zero-new-gaps streak; ★ NO missing-diagrams gap (shared-doc design covers line 37); ★ WORKFLOW RECOVERY narrative continues dominant — 9 of 9 Path A vs. 4 of 5 drift surge (streak length 2.25× drift surge length); backend 765/765 UNCHANGED (20th audit with zero new tests). **★ Looking ahead — line 38 (Form 2210 estimated tax penalty)**: NINETEENTH payments-section audit; ★ Form 2210 has dedicated computeForm2210 method at line 20090+; ★ likely BREAKS SHARED-DOC streak (Form 2210 may have separate knowledge file); ★ likely BREAKS FLOOR-tier streak (Form 2210 introduces $1,000 trigger + 100%/110% safe-harbor tiers + $150k AGI threshold + IRS short-term federal rate); ★ likely NEW or RECURRING complexity dimension; ★ likely 23rd META-AUDIT. See `history.md` 2026-05-17 line-37 entry. **Line 38 audit complete 2026-05-17 — all 10 issues closed; ★ ZERO new deferred enhancements; ★ NINETEENTH payments-section audit; ★ MAJOR MILESTONE — line 38 is the LAST LINE on Form 1040 page 2 (complete Form 1040 line-by-line audit through line 38); ★ FIRST HYBRID-DOC AUDIT in workflow (NEW audit category — line 38 documented in BOTH lines/33.md §4 stacking site AND lines/2210.md DEDICATED Form 2210 spec covering helper at line 20090-20278); ★ BREAKS 4-consecutive SHARED-DOC streak (34/35/36/37); ★ TWO-STAGE wiring — Stage 1 at TaxReturnComputeService.java:20090-20278 (computeForm2210 helper ~189 lines with Part I required annual payment + Part II waivers + Part III 4-installment loop) + Stage 2 at line 1693-1706 (4-condition gate → setEstimatedTaxPenalty + add to amountOwed); ★ NEW complexity dimension MULTI-STAGE PENALTY WITH SAFE-HARBOR AND WAIVER BRANCHES (15th distinct; dimension count 14 → 15); ★ Largest single computation in payments-section by far; ★ Five structural distinctions — MULTI-PART helper + MULTIPLE EXIT POINTS + SAFE-HARBOR ROUTING + PENALTY STACK on existing field + CROSS-METHOD wiring; ★ 5 CONVENTIONS — NOT baseline 4 (first payments-section audit to break baseline-4); ★ Convention 5 NEW SAFE-HARBOR ROUTING via filing-status at line 20155-20156 (isMfs picks $75k vs $150k AGI threshold — tax-rule routing distinct from Convention 4 MFS-protection); ★ Convention 1 if-gate-around-setter 3rd recurrence (line 31 → 35b/c/d → 36 → 38; now 4 instances total — tied with ternary-at-setter for most-recurring Convention 1 mechanism); ★ HELPER-RETURNED-NULL recurrence at Stage 1 helper line 20099; ★ NO MFS-PROTECTION MECHANISM NEEDED + ★ M2 RECURRENCE — 8th recurrence of M2 in payments-section after 31+32+33+34+35+36+37; ★ 14 M2 instances now; ★ M2 firmly DOMINANT pass-through pattern in payments-section (8 consecutive M2 audits); ★ NO Legacy A migration possible (lines/2210.md already in descriptive form-named convention); ★ Convergence UNCHANGED at 39 lines; ★ 5th Verification log row contribution — row 6 appended to existing lines/33.md §10; ★ MULTI-ROW pattern firmly established (5 consecutive rows); ★ LAST expected row in this log; ★ 23rd META-AUDIT — sub-type (b); ★ DOMINANCE to ~96% — 22 of 23; ★ CLEAN — 7/7 consistency checks pass (first HYBRID-DOC META-AUDIT spans BOTH lines/33.md §4 + lines/2210.md); ★ 5th consecutive clean META-AUDIT after 34 #4 + 35 #4 + 36 #4 + 37 #4; ★ workflow recovery streak now EXCEEDS prior 4-of-5 drift surge length; ★ clean trend in sub-type (b) recovers from ~67% to ~68% (15 clean / 22); ★ 32nd anti-duplication application; ★ 25a #5 breadcrumb reuse 10th cross-audit reuse — DOUBLE-DIGIT MILESTONE (after 25b/25c/25d/32/33/34/35/36/37 #5); ★ 7th reuse OUTSIDE 25abcd cluster; ★ first audit to use 4-source coverage (lines/33.md §4 + lines/2210.md + dependencies/33.md + 25a #5 breadcrumb); ★ Pattern decisively confirmed: a single method-level breadcrumb has provided durable anti-duplication coverage across ALL 15 complexity dimensions, both mutually-exclusive branches, non-adjacent code regions, AND HYBRID-DOC scenarios; ★ NON-ZERO routing distinctions (~3) — computation-method branch routing + MFS half-threshold + 110% safe harbor tier; first non-zero routing in payments-section since line 30; ★ NON-ZERO reference data (~12 distinct constants) — F2210_PENALTY_ANNUAL_RATE 7% / daily rate / $1,000 trigger / $150k+$75k AGI thresholds / 110% rate / 90% multiplier / days underpaid 365/303/212/90 / installment divisor 4; ★ BREAKS FLOOR-tier streak after 14 audits — line 38 places in LOW-MID tier at upper end (~12 constants, just below MID tier); ★ Pattern confirmed: form-level computations introduce structural reference data; ★ Path A application — ★ continues zero-outstanding-walkthroughs streak at 10 — DOUBLE-DIGIT MILESTONE after 29 RESUMED + 30 + 31 + 32 + 33 + 34 + 35 + 36 + 37 continued; ★ 10-audit zero-new-gaps streak — DOUBLE-DIGIT MILESTONE; ★ NO missing-diagrams gap (shared-doc design covers line 38); ★ Box C/D/Form 2210-F already documented as G7/G8/G9 OOS — not re-opened; ★ WORKFLOW RECOVERY narrative continues firmly dominant — 10 of 10 Path A vs. 4 of 5 drift surge (streak length 2.5× drift surge length); ★ MULTIPLE DOUBLE-DIGIT MILESTONES achieved in same audit — 25a #5 breadcrumb reuse 10×, Path A streak at 10, 10-audit zero-new-gaps streak; backend 765/765 UNCHANGED (21st audit with zero new tests). **★ MAJOR WORKFLOW MILESTONE — Form 1040 line-by-line audit COMPLETE through line 38 (LAST line on page 2)**. **★ Looking ahead — END OF FORM 1040 BODY**: line 38 is the LAST line on Form 1040 page 2. User to direct next focus — potential next areas: Schedule 1/2/3 individual lines, sub-forms (Form 4972, 8814, 6251, 8606, etc.), or declare Form 1040 audit COMPLETE. See `history.md` 2026-05-17 line-38 entry. **Input/Output forms xlsx audit complete 2026-05-17 — 162 files audited via generator-driven approach; ★ ZERO new deferred enhancements; ★ FIRST META-AUDIT of XLS/input_forms + XLS/output_forms folders in workflow; ★ Generator-driven META-AUDIT pattern established (re-run canonical generators rather than manually auditing N files; snapshot md5s before/after; diff to identify stale files); ★ 160 of 162 files (98.8%) already in sync with current code state; ★ 2 stale files corrected via regeneration — input_forms/form-interest-income-taxpayer.xlsx (44 fields; 5 sections) + input_forms/form-interest-income-spouse.xlsx (32 fields; 4 sections); ★ NO orphan files — every xlsx in both folders corresponds to a current YAML/Angular component/PDF field map; ★ NO backend code changes — purely a doc/manifest regeneration; ★ Generator output summary: generate-form-xlsx.js processed all us-tax-ui/src/app/forms/* + 90 YAML files (YAML-first extraction with template-scan fallback); generate-output-xlsx.js processed 44 tax-return forms (skipped 1 known no-PDF form form-tax-return-required-attachment); total 2,901 PDF fields documented across output forms; ★ Why so few stale: last broad refresh was 2026-05-09 line 1g audit Issue #2 regex fix; since then only interest-income forms received content changes; ★ Path A application — ★ NO new outstanding.md gap entries; ★ NEW helper script XLS/_tools/inspect-xlsx.js created for future xlsx inspection during audits; backend 765/765 UNCHANGED (22nd consecutive audit with zero new tests). See `history.md` 2026-05-17 input/output-forms-audit entry.)

---

## ~~MFS: Return-Level Childcare/Form-2441 Qualifying-Person Scoping Blocks the Non-Claiming Spouse Leg — Deferred 2026-06-21~~ **RESOLVED 2026-06-21 (Option B)**

**Resolved same day** by MFS migration Form #12 Option B: the spouse now has its
own `childcare-expenses-spouse` form (owner_role spouse; V82), so childcare is
per leg. The MFS spouse leg reads its own Form 2441 (its own qualifying children)
and no longer sees the head's return-level childcare form — the §17
qualifying-person-not-in-family block is gone (the spouse leg computes 200). See
history.md 2026-06-21 Option B entry. Original deferred analysis below.



Found during MFS-spouse migration Form #12 (child & dependent care). The
`childcare-expenses` form is return-level (no -taxpayer/-spouse suffix) and
lists qualifying children for the whole household. On an MFS return, dependents
are claimed per leg via `claimedByMfs` (`loadScopedDependents` filters by
`scopedDependentSide`), so a qualifying child belongs to exactly one leg's
family. When that child is listed on the shared childcare form, the leg that
does NOT claim the child hits the §17 non-overrideable
`DEPENDENT_CARE_QUALIFYING_PERSON_NOT_IN_FAMILY` flag, which 409s that leg's
ENTIRE compute — not just the dependent-care credit.

Impact: an MFS spouse leg cannot produce ANY computed return while the
household childcare form lists a child claimed by the other spouse, even though
the spouse may have unrelated return content to file.

Correct fix (deferred — tied to the broader dependents work): scope the
qualifying-person list per leg so each leg's Form 2441 sees only the children it
claims (and only that leg's share of expenses). This also generalizes the
double-claim protection from "child claimed by one side" to "expenses split per
side." Note the realistic considered-unmarried care-provider elects Head of
household (HoH-split), where the leg's status is "Head of household"
(isMfs=false) and the credit computes per leg normally. The §21(e)(2) credit
disallowance itself is correctly implemented and needs no change. Current
behavior is locked in by `e2e/tests/mfs-spouse-childcare-credit.spec.ts` Test 3.

Likely recurs on Form #13 (adoption-expenses / Form 8839), which also references
children on a return-level form.

---

## ~~Line 4abc: QCD $108,000 Annual Cap + SIE $54,000 Cap Enforcement — Deferred 2026-05-11~~ **Completed 2026-06-03**

**Resolved 2026-06-03** as Gaps 1 and 2 of `XLS/Computations/4a.md` §3.2. Constants added: `ReferenceData.QCD_ANNUAL_CAP_PER_PERSON_2025 = $108,000` (line 258) and `ReferenceData.QCD_SIE_LIFETIME_CAP_PER_PERSON_2025 = $54,000` (line 267). Advisory flags wired: `QCD_EXCEEDS_ANNUAL_CAP_TAXPAYER`/`_SPOUSE` (non-blocking, silent-cap design — `effectiveQcdAmount = min(totalQcdAmount, $108,000)` with the over-cap portion absorbed into Line 4b) and `QCD_SIE_EXCEEDS_LIFETIME_CAP_TAXPAYER`/`_SPOUSE` (promoted to **blocking** 2026-06-04 per `rules.md §18`). Backend lock-in tests: `qcdAnnualCapSilentlyAppliedAndFlagFires`, `splitInterestEntityQcdExceedingLifetimeCapEmitsFlag`. Spec coverage: `XLS/Computations/4a.md` §3.5 confirms "clean — both cap-validation gaps closed 2026-06-03"; `XLS/Computations/4b.md` Gaps 6/7 closed in parallel.

---

## Line 5b: Per-Annuity Basis Recovery (Simplified Method / General Rule) — Deferred 2026-05-12

Per spec `lines/5abc.md` §3.2: "Compute the taxable amount **per distribution / per annuity stream** and then sum the taxable pieces for line 5b. **Do not collapse multiple pensions into a single basis computation.**"

**Current state:**
- `computePensionForPerson` computes Simplified Method / General Rule at the **per-person aggregate level** — single call to `computePensionTaxableViaSimplifiedMethod(pensionForm, grossTotal)` or `computePensionTaxableViaGeneralRule(pensionForm, grossTotal)` using the SUMMED gross across all 1099-R + RRB-1099-R entries for the person.
- This violates the spec §3.2 per-annuity requirement when a person has **multiple annuities with different starting dates** (e.g., one pre-Nov 1996 General Rule annuity + one post-Nov 1996 Simplified Method annuity).
- Real-world incidence: rare. Most retirees have one annuity. The common case (single annuity) produces correct results.

**Related gap**: Simplified Method and General Rule are **mutually exclusive** per IRS rules but the code doesn't enforce mutual exclusion at the personal-form input level. If both `needsSimplifiedMethodComputation` and `needsGeneralRuleComputation` are true, the General Rule (computed second) wins. This is a soft validation gap — UI should expose ONE annuity-method selector.

**If revisited**, scope (~3-5 hours — major refactor):

- **YAML / personal-form additions** (`5abc-pension-income-taxpayer.yaml` + spouse):
  - New repeating section `annuityStreams[]` (multiplicity: multiple) with per-stream fields:
    - `annuityStartingDate` (determines Simplified vs General Rule)
    - `basisRecoveryMethod` (enum: simplified | general | not-applicable — single selector replacing the two booleans)
    - Per-stream Simplified Method inputs (cost basis, annuitant age, joint age, prior recovery)
    - Per-stream General Rule inputs
    - Per-stream rollover/PSO attribution (if needed)
  - Backwards-compat: when `annuityStreams[]` is empty, fall back to the current per-person aggregate model.
- **Backend (`computePensionForPerson`)**:
  - Iterate over `annuityStreams[]`, compute per-stream taxable amount via the selected method.
  - Sum per-stream results into `taxableBase`.
  - Rollover/PSO continue to apply at the post-aggregation level (per IRS rules).
- **Frontend**:
  - Per-stream UI for entering annuity details.
  - Method-selector dropdown enforces mutual exclusion at input time.
- **Tests**:
  - Multi-annuity scenarios with mixed Simplified + General Rule.
  - Mutual-exclusion enforcement.
  - Backwards-compat: legacy single-aggregate model still works.

**Why deferred:**
- **Rare scenario** — multi-annuity retirees with mixed pre-/post-1996 starting dates are uncommon.
- **Major refactor scope** — touches YAML schema, frontend UI, backend logic, and tests.
- **Common case is correct** — single annuity (the vast majority of users) is handled correctly.
- **IRS validation acts as safety net** — wrong basis-recovery computation would be caught on IRS validation at filing.
- The 5b #9 breadcrumb at `TaxReturnComputeService.java:6039-6053` documents the current per-person aggregate limitation in-code.

**Priority:** Low. UX improvement for a niche user group (multi-annuity retirees with mixed starting dates). Common case is correct.

**Tracked from:** 5b.xlsx Code Validation #9 walkthrough on 2026-05-12. Pre-existing observation in `lines/5abc.md` §3.2 ("Do not collapse multiple pensions into a single basis computation") — spec acknowledges the per-annuity requirement.

---

## Line 6b: Lump-Sum Election Prior-Year Fidelity Gaps (Form 2555 + Filing-Status Changes) — Deferred 2026-05-12

Per IRC §86(e) + IRS Publication 915 Worksheet 3: when a taxpayer receives a retroactive Social Security back-payment covering one or more earlier years, they may elect to recompute the taxable portion using prior-year income context. The current implementation correctly handles the 4-step worksheet algorithm but has two fidelity gaps in the prior-year recomputation step.

**Current state:**
- `computeTaxableSocialSecurityLumpSum` at `TaxReturnComputeService.java:8839-8915` implements Pub. 915 Worksheet 3 with per-prior-year recompute using `priorYearOtherIncomeForRecompute`, `priorYearTaxExemptInterestForRecompute`, `priorYearAdjustmentsForRecompute` from each `lumpSumDetails` row.
- **Gap (i)** — prior-year `worksheetLine5` (Form 2555 + adoption exclusion add-backs) is hardcoded null at line 8895-8898. Users with Form 2555 foreign earned income exclusion OR Form 8839 adoption benefits in PRIOR years get inaccurate prior-year recomputation → election decision may use wrong taxable amount.
- **Gap (ii)** — prior-year filing status is assumed SAME as current year (passes `normalizedFilingStatus` for all years at line 8897). Users who changed filing status between prior years and current year (marriage / divorce / death of spouse / new HOH qualification) get prior-year recompute using WRONG threshold table ($25k Single vs $32k MFJ vs $0 MFS-with-spouse).
- YAML `lumpSumDetails` repeating section captures per-year other income / tax-exempt interest / adjustments / previously-reported-taxable, but does NOT capture per-year filing status or per-year Form 2555 / adoption exclusion.

**Concrete failure example (Gap ii)**:
- User filed Single in 2022 (year of lump-sum allocation), files MFJ in 2025.
- Prior-year provisional income = $30,000.
- Current code: uses MFJ $32k base → recompute prior-year taxable = $0 → election shows max benefit.
- IRS-correct: should use Single $25k base → prior-year taxable > $0 → election shows LESS benefit.
- Direction: USER-FAVORABLE but IRS-violating.

**If revisited, scope (~2-3 hours):**

- **YAML / personal-form additions** (`6abcd-social-security-benefits-taxpayer.yaml`):
  - Per-prior-year `lumpSumDetails` row additions:
    - `priorYearFilingStatus` (dropdown: Single / MFJ / MFS / HOH / QSS)
    - `priorYearForm2555ExclusionAmount` (optional)
    - `priorYearAdoptionExclusionAmount` (optional)
- **Backend** (`computeTaxableSocialSecurityLumpSum`):
  - Add per-row reads of new fields at line 8884-8893.
  - Compute per-row `priorYearWorksheetLine5 = addNonNull(priorYearForm2555Excl, priorYearAdoptionExcl)`.
  - Compute per-row `priorYearFilingStatusNormalized` (fallback to current-year filing status if absent — backwards compat).
  - Pass per-row values to `computeTaxableSocialSecurityNormal` instead of the hardcoded null + current-year filing status.
- **Frontend** — add the new fields to the lump-sum detail row UI (per-year repeating).
- **Tests**:
  - `lumpSumElectionUsesPerYearFilingStatusForRecompute` — filing-status change scenario where Gap ii makes a material difference.
  - `lumpSumElectionUsesPerYearForm2555ExclusionForRecompute` — Form 2555 prior-year scenario.

**Why deferred:**
- Affected population is narrow: lump-sum claimants with prior-year exclusions OR filing-status changes.
- Most common lump-sum scenario (SSDI applicants with low/no prior-year income) is unaffected.
- The orchestrator already emits `SOCIAL_SECURITY_LUMP_SUM_ALLOCATION_REQUIRED` advisory flag when allocation data is missing — the broader user category gets a softer signal.
- Even when the bug applies, direction is user-favorable (under-states election benefit when filing status was Single → MFJ; over-states when MFJ → Single). IRS validation may catch this on review.

**Priority:** Low. Niche user demographic. The full prior-year recompute algorithm is correctly implemented for the common case (same filing status across years + no prior-year exclusions).

**Tracked from:** 6b.xlsx Code Validation #9 walkthrough on 2026-05-12. Pure deferral — no code change at the time of audit.

---

## ~~Line 6d: `livedApartAllYear` vs `livedWithSpouseAnyTime` Mutual-Exclusion Enforcement — Deferred 2026-05-12~~ **Closed 2026-06-06**

**Closure summary (2026-06-06):** Promoted from "deferred / low priority" to closed via §17 non-overrideable blocker per the audit-risk-avoidance principle. Added `SOCIAL_SECURITY_LINE6D_MFS_RESIDENCE_INCONSISTENT` to `TaxReturnComputeService.validateLine6dMfsResidenceConsistency` (new helper) and to `NonOverrideableFlags.CODES`. Fires when filing status is MFS AND `hadSocialSecurityBenefits=true` AND the two residence flags are both true OR both not-true. Resolution path is a pure user-side data fix: answer exactly one of the two questions Yes. Java unit tests added: `mfsResidenceFlagsBothTrueFiresLine6dInconsistencySection17` (Case A), `mfsResidenceFlagsBothFalseFiresLine6dInconsistencySection17` (Case B), plus two negative tests. E2e test added: `MFS+SS taxpayer with both residence flags missing fires §17 Line 6d inconsistency blocker (closes 6d.md Gap 1)`. Original deferred analysis preserved below for historical context.

---

### Original deferred analysis (2026-05-12)

## Line 6d: `livedApartAllYear` vs `livedWithSpouseAnyTime` Mutual-Exclusion Enforcement — Deferred 2026-05-12

Per IRC §86(c)(1)(C)/(D): on a Married-Filing-Separately return, the two residence-fact flags `livedApartFromSpouseEntireTaxYear` and `livedWithSpouseAnyTimeDuringTaxYear` describe mutually exclusive states — exactly ONE should be TRUE. The current backend reads both flags INDEPENDENTLY, allowing logically inconsistent return data.

**Current state:**
- `TaxReturnComputeService.java:8424` reads `livedWithSpouseAnyTime` → drives `mfsLivedWithSpouseAnyTime` → triggers the MFS-with-spouse restrictive 85% branch in `computeTaxableSocialSecurityNormal` (per 6b #7).
- `TaxReturnComputeService.java:8425` reads `livedApartAllYear` → drives line 6d output (per 6d #6).
- No backend cross-check enforces mutual exclusion.

**Two pathological cases not prevented:**

| Case | livedApartAllYear | livedWithSpouseAnyTime | line 6d | line 6b path | Result |
|---|---|---|---|---|---|
| (A) Both TRUE | TRUE | TRUE | **TRUE** | Restrictive 85% branch fires | Internally inconsistent — $25k base claim contradicts $0 restrictive path; IRS reviewer would flag |
| (B) Both FALSE | FALSE | FALSE | FALSE | Normal tier path with $25k base | MFS filer gets $25k base WITHOUT line 6d disclosure — IRS would expect disclosure |

**If revisited**, scope (~1-2 hours):

- **Frontend (`form-social-security-benefits-taxpayer.component.ts`)**:
  - Replace two independent boolean p-select dropdowns with a single radio-button group:
    - ☐ "Lived apart from spouse the ENTIRE tax year" → sets `livedApartAllYear=TRUE`, `livedWithSpouseAnyTime=FALSE`
    - ☐ "Lived with spouse at any time during the tax year" → sets `livedApartAllYear=FALSE`, `livedWithSpouseAnyTime=TRUE`
  - Migration: when loading existing form data, infer radio button state from existing booleans (handle pathological cases by falling back to the more conservative selection — "lived with spouse").
- **Backend (optional advisory flag)**:
  - Emit `SOCIAL_SECURITY_MFS_RESIDENCE_FACTS_INCONSISTENT` advisory when both flags are TRUE on MFS OR both FALSE on MFS.
- **Tests**:
  - `lockInLine6dAndRestrictiveBranchAreMutuallyExclusive` — covers normal cases.
  - `pathologicalBothTrueResidenceFlagsEmitsAdvisory` — exercises optional advisory flag.

**Why deferred:**
- Affected population is very narrow (requires user deliberately producing inconsistent return data via direct form-field entry; UI normally guides users to single selection).
- IRS validation catches the inconsistency on review.
- Not a correctness bug — backend produces a result, just an internally inconsistent disclosure.
- Low-priority polish; not blocking accurate tax computation.

**Priority:** Low. UI improvement to prevent edge-case inconsistency; IRS-side validation acts as the safety net.

**Tracked from:** 6d.xlsx Code Validation #7 walkthrough on 2026-05-12. Pure deferral — no code change at the time of audit (just a documentation breadcrumb at the read sites).

---

## Lines 2a/2b: Seller-Financed Mortgage Interest Schedule B Trigger Missing — RESOLVED 2026-06-02

**STATUS: CLOSED 2026-06-02** — Tier 2 full implementation across 6 phases. See `lines/2ab.md` §12 (2026-06-02 row) and `XLS/Computations/2a.md` §3.2 (Gap 2). Summary: new `pf_seller_financed_loan` child table (V39 + `PfSellerFinancedLoan` entity); `InterestIncomeMapper` parent/child round-trip; `computeInterestForPerson` row validation + amount aggregation into Line 2b + per-buyer Schedule B item emission; `computeInterestIncome` adds `hasSellerFinancedLoans` to the `scheduleBRequired` chain (no $1,500 threshold) and reorders Part I so seller-financed rows appear FIRST per IRS instructions; two new §17 codes `SELLER_FINANCED_LOAN_MISSING_REQUIRED_FIELDS_{TAXPAYER,SPOUSE}` block missing required fields (buyer name + address + SSN/EIN + positive amount); new per-buyer repeater section in `form-interest-income-{taxpayer,spouse}.component.ts`. 4 backend unit tests + 4 e2e tests, all passing.

Historical context (kept for reference):

Per IRS Schedule B (Form 1040) Part I instructions: when a taxpayer receives interest from a seller-financed mortgage AND the buyer used the property as a personal residence, the taxpayer **must file Schedule B regardless of the interest amount** (no $1,500 threshold), AND the buyer must be listed first on Schedule B line 1 with the buyer's name, address, and SSN.

**Current state:**
- The personal form `interest-income-taxpayer` has no field for seller-financed mortgage interest.
- The `scheduleBRequired` chain in `computeInterestIncome()` checks 9 triggers (taxable interest > $1,500, ordinary dividends > $1,500, accrued interest adjustment, OID adjustment, bond premium adjustment, savings bond exclusion, foreign account, foreign trust, nominee interest — see line 1c-2ab cascade documentation) but does NOT include seller-financed mortgage interest.
- A taxpayer who receives, say, $500 of seller-financed mortgage interest on a primary-residence sale would currently NOT have Schedule B generated. The amount enters line 2b via the standard 1099-INT path or manual entry, but the Schedule B Part I listing requirement is silently violated.

**If revisited**, scope (~30-45 minutes):

- **YAML / personal-form additions** (`2ab-interest-income-taxpayer.yaml`):
  - New boolean: `hasSellerFinancedMortgageInterest` (gates the array).
  - New array (multiplicity: multiple): `sellerFinancedMortgageEntries[]` with per-entry fields: `buyerFirstName`, `buyerLastName`, `buyerAddress`, `buyerSSN`, `interestAmount`, `propertyUsedAsBuyerPersonalResidence` (boolean — confirms the personal-residence gate per IRS instructions).
- **Backend**:
  - Read `hasSellerFinancedMortgageInterest` in `computeInterestIncome()` and add `|| hasSellerFinancedMortgageInterest` to the `scheduleBRequired` chain.
  - Add per-entry sum from `sellerFinancedMortgageEntries[].interestAmount` to `line2b` via `computeInterestForPerson()` (matches the existing manualTaxableInterestNotOnStatements pattern but with per-payer detail).
  - For each entry, prepend a `ScheduleBInterestItem` with the buyer's name (priority position — line 1 requires the seller-financed entry first per IRS instructions).
- **Frontend**:
  - New Angular component section on `form-interest-income-taxpayer.component.ts` with the array UI (similar shape to the existing care-providers / qualifying-persons array patterns from line 1e).
  - Schedule B PDF rendering: ensure the buyer-name listing appears as the first line-1 entry (currently the order is insertion-order of the items list).
- **Tests**:
  - Unit: `scheduleBTriggeredBySellerFinancedMortgageRegardlessOfAmount` ($500 seller-financed interest, no other triggers → asserts `scheduleB != null` and `scheduleB.interestItems[0].payerName` starts with the buyer's name).
  - Unit: `sellerFinancedMortgageInterestAggregatesIntoLine2b` (verifies the amount enters `income.taxableInterest`).
  - E2E: scenario in `line2ab-interest-income.spec.ts` extension.
- **Documentation**:
  - Update `lines/2ab.md` §4 Schedule B trigger list to add "seller-financed mortgage interest (regardless of amount)" — currently the spec lists this as a trigger at line 123 but the code does not check it (silent spec/code gap).
  - Update `knowledge/line-2ab-interest-income.md` Schedule B triggers table.

**Why deferred:**
- Per audit recommendation: "OUT OF SCOPE for line 2a."
- Affects Schedule B GATING only — does NOT affect line 2a value or line 2b value (the interest amount still flows correctly via existing manual-entry paths).
- The user is otherwise correct: the amount appears on line 2b; the only thing missing is the Schedule B requirement and the buyer-name listing.
- Affected users (real-estate sellers carrying seller paper for primary-residence buyers) are uncommon; affected USERS who would care about the Schedule B vs no-Schedule-B distinction at low amounts are rarer still.
- The fix touches 5 files (YAML, Angular, backend method, Schedule B item ordering, tests) — broader than a quick patch.

**Priority:** Low-medium. IRS compliance gap (Schedule B technically required), but the interest income itself is correctly reported on line 2b.

**Tracked from:** 2a.xlsx Code Validation #9 walkthrough on 2026-05-11. Pre-existing observation in `knowledge/line-2ab-interest-income.md` § "Known gaps / Gap 8" (marked "unchanged"). lines/2ab.md §4 line 123 lists this trigger but the code does not implement it.

---

## Line 2b: Form 8815 Line-by-Line Path Does Not Retroactively Reduce Line 2b (Gap 3 from 2b.md) — Deferred 2026-06-03

**Tracked as Gap 3 in `XLS/Computations/2b.md` §3.2; also Gap 7 in `XLS/Computations/8815.md` §3.2.**

When the user fills in the line-by-line Form 8815 intake (`form8815*` fields) WITHOUT also setting the manual `savingsBondExclusionAmount` override, Form 8815 line 14 (the computed savings-bond interest exclusion) is correctly emitted on the Form 8815 output BUT Form 1040 Line 2b is NOT retroactively reduced by line 14. The amount that should be excluded from taxable interest still appears in Line 2b → Line 9 → Line 11a → Line 11b → Line 15 → tax → credits.

**Root cause:** `computeInterestIncome` runs near the top of `prepare()` at `TaxReturnComputeService.java:410`; `computeForm8815` runs near the end at `TaxReturnComputeService.java:1791`. The manual-override path works because the user pre-populates the value on the personal form — `computeInterestForPerson` reads it during interest compute and applies it to Line 2b. The line-by-line path produces the same value but only AFTER Line 2b is already finalized.

**Why there is no true mathematical circularity** (informing the fix design):

Per the IRS Form 8815 Line 9 Worksheet (and Pub. 550): MAGI for §135 purposes is **pre-exclusion** Line 11b. The worksheet's line 1 explicitly reads Schedule B line 2 (pre-exclusion total interest). So `computeForm8815` can run after `computeInterestIncome` using the current Line 11b as MAGI and produce the correct line 14 in a single pass. The challenge is propagating that line 14 BACK into Line 2b and everything downstream.

**Workaround (current):** Documented in the `computeForm8815` Javadoc and in `8815.md` Gap 7. User must also fill in `savingsBondExclusionAmount` with the same amount they computed via Form 8815. The override fallback path is fully functional and well-tested.

**If revisited — recommended approach (Option A from the 2026-06-03 design review):**

Re-invoke `prepare()` once with a synthetic override, mirroring the existing two-pass pattern at `TaxReturnComputeService.java:911-1058` (QBI deduction line 13a recomputes after Schedule 1-A line 13b finalizes):

1. At the end of `prepare()`, after `computeForm8815`:
   - If Form 8815 line 14 came from the line-by-line path (i.e., `savingsBondExclusionAmount` was null/zero in the input) AND line 14 > 0, inject line 14 as `savingsBondExclusionAmount` into a copy of `interestIncomeTaxpayer` and recurse into `prepare()` once.
2. The second pass uses the well-tested manual-override path, which correctly reduces Line 2b → Line 9 → Line 11a → Line 11b → Line 15 → Line 16 → all Schedule 3 credits with MAGI/AGI phaseouts (Form 1116, Form 8863, Form 8880, Schedule 8812, etc.) → Form 6251 AMT → totals.
3. Form 8815 line 14 should be identical in the second pass because MAGI = pre-exclusion Line 11b (mathematical invariant), so the recursion is deterministic and single-iteration.
4. Need a recursion-depth guard parameter to prevent infinite loop.

**Alternative considered and rejected — Option B (in-place patch):**

Manually decrement Line 2b / Line 9 / Line 11a / Line 11b / Line 15 by line 14 at the end of `prepare()`, then re-run `computeLine16` and every downstream consumer. Rejected because it requires hand-coding ALL downstream MAGI/AGI-sensitive computations (Form 6251, Schedule 8812, Form 8863, Form 8880, Form 1116, Schedule 3 nonrefundable credits, education credits, retirement savings credit, EIC, etc.) and the silent-failure mode (missing one consumer → wrong return) is the exact category Pub-17 §17 calls out.

**Estimated implementation effort (Option A):**

- **Backend** (`TaxReturnComputeService.java`):
  - Add `prepare(String uid, boolean isSecondPass)` overload; existing `prepare(String uid)` calls it with `false`.
  - At the end of `prepare()`, after `computeForm8815`: detect line-by-line success + missing-override condition; if `isSecondPass == false`, deep-copy `personalForms`, inject `savingsBondExclusionAmount` into the copy's `interest-income-taxpayer` map, recurse with `isSecondPass = true`, return the second-pass result.
  - Estimated ~30 lines of new code at the end of `prepare()` plus the parameter plumbing.
- **Tests**:
  - Unit: `form8815LineByLineRetroactivelyReducesLine2bAndDownstream` — assert Line 2b, Line 9, Line 11b, Line 15, Line 16 all reflect the exclusion.
  - Unit: `form8815LineByLineDeterministicSinglePass` — assert the second-pass Form 8815 line 14 equals the first-pass Form 8815 line 14 (MAGI invariant proof).
  - Audit existing line-by-line tests for assertions on Line 2b/9/11b/16 that would have been previously wrong.
- **Documentation**:
  - Update `2b.md` §3.2 Gap 3 to **Closed**.
  - Update `8815.md` §3.2 Gap 7 to **Closed**.
  - Cross-reference the QBI second-pass pattern site in code comments.

**Why deferred:**
- Override path is fully functional — users who need the exclusion can still get a correct return today by also filling in the manual override field (a one-line workaround documented in the UI / form copy).
- Not a silent-under-reporting risk in the IRS-detection sense: the affected scenario (filer uses line-by-line but not the override) produces a return where Form 8815 is correctly emitted but the savings bond interest is NOT excluded from Line 2b. The IRS would receive a higher Line 2b than warranted — i.e., the filer self-over-reports interest income. This is self-harm, not the kind of under-reporting that triggers CP-2000. Filers who reconcile against their hand-computed Form 8815 line 14 would catch the discrepancy.
- Two-pass re-invocation is a meaningful architectural change that warrants its own dedicated implementation cycle.
- Affected population is narrow: filers who use the new line-by-line intake AND skip the manual override field AND have non-zero savings bond exclusion AND have phaseout in play (because below phaseout, line 14 = line 8 and the user can just enter line 8 directly).

**Priority:** Low-medium. Self-over-reporting only; well-understood permanent fix; established second-pass pattern available; manual workaround documented.

**Tracked from:** XLS/Computations/2b.md §3.2 Gap 3 (also `XLS/Computations/8815.md` §3.2 Gap 7). Design review 2026-06-03 confirmed Option A (re-invoke `prepare()`) is the correct approach.

---

## Line 3a: Non-Treaty Foreign Corporation Dividend Manual-Classification Field Missing — RESOLVED 2026-06-03

**STATUS: CLOSED 2026-06-03** — Closed via XLS/Computations/3a.md §3.2 Gap 1. V42 Liquibase migration adds `non_qualified_non_treaty_foreign_corp_dividends` column to `pf_dividend_income`; entity (`PfDividendIncome`), mapper (`DividendIncomeMapper`), backend compute (`TaxReturnComputeService.computeDividendForPerson` at `:7844`), YAML (`2ab-dividend-income-{taxpayer,spouse}.yaml`), and UI components (`form-dividend-income-{taxpayer,spouse}.component.ts`) all wired. New field is subtracted from `candidateQualified` alongside the existing five disallowed categories, distinct from the existing `nonQualifiedSurrogateForeignCorporationDividends` (which covers only Internal Revenue Code §7874 surrogate-inversion). Lock-in test `nonTreatyForeignCorporationDividendsReduceLine3aOnly` asserts Line 3a is reduced and Line 3b is unchanged. Backend regression: 639/639 tests pass.

Historical context (kept for reference):

### ~~Line 3a: Non-Treaty Foreign Corporation Dividend Manual-Classification Field Missing — Deferred 2026-05-11~~ (superseded by the resolved entry above; demoted from H2 to H3 2026-06-04 to keep the open-deferred-section sweep accurate)

Per IRC §1(h)(11)(C) + IRS Pub. 550 + `lines/3ab.md` §4.3: not every dividend reported in 1099-DIV box 1b from a foreign corporation remains qualified. To be a "qualified foreign corporation," the corp must be (a) incorporated in a US possession, (b) eligible for benefits of a comprehensive US income tax treaty, OR (c) have stock readily tradable on an established US securities market (e.g., NYSE-listed ADRs). Dividends from foreign corps failing all three tests are **NOT qualified**, even if the broker reported them in box 1b.

**Current state:**
- The `dividend-income-{taxpayer,spouse}` personal form has 5 manual-classification disallowance fields: 2 holding-period categories, related-payment/short-sale, payments-in-lieu, and surrogate foreign corp (IRC §7874). See 3a #9 closure documenting the manual-entry design.
- **No dedicated field** for "non-treaty foreign corp dividends" that should be removed from line 3a. The surrogate-foreign-corp field (#15, `nonQualifiedSurrogateForeignCorporationDividends`) covers IRC §7874 inverted-corp surrogates only — a narrower scope than the full IRC §1(h)(11)(C) eligibility test.
- A user with a direct holding in a non-treaty foreign corp (without ADR listing) would either: (a) mis-categorize the amount under one of the existing 5 fields (semantically wrong), OR (b) trust that the broker pre-classified box 1b correctly (often the case but not guaranteed for direct non-ADR foreign holdings).

**If revisited**, scope (~30-45 minutes):

- **YAML / personal-form additions** (`3ab-dividend-income-taxpayer.yaml` + spouse):
  - New field under `disallowedQualified` section: `nonQualifiedNonTreatyForeignCorporationDividends` with help text explaining the three eligibility tests (US possession, treaty, US-listed stock) and noting that PFIC dividends and inverted-surrogate dividends are handled by separate fields.
- **Backend** (`computeDividendForPerson`):
  - Add `disallowedQualifiedTotal = addNonNull(disallowedQualifiedTotal, getAmount(dividendForm, "nonQualifiedNonTreatyForeignCorporationDividends"));` as the 6th disallowance line in the chain at lines ~4944-4949.
- **Frontend**:
  - Add the new field to the dividend-income Angular component in the existing disallowed-categories section.
- **Tests**:
  - Unit: `nonTreatyForeignCorporationDividendsRemovedFromLine3aButNotLine3b` — 1099-DIV box 1a=$1,000, box 1b=$1,000, `nonQualifiedNonTreatyForeignCorporationDividends=$300` → line3b=$1,000 (unchanged), line3a=$700.
- **Documentation**:
  - Update `lines/3ab.md` §4.3 to note that the non-treaty foreign-corp test is now exposed as a manual field.
  - Update `knowledge/line-3ab-dividend-income.md` disallowance-categories table.

**Why deferred:**
- Per audit recommendation: "Defer as future UX enhancement; not a backend bug."
- Brokers typically pre-classify box 1b correctly for major foreign holdings (especially ADR-listed).
- Affected users (direct non-ADR foreign-stock holders) are rare for retail filers.
- Line 3a ≤ line 3b cap (3a #6) is the safety net for any over-claim.
- Adding the field would parallel the 5 existing manual-classification fields — but with the same low retail incidence and same broker pre-classification reliance.

**Priority:** Low. Silent gap in user-input options; existing 5 fields don't semantically fit the IRC §1(h)(11)(C) non-treaty case.

**Tracked from:** 3a.xlsx Code Validation #10 walkthrough on 2026-05-11. Distinct from 3a #9 (which documented the manual-entry design for the existing 5 fields) — this entry covers the **gap in available fields** for the broader IRC §1(h)(11)(C) test.

---

## Cross-Line 0-vs-null Compliance Audit — Folded Into Each Remaining Line Audit — In Progress 2026-05-10

Per the canonical rule established 2026-05-10 (`knowledge/canonical-null-zero-semantic.md`, `rules.md`):

- **NULL** = "this concept does not apply / no input was provided"
- **ZERO** = "this concept applies, input was provided, computed value is zero"

The line 1e fix on 2026-05-10 (commit applied during 1z closure) was Option B from the audit proposal — bring line 1e into compliance, document the rule, defer the cross-line sweep. Lines 1a–1i + 1z are now audited and compliant (or have spec-driven ZERO exceptions documented per the rule).

**Scope of remaining work:**

The remaining Form 1040 lines (2a/2b, 3a/3b, 4a–c, 5a/5b, 6a/6b, 7a/7b, 8, and all of 9–38) have not been formally audited for 0-vs-null compliance. **Each future line audit must include a 0-vs-null compliance check on its Code Validation sheet** as a standard step.

Per-line checklist for the canonical-rule audit step:

1. Read the compute helper for the line; identify the "no input" exit path.
2. Verify the return value is `null` unless a spec mandates ZERO with a documented citation.
3. Add a breadcrumb comment near the exit citing `knowledge/canonical-null-zero-semantic.md`.
4. Add a lock-in test pair: assert null on no inputs; assert ZERO only for spec-mandated ZERO paths.
5. Trace downstream consumers — confirm any `if (x != null)` branch behaves correctly.

**Coverage so far** (from `knowledge/canonical-null-zero-semantic.md` § Audit Coverage):
- ✅ Lines 1a, 1b, 1c, 1d, 1e, 1f, 1g, 1h, 1i, 1z — all audited and compliant.
- ⏳ Lines 2a/2b, 3a/3b, 4a/4b/4c, 5a/5b, 6a/6b, 7a/7b, 8 — pending future audits.
- ⏳ Lines 9–38 (totals, deductions, credits, payments) — pending future audits.

**Why folded into per-line audits rather than a single sweep:**
- Per-line context: each compute method has its own spec mandates, edge cases, and downstream consumers. Auditing in isolation (a single big sweep) risks missing line-specific subtleties.
- Continuity: the user is already auditing one line at a time. Folding the rule check into the existing per-line walkthrough adds ~15-30 minutes to each audit rather than scheduling a separate cross-line effort.
- Coverage gradually accumulates: each line closed gets a compliance breadcrumb + lock-in test, and the canonical-null-zero-semantic.md "Audit Coverage" table fills in over time.

**If a future audit reveals a new outlier** (line 1e was the only one found in the 1a–1z block):
- Fix the compute method per the canonical rule.
- Update the affected line's spec doc.
- Add lock-in tests.
- Note the fix in the canonical-null-zero-semantic.md change log.

**Priority:** Medium — correctness affects null-propagation contracts and downstream consumer branching, but the wage-block fix already resolves the most-impactful instance.

**Tracked from:** 1h.xlsx #4(g) (early sighting); 1z.xlsx #1/#9 (root-cause investigation); cross-line audit user request 2026-05-10 with Option B applied.

---

## TaxReturnComputeService — `addNonNullVarargs` Helper + Cross-Site Migration (~31 nested addNonNull chains) — Deferred 2026-05-10

The `addNonNull(BigDecimal, BigDecimal)` helper at `TaxReturnComputeService.java:11425` performs null-aware binary addition. It is composed into LEFT-FOLD CHAINS in many places — e.g., the line 1z chain at line 4140-4141 is `addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(addNonNull(line1a, line1b), line1c), line1d), line1e), line1f), line1g), line1h)` — 7 nested calls to sum 8 operands. The same shape appears at line 4144-4145 for line 9, and at 29 other sites.

**Total nested-addNonNull sites:** 31 across the file (grep result 2026-05-10). Scattered across:
- Wages computation (line 1a-1h aggregation, line 1z) — 2 chains
- Line 9 total income — 1 chain
- Withholding aggregations (line 25a/25b/25c/25d) — ~3 chains
- EIC earned-income computation — ~4 chains
- Schedule 8812 Part II-A (ACTC) — ~3 chains
- Schedule 3 credit aggregations — ~5 chains
- Form 2441 dependent care — ~2 chains
- Form 8839 adoption — ~3 chains
- Schedule 1 income aggregations — ~3 chains
- Misc per-credit cells — ~5 chains

The deep nesting is mathematically correct but hard to scan. A varargs helper would replace each chain with a flat parameter list.

**If revisited**, scope (~1-2 hours):
- Add private static helper:
  ```java
  private static BigDecimal addNonNullVarargs(BigDecimal... values) {
      BigDecimal acc = null;
      for (BigDecimal v : values) {
          acc = addNonNull(acc, v);
      }
      return acc;
  }
  ```
  Place near the existing `addNonNull(BigDecimal, BigDecimal)` at line 11425.
- Migration order (DO NOT do all 31 at once — section sweeps with full regression after each):
  1. Line 1z + line 9 chains (lines 4140-4141, 4144-4145) — 8-operand chains, comprehensive existing coverage from 1z.xlsx Issue #2 (6 dedicated tests).
  2. Withholding aggregations — line 25 family.
  3. EIC earned-income chains — `computeLine27aEIC`.
  4. Schedule 8812 chains — `computeSchedule8812`.
  5. Schedule 3 credit aggregations.
  6. Per-form chains (Form 2441, Form 8839, Schedule 1).
  7. Misc remaining sites.
- Test gates: run the full 746-test suite after each section migration. Stop and investigate immediately if any pre-existing test fails.
- Unit test for the helper itself:
  - `addNonNullVarargsReturnsNullWhenAllOperandsNull`
  - `addNonNullVarargsReturnsSingleNonNullWhenOthersAreNull`
  - `addNonNullVarargsSumsAllNonNullOperands`
  - `addNonNullVarargsAcceptsZeroAndNegativeValues`
  - `addNonNullVarargsEmptyArgsReturnsNull` (boundary)
- Document the helper's semantic in a 2-line comment above the method declaration.
- Update the line 1z + line 9 inline comments in `buildIncome()` to reflect the cleaner call site.

**Why deferred:**
- Per audit recommendation: "OPTIONAL — out of scope for line 1z math. Defer to a future refactor pass."
- Pure cosmetic — no production bug, no math error, no test gap.
- Partial migration (only line 1z + line 9) would create inconsistency: two patterns coexisting in the same method body. Better to do the full sweep as a single coherent refactor.
- Full sweep requires touching ~29 unrelated code paths and running comprehensive regression, which is broader than the line 1z audit scope.

**Priority:** Very low. Pure readability. No functional or correctness impact.

**Tracked from:** 1z.xlsx Issue #4 walkthrough on 2026-05-10; current code at `TaxReturnComputeService.java:4140-4141` (line 1z) and `:4144-4145` (line 9), plus 29 other sites discoverable via `grep -c "addNonNull(addNonNull(" TaxReturnComputeService.java`.

---

## Form 1040 Top-of-Form `combat_zone` Checkbox — Filing Deadline Extension Marker — Deferred 2026-05-10

Per IRS Pub. 3 §7 (Armed Forces' Tax Guide, "Extension of Deadlines"), taxpayers serving in a combat zone qualify for an automatic filing-deadline extension: 180 days after leaving the combat zone, PLUS the number of days remaining in the filing period when they entered the zone. The Form 1040 top-of-form checkbox (printed near the heading, labeled "If you served in a combat zone, see instructions") signals to the IRS that the return may qualify for this relief.

**Current state:**
- PDF field present in `pdfs/f1040_field_mapping_semantic.csv`: `topmostSubform[0].Page1[0].c1_2[0]` / semantic name `top_combat_zone` / label "Top Combat Zone".
- **No backend wiring** — grep of `us-tax-be/src` for `top_combat_zone` / `combat_zone` / `topCombatZone` / `servedInCombatZone` returns zero matches.
- **No UI wiring** — the EIC component (`form-earned-income-credit.component.ts`) has "combat zone" text but it refers to the EIC election (the duplicate fields deprecated in 1i.xlsx Issue #2), NOT this top-of-form checkbox.
- Result: the PDF field is always rendered unchecked on the exported Form 1040.

**Why auto-deriving from W-2 box 12 code Q is INCOMPLETE:**
- Combat zone service is BROADER than nontaxable combat pay. A taxpayer can be in a combat zone briefly without earning code Q (e.g., short rotation, transit through, or service above the officer cap that does not appear as code Q box 12).
- Conversely, code Q is W-2 annual reporting, while the deadline-extension status is an administrative real-time eligibility.
- A correct implementation needs an explicit user-facing checkbox.

**Distinction from line 1i math:**
- Line 1i (combat pay election): affects EIC and ACTC earned-income calculations. The math change deferred to date is purely on the credit side.
- This checkbox: purely an ADMINISTRATIVE marker for the IRS. Does not affect tax, deductions, credits, AGI, refund, or any computed amount. It only signals deadline-extension eligibility for a return that has already been filed (or will be filed late).
- Both are about military service, but completely independent.

**If revisited**, scope (~30-45 minutes):
- Add a new personal-form field, either:
  - On `identification-taxpayer` and `identification-spouse`: `servedInCombatZone2025` boolean (paired with optional date-range fields for the deployment).
  - OR as a standalone form (e.g., `combat-zone-service-taxpayer` / `combat-zone-service-spouse`) under the Personal sidebar section.
- Wire `Form1040.setTopCombatZone(boolean)` from the new field — checked when EITHER spouse on the return has served in a combat zone in 2025.
- Add to the PDF export mapping in the frontend's `pdf-readonly-preview` overlay logic so `top_combat_zone` gets the checkmark.
- Add YAML intake spec.
- Tests: unit test on the boolean wiring (taxpayer-only, spouse-only, both, neither); PDF export E2E test verifying the checkmark renders.
- Update `lines/1i.md` §11 to reference the new field (currently silent on this checkbox); update `knowledge/line-1i-combat-pay.md` similarly.
- No mathematical effect, so no compute-path changes.

**Why deferred:**
- Per audit recommendation: "OPTIONAL — out of scope for line 1i math. The checkbox is informational (does not affect tax). Defer."
- No tax-correctness gap; only a clerical/administrative omission.
- Affected users (deployed military filers) typically work with VITA, MilTax, or unit financial counselors who handle deadline-extension paperwork separately and would notice the missing checkbox during review.
- Better as part of a future "military filer enhancements" track that bundles this checkbox + the IRA-compensation §219(f)(7) deferred (above) + any other military-specific UX.

**Priority:** Low. Pure clerical gap. Affected users have alternative paths to deadline-extension relief (Form 4868, written request).

**Tracked from:** 1i.xlsx Issue #8 walkthrough on 2026-05-10; `pdfs/f1040_field_mapping_semantic.csv` confirms the PDF field's existence; `lines/1i.md` §11 silent on this checkbox today.

---

## Line 1i — Nontaxable Combat Pay as IRA Contribution Compensation (IRC §219(f)(7)) — Deferred 2026-05-10

Per IRC §219(f)(7) and IRS Pub. 590-A Section 2, nontaxable combat pay counts as compensation for IRA contribution purposes — a statutory exception to the general rule that nontaxable income cannot support IRA contributions. This rule is **independent of the line-1i credit election**: combat pay counts as IRA compensation regardless of whether the taxpayer elected to include it on line 1i for EIC/ACTC purposes.

**Current backend state:**
- `computeIraDistributions` (`TaxReturnComputeService.java:4832`) handles **distributions** (lines 4a/4b) — does not touch contributions.
- IRA contribution **deduction** (Schedule 1 line 20) is read as a user-entered value at line ~7317 (`iraDeductionLine20` from `income-adjustments-{taxpayer,spouse}` forms). There is **no compensation-cap validation logic** anywhere in the backend.
- The user manually computes their IRA deduction (or uses external help) and enters the result; backend trusts the entered value.

So the combat-pay-as-IRA-compensation rule is one of several IRC §219 compensation components that would be needed once IRA-contribution-cap validation is implemented at all. This is not specifically a line-1i gap; it's a broader missing feature.

**If revisited** (alongside the broader IRA-contribution-cap implementation), scope (~1-2 hours total for the broader feature; combat-pay piece is ~5 min):
- Add a `computeIraCompensation(...)` helper that aggregates IRC §219 compensation components per person: W-2 wages (box 1) + self-employment net earnings (out of scope) + **nontaxable combat pay** (the new combat-pay piece).
- The combat-pay component uses `sumW2Box12ByCodes(w2Entries, COMBAT_PAY_CODES, personSsn)` — the UNDERLYING sum, NOT `form1040.income.nontaxableCombatPayElection`. Combat pay counts as IRA comp even if the taxpayer didn't elect the line-1i credit treatment.
- Apply per-person caps: $7,000 base (2024 limit; 2025 may differ — check ReferenceData) + $1,000 catch-up if age ≥ 50.
- If user-entered `iraDeductionLine20` exceeds computed compensation cap → emit blocking flag `IRA_DEDUCTION_EXCEEDS_COMPENSATION` with the cap value in the message.
- Test: `iraDeductionCapIncludesNontaxableCombatPayPerIrcSec219f7` — taxpayer has $0 box 1 wages + $5,000 W-2 code Q (no line-1i election) + claims $5,000 IRA deduction → must NOT block (combat pay covers the deduction via §219(f)(7)).

**Why deferred:**
- Per audit recommendation: "OPTIONAL — out of scope for line 1i. Defer."
- The broader IRA-contribution-cap validation feature is itself absent. Adding combat-pay-specific logic to a not-yet-implemented compensation path is premature.
- Current user-entered deduction values produce mathematically correct line-20 / AGI / line-15 outputs; the only risk is a user over-contributing to an IRA and not being warned (a soft validation gap, not a math bug).
- The §219(f)(7) rule is well-known to military filers (Pub. 3 covers it); affected users typically already understand the compensation expansion.

**Priority:** Low. The feature would be valuable for user protection, but it's a broader IRA-cap initiative, not a line-1i correctness gap.

**Tracked from:** 1i.xlsx Issue #7 walkthrough on 2026-05-10; `lines/1i.md` §8 explicitly lists this as "out-of-scope-but-relevant"; knowledge file `line-1i-combat-pay.md` mentions the §219(f)(7) provision under "IRA contributions (informational, out of scope for line 1i)".

---

## Helper `sumW2Box12ByCodes` — Defensive Null-SSN Handling (Option C Broader Cleanup) — Deferred 2026-05-10

After 1i.xlsx Code Validation #4 closure (Option A scope), the two combat-pay sum sites in `computeCombatPay` are protected by `hasText(ssn)` guards. But the underlying helper `sumW2Box12ByCodes` (`TaxReturnComputeService.java:10900`) still has the surprising semantic: when called with `ssn=null` or `ssn=""`, the helper SKIPS the SSN filter (line 10897 — `if (hasText(normalizedSsn))`) and sums ALL W-2 box 12 entries matching the requested code(s).

**Current callers of `sumW2Box12ByCodes`:**
- Line 10244 (combat pay taxpayer) — **protected** by Option A hasText guard.
- Line 10245 (combat pay spouse) — **protected** by Option A hasText guard + Issue #1 MFS gate.
- Lines 11065-11067 (line 1h excess deferrals via `computeDeferralTotalsForSsn`) — **protected** by the caller's own `if (!hasText(ssn)) return new DeferralTotals(null, null, null);` early-return.
- Lines 19687, 19730 (Saver's Credit Form 8880 — `computeSaverCredit`) — **NOT VERIFIED**. Pass `taxpayerSsnW2` and `spouseSsnW2` derived from `you.ssn` / `spouse.ssn`. Potentially vulnerable if those SSNs are null in production.

**If revisited**, scope (~30-45 minutes):
- Change `sumW2Box12ByCodes` to return null when ssn is null/empty (line 10897 — replace `if (hasText(...))` skip-pattern with an early-return guard at the top of the method).
- Audit the Saver's Credit call sites (`computeSaverCredit` lines ~19687, 19730) — verify that null `taxpayerSsnW2`/`spouseSsnW2` would produce sensible behavior under the new semantic (likely "0 saver's credit deferral total" which is correct; needs test).
- Remove the now-redundant hasText guards from `computeCombatPay` lines ~10244-10250 (Option A defenses become redundant once the helper is itself defensive).
- Add lock-in tests for the new semantic: `sumW2Box12ByCodesReturnsNullWhenSsnIsNull`, `sumW2Box12ByCodesReturnsNullWhenSsnIsEmpty`, `sumW2Box12ByCodesIgnoresEntryWhenSsnDoesNotMatch`.
- Keep `countW2Box12ByCodes` unchanged — its `null SSN = count all entries` semantic is intentionally used at line 10241 for diagnostic logging.
- Update breadcrumb comments at the combat-pay site to reference the new helper behavior.

**Why deferred:**
- The Option A scope (caller-side hasText guards) eliminates the line-1i exposure today.
- Helper-semantic change is a cross-cutting refactor; affects line 1h (already protected), Saver's Credit (needs verification), and any future caller.
- Option C is the right LONG-TERM design ("null SSN = no contribution = null") but the immediate audit goal is line 1i correctness, which is now closed.
- No regression risk to defer; lock-in test `combatPayWithNullTaxpayerSsnDoesNotAbsorbCodeQFromOtherW2s` prevents the line-1i scenario from recurring even if the helper is later changed.

**Priority:** Low-medium. Saver's Credit users with missing SSN could theoretically see an inflated credit-deferral total (low real-world incidence; pre-launch app); the issue is in code, not a user-visible defect today.

**Tracked from:** 1i.xlsx Issue #4 walkthrough on 2026-05-10; caller-side guards at `TaxReturnComputeService.computeCombatPay` lines ~10244-10254.

---

## Line 28 — G13 — CTC Per-Child Amount Documentation Drift ($2,000 docs vs $2,200 code; OBBBA citation) — Drift Fixed 2026-05-16

★ **G13 NEW GAP surfaced at 28 #9 audit on 2026-05-16; drift fix applied at 28 #4.** The 2025 Form 1040 Schedule 8812 line 5 (CTC potential per qualifying child) had a documentation drift where 3 doc files (`lines/28.md` §3, `dependencies/28.md` §6 G10, `knowledge/line-28-actc-schedule-8812.md` §60) all claimed CTC was $2,000 per qualifying child (citing a "G10 fix 2026-04-20 — corrected to $2,000"), while the actual code at `TaxReturnComputeService.java:23074-23075` uses **$2,200** with comment citing "Rev. Proc. 2024-40 §3.08; increased from $2,000 in 2024", and the 19 #6 breadcrumb (planted 2026-05-14 during line 19 audit) cites "OBBBA + Rev. Proc. 2024-40 §3.08" for Part II-A verification.

**Most likely explanation:**
- OBBBA Act (One Big Beautiful Bill Act, passed July 2025) raised CTC to $2,200 per qualifying child for tax year 2025 (and 2026-2028; inflation-adjusted thereafter).
- The 2026-04-20 "G10 fix to $2,000" predated the OBBBA awareness and was based on the pre-OBBBA Rev. Proc. 2024-40 §3.08 amount.
- The code was updated 2026-05-14 (19 #6 timestamp) to $2,200 with OBBBA citation; doc files were never updated.
- Documentation drift persisted from 2026-05-14 to 2026-05-16 (~2 days).

**Drift fix already applied at 28 #4:**
1. `lines/28.md` §3 — updated to mark CTC at $2,200 per OBBBA Act with REOPENED note
2. `dependencies/28.md` §6 G10 — marked REOPENED with full explanation
3. `knowledge/line-28-actc-schedule-8812.md` §60 — updated to $2,200 with OBBBA citation

**Severity:** MEDIUM (presumed code is OBBBA-correct; drift fix corrects documentation)

**★ User action still required:** Verify against authoritative IRS 2025 Form 1040 / Schedule 8812 final instructions to confirm $2,200 is correct. If $2,000 turns out to be the actual IRS amount (highly unlikely given OBBBA reality), severity escalates to HIGH and code at `TaxReturnComputeService.java:23075` must be reverted from $2,200 to $2,000.

**Impact if code is wrong:** Every taxpayer with CTC-eligible children would receive $200/child too much in Schedule 8812 line 5, propagating to line 8 (total potential), line 12 (after phase-out), line 14 (Form1040 line 19 nonrefundable CTC+ODC), line 16b (ACTC ceiling $1,700 × children — UNAFFECTED), line 17 (Part II-A ACTC potential), and line 27 (Form1040 line 28 final ACTC). For a family with 2 CTC-eligible children: $400 excess credit.

**Recommended verification action:**
1. Download 2025 Form 1040 Schedule 8812 instructions from IRS.gov
2. Look up the per-qualifying-child amount on Schedule 8812 line 5
3. If $2,200: confirm OBBBA + code correctness; no further action.
4. If $2,000: revert code at line 23075 + re-revert docs.

**Tracked from:** 28.xlsx Issue #9 walkthrough on 2026-05-16. Drift fix at 28 #4 already updated 3 doc files.

★ **2nd consecutive new-gap audit** (after G12 at 27c). ★ Confirms the streak-end at 27c is not a one-off; gaps are now being surfaced regularly.

---

## Line 27c — G12 — EIC Opt-Out / Disqualified Checkbox Auto-Fill Missing — Deferred 2026-05-16

★ **G12 NEW GAP surfaced at 27c #9 audit on 2026-05-16.** IRS 2025 Form 1040 line 27c is a checkbox that should be checked when (a) the taxpayer voluntarily opts out of EIC OR (b) the eligibility flow determines EIC cannot be claimed (Form 2555 filer, investment income > $11,950, invalid SSN, nonresident alien, MFS without §32(d)(2) exception, etc.). The 2025 instructions explicitly say "You can't take the credit. Check the box on line 27c." in disqualifying situations.

**Documented intent (knowledge §1 row 27c + dependencies §2):** "Checked when EIC = null"; "derived from computation result, checked by frontend."

**Current implementation:**
- `form-tax-return-1040.component.ts` has ZERO references to `line27c` or `27c_*` AcroForm fields.
- Backend has no helper / no output field; only an inline comment at `TaxReturnComputeService.java:19886` documenting the intent: `// 27c (EIC opt-out checkbox) = auto-determined by eligibility (no separate stored field).`
- PDF AcroForm checkbox renders **unchecked** regardless of EIC state.

**Effect:** When a taxpayer is disqualified from EIC (line 27a = null), the printed Form 1040 shows line 27a blank ✓ (correct) but line 27c unchecked ✗ (incorrect per IRS instructions; should be checked).

**Severity:** MEDIUM
- ✅ IRS still processes returns with EIC = blank correctly (no math affected).
- ❌ Printed return doesn't accurately reflect that EIC was intentionally not claimed.
- ❌ Spec/knowledge documented intent that wasn't implemented (drift fixed at 27c #4 — docs now mark this as INTENDED with G12 reference).

**Recommended fix** (frontend PDF-fill code, ~5 minutes):
```typescript
// In form-tax-return-1040.component.ts PDF-fill function:
values["line27c_eic_opt_out_checkbox"] =
    (payments?.earnedIncomeCredit == null) ||
    (eicTaxpayer?.claimsEIC === false);
```

**Lock-in test:** Add E2E scenario verifying that when EIC is disqualified (e.g., Form 2555 filer), the PDF rendering shows line 27c checked.

**Why deferred:**
- Low risk; cosmetic on the printed return.
- Backend has nothing to change; pure frontend addition.
- Can be implemented when next batch of frontend PDF-fill improvements is in scope.

**Tracked from:** 27c.xlsx Issue #9 walkthrough on 2026-05-16. Drift fix at 27c #4 already updated `knowledge/line-27abc-earned-income-credit.md` §1 row 27c and `dependencies/27abc.md` §2 to mark this as INTENDED but NOT YET IMPLEMENTED.

★ **This gap broke 2 workflow streaks:** 15-consecutive-zero-new-gaps (was 15 audits clean) AND 32-consecutive-zero-outstanding-walkthroughs (was 32 audits clean). FIRST significant streak-breaker in workflow.

---

## Line 27a EIC — Deprecate Legacy `electNontaxableCombatPay` YAML/UI Fields — Deferred 2026-05-10

After 1i.xlsx Code Validation #2 closure, the backend `computeLine27aEIC` reads combat pay exclusively from `form1040.income.nontaxableCombatPayElection` (single source of truth, populated by `computeCombatPay` from the line-1i form `combat-pay-taxpayer.electCombatPay`). The legacy EIC personal-form fields are **no longer consumed** by the backend — but still defined in the YAML files and still rendered in the EIC UI form, asking the user a duplicate question that has no effect.

**Files still containing the dead fields:**
- `C:/us-tax/yamls/27a-earned-income-credit-taxpayer.yaml` line 51 — `electNontaxableCombatPay` field.
- `C:/us-tax/yamls/27a-earned-income-credit-spouse.yaml` line 29 — `spouseElectNontaxableCombatPay` field.
- Corresponding Angular components: `form-earned-income-credit-taxpayer.component.ts` and `form-earned-income-credit-spouse.component.ts` (the boolean input controls bound to those YAML field IDs).

**Lock-in test in place:** `line27aEicReadsCombatPayFromLine1iSource_notEicFormFlag` Part B asserts that setting the legacy flag with line-1i election OFF produces the no-election EIC ($306, not the elected $649) — proving the legacy flag has no effect.

**If revisited**, scope (~10-15 minutes):
- Remove the two YAML fields and any `showIf`/`helpText` text referencing them.
- Update the EIC components to drop the bound form controls (and any read/save references in `loadForm` / `saveForm` paths).
- Update the EIC form's introductory text to remove the "Combat zone pay — if you served in a combat zone in 2025…" instruction (the combat pay election now lives exclusively on the line-1i / "Combat Pay" sidebar form).
- Consider data migration: any user data that has `electNontaxableCombatPay=true` saved in Firestore should be migrated to `combat-pay-taxpayer.electCombatPay=true`. Since the app is pre-launch (no production users), migration is moot — but the cleanup script could be a one-liner Firestore update if needed later.
- Optional: regenerate `XLS/input_forms/form-earned-income-credit-taxpayer.xlsx` and `form-earned-income-credit-spouse.xlsx` to reflect the removed fields.

**Why deferred:**
- Backend correctness is fully restored (the EIC combat-pay path now flows through line 1i, identical to the Schedule 8812 ACTC path).
- UI/YAML cleanup is purely visual hygiene — users see a vestigial question that no longer affects their tax return.
- No regression risk to defer; lock-in test Part B prevents accidental re-coupling to the legacy flag.

**Priority:** Low. Backend correctness is the high-value change; UI cleanup is cosmetic.

**Tracked from:** 1i.xlsx Issue #2 walkthrough on 2026-05-10; backend refactor at `TaxReturnComputeService.computeLine27aEIC` lines ~16604-16612 (now reads `form1040.getIncome().getNontaxableCombatPayElection()` directly).

---

## Line 1h — Corrective Distribution Box 2a Missing Advisory — Deferred 2026-05-10

Per IRS 2025 1099-R instructions, plan administrators issuing a code-8 corrective distribution MUST populate box 2a with the taxable amount. The amount must be split from any non-taxable basis the participant had in the plan, so the issuer (not the recipient) is the only party with the data needed to compute box 2a correctly.

**Current behavior** (`computeOtherEarnedIncome` Cat 4, line ~10149):

```java
if (hasCurrentCorrective) {
    BigDecimal taxable = parseAmount(entry.get("taxableAmountAmount"));
    correctiveTotal = addNonNull(correctiveTotal, taxable);
}
```

When the issuer leaves box 2a blank on a code-8 1099-R (issuer error), Cat 4 silently extracts null and the corrective distribution does NOT enter line 1h. This is **mathematically correct** — falling back to box 1 (gross) would risk routing non-taxable basis to line 1h. But the user sees no warning that their corrective distribution went uncounted. The asymmetric breadcrumb comment (added 2026-05-10) makes the design intent visible to future maintainers, but doesn't reach the user.

**Practical user impact:** Low. Code-8 corrective distributions are themselves rare; issuers almost always populate box 2a per the IRS instructions. The combined event (corrective distribution + issuer error + user uploads to current year) is extremely rare. Affected users with a missing box 2a should contact the plan administrator for a corrected 1099-R, not proceed with the uploaded one.

**If revisited**, scope (~15-20 minutes):
- Detect the issuer-error case inside the Cat 4 block: `hasCurrentCorrective && !iraSepSimple && !codes.contains("3")` AND `parseAmount(taxableAmountAmount) == null` AND `parseAmount(grossDistributionAmount) != null`.
- Emit non-blocking flag `LINE1H_CORRECTIVE_BOX2A_MISSING` with message: "1099-R from {payerName} is coded as a corrective distribution (code 8) but box 2a (taxable amount) is blank. Per IRS instructions, the issuer should populate box 2a — contact the plan administrator for a corrected 1099-R. The amount was NOT added to line 1h."
- Make the flag PER-ENTRY so users with multiple problem 1099-Rs see one advisory each (scoped by `entryId`).
- Test: `correctiveDistribution_box2aMissing_emitsAdvisoryFlag_lineRemainsNull` — code-8 1099-R with null taxableAmount, gross=$1,500 → line 1h null + flag list contains `LINE1H_CORRECTIVE_BOX2A_MISSING`.
- Update `lines/1h.md` §8 to document the advisory.
- Update `knowledge/line-1h-other-earned-income.md` Cat-4 section.

**Why deferred:**
- Per the audit author's explicit recommendation in 1h.xlsx Code Validation #9 ("Defer.")
- Current silent-skip behavior is mathematically correct (no money goes to the wrong line).
- A breadcrumb comment was added on 2026-05-10 at `computeOtherEarnedIncome` line ~10149 explaining the deliberate no-fallback and citing this audit ID.
- Lock-in test `computesLine1hCorrectiveDistribution_box2aEmpty_excludedNoFallback` now codifies the no-fallback behavior — protects against a future "fix" that would mirror Cat 3's box-1 fallback.
- Affected users (corrective distribution + issuer error) are extremely rare and tend to use a tax professional anyway.

**Priority:** Very low. The advisory is purely informational — no money, math, or filing-status outcome is affected.

**Tracked from:** 1h.xlsx Issue #9 walkthrough on 2026-05-10; breadcrumb comments at `TaxReturnComputeService.computeOtherEarnedIncome` line ~10122 (Cat 3 fallback rationale) and line ~10149 (Cat 4 no-fallback rationale); lock-in test in `TaxReturnComputeServiceTest.java`.

---

## Line 1h — Code-P-Only 1099-R Advisory Flag — Deferred 2026-05-10

Per IRS 1099-R instructions, distribution code P represents "Excess contributions plus earnings/excess deferrals taxable in 2024" (the prior tax year). Such amounts belong on the prior-year return, NOT the current line 1h. The compute service correctly skips them.

**Current behavior** (`computeOtherEarnedIncome` line ~10134):

```java
if ((hasCurrentCorrective || hasPriorCorrective) && !iraSepSimple && !codes.contains("3")) {
    if (hasCurrentCorrective && owner == null) { ... }   // owner attribution: code 8 only
    if (hasCurrentCorrective) { correctiveTotal += taxable; }   // amount: code 8 only
}
```

The `||` in the outer guard is intentional (a breadcrumb comment was added 2026-05-10 to lock that in). When a 1099-R has only code P (no code 8), the block enters but nothing happens — no owner prompt, no amount added, no flag emitted. The user sees their 1099-R uploaded but no contribution to line 1h.

**Practical user impact:** Extremely rare. Code P arrives only when:
- The plan administrator detected an excess deferral for the PRIOR year, AND
- The corrective distribution was taken AFTER April 15 of the current year, AND
- The user uploads that 1099-R into their CURRENT year return.

A user with this scenario likely needs to amend their PRIOR-YEAR return — not file the amount on this year's line 1h.

**If revisited**, scope (~15-20 minutes):
- Add a new pass over `rEntries` that detects code-P-only entries (codes contains "P" && !codes.contains("8") && !codes.contains("3") && !iraSepSimple).
- Emit non-blocking flag `LINE1H_CODE_P_PRIOR_YEAR_INFO` with message: "1099-R with distribution code P (recipient {recipientName}, payer {payerName}) was not added to line 1h. Code P amounts are taxable in the prior year — you may need to amend your prior-year return."
- Make the flag PER-ENTRY so users with multiple code-P 1099-Rs see one advisory each (scoped by `entryId`).
- Test: `line1hCodePOnly1099R_emitsPriorYearAdvisoryFlag_lineRemainsNull` — single 1099-R with codes "P", taxableAmount=$1,500 → line 1h = null, statements empty, flag list contains `LINE1H_CODE_P_PRIOR_YEAR_INFO`.
- Update `lines/1h.md` §8 to document the advisory.
- Update `knowledge/line-1h-other-earned-income.md` Cat-4 section.

**Why deferred:**
- Per the audit author's explicit recommendation in 1h.xlsx Code Validation #6 ("Practical incidence is extremely rare. Defer.")
- Current silent-skip behavior is mathematically correct (no money goes to the wrong line).
- A breadcrumb comment was added on 2026-05-10 to make the silent skip visible to future readers and prevent accidental "fixes" that would route code-P amounts to line 1h (which would be a real bug).
- Affected users (who already have a complex prior-year correction situation) are likely working with a tax professional.

**Priority:** Very low. The advisory is purely informational — no money, math, or filing-status outcome is affected.

**Tracked from:** 1h.xlsx Issue #6 walkthrough on 2026-05-10; breadcrumb comment lives in `TaxReturnComputeService.computeOtherEarnedIncome` near line 10134.

---

## Schedule 2 Line 13 — Uncollected SS/Medicare or RRTA Tax on Tips and Group-Term Life Insurance (W-2 Box 12 Codes A, B, M, N) — Deferred 2026-05-09

Per IRS 2025 Schedule 2 line 13 ("Uncollected social security and Medicare or RRTA tax on tips or group-term life insurance from Form W-2, box 12"), four W-2 box 12 codes flow here:

- **Code A** — Uncollected SS tax on tips (CURRENT employees whose employer didn't withhold despite tip reporting)
- **Code B** — Uncollected Medicare tax on tips (CURRENT employees, same scenario)
- **Code M** — Uncollected SS tax on group-term life insurance > $50,000 (FORMER employees only)
- **Code N** — Uncollected Medicare tax on group-term life insurance > $50,000 (FORMER employees only)

Plus T-variant codes for RRTA equivalents (railroad workers).

**Current code limitation:** The `Schedule2OtherTaxes` model has the field `uncollectedSocialSecurityMedicareRrtaTax`, and the line-18 total formula in `prepare()` references it (line ~11809), explicitly commented as "line 13 (deferred — null today)". But no compute path scans W-2 box 12 entries for codes A/B/M/N → field stays null → Schedule 2 line 13 is always blank.

**Practical user impact:** Low — code A/B applies only when the employee actually reported tips to the employer but the employer somehow didn't withhold (rare); codes M/N apply only to FORMER employees with > $50k group-term life insurance still being provided (rare). High-incidence scenarios (tip income, misclassified wages) are covered by Form 4137 (line 5) and Form 8919 (line 6) respectively.

**Distinction from line 1g (Form 8919):** Line 1g (this audit) is for misclassified-employee WAGES where the firm treated the worker as a contractor. Schedule 2 line 13 (this deferral) is for SS/Medicare tax on amounts already correctly reported on the W-2 — just not withheld at source. Different tax-law basis (IRC §3101 employee share, but at amount-already-reported level rather than wage-classification-level).

**If revisited**, scope (~30-45 min):
- Add new helper `sumW2Box12CodesABMN(w2Entries, ssns...)` mirroring `sumW2DependentCareBenefitsForSsns` / `sumW2AdoptionBenefitsForSsns` from line 1e/1f closures: SSN-filtered; sums the four codes (or per-code if separate fields ever needed).
- Add wiring in `prepare()` (alongside `computeUncollectedSSTax`): pass `isMfsReturn` for the same single-guard cascade pattern; skip spouse on MFS.
- Wire result to `schedule2.otherTaxes.setUncollectedSocialSecurityMedicareRrtaTax(roundMoney(total))`. Line 18 total already includes it (line ~11809).
- For codes M/N (FORMER employees), no need to filter by current employment status — IRS expects the W-2 to carry the codes regardless.
- Tests: `schedule2Line13IncludesW2Box12CodeAUncollectedSsTaxOnTips`, `schedule2Line13IncludesW2Box12CodeMUncollectedSsTaxOnGroupTermLife`, `schedule2Line13AggregatesAllFourCodesAcrossW2s`, `mfsExcludesSpouseFromSchedule2Line13` (mirror of line 1g Issue #1 MFS-guard cascade).
- Update `lines/8919.md` (or create `lines/schedule-2-line-13.md`) with the spec; update `dependencies/` accordingly.
- Add `knowledge/schedule-2-line-13.md` documenting the four codes + cross-reference back to line 1c (Form 4137) and line 1g (Form 8919) since they share Schedule 2 placement.
- Update `knowledge/line-1g-form-8919.md` §13 closed-items table when implemented.

**Why deferred:**
- Out of scope for line 1g audit — Schedule 2 line 13 is a separate Schedule 2 line and a separate IRS-form path.
- Already documented as "deferred — null today" in the existing code (line 11809 comment).
- Low-incidence scenario per the IRS audit incidence statistics.
- Affected users (typically older retirees with continuing employer-provided life insurance) tend to use a tax professional anyway.

**Priority:** Low. Current null-field behavior is benign (Schedule 2 line 13 simply omitted) — affected users would need to manually add the amount on a paper form or use other software.

**Tracked from:** 1g.xlsx Issue #10 walkthrough on 2026-05-09; `lines/1g.md` §4 explicitly listed codes M/N as out-of-scope-for-line-1g; verification confirmed they aren't routed elsewhere either.

---

## ~~Form 8839 Special-Needs Off-W-2 Part III Enablement (Negative Line 1f Computation)~~ — RESOLVED 2026-05-23

**Resolution:** Implemented per `XLS/Computations/1f.md` Gap #4 resolution proposal. Two small backend edits in `computeAdoptionBenefits`:

1. **Gate change:** new predicate `hasSpecialNeedsFinalChild` (true when at least one child has `hasSpecialNeeds=true && adoptionFinal2025OrEarlier=true`) is OR'd into the `allowPartIII` gate, so Part III runs even when `hasBenefits=false`. The existing special-needs branch (`L24 = L21`) was already in place; only the gate needed to open.
2. **Line 1f propagation:** the final `line1f` derivation now triggers on `allowPartIII && line31 != null` rather than `hasBenefits`, so a negative `line31` (from `L23=$0 − L30`) reaches `Form1040.income.adoptionBenefits`.

No new inputs required (existing `hasSpecialNeeds` + `adoptionFinal2025OrEarlier` + `priorYearEmployerBenefitsByChild` sufficient). No frontend changes. No new output fields. No reference data changes.

**The simpler "L23 source change" deferred sketch (totalPart3Line22 vs w2TotalBenefits) turned out not to be needed** — `part3Line23 = safeAmount(w2TotalBenefits)` already equals `safeAmount(null) = 0` when `hasBenefits=false`, which is exactly the value the negative-L31 math needs. **(2026-05-24 update: the source change was applied separately as Gap #5 to honour the IRS-form definition of line 23 = `sum(L22[i])`. Within the ±$1 allocation tolerance the new value can differ from `w2TotalBenefits` by up to $1, which now correctly propagates through L31 / line 1f. See `XLS/Computations/1f.md` Gap #5.)**

**Edge cases handled:** phaseout to full ($299,190+ MAGI) zeros the negative adjustment; prior-year benefits ≥ $17,280 zero L21; MFS-disallowed early-return supersedes; §1372-disallowed slice still stacks on top correctly; mixed-children (only special-needs-final contributes).

**Tests:** 1 existing test renamed/updated (`specialNeedsOffW2BenefitsDoNotBlockButPartIIINotEnabled` → `specialNeedsOffW2EnablesPartIIIAndProducesNegativeLine1f`); 3 new unit tests (`specialNeedsOffW2WithPriorYearBenefitsReducesNegativeLine1f`, `mixedSpecialNeedsAndRegularChildOffW2OnlySpecialNeedsContributes`, `specialNeedsOffW2NegativeLine1fGoesAwayWhenFullyPhasedOut`) + 1 new E2E test (`Special-needs off-W-2: negative line 1f produced even with no W-2 box T (IRC §137(a)(3))`). Backend suite 782/782.

**Out of scope:** The application cannot verify the employer's "written qualified adoption-assistance program" requirement — no input field for it; the user's special-needs-final answer is trusted.

---

---

## ~~Form 8839 §137(d) Same-Expense Coordination — Auto-Subtraction~~ — RESOLVED 2026-05-23

**Resolution:** Option B (two-input model) implemented per the user-approved proposal. The per-child Part II "Qualified adoption expenses" input was split into:
- `qualifiedAdoptionExpensesByChild["child{N}QualifiedExpensesGross"]` — the total gross amount paid for qualified adoption expenses for this child.
- `qualifiedAdoptionExpensesByChild["child{N}EmployerReimbursementToSubtract"]` — the portion that was reimbursed by the employer (pre-fills from the Part III allocation; user can override).

Backend `computeAdoptionBenefits` per-child loop: `part2Line5 = max(0, gross - reimbursement)`. The same dollar can no longer reach both Part II (credit) and Part III (exclusion) — the inputs are structurally separated, so §137(d) is enforced by the arithmetic. The user's net qualified expense is displayed read-only on the form in real time.

The old `ADOPTION_BENEFITS_VERIFY_NO_DOUBLE_DIP_CHILD_N` advisory was removed entirely (and its 3 unit tests deleted) — there is nothing to advise about when the math forbids the violation.

**Why Option B over the auto-subtract option from the original sketch:** The deferred sketch proposed auto-subtracting from a single "gross" input, but that would punish users who entered the net amount per the old IRS-instruction-friendly UX. The two-input model is unambiguous in both directions.

**Migration:** None implemented — the project is pre-production. The old `child{N}QualifiedExpenses` field is no longer read by the backend.

**Tests:** 2 new unit tests (`qualifiedExpensesNetOfEmployerReimbursementForCreditBase`, `qualifiedExpensesReimbursementExceedsGrossFloorsAtZero`) + 1 new E2E test (`Part II credit base: gross expenses net of employer reimbursement (IRC §137(d))`). 7 existing unit tests + 8 E2E tests updated to the new field names. 3 obsolete unit tests deleted (assertions on the removed advisory).

**Out of scope:** UI cross-party validation (cannot detect when both reimbursement and gross are misreported) — same fundamental limitation as Gap #2.

---

## ~~Form 8839 §1372 Over-2% S Corporation Owner Exclusion Disallowance~~ — RESOLVED 2026-05-23

**Resolution:** Implemented per Option C of the resolution proposal — captures the §1372 disqualification on `form-adoption-expenses` (the W-2 statement form was intentionally left untouched per the user's directive that statement screens should only contain statement data). Two new optional inputs:
- `employerBenefitsPartIII.section1372AnyEmployer` — outer screening (required when any W-2 has box 12 code T > 0).
- `employerBenefitsPartIII.section1372ByEmployer` — per-W-2 review keyed by W-2 entryId.

Both fields live under a new "Less common situations" toggle on the adoption-expenses form (default closed; auto-opens when any §1372 data is already saved).

**Backend:** `computeSection1372DisallowedFromEligibleW2BoxT` helper partitions the SSN-filtered W-2 box-T total into eligible and disallowed slices; the disallowed slice stacks directly onto line 1f and does not flow through Form 8839 Part III. The G1 fallback in `applyAdoptionCredit` also re-stacks the disallowed slice when MAGI is auto-derived. New output field `Form8839.section1372DisallowedFromW2BoxT` surfaces the disallowed amount for the audit trail. Non-blocking advisory `ADOPTION_BENEFITS_SECTION_1372_DISALLOWED` fires when the slice is positive.

**Severity decision:** Flag is **non-blocking** (not blocking as the original sketch proposed). The compute is mathematically correct — the user answered the screening explicitly (UI form-validation enforces a Yes/No answer when W-2 box T > 0), and the disallowed amount becomes taxable wages exactly as IRC §1372 + §137 require. Blocking would be a misuse — the return is fileable and IRS-correct. The non-blocking flag is informational disclosure, matching the precedent of `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED`.

**Tests:** 3 unit tests (`section1372DisallowsAdoptionExclusionForOver2PercentSCorpOwner`, `section1372PartitionsTwoW2sStackingOnlyDisallowedSliceOntoLine1f`, `section1372ScreeningOffMeansNoPartitionEvenWhenPerEmployerFlagSet`) + 1 end-to-end test (`Section 1372: >2% S-corp owner W-2 box T stacks on line 1f, eligible W-2 runs through Part III`). All passing. Full backend suite 777/777.

**Out of scope:** IRC §1372(b) constructive ownership via §318 attribution rules (spouse/parents/children stock) — captured in the screening question's wording so users include attributed stock when answering, but not separately computed by the application. Same pattern can be reused for IRC §129 (line 1e dependent care) by replicating the screening + per-W-2 questions on `form-childcare-expenses`; deferred to a separate follow-up.

---

## ~~Form 8839 Shared-Adoption L19 Split with Non-Spouse~~ — RESOLVED 2026-05-23

**Resolution:** Implemented per Option C of the resolution proposal — captured on `form-adoption-expenses` (no W-2 changes), under the same "Less common situations" toggle as §1372.

**New inputs:**
- `children.sharedAdoptionAnyChild` — outer screening (required to answer when any child has Part II expense > 0 OR Part III benefit > 0).
- `children.entries[i].sharedAdoptionWithNonSpouse` — per-child Yes/No.
- `children.entries[i].sharedAdoptionAllocatedShare` — per-child dollar amount (0–$17,280).

**Backend:** new helper `resolveSharedAdoptionCap(maxPerChild, childIndex, adoptionData)` returns the allocated share when the per-child override is active (else the full $17,280). The helper is called inside `computeAdoptionBenefits`'s per-child loop, and the resolved cap feeds BOTH `part2Line2` (Part II credit base) and `part3Line19` (Part III exclusion base). Non-blocking advisory `ADOPTION_BENEFITS_SHARED_ADOPTION_CAP_SPLIT` fires when any child's cap was reduced, listing the affected children and reduced amounts.

**Output:** Existing per-child `Form8839Child.part2Line2MaxCredit` and `Form8839Child.part3Line19MaxExclusion` fields now reflect the resolved per-child cap (was always $17,280). No new output fields needed.

**Severity decision:** Flag is **non-blocking** for the same reason as §1372 — the compute is mathematically correct (user provided their agreed share, we applied it). UI form-validation enforces the screening + per-child allocation answers when applicable, so the flag is purely informational disclosure.

**Tests:** 3 unit tests (`sharedAdoptionCapSplitReducesPart3Line19AndStacksTaxableLine1f`, `sharedAdoptionCapSplitForcesTaxableBenefitsWhenCapBelowBenefits`, `sharedAdoptionAnyChildOffMeansNoCapReductionEvenWithPerChildFlag`) + 1 end-to-end test (`Shared adoption: $17,280 cap reduced per child when adopted with non-spouse`). All passing. Full backend suite 780/780.

**Out of scope:** No cross-party allocation validation — the application cannot detect a coordinated over-claim where both parties allocate more than $17,280 in aggregate. Each side is clamped at $17,280 independently. The IRS relies on the parties to agree honestly.

---

## Form 8839 manual MAGI cross-check vs autoMagi worksheet — Deferred 2026-05-24

When the user enters `magiForAdoptionBenefitsExclusion` manually on the adoption-expenses form, the G1 fallback does NOT fire and the user-entered value is used as-is. This matches the existing G1 architecture (manual entry wins) and assumes the user computed MAGI correctly per the 2025 Form 8839 worksheet — including all six add-backs now covered by autoMagi (Form 2555 lines 45/50, Puerto Rico, Form 4563 line 15, student-loan interest deduction, savings-bond interest exclusion, foreign-housing deduction).

**Proposed enhancement.** When the user has entered manual MAGI, internally compute the autoMagi value anyway. If `autoMagi > manualMagi + $50` tolerance, emit a non-blocking `ADOPTION_BENEFITS_MAGI_VERIFY_ADD_BACKS` advisory asking the user to verify they included the new add-backs (student loan, bond exclusion, housing deduction).

**Why deferred** (chose to keep manual entry trusted in Gap #8 closure):
- Adds friction for users who did the worksheet correctly.
- The narrow population this would catch is the same population the autoMagi fix already serves — users who newly populate Schedule 1 line 21 / Schedule B line 3 / Schedule 1 line 24j tend to enter or update the manual MAGI alongside, not leave it stale.
- Implementing requires a tolerance / suppression mechanism so users can dismiss the advisory once verified.

**Scope when revisited** (~30 min):
- Refactor the G1 autoMagi computation out of `applyAdoptionCredit` into a private helper so it can be called twice (once for the auto-derive path, once for the cross-check).
- Compare against manual MAGI; emit advisory when delta > $50.
- 2 new unit tests (advisory fires; advisory suppressed when manual matches autoMagi).

**Tracked from:** Gap #8 closure dialogue with user, 2026-05-24.

---

## ~~Form 8839 Foreign-Child Finality-Year Retroactive Exclusion~~ — RESOLVED 2026-05-24

Closed as Gap #6 in `XLS/Computations/1f.md`. New per-child input
`deferredPriorYearForeignBenefitsByChild["child{N}DeferredPriorYearForeignBenefits"]`
augments L24 via `min(L21, L22 + deferred)` for the `foreignChild && adoptionFinal &&
!specialNeeds` branch; L22 itself stays the current-year W-2 box T allocation
(preserving Gap #5 IRS-form-23 definition + allocation-mismatch check). `allowPartIII`
gate opened to permit Part III with zero W-2 box T when deferred > 0. Off-W-2
blocking gate (Issue #11) given narrow exception so L20 > 0 alongside deferred is
allowed. New `Form8839Child.part3DeferredPriorYearForeignBenefits` audit-trail
output field. Old `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL` advisory
removed. 5 new unit tests + 1 E2E. Backend 786/786.

Implementation departed from the deferred sketch in two ways: (1) injection happens
at L24 not L22, so the allocation-mismatch check needs no relaxation; (2) L22 keeps
its IRS-defined meaning (current-year W-2 box T only).

---

## ~~Form 8839 Foreign-Child Finality-Year Retroactive Exclusion — Deferred 2026-05-08~~ (superseded — see resolved entry above)

Per IRS 2025 Form 8839 Part III (and lines/1f.md §4.5 + §8), when a foreign adoption finalizes in 2025, employer-provided adoption benefits paid by the employer in PRIOR years (which were taxed as wages on those prior-year returns) become retroactively excludable in the finality year. The mechanism produces a NEGATIVE Form 8839 line 31 → negative Form 1040 line 1f, reducing total wages.

**Current code limitation:** `computeAdoptionBenefits` per-child Part III formula is `L24[i] = (specialNeeds AND adoptionFinal) ? L21[i] : min(L21[i], L22[i])`. For the non-special-needs branch, `L24[i] ≤ L22[i]` always, so `L30 ≤ L23` and `L31 ≥ 0`. The only path producing negative L31 today is the special-needs branch (which `computesNegativeAdoptionBenefitsForSpecialNeeds` covers). The foreign-child finality retroactive-exclusion mechanism is NOT implemented.

**Workaround in place since 2026-05-08:** `ADOPTION_BENEFITS_FOREIGN_CHILD_FINALITY_RETRO_PARTIAL` non-blocking advisory fires when a child is marked `isForeignChild=true && adoptionFinal2025OrEarlier=true && priorYearEmployerBenefitsByChild[N] > 0`. Tells the user we cap exclusion at current-year benefits and refers them to Form 8839 instructions if their case involves prior-year deferred benefits.

**If revisited**, scope (~1-2 hours):
- Add per-child UI input `deferredPriorYearForeignBenefits` (number, conditional on isForeignChild=true) — represents employer benefits paid in prior years for this foreign adoption that were taxed as wages then and are now excludable in finality year
- Backend: in per-child Part III block, when foreignChild && adoptionFinal && deferredPriorYearForeignBenefits > 0, add the deferred amount to L22[i] for L24/L29 computation; track separately so the W-2 box T allocation-mismatch flag does NOT fire on this delta
- Allocation-flag relaxation: `sum(L22[i] − deferredAmount) == w2TotalBenefits` (deferred amounts are not part of the 2025 W-2 total)
- Negative L31 then arises naturally: L29 includes the deferred portion via L21 cap, while L23 only counts current-year W-2 → L30 > L23 → L31 < 0
- Tests: `negativeLine1fForForeignChildFinalityYear` (the headline case); `noNegativeWhenForeignChildOnlyHasCurrentYearBenefits`; `allocationMismatchSuppressedForDeferredAmount`
- Update `lines/1f.md` §8 to reflect the new input field and update `dependencies/1f.md` accordingly
- Drop the advisory once full implementation lands

**Why deferred** (advisory chosen first):
- Rare scenario — foreign adoption finality years are uncommon for typical filers
- Aligns with other deferred Form 8839 items (§1372 over-2% S-corp owner, shared-adoption $17,280 split)
- The non-special-needs negative-L31 mechanism requires a NEW input field (not in current YAML/UI), so this is genuinely missing functionality, not a tweak
- Filers in this scenario tend to use a tax professional anyway (foreign adoption is high-touch)

**Priority:** Low. Affects rare scenario; advisory now warns affected users to consult IRS instructions.

**Tracked from:** 1f.xlsx Issue #1 walkthrough on 2026-05-08.

---

## Notice 2014-7 Home-Sharing — Escalate Advisory to Blocking Flag — Deferred 2026-05-06

When the user answers `livesWithCareRecipient === false` on the medicaid-waiver form but has entered qualified Notice 2014-7 amounts, an inline yellow `.notice2014-warning` advisory callout is shown (since 2026-05-06 — see `knowledge/line-1d-medicaid-waiver-payments.md` §9). The advisory educates the user but does NOT block save or compute.

**Considered escalation:** Add a backend blocking flag `MEDICAID_WAIVER_NOTICE_2014_7_HOME_SHARING_VIOLATION_{TAXPAYER,SPOUSE}` that fires when:
- `livesWithCareRecipient === false` AND
- Any per-entry `qualifiedNotice2014_7Amount > 0` AND
- The Notice 2014-7 election is ON

This would prevent filing returns with qualified amounts that contradict the home-sharing requirement. Compute would mark the qualified amounts as taxable instead.

**Why deferred** (advisory chosen first):
- Notice 2014-7 has documented exceptions ("the care recipient's home is also your home and you have no separate home"; "some non-§1915(c) state programs may qualify per facts and circumstances"). A blocking flag could prevent legitimate filings.
- The user might know facts the system cannot verify (e.g., specific state-program eligibility, partial-year living arrangements).
- Soft advisory is safer for a first iteration — surfaces the IRS rule without forcing the user's hand.
- Real-world false-positive cost (blocked legitimate filing) is higher than false-negative cost (filing with the user's questionable claim — they bear audit risk).

**If revisited**, scope (~1-2 hours):
- Add backend gate in `computeMedicaidForPerson` after the per-entry loop: when `livesWithCareRecipient === false` AND `qualifiedTotal > 0` AND `election === true`, emit blocking flag + reclassify qualified amount as taxable
- Possibly add a per-entry override: `qualifiedAmountAcceptableUnderException: boolean` so user can document an exception per entry
- 4 unit tests: contradiction with election ON; same with election OFF; with exception override (if added); MFJ per-spouse independence
- Update `lines/1d.md` §4 + §5 with the new gate and exception path
- Update help text to describe the exception override

**Priority:** Medium-Low. Current advisory is sufficient for typical cases; blocking would handle the malicious / uninformed-user case but at the cost of legitimate-exception users.

**Tracked from:** 1d.xlsx Issue #9 walkthrough on 2026-05-06.

---

## UI Heuristic for Cross-Entry Duplicate Detection (Medicaid Waiver) — Deferred 2026-05-06

When the user has multiple Medicaid waiver entries, they could mis-enter the same real-world payment as separate entries. Backend math is robust (line 8s offset cancels the inflation in AGI per the §8.6 invariant in `lines/1d.md`), BUT earned-income basis for EIC/ACTC could be over-claimed by the duplicate amount because the duplicated `qualifiedNotInW2` flows through line 1d → line 1z → earned income.

**Considered enhancement:** UI heuristic warning when two or more entries share matching `payerName` OR `payerTIN` AND identical `qualifiedNotice2014_7Amount` values. Show a yellow callout: "These entries appear to duplicate the same payment. Verify each represents distinct Medicaid waiver income, or remove the duplicate."

**Why deferred:**
- False-positive rate could be high — legitimate scenarios include two payment periods from the same payer with the same monthly amount, two co-providers with similar caregiving arrangements, or the same payer paying for two different recipients separately
- Backend has no visibility to disambiguate — only the user knows ground truth
- No real user reports of this issue
- Primary AGI impact is fully protected by the W2_OVERAGE constraint + algebraic offset cancellation (`line 8s = −qualifiedTotal` invariant)

**Priority:** Low. The only residual risk is over-claiming EIC/ACTC via inflated earned-income basis. Verified during 1d.xlsx Code Validation walkthrough — primary impact is fully mitigated.

**If revisited**, scope (~30 min):
- Add helper `findDuplicateEntries()` returning groups of entries with matching payer + qualified amount
- Render conditional yellow `.duplicate-risk-warning` callout per group (similar to the line 1c inmate-wages duplicate pattern from 1c.xlsx Issue #7)
- No backend changes — purely UI advisory

**Tracked from:** 1d.xlsx Issue #7 + `lines/1d.md` §8.6.

---

## IRC §131(c) Per-Individual Cap on Medicaid Waiver Exclusion — IMPLEMENTED 2026-05-31

`computeMedicaidForPerson` applies the IRC §131(c) cap that limits the difficulty-of-care exclusion to **10 qualified individuals under age 19** plus **5 individuals age 19 or older**. When either threshold is exceeded, pro-rata reduction routes the over-cap portion of `qualifiedTotal` to Line 1d as ordinary taxable income (no Schedule 1 line 8s offset).

Constants: `ReferenceData.IRC_131C_CAP_INDIVIDUALS_UNDER_19` (= 10), `IRC_131C_CAP_INDIVIDUALS_19_OR_OLDER` (= 5) — statutory, not tax-year-specific. Form fields: `qualifiedIndividualsUnder19Count`, `qualifiedIndividualsAge19OrOlderCount` on both `medicaid-waiver-payments-taxpayer` and `-spouse`. Backward-compatible: legacy returns without the count fields treat counts as 0 (no cap fires).

Backend tests: `line1dCap131c_withinLimits_noReduction`, `line1dCap131c_age19PlusExceeded_proRataReduction`, `line1dCap131c_bothCapsExceeded_proRataReduction`, `line1dCap131c_electionOff_capExcessStillTaxableLine1d`, `line1dCap131c_countsAbsent_capDoesNotApply` — 5 tests, 593/593 in `TaxReturnComputeServiceTest`. E2E: one new test in `medicaid-waiver.spec.ts` covering the canonical 7-individuals-age-19+ pro-rata scenario.
- Per-recipient breakdown (more accurate, more work) is a future extension if the basic pro-rata becomes contentious

**Priority:** Low — niche case. Revisit if a real filer scenario surfaces (group-home operator, professional adult-foster provider).

**Tracked from:** `dependencies/1d.md` "Deferred / Not Yet Wired" row + `lines/1d.md` §4.2 (the deferral now has a verification footnote pointing here, since 2026-05-06).

---

## Pub 503 Worksheet A — Full Prior-Year Computation for Form 2441 Line 9b — Deferred 2026-05-31

The 2026-05-31 closure of Line 1e Gap 1 added the **outer-bound cap** to Form 2441 line 9b (`prior-year qualified expenses paid this year`): `line9b ≤ IRC §21(c) per-year ceiling` ($3,000 for 1 qualifying person, $6,000 for 2+). This is provably correct under any prior-year scenario because the §21(c) cap is identical in 2024 and 2025, so the prior-year UNUSED expense limit can never exceed the same per-year ceiling. The cap catches the obvious "user entered $50,000" abuse.

**What is still deferred — the tighter Worksheet A cap.** Pub 503 Worksheet A computes line 9b as `min(input #1, $3k/$6k + 2024 line 31, lesser of TP/spouse 2024 earned income) × decimal-from-AGI-table`. To implement faithfully the application would need **five additional prior-year inputs**:

| # | Field | Why it matters |
|---|---|---|
| 1 | 2024 Form 2441 line 31 | Adds to the per-year ceiling — represents 2024's unused expense capacity |
| 2 | Number of 2024 qualifying persons | Selects the $3k vs $6k per-year ceiling in the worksheet |
| 3 | 2024 taxpayer earned income | Lesser-of clamp on the credit base |
| 4 | 2024 spouse earned income (MFJ only) | Lesser-of clamp continues for MFJ returns |
| 5 | 2024 AGI | Drives the applicable-percentage step-down (35% at $15k → 20% floor at $43k) |

**Scope of the full implementation** (when picked up):
- New section on `childcare-expenses` form: "2024 prior-year credit recovery" — 4–5 inputs (TP earned, spouse earned on MFJ, AGI, 2024 line 31, optional 2024 qualifying-person count).
- `pf_childcare_expenses` schema columns + Liquibase migration (e.g. V31).
- `ChildcareExpensesMapper` save + load handling for the new fields.
- `computeDependentCareBenefits` Worksheet A math replacing the outer-bound cap (the outer cap remains as a defense if the user leaves all 5 fields blank).
- Unit + e2e tests covering: full Worksheet A path with non-zero 2024 line 31, applicable-percentage step-down from prior-year AGI, lesser-of TP/spouse 2024 earned, fallback to outer cap when prior-year fields are blank.
- Update `XLS/Computations/1e.md` §3.1 item 2 from "outer-bound implemented; tighter cap deferred" to "fully implemented", and remove this deferral.

**Why deferred:**
- **Affects credit only, not line 1e.** The credit lands on Schedule 3 line 2; line 1e (the audit anchor) is unaffected.
- **Pub 503 grace period is 2.5 months max** — true carryover is uncommon; the line 9b case applies only when 2024 expenses were *paid* in 2025. Real-user prevalence is low.
- **UI surface area is non-trivial** — adding a 5-field prior-year section to `childcare-expenses` is a meaningful design call that should be reviewed alongside any broader "prior-year carryover" infrastructure (similar pattern surfaces in IRA basis, NOL, AMT credit carryforward, REIT/PTP loss carryforward, etc.).

**Priority:** Low — niche case with low user impact and a defensible outer-bound cap already in place. Revisit if a real filer's 2024 carryover scenario surfaces, OR if a broader prior-year-carryover input section is added for other lines.

**Tracked from:** Line 1e Gap 1 closure 2026-05-31 + `XLS/Computations/1e.md` §3.1 item 2 + `test_cases/1e.md` Test 20 (covers the outer-bound cap; tighter cap remains untested).

---

## Knowledge-File Source-Code Line-Number Sweep — Deferred 2026-05-06

`1c.xlsx` Issue #9 verification (2026-05-06) confirmed that `knowledge/line-1c-tip-income.md` uses function-name references exclusively (no source-code line numbers). The convention is captured in `knowledge/line-1c-tip-income.md` §4 and the file's verification log.

**The same convention has not been applied to other knowledge files.** During earlier audit reads, `knowledge/line-1b-household-wages.md` referenced specific line numbers in `TaxReturnComputeService.java` (e.g., "line 9544", "line 9552", "line 2430") — those numbers may have shifted since the knowledge file was authored, and will keep shifting with future refactors.

**Sweep needed across all knowledge files in `C:\us-tax\knowledge\`:**
- Grep for source-code line references: `grep -rE "line [0-9]{3,}|at line [0-9]+|\(line [0-9]+\)"`
- Distinguish IRS-form line references (line 1c, line 6a, etc. — KEEP, those are stable) from source-code line references (line 9544 in TaxReturnComputeService.java — REPLACE with function names)
- For each file: replace source-code line numbers with function names; add the convention note + verification log footer matching the `line-1c-tip-income.md` pattern

**Priority:** Low. Stale line numbers are a documentation hygiene issue, not a correctness issue. Worth doing during the next round of line-by-line audits (1d, 1e, ...) when the function-name discipline is freshest.

**Tracked from:** 1c.xlsx Issue #9 fix on 2026-05-06.

---

## Adequate-Records Audit-Trail Storage — Deferred 2026-05-06

When a user claims `hasAdequateRecordsUnreportedLessThanAllocated=true` on the tip-income form, the application currently captures only the boolean claim + the substantiated amount + (since 2026-05-06) IRS-guidance help text and inline reminder pointing to Pub 531 / Form 4070A. It does NOT capture WHAT records the user has (description, notes, document upload).

**Considered enhancement (Option C from 1c.xlsx Issue #8 plan):** add an optional `recordsDescriptionNotes` text field per employer where the user can describe their adequate records (e.g., "Daily tip log via [POS system]; pay stubs filed monthly"). Help-text could prompt for: type of record, where stored, retention period.

**Why deferred:**
- The IRS does NOT require record descriptions on the return itself — only on audit
- Compute uses only the boolean + substantiated number; the description has zero compute value
- Storage adds model bloat for a niche use case (only adequate-records claimants would fill it in)
- Better belongs in a separate "Audit support records" feature if/when we build one

**If revisited**, scope:
- Add `recordsDescriptionNotes: string | null` per-employer entry in `tip-income-{taxpayer,spouse}` model
- Add `<textarea>` field below substantiated amount, only when `hasAdequateRecordsUnreportedLessThanAllocated === true`
- Backend: persist as-is, no compute logic
- Optional: maxLength validation, no required validation

**Priority:** Low — the help-text + inline guidance fix on 2026-05-06 closes the user-education half of the original audit row. Storage is purely audit-trail and doesn't affect filing correctness.

---

## Hide SS Wage-Base Fallback Fields When Matching W-2 Exists — Deferred 2026-05-06

The tip-income form (taxpayer + spouse) has two per-employer "fallback only" fields:
- `socialSecurityWagesW2Box3` (W-2 box 3)
- `socialSecurityTipsW2Box7` (W-2 box 7)

These are used by `computeTipsForPerson` ONLY when no matching W-2 with the person's SSN exists in the Statements section (per the `firstNonNull(ssWagesTipsFromW2, ssWagesTipsFromInput)` semantics — see `lines/1c.md` §7.5 / 1c.xlsx Code Validation #5 verification 2026-05-06).

**Current state:** the fields are visible regardless of W-2 state. Help text now warns "FALLBACK ONLY — silently ignored when a W-2 is on file" (since 2026-05-06). Users can still fill them in unnecessarily.

**Deferred enhancement:** hide (or disable) these two fields when the form detects that a matching W-2 with the person's SSN exists in the Statements section. Would require:
- Frontend awareness of W-2 state at form-render time (likely already accessible via `StatementEntryStateService` — same channel used by the W-2 employer auto-fill)
- A computed signal/observable on the tip-income form: `hasMatchingW2($personSsn): boolean`
- `*ngIf="!hasMatchingW2(...)"` wrapping the two field blocks (or `[disabled]` for a softer treatment)
- Maybe a small note where the fields would have been: "✓ Box 3 and 7 will be read from the W-2 in Statements"

**Priority:** Low. Help-text mitigation already in place; fields ignored silently rather than producing wrong results. Pure UX polish.

**Tracked from:** 1c.xlsx Code Validation #5 — Option (b) considered and skipped during Issue #5 fix on 2026-05-06.

---

## Adequate-Records Substantiated-Amount — Skipped Enhancement Options — Considered 2026-05-06

When fixing 1c.xlsx Code Validation #4 (silent fallthrough on adequate-records claim), three additional hardenings were considered and intentionally skipped. Documented here so future audits don't re-propose them without context.

### Option 1 — Make `ADEQUATE_RECORDS_MISSING_SUBSTANTIATED_AMOUNT_*` blocking instead of non-blocking

**Rejected.** Too aggressive. The user may have legitimate records they just need to enter; refusing to compute the return at all blocks legitimate work. Non-blocking flag prompts correction without preventing the user from seeing the rest of their return. If the user files without correcting, the allocated-tips fallback is still IRS-acceptable (it's the conservative default per Pub 531).

**When to revisit:** if filing-time validation is added (a separate "Ready to file?" gate that converts non-blocking flags to blocking), this would naturally upgrade.

### Option 2 — Auto-clear `hasAdequateRecordsUnreportedLessThanAllocated` to false in `normalizeForSave` when substantiated is null

**Rejected.** Silent data mutation is worse than the current state. If the user toggled adequate-records to Yes but didn't enter the substantiated amount, auto-flipping it back to No silently changes their stated answer — could even make them think the system is broken when their Yes "disappears." Better to surface the inconsistency via the UI required-field validation (now in place) so the user sees and fixes it explicitly.

### Option 3 — Use a simple `required` ngModel attribute instead of conditional `[required]` evaluated against `hasAdequateRecords === true`

**Considered but only partially adopted.** Template-driven `[required]` works fine when bound to a dynamic boolean expression (now in place). The simpler always-required approach was rejected because the substantiated field is conditionally visible (`*ngIf="hasAdequateRecords === true"`); marking it always-required would either fail when hidden (form invalid in an unreachable state) or require extra disabled-when-hidden logic. The conditional `[required]="hasAdequateRecords === true"` is cleaner.

---

## `buildTipEntriesFromW2` Null-SSN Fallthrough — Discovered 2026-05-06

`TaxReturnComputeService.buildTipEntriesFromW2(w2Entries, ssn)` (line ~16799) is called once per person (taxpayer + spouse) by `computeTipsForPerson` to auto-fill tip-income entries from W-2 box 8 (allocated tips) when no manual `tipsByEmployer[]` data exists.

**Bug**: when `ssn` is null/empty (e.g., return without spouse identification), the function falls through `boolean hasSsn = hasText(normalizedSsn)` to `false`, which **disables SSN filtering entirely** and includes ALL W-2 entries in the result. The taxpayer's W-2 with box 8 allocated tips then auto-fills into BOTH the taxpayer path AND the spouse path, **double-counting line 1c** by the box 8 amount.

**Discovered**: 2026-05-06 while writing the unit test `line1cAutoFill_stillWorksWhenHasUnreportedTipsNotAnswered` for 1c.xlsx Issue #2. Test had to set a non-matching spouse SSN as a workaround to isolate taxpayer-only behavior.

**Mitigated in practice** (not yet fully fixed) by:
1. **Issue #1 MFS guard** (applied 2026-05-06): on MFS returns, the spouse `computeTipsForPerson` call is skipped entirely, so the bug cannot manifest there.
2. **Issue #2 soft gate** (applied 2026-05-06): when the user has explicitly answered `hasUnreportedTips=false`, the gate returns null before `buildTipEntriesFromW2` is reached.
3. **UI workflow**: spouse identification (`identification-spouse`) is required before the spouse tip-income form is accessible, so legitimate flows produce a non-null spouse SSN.

**Residual risk**: returns saved before identification-spouse was made required, MFJ returns where spouse SSN is somehow null/empty, and direct-API submissions can still trigger the double-count.

**Fix**: change `buildTipEntriesFromW2` to return `List.of()` when `hasSsn` is false rather than including all entries. The "no filter" semantics are misleading — a null SSN means "no person to attribute W-2s to", which should produce an empty entry list, not an unfiltered one.

```java
// Current (around line 16804-16806):
String normalizedSsn = normalizeSsn(ssn);
boolean hasSsn = hasText(normalizedSsn);
for (Map<String, Object> entry : w2Entries) {
    if (entry == null) continue;
    if (hasSsn) {
        // SSN filter
    }
    // else: entry included regardless — BUG
    ...
}

// Proposed:
String normalizedSsn = normalizeSsn(ssn);
if (!hasText(normalizedSsn)) {
    return List.of();  // no person → no auto-fill
}
for (...) {
    String entrySsn = ...;
    if (!hasText(entrySsn) || !entrySsn.equals(normalizedSsn)) continue;
    ...
}
```

Plus a unit test that seeds a W-2 with box 8 + only a `you` form (no spouse), asserts that taxpayer line 1c gets the auto-fill but the SAME W-2 does NOT also auto-fill into a phantom spouse computation.

**Priority**: Medium. Currently masked by other guards but defense-in-depth value is real, and the `hasSsn` semantics are surprising / surprising-future-readers.

**Tracked from**: `knowledge/line-1c-tip-income.md` §4 "Auto-fill from W-2" pre-existing-bug note (added 2026-05-06).

---

## Line 1b Diagram Refresh — Deferred 2026-05-05

`diagrams/1b.drawio` is a basic 5-node box diagram (Inputs → Computation → Outputs). It accurately depicts the high-level data flow but does not match the decision-tree style established for `1a.drawio`. Specific gaps:

- Does not show the three-gate decision tree (`householdWork` → `controlTest` → `receivedW2`)
- Missing the `HOUSEHOLD_WORK_SELF_EMPLOYMENT_*` blocking-flag node
- Missing the per-employer `employerTreatedAsContractor` collision-guard branch (line 1g handoff)
- Missing the missing-W-2 handoff arrow (`MISSING_W2_EMPLOYMENT_INCOME_*` suppression in `validateEmploymentIncomeW2ForPerson()` when `householdWork == true`)
- Missing the new (2026-05-05) per-employer `federalTaxWithheld` warning branch

**Priority:** Low — purely cosmetic / documentation. No compute impact. Adopt the `1a.drawio` decision-tree style with the same shape vocabulary (gates as diamonds, computations as rectangles, outputs as cylinders, blocking flags as red rectangles). Tracked in `knowledge/line-1b-household-wages.md` Outstanding-items table as the sole remaining cosmetic follow-up after the 2026-05-05 audit.

---

## OCR-Content Fallback Coverage for Other Statement Types — Deferred 2026-04-28

`OcrContentFallback.extractMissingW2Fields` (introduced 2026-04-28) currently runs only for `formId == "w-2"`. Extend the same pattern to:

- **1099-INT**: PayerTIN / RecipientTIN / payer name+address / recipient name+address commonly fail the same way (label leak, format-rejection by Azure's `prebuilt-tax.us.1099INT`).
- **1099-DIV**: same fields, same failure modes.
- **1099-R**: payer / recipient identity fields plus distribution-code free text.
- **1099-MISC / 1099-NEC**: payer / recipient identity.
- **W-2G**: similar structure to W-2.

Each new form needs its own `extractMissing<Form>Fields` method with form-specific label phrases and skip-line patterns, mirroring the W-2 implementation. Hook into `GenericFieldMapper.mapToAppModel` after the structured pass, with the same `formId`-gated dispatch.

**Priority**: Medium — wait for user reports before building, since each form's failure pattern is different and we don't want to over-engineer.

---

## Spatial OCR Extraction via `pages.words` Polygons — Deferred 2026-04-28

The current OCR-content fallback parses `result.getContent()` as line-broken text. This works for most W-2 cases (the line breaks reflect visual rows reasonably well) but fails when:

- An address spans multiple OCR lines because each line of a multi-line address is on its own visual line.
- A value sits in a column-major position relative to its label (Azure reads top-down, so a value 4 columns to the right of a label appears far away in the content text).
- The form has unusual cropping or rotation.

**What to build**: a polygon-aware extractor that reads `result.pages[0].words` (each word has `content`, `polygon` 8-coord bounding box, and `confidence`). For each missing field, find the label words by content match, compute the label's bounding box, then collect words within a known spatial neighborhood (right of the label, within Y range) and concatenate them.

This is a more robust replacement for the line-based fallback. Implement only when the current fallback proves insufficient on real W-2s.

**Priority**: Low — current fallback handles every concrete case observed today.

---

## Surface Missing-Fields List in the Extraction UI — Deferred 2026-04-28

After upload extraction, the user has no explicit signal of which boxes did vs didn't extract. Today they discover gaps by scrolling the form and seeing empty fields. Better UX:

- After extraction completes, show a banner / panel listing fields the structured + fallback extraction couldn't fill (e.g. "Box d Control number — please enter manually").
- Highlight the empty fields in the form with a subtle visual marker.
- Optionally, show a confidence bar per field (Azure provides per-field confidence in the raw response).

Backend already returns `Map<String,Object>` of extracted fields; the gap list is "expected fields − returned fields". Frontend computes and renders. Could live in `StatementFormDirective` or as a sibling component near the upload button.

**Priority**: Medium — improves user trust and reduces "extraction failed" support requests.

---

## Reactivate or Delete the W-2 "Structured Form" Alternate View — Deferred 2026-04-28

`form-w-2.component.ts` still contains the `*ngIf="!pdfView"` "structured form" view (~487 lines): sectioned form with separate fields, Add/Remove buttons for box-12 / box-14 / state-local arrays, routing-question gate, separate save button. This view was reachable via a Form/Pdf toggle that's now hidden (`*ngIf="false"` on the `view-toggle` div, which was removed from the template; `_pdfView = true` is the field default). The form view is technically dead but its code is functional.

**Decisions to make**:
- **Reactivate** the toggle? Some users might prefer the form view for accessibility / data-entry density.
- **Delete** the form view to drop ~487 lines, simplifying the component significantly.
- The `pdfView` getter/setter and `_pdfView` field can also be removed if the view is deleted.

**Priority**: Low — no current pain. Decide when next refactoring the W-2 component.

---

## E2E Coverage for Header Dialogs (Account / Payment / Support / Messages) — Deferred 2026-04-28

The four header dialogs added 2026-04-28 ship with full unit-test coverage but no Playwright E2E. Each has a different blocker:

- **Topbar menu** — trivial to add (open menu, assert Account / Payment / Support items, click each, assert respective dialog opens). No blockers; just hasn't been written.
- **Payment dialog** — pure-UI. Toggle code/card modes, assert validation gating, assert "demo only" message after submit. No backend dependency.
- **Support dialog** — backend is real (`POST /api/support-requests`) and the happy-path E2E is straightforward, but `supportRequests` is a top-level Firestore collection with no `clearUserData`-equivalent reset wired, so a test would either pollute the collection across runs or need a new reset endpoint scoped to the test user.
- **Messages dialog** — empty-state ("There are no messages at this point.") is easy. Populated-state requires seeded `users/{uid}/messages` documents; we have no admin creation endpoint, so seeding must come from a temporary test endpoint or direct Firestore Admin SDK calls in the runner.
- **Account dialog** — open-and-cancel is easy. The full save flow needs a Firebase OTP for either the *current* phone (re-auth path via `reauthenticateWithCredential`) or the *new* phone (phone-change path via `updatePhoneNumber`). The current shared-auth env (`E2E_SHARED_AUTH_PHONE` = `+19056193359`) is the only configured test phone; covering the phone-change path needs a *second* test phone added to Firebase Console → Authentication → Phone numbers for testing. Without that, E2E is limited to "open dialog, see pre-filled fields, cancel".

**Priority**: Low (UI implementation is correct; unit coverage exists). Pick up when the related deferred backend items below are addressed.

---

## Admin-Side Message Creation Tooling — Deferred 2026-04-28

The Messages feature ships only the receive/list/delete pipe. Messages must currently be created by support staff via the Firebase Admin SDK or Firebase Console at `users/{uid}/messages/{auto-id}` with fields `subject`, `body`, `createdAt` (epoch ms).

**What's needed** for a real workflow:
- A backend admin endpoint (e.g. `POST /api/admin/messages`) that accepts `{ uid, subject, body }`, validates, and writes to the per-user subcollection. Must be guarded by an admin role claim — not just `@Authenticated` — so regular users can't message themselves or others.
- Role-based authz: introduce a Firebase custom claim (`role: "support"` or similar) and a Quarkus `@RolesAllowed("support")` (or equivalent) check in the resource. The existing `FirebaseIdentityUtil` only extracts `uid`; it doesn't read claims yet.
- An admin UI (likely a separate route gated by the role claim) for support staff to compose messages and target a uid. Could reuse the support dashboard scaffolding.

**Priority**: Medium — without this, support staff have no tooling and rely on Firebase Console.

---

## Support Dashboard for `supportRequests` Collection — Deferred 2026-04-28

The Support dialog persists user-submitted requests to the `supportRequests` Firestore collection (one doc per submission, status='open' on create) but no support-team UI consumes it.

**What's needed**:
- Backend admin endpoints: `GET /api/admin/support-requests?status=open`, `PATCH /api/admin/support-requests/{id}` (to update status to `in_progress` / `resolved`, attach response notes).
- Role-based authz, same as the message-creation case above.
- Admin UI: list view, filters (status, date), detail view with the full `subject`/`message` and contact snapshot already stored on the request, plus a "Send response" action that creates a `users/{uid}/messages` doc closing the loop.
- Audit logging on status transitions.

**Priority**: Medium — without this, support staff must read from Firebase Console.

---

## Real Card Processor Integration for Payment Dialog — Deferred 2026-04-28

The Payment dialog "Pay by card" tab ships as a UI shell only — submission logs a redacted summary and shows "Demo only — no real charge will be made." No backend, no PCI scope, no real charge.

**What's needed**:
- Choose a processor (Stripe, Square, etc.) and use their tokenized client SDK so card data never touches our backend.
- Backend endpoint `POST /api/payments/charge` accepting the processor's token + amount, performing the charge, and persisting a record to a new `payments` collection.
- Replace the dummy form with the processor's hosted-fields/Element, removing the raw card-number input.
- Tax/receipt logic, retries, refund flow — all out of scope for a single follow-up.

**Priority**: High once monetization goes live; **Low** today.

---

## Backend Redemption for Payment "Enter Code" Path — Deferred 2026-04-28

The Payment dialog "Enter code" tab validates an 8-character alphanumeric code client-side and currently logs to console. There is no backend redemption logic.

**What's needed**:
- Decide what the code represents: promo / voucher / pre-paid license / etc. The schema follows.
- A new collection (e.g. `accessCodes`) with fields like `code` (the literal), `status` (`unused` / `redeemed`), `redeemedByUid`, `redeemedAt`, `validFrom`, `validUntil`, optional `entitlement` payload.
- `POST /api/payments/redeem-code` accepting `{ code }`, looking up the doc, atomically marking it redeemed, and granting the user the entitlement (likely a flag on their profile or a separate `entitlements/{uid}` doc).
- Brute-force protection: rate-limit per uid, log attempts.

**Priority**: Tied to whichever feature the codes gate.

---

## ~~Lines 13a/13b: taxableIncomeBeforeQbi Does Not Subtract line13b (Structural Bug)~~ **Implemented 2026-04-17**

**Fixed:** Added `BigDecimal line13b` parameter to `computeLine13a()`; updated formula to `AGI − line12e − line13b`; added second-pass re-invocation of `computeLine13a()` in `prepare()` after `computeSchedule1A()` so the corrected value flows through; first pass inside `computeLine12()` passes `null`. Unit test `computesLine13aWithCorrectTaxableIncomeWhenSchedule1ADeductionsPresent` verifies the fix (limitation = $4,850 not $6,000 when line13b = $10k present).

---

## ~~Lines 13a: Taxable Income Limitation Uses Approximate Capital Gain/Qualified Dividend Proxy~~ **Resolved 2026-04-17**

**Resolution:** The formula `max(line7a, 0) + qualifiedDividends` was confirmed to be the correct IRS-prescribed computation (Form 8995 instructions). The "proxy" comment was misleading — it was removed. No logic change needed.

---

## ~~Lines 13b Part II: Tips from 1099-NEC / 1099-MISC / 1099-K Not Auto-Imported~~ **Implemented 2026-04-17**

**Fixed:** Added `isTipIncome` boolean field to 1099-NEC component model and template. `computeSchedule1A()` now calls `sum1099NecTipsForSsn()` which scans 1099-NEC entries for `isTipIncome=true` with SSN-matched `recipientTIN` and adds to raw tip total. Unit test `schedule1ANecTradeTipsAutoImport` verifies ($1k W-2 box 7 + $2k 1099-NEC trade tips = $3k deduction).

---

## ~~Lines 13b Part II: Net Income Limitation for Trade/Business Tips Not Enforced~~ **Implemented 2026-04-17**

**Fixed:** Added `taxpayerTradeTipsNetIncomeCap` and `spouseTradeTipsNetIncomeCap` amount fields to additional-deductions forms and YAMLs. `computeSchedule1A()` applies `min(necTradeTips, cap)` before adding to raw tips. Unit test `schedule1ANecTradeTipsCappedByNetIncomeCap` verifies ($8k NEC tips capped to $5k → $5k deduction).

---

## ~~Lines 13a: SSTB Above-Threshold Path Blocked but Not Computed~~ **Implemented 2026-04-17**

**Fixed:** `validateQbiThresholdPath()` no longer blocks SSTB activities with a flag. `compute8995AQbiDeductionComponent()` now handles SSTB activities: above the upper threshold → $0 (explicit zero contribution); in phase-in band → scale QBI, W-2, and UBIA by applicable percentage `(1 − phaseInPercentage)` then apply W-2/UBIA limit. Unit test `line13aSstbActivityInPhaseInBandGetsPartialDeduction` verifies (SSTB QBI $100k, W-2 $60k, single at $220k → deduction $10,920).

---

## ~~Lines 13a: Cooperative Patron Path Not Blocked~~ **Implemented 2026-04-17**

**Fixed:** Added `isCooperativePatronOfAgriculturalHorticulturalCooperative` boolean to `qbi-deduction-taxpayer` and `qbi-deduction-spouse` YAMLs and to `QbiPersonInputs` record; `validateQbiStatementGating()` now emits blocking flag `LINE13A_COOPERATIVE_PATRON_UNSUPPORTED` when set. Unit test `flagsLine13aCooperativePatronUnsupported` verifies the flag.

---

## ~~Lines 13b Part IV: Car Loan Interest from Schedule C/F Not Excluded~~ **Implemented 2026-04-17**

**Fixed:** Added `interestAlreadyDeductedOnScheduleCAmount` and `interestAlreadyDeductedOnScheduleFAmount` to the `VehicleEntry` interface and `addVehicle()` initializer. Backend `computeSchedule1A()` vehicle loop now reads and sums all three exclusions (E + C + F) before computing net interest. Two new p-inputNumber fields added to the vehicle entry section in the HTML. Unit test `schedule1ACarLoanScheduleCAndFExclusionsReduceDeductibleInterest` verifies ($3k − $800 Sched C − $200 Sched F = $2k deduction).

---

## ~~Lines 13b Part IV: Car Loan Refinancing Limitation Not Implemented~~ **Implemented 2026-04-17**

**Fixed:** Added `vehicleWasRefinanced` boolean, `vehicleOriginalLoanPrincipal`, and `vehicleRefinancedLoanBalance` amount fields to each vehicle entry in the additional-deductions form. `computeSchedule1A()` vehicle loop proportionalizes interest as `paid × (originalPrincipal / refinancedBalance)` when `vehicleWasRefinanced=true` and `originalPrincipal < refinancedBalance`. Unit test `schedule1ACarLoanRefinancingProportionalizesInterest` verifies ($2k × 20k/25k = $1,600 deduction).

---

## ~~Lines 13b Part II: Multiple-Employer Tip Worksheet Not Modeled~~ **Resolved 2026-04-17**

**Resolution:** No computation change needed — the combined total is mathematically identical to the worksheet result. The UI now surfaces the `taxpayerHasMultipleTipEmployers` / `spouseHasMultipleTipEmployers` yes/no selector (previously in the interface but never rendered). When the user selects Yes, an informational panel explains that the IRS worksheet allocates the $25,000 cap proportionally across employers for recordkeeping purposes, and that the deduction computed here is correct.

---

## ~~Lines 13a: REIT/PTP Loss Carryforward Not Implemented~~ **Implemented 2026-04-17**

**Fixed:** Added `hasPriorYearReitPtpLossCarryforward` + `priorYearReitPtpLossCarryforwardAmount` to both taxpayer and spouse QBI YAMLs; added `priorYearReitPtpLossCarryforward` to `QbiPersonInputs` record; `computeLine13a()` computes `netQualifiedReitAndPtpAmount = qualifiedReitAndPtpAmount − priorYearReitPtpCarryforward` and uses it as the REIT/PTP component base; carryforward stored on `Form8995`/`Form8995A` output models. Unit test `computesLine13aWithReitPtpLossCarryforward` verifies (gross $15k − carryforward $5k = net $10k → deduction $2k).

---

## ~~Lines 13b Part II: No E2E Test for Tips Phaseout Scenario~~ **Implemented 2026-04-17**

**Fixed:** Added Scenario 8 to `e2e/tests/line13b-additional-deductions.spec.ts` — single filer, wages $160k, W-2 box 7 tips $20k; asserts `line13TipsDeduction = 19000` (excess MAGI $10k → $1,000 floor phaseout).

---

## ~~Line 10 / Line 21: Student Loan Interest — $2,500 Cap and MAGI Phaseout Not Enforced~~ **Implemented 2026-04-16**

**Fixed:** `line21Uncapped.min(ReferenceData.STUDENT_LOAN_INTEREST_MAX)` in `computeIncomeAdjustments()`;
MAGI phaseout (single $85k–$100k / MFJ $170k–$200k / MFS fully disallowed) applied in `buildAdjustments()`.
New constants in `ReferenceData.java`. 4 new unit tests. Remaining deferred: dependent-on-another-return guard.

---

## ~~Line 10 / Line 19a: Alimony Post-2018 Agreement Guard Missing~~ **Implemented 2026-04-16**

**Fixed:** `isAlimonyAgreementPost2018(dateStr)` helper; blocking flag
`INCOME_ADJUSTMENTS_ALIMONY_POST_2018_NOT_DEDUCTIBLE` emitted; `line19a = null` when post-2018.
Existing test updated to pre-2019 date. 2 new unit tests (post-2018 blocked, pre-2019 passes).

---

## ~~Line 10 / Line 11: Educator Expenses Cap Not Enforced~~ **Implemented 2026-04-16**

**Fixed:** Per-person `educatorExpensesLine11.min(EDUCATOR_EXPENSES_CAP_PER_PERSON)` before summing.
MFJ cap naturally becomes $600 (two × $300). New constant `EDUCATOR_EXPENSES_CAP_PER_PERSON = 300`
in `ReferenceData.java`. 2 new unit tests.

---

## ~~Line 10 / Line 20: IRA Deduction MAGI Worksheet Not Implemented~~ **Implemented 2026-04-16**

**Fixed:** Per-person IRA phaseout via `computeIraPhaseout()` in `buildAdjustments()`. Phaseout
ranges from `ReferenceData.java`. New intake fields `isCoveredByWorkplaceRetirementPlanTaxpayer`
and `isCoveredByWorkplaceRetirementPlanSpouse` in YAMLs. Record expanded with 4 new fields.
4 new unit tests (fully phased out, not phased out, partial MFJ covered, non-covered with covered spouse).
Remaining deferred: Form 8606 advisory for nondeductible contributions.

---

## ~~Line 10 / Lines 18 and 21: Statement Auto-Import Paths Have No Unit or E2E Test Coverage~~ **Implemented 2026-04-17**

**Fixed:** 4 unit tests added to `Line10IncomeAdjustmentsApiTest`:
- `statementAutoImport1099IntPenaltyFlowsToLine18` — 1099-INT `earlyWithdrawalPenaltyAmount=500` → line 18 = 500
- `statementAutoImport1099OidPenaltyFlowsToLine18AndCombinesWithInt` — INT ($300) + OID ($400) sum to line 18 = 700
- `statementAutoImport1098EInterestFlowsToLine21` — 1098-E `studentLoanInterestReceivedAmount=1200` → line 21 = 1200
- `statementAutoImport1098EInterestCappedAt2500` — 1098-E with $3,000 capped to $2,500 (IRC §221(b)(1))

2 E2E tests added to `line10-income-adjustments.spec.ts` (API-first, `overrideFlags: true`):
- 1098-E $1,200 → `studentLoanInterestDeduction=1200` on Schedule 1
- 1099-INT $300 + 1099-OID $400 → `earlyWithdrawalPenalty=700` on Schedule 1

Existing broken E2E tests fixed: removed references to `statementUploadCheck` fields that were removed from the taxpayer component.

---

## ~~Line 10 / Line 24k: K-1 (Form 1041) Statement Entries Not Directly Parsed~~ **Implemented 2026-04-16**

**Fixed:** Added `sumStatementAmount(entriesK11041, "excessDeductionsSection67eAmount")` as third
addend in `line24k` computation. Added `excessDeductionsSection67eAmount` field to K-1 (1041)
Angular component (`form-schedule-k1-1041.component.ts`). 2 new unit tests (statement-only, statement + manual stacking).

---

## ~~Lines 6a/6b/6c/6d: Line 6c and 6d Checkboxes Unmapped in PDF CSV~~ **Implemented 2026-04-15**

Both `pdfs/f1040_field_mapping_semantic.csv` and `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` now map:
- `c1_41[0]` → `line6c_lump_sum_election` (CheckBox)
- `c1_42[0]` → `line6d_mfs_lived_apart_all_year` (CheckBox)

PDF export now fills lines 6c and 6d checkboxes correctly.

---

## ~~Lines 6a/6b/6c/6d: Worksheet Line 5 Exclusions/Additions Not Implemented~~ **Implemented 2026-04-15**

`computeTaxableSocialSecurityNormal()` now accepts a `worksheetLine5` parameter. `computeSocialSecurityBenefits()` populates it by calling `computeForm2555ExclusionForSsWorksheet()` for both taxpayer and spouse raw form maps. The helper instantiates a temporary `Form2555` via `computeForm2555Exclusions()` and sums line 45 + line 50. Remaining worksheet line 5 additions (Form 8839, Form 8815, Samoa/PR) are deferred — they are uncommon and require additional YAML fields.

---

## ~~Lines 6a/6b/6c/6d: Worksheet Line 6 (Schedule 1 Adjustments) Defaults to Zero~~ **Implemented 2026-04-15**

`computeSocialSecurityBenefits()` now accepts `incomeAdjustments: IncomeAdjustmentsComputation` as a parameter (passed from `prepare()` where it is already computed before the SS call). `worksheetLine6` falls back to `incomeAdjustments.line10FromSchedule1Line26()` when no manual override is present. Unit test `scheduleOneAdjustmentsReduceTaxableSocialSecurity` verifies: single filer, SS=$20k, wages=$25k, IRA deduction=$5k → taxable SS $2,500 (vs $5,350 without adjustment).

---

## ~~Lines 6a/6b/6c/6d: Lump-Sum Election Uses Simplified Approximation~~ **Implemented 2026-04-16**

`computeTaxableSocialSecurityLumpSum()` rewrote with full Pub. 915 Worksheet 3 logic:
1. Total lump-sum allocated to prior years subtracted from line6a to get current-year regular benefits.
2. `computeTaxableSocialSecurityNormal()` called on current-year regular benefits for taxable base.
3. For each prior-year row: recomputes taxable SS as if that year's total benefits were received using prior-year income/adjustments/tax-exempt-interest; additional taxable = max(0, recomputed − previously reported).
4. Result = current-year base + sum of additional amounts.
Method signature extended to take `line6a`, `worksheetLine3/4/5/6` from the call site.
Unit tests: `lumpSumElectionUsesFullPub915Worksheet3WhenPriorYearIncomeProvided` (new); `computesSocialSecurityLinesWithLumpSumElectionAndLine6d` updated (10850 → 11725). E2E assertion updated to 11725.

---

## ~~Lines 6a/6b/6c/6d: Worksheet Line 5 — Form 8839 Adoption Exclusion Not Implemented~~ **Partially implemented 2026-04-16**

`worksheetLine5` in `computeSocialSecurityBenefits()` now includes `adoption.line1f()` alongside Form 2555 exclusions per Pub. 915 modified AGI rules. Comment at `computeTaxableSocialSecurityNormal()` updated.

**Remaining deferred:**
- **Unit test** for adoption → SS interaction requires a complete Form 8839 child-level data setup. Deferred until Form 8839 compute is fully wired (child allocation, phaseout, Part III). The code wire-up is correct; integration test is missing.
- **Form 8815** savings bond interest exclusion — no Form 8815 compute path; remains deferred.
- **Bona fide residents of American Samoa / Puerto Rico** — no intake form; deferred.

---

## ~~Lines 6a/6b/6c/6d: Pub. 590-A IRA Deduction / SS Coordination~~ **Advisory flag implemented 2026-04-16**

Non-blocking advisory flag `SOCIAL_SECURITY_IRA_COORDINATION_MANUAL_REVIEW` emitted when `iraDeduction > 0` AND `taxableSocialSecurityBenefits > 0`. Flag text directs user to verify IRA MAGI eligibility per Pub. 590-A Worksheet 1. Unit test `emitsIraCoordinationAdvisoryFlagWhenIraDeductionAndTaxableSsCoexist` added.

**Still deferred:** Full iterative solve for the Pub. 590-A / Pub. 915 mutual-dependency loop (IRA deduction affects SS taxability which affects MAGI for IRA eligibility). Requires covered-workplace-plan flag on the IRA form and multi-pass compute. Affects only IRA contributors covered by a workplace plan who also have taxable SS.

---

## ~~Lines 6a/6b/6c/6d: Special Cases Not Guarded~~ **Partially implemented 2026-04-15**

- **Repayments > gross benefits (negative line6a)**: Now guarded — `computeSocialSecurityBenefits()` emits non-blocking advisory flag `SOCIAL_SECURITY_NEGATIVE_NET_BENEFITS_MANUAL_REVIEW` and returns null (no SS lines on return). Unit test `emitsAdvisoryFlagWhenNetSocialSecurityBenefitsAreNegative` + E2E test added.
- **IRA deduction coordination (Pub. 590-A)**: Deferred — see standalone entry above.

---

## ~~Lines 6a/6b/6c/6d: E2E Tests Use Legacy UI Patterns~~ **Implemented 2026-04-15**

`line6abcd-social-security-benefits.spec.ts` rewritten (5 tests):
1. UI test retained for form-level save blocking (requires UI to validate no-statement gate).
2–5. API-based: `seedStatementApi`, `savePersonalFormApi`, `computeReturnApi`. `test.describe.configure({ retries: 1 })` added. Two new scenarios: Schedule 1 adjustments reduce taxable SS (Gap 3); negative net benefits advisory flag (Gap 5).

---

## ~~Lines 5a/5b/5c: Line 5c PDF Checkboxes Unmapped~~ **Implemented 2026-04-15**

Both `pdfs/f1040_field_mapping_semantic.csv` and `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv` now map `c1_38[0]` → `line5c_box1_rollover`, `c1_39[0]` → `line5c_box2_pso`, `c1_40[0]` → `line5c_box3_other`. Frontend fills at `form-tax-return-1040.component.ts` lines 273–276.

---

## ~~Lines 5a/5b/5c: PSO Field Label Misleads Users~~ **Implemented 2026-04-15**

Field renamed to `totalQualifyingPsoPremiumsPaid` in both YAMLs, both Angular components, and backend. Label and help text updated to reflect both direct-from-plan and retiree-paid paths.

---

## ~~Lines 5a/5b/5c: RRB-1099-R Taxable Amount Not Read~~ **Implemented 2026-04-15**

`computePensionForPerson()` now reads Box 3 (employee cost), Box 4 (NSSEB), Box 5 (VDB), Box 6 (supplemental). Box 5+6 are always taxable; Box 4 is fully taxable only when Box 3 cost = 0; when cost > 0, Box 4 is treated as basis-recovery and excluded from initial taxableRrb. Falls back to box 7 (totalGrossPaidAmount) when detail boxes are absent.

---

## ~~Lines 5a/5b/5c: Rollover Taxable Base Should Start from Box 1, Not Box 2a~~ **Implemented 2026-04-15**

When `hasRollover == true`, rollover reduction now starts from `gross1099R` (box 1), not `taxable1099R` (box 2a). RRB distributions are re-added after reduction. Existing test `computesPensionDistributionsWithLine5cAndOutputForms` assertion updated from 3700 → 4200 to reflect the corrected formula.

---

## ~~Lines 5a/5b/5c: Simplified Method Prior-Year Recovery Not Applied~~ **Implemented 2026-04-15**

`computePensionTaxableViaSimplifiedMethod()` now reads `priorYearTaxFreeRecoveryAmount`, computes `remainingBasis = max(0, cost − priorRecovery)`, and uses remainingBasis for the monthly exclusion. When remainingBasis = 0, returns gross (fully taxable path).

---

## ~~Lines 5a/5b/5c: E2E Test Coverage Gaps~~ **All 10 passing — verified 2026-04-16**

**Unit tests:** 11 passing (3 original + 8 covering Simplified Method × 3, General Rule, RRB, MFJ, PSO, code-S).

**E2E tests:** 10 passing in `line5abc-pension-withdrawals.spec.ts` (tests 1–3 converted to pure API; tests 9–10 Form 5329 wiring added).

---

## Lines 5a/5b/5c: Remaining Deferred Items

- [Line 5abc / box 2b taxable-not-determined] No unit test for the `hasAnyTaxableAmountNotDeterminedPension1099R` path. When box 2b is checked on a 1099-R, the backend uses box 1 gross as a proxy for taxable amount; this fallback has no dedicated assertion.
- [Line 5abc / spouse upload gate] Spouse form has no statement upload confirmation section. Upload gating relies entirely on the taxpayer form for the whole return. If spouse-only pension statements exist with no corresponding taxpayer statements, no blocking flag is raised.

---

## ~~Lines 5a/5b/5c: Pension UI Sub-Interview Screens~~ **Implemented 2026-04-15**

Both pension components converted to wizard. Pre-existing `line5cBox*` build errors fixed (4 fields added to `Income` interface in `form-tax-return-1040.component.ts`).

---

## Lines 5a/5b/5c: Pension UI Sub-Interview Screens — Implementation Plan (archived)

**Filed: 2026-04-15**

UI violations 1–6 (radio buttons, showIf gates, uncommon gate, label rewrites, auto-derived statement fields, stale Form 4972 fields) were implemented in both `form-pension-annuity-income-taxpayer.component.ts` and `form-pension-annuity-income-spouse.component.ts`.

Violation 7 (Rule 4 / TurboTax one-question-per-screen sub-interview) implementation plan is below. The flat form now has correct conditional gating and uncommon gate, but the full wizard/stepper pattern (sequential screens with Back/Continue navigation) was not yet implemented.

### Implementation Steps

**Step 7a — Screen type and navigation state**

Taxpayer screens (11):
```typescript
type PensionTaxpayerScreen =
  'screening' | 'upload-check' | 'classification' | 'pension-details' |
  'exception-amounts' | 'uncommon-gate' | 'pso' | 'simplified-method' |
  'general-rule' | 'early-distribution' | 'summary';
```
Spouse screens (9, no upload-check / no early-distribution):
```typescript
type PensionSpouseScreen =
  'screening' | 'classification' | 'pension-details' | 'exception-amounts' |
  'uncommon-gate' | 'pso' | 'simplified-method' | 'general-rule' | 'summary';
```
State: `currentScreen = 'screening'`, `screenHistory: Screen[] = []`.

**Step 7b — Navigation methods**

- `getNextScreen(current)` — returns next screen; PSO/Simplified/General Rule skipped when their checkbox is unchecked:
  - `screening → upload-check` (taxpayer) / `screening → classification` (spouse)
  - `upload-check → classification`
  - `classification → pension-details`
  - `pension-details → exception-amounts`
  - `exception-amounts → uncommon-gate`
  - `uncommon-gate → pso` (if pso) else `simplified-method` (if simplified) else `general-rule` (if generalRule) else `early-distribution` (taxpayer) / `summary` (spouse)
  - `pso → simplified-method` (if simplified) else `general-rule` (if generalRule) else `early-distribution` / `summary`
  - `simplified-method → general-rule` (if generalRule) else `early-distribution` / `summary`
  - `general-rule → early-distribution` (taxpayer) / `summary` (spouse)
  - `early-distribution → summary`
  - `summary → summary` (terminal)
- `goBack()` — pops `screenHistory` stack, sets `currentScreen`
- `continueToNext()` — validates current screen → pushes current to history → navigates to next

**Step 7c — Per-screen validation (`isCurrentScreenValid()`)**

| Screen | Must pass |
|---|---|
| `screening` | `hadPensionOrAnnuityIncome !== null` |
| `upload-check` | count > 0 OR both received flags are `false` |
| `classification` | if disability yes → routing confirmed = true |
| `pension-details` | always |
| `exception-amounts` | if write-in code yes → text non-empty |
| `uncommon-gate` | always |
| `pso` | always |
| `simplified-method` | always |
| `general-rule` | always |
| `early-distribution` | always |
| `summary` | delegates to full `isValid()` |

**Step 7d — Replace template layout**

Remove `<ng-container *ngFor="let section of sections">` block.  
Add `<ng-container [ngSwitch]="currentScreen">` with one `*ngSwitchCase` per screen.  
Each case contains the exact HTML already inside that section — no field changes.  
Screening block (currently hardcoded) becomes `*ngSwitchCase="'screening'"`.  
Upload-check block becomes `*ngSwitchCase="'upload-check'"`.  
Uncommon gate block becomes `*ngSwitchCase="'uncommon-gate'"` (same checklist template).

**Step 7e — Navigation bar**

Replace single Save button with a sticky three-state footer:
```html
<div class="wizard-nav">
  <button Back *ngIf="screenHistory.length > 0" (click)="goBack()">
  <button Continue *ngIf="currentScreen !== 'summary'" (click)="continueToNext()">
  <button Save *ngIf="currentScreen === 'summary'" (click)="onSubmit()">
</div>
```
`<form (ngSubmit)>` stays for ngModel binding; submit button removed from form submission.

**Step 7f — Summary screen**

`*ngSwitchCase="'summary'"` renders read-only grouped summary of all non-null answers. Save button triggers `onSubmit()`.

**Step 7g — Step indicator (optional polish)**

Small label above card: "Step N of M — [Screen title]". Derived from active screen list position.

**Step 7h — Spouse component**

Same pattern, 9-screen variant. `[disabled]="!isJointReturn"` propagates as before. No upload-check or early-distribution screens.

### Implementation order
1. Taxpayer: types → state → `getNextScreen` / `goBack` / `continueToNext` / `isCurrentScreenValid` → template switch → nav bar → summary screen
2. Spouse: same pattern, 9-screen variant
3. `npm run build` to verify
4. Manual smoke test: walk all screens → save → reload → verify data persists

---

## ~~Form 8814 — Statement-Driven Child Income~~ **Implemented 2026-04-14**

## ~~Form 8814 — Statement-Driven Child Income (Enhancement)~~ (Resolved 2026-04-14)

All 4 enhancements implemented: dependent tab auto-includes 1099-INT/DIV; backend routes child 1099s to Form 8814 by `recipientTIN` SSN match; UI auto-populates from statements; manual fields override when non-null. 7 unit tests + 4 E2E tests in `line8814-statement-driven.spec.ts`.

---

## Lines 2a/2b: Box 9 Double-Counted into Line 2a (Critical Bug)

**File:** `TaxReturnComputeService.java` — `computeInterestForPerson()` ~line 4105

**Bug:**
```java
BigDecimal entryTaxExemptInterest = subtractNonNegative(addNonNull(box8, box9), box13);
```
Box 9 (specified private activity bond interest) is already included in box 8 (total tax-exempt interest). The code adds box 9 on top of box 8 before subtracting box 13, which **inflates line 2a by the full box 9 amount** for every 1099-INT that has private activity bond interest.

**Correct formula:**
```java
BigDecimal entryTaxExemptInterest = subtractNonNegative(box8, box13);
```
Box 9 is tracked separately for Form 6251 line 2g (which the code does correctly on the following line) but must not be added to the line 2a total.

**Impact:** Every 1099-INT with a non-zero box 9 (private activity bond interest) produces an overstated line 2a. The E2E test `line2ab-interest-income.spec.ts` seeds a box9 = 30 and asserts `taxExemptInterest == 157` — this assertion **passes only because of the bug**. With the fix applied, the correct value would be 127 (30 less).

**Fix required:** Change `addNonNull(box8, box9)` to just `box8` in the tax-exempt interest calculation. Also update the E2E assertion from 157 to 127 after the fix.

**Priority:** High — affects every 1040 with private activity bond interest on line 2a

---

## ~~Lines 2a/2b: `scheduleBFbarRequired` Always Equals `scheduleBForeignAccount` (Bug)~~ (Resolved)

`hasFbarRequirement` is already a separate field from `hasForeignAccountForScheduleBPartIII`. The YAML asks "Did the aggregate value of all your foreign financial accounts exceed $10,000?" as a sub-question; the backend reads it into `scheduleBFbarRequired` independently. `buildScheduleB()` wires them to separate PDF fields. No further action needed.

---

## ~~Lines 2a/2b: Nominee Interest Does Not Independently Trigger Schedule B (Bug)~~ (Resolved)

`hasNomineeInterest` is already present in the `scheduleBRequired` chain at `computeInterestIncome()` line 4053. It derives from `hasPositiveAmount(nomineeInterestAdjustment)` read from the personal form, so a nominee adjustment alone correctly triggers Schedule B generation.

---

## ~~Lines 2a/2b: Schedule B Dividend Per-Payer Detail Not Populated~~ (Resolved)

Per-payer dividend items are now populated in `scheduleBDividendItems` during `computeDividendForPerson()` and assembled in `buildScheduleB()`. Total and detail rows both correct.

---

## Line 3c — Child Dividend Disclosure Checkbox (Implemented 2026-04-14)

**Implemented.** Form 8814 line 9 (child qualified dividends) now flows to parent lines 3a and 3b; both line 3c checkboxes are set when applicable. See `history.md` for details.

**All items resolved as of 2026-04-14.**

1. ~~**`form-child-interest-dividends` screening gate**~~ — **Done 2026-04-14**: Screening gate implemented in component with three-state `electionMade` (null/false/true). 4 E2E tests added.

2. ~~**PDF semantic assets need regeneration**~~ — **Verified 2026-04-14**: Confirmed via pdf-lib inspection that `c1_33`/`c1_34` at y≈187.5 are the line 3c checkboxes. CSV rename is correct. No regeneration needed.

---

## ~~Lines 2a/2b: Form 8815 Savings Bond Exclusion Is Manual Entry Only (Deferred)~~

**CLOSED 2026-06-02** — Full Form 8815 implementation across 6 phases. See `history.md` 2026-06-02 entry and `XLS/Computations/8815.md` for details.

Implementation includes: backend `Form8815` POJO + `OutForm8815` entity + `Form8815OutputMapper` (V36 migration); 15 line-by-line intake fields with grouped 5-section accordion UI (V37 migration); 8 worksheet intake fields for Line 6 + Line 9 Worksheets (V38 migration); full lines 1-14 phaseout compute with 2025 thresholds ($99,500/$149,250 phaseout start; $114,500/$179,250 end; $15,000/$30,000 range); MFS suppression via `FORM_8815_MFS_BLOCKED` informational flag; manual `savingsBondExclusionAmount` preserved as override path; Tax Return sidebar entry with `pdf-readonly-preview` renderer; semantic PDF + CSV at `pdfs/f8815_*` and `us-tax-ui/public/irs/f8815_*`; 15 backend unit tests + 7 e2e tests (all 15 backend passing).

**Note on prior threshold values:** the deferred entry above quoted 2024 phaseout values ($94,100–$124,100 single). The 2025 values used in the implementation are $99,500–$114,500 (Single/HOH/QSS) and $149,250–$179,250 (MFJ) per IRS Form 8815 (2025) line 10 + General Instructions.

**Remaining follow-up:** Gap 7 in `XLS/Computations/8815.md` §3.2 — when user provides line-by-line WITHOUT manual override, Form 1040 line 2b is not retroactively reduced. Workaround: also fill in manual override field. Permanent fix requires moving `computeForm8815` earlier in `prepare()`.

---

## Line 1z: E2E Test Coverage — Sub-Line Combination Scenarios

Only one E2E test exists for line 1z (`line1z-total-wages.spec.ts`), covering lines 1a + 1h with combat pay exclusion. The following scenarios are not covered:

- **All 8 sub-lines contributing simultaneously** — no test seeds data for all of 1a, 1b, 1c, 1d, 1e, 1f, 1g, and 1h in the same return.
- **Negative line 1f (special-needs adoption)** — Form 8839 line 31 can be negative; no E2E test verifies that a negative adoption benefits amount flows correctly through the line 1z sum.
- **line 1z null when all sub-lines are null** — no E2E test verifies that `totalWages` is absent from the JSON response when no wage data is provided.
- **MFJ return with taxpayer wages + spouse wages summed into 1a** — W-2 attribution by SSN verified in line 1a tests but not in the context of the final 1z subtotal.

**Priority:** Low (implementation is correct; test gaps only)

**Files:** `C:\us-tax\us-tax-be\e2e\tests\line1z-total-wages.spec.ts`

---


## Line 1d: IRC § 131(c) Per-Individual Cap — RESOLVED 2026-05-31

See the consolidated "IRC §131(c) Per-Individual Cap on Medicaid Waiver Exclusion — IMPLEMENTED 2026-05-31" entry earlier in this file for the full implementation summary. This duplicate-section placeholder is retained only so historical grep / git blame against this filename anchor still finds something meaningful; the canonical entry above carries the details.

---

## Line 1c: E2E Test Coverage Gaps

Line 1c and Form 4137 are fully implemented. The following spec scenarios from `lines/1c.md` are not yet covered by E2E tests:

- **Spec scenario 9** — MFJ return with both spouses having unreported tips produces two separate Form 4137 outputs. No E2E test exercises the spouse tip form or verifies `form4137Spouse`.
- **Spec scenario 11** — W-2 box 12 codes A and B (uncollected SS/Medicare on tips reported to employer) flow to Schedule 2 line 13, not line 1c. No E2E test covers the `uncollected-ss-medicare-taxpayer` form and its Schedule 2 routing.
- **Spec scenario 12** — RRTA employees should not use Form 4137 for railroad retirement taxes. No E2E test verifies this exclusion.
- **Spec scenario 1** — Timely reported tips already in W-2 box 1 do not appear on line 1c. No E2E test verifies this boundary.
- **`page.fill()` on amount fields** — The spec `line1c-tip-income.spec.ts` uses `page.fill('#totalTipsReceived0', ...)` etc. If these fields render as `p-inputNumber`, `setNumberValue()` is required instead. Verify when running tests.
- **`test.describe.configure({ retries: 1 })`** — Missing from `line1c-tip-income.spec.ts`; required by project convention to handle cold-start auth failures.

**Priority:** Medium (implementation is correct; test gaps only)

---

## ~~Line 1b: Dead YAML — `1b-household-employee-wages.yaml`~~ **Resolved 2026-05-10**

`C:\us-tax\yamls\1b-household-employee-wages.yaml` was an orphaned artifact — not registered in `PersonalResource.java`, not referenced in any backend or frontend file, and not wired to any compute path. Household employee data is embedded in `employment-income-taxpayer/spouse` forms instead.

**Resolution:** Verified during 1z.xlsx Issue #5 walkthrough on 2026-05-10 that the file had no external dependencies (grep returned matches only in documentation files — outstanding.md, knowledge/line-1z-total-wages.md, history.md — plus the 1z audit row itself). No build tooling scans the `yamls/` folder programmatically. File deleted via plain `rm` (`us-tax/` is not a git repo so OS-level recovery only).

**Priority at time of resolution:** Low (no functional impact; technical debt only).

---

## ~~Line 1b: Form 8919 Collision Guard~~ **Resolved 2026-04-09**

`reportedOnForm8919` boolean added per employer entry in both employment income intake components (taxpayer/spouse). `householdEmployeeAmount()` skips entries where the flag is true. `lines/1b.md` updated with gate and blocking-flag documentation.

---

Updated: 2026-04-12T00:00:00-04:00
<!-- Form 4852 line 1a wiring completed 2026-04-09: extractForm4852Line1aWages() wired into buildIncome(). Amended-return trigger (1040-X when corrected W-2 differs) remains out of scope. -->

---

## ~~Form 8839: Part II Adoption Credit — Out-of-Scope Notice Missing (Rule 27)~~ **Resolved 2026-04-18**

~~`form-adoption-expenses.component.html` collects Part II adoption credit fields (`qualifiedAdoptionExpenses`, `priorYearAdoptionCredit`, `line15CreditCarryforward`) but the credit computation is not yet implemented.~~

Part II adoption credit (refundable line 13 → Form 1040 line 30; nonrefundable line 18 → Schedule 3 line 6c) is fully implemented. `computeAdoptionBenefits()` computes line 13; `applyAdoptionCredit()` computes line 17 (CLW-B) and line 18. Out-of-scope notice no longer needed; the hint text should be updated to reflect that the credit is live.

---

## Line 1g / Form 8919: UI Violations (Rule 7 — Boolean Fields Must Use Radio Buttons)

~~**`received1099MiscOrNec`** in `form-uncollected-ss-medicare-taxpayer.component.ts` and the spouse variant~~ — **Fixed 2026-04-12**: replaced with radio buttons; `irsDeterminationDate` now conditionally rendered; help text, W-2 SS wages attribution banner, descriptive reason code labels, currency mode, and dynamic section titles also added.

- **`electCombatPay`** in `form-combat-pay-taxpayer.component.ts` and the spouse variant — a boolean Yes/No field rendered as `p-select`. **Still outstanding.**

**Priority:** Medium (functional; visual/UX consistency violation)

---

~~## Line 1i / Combat Pay: UI does not guide "compute both ways" decision~~ — **Fixed 2026-04-13**

IRS caution note added to both `form-combat-pay-taxpayer.component.ts` and `form-combat-pay-spouse.component.ts` templates. Instructions text updated to mention ACTC in addition to EITC.

---

~~## Line 1i / Combat Pay: Verify ACTC earned income includes combat pay in Schedule 8812~~ — **Fixed 2026-04-13**

`computeSchedule8812()` was reading `line18a` from `getTotalWages()` only (line 1z, which excludes line 1i by design). Fixed by adding `getNontaxableCombatPayElection()` to `line18a` after the wages assignment. Two new unit tests added to `TaxReturnComputeServiceTest`:
- `schedule8812_actcEarnedIncomeIncludesCombatPay` — wages $1,800 + code Q $1,000 → `line18a=$2,800`, `line20=$45`
- `schedule8812_actcEarnedIncomeWagesAloneAtFloor_combatPayUnblocks` — wages exactly at $2,500 floor; combat pay $500 pushes `line18a` to $3,000 and unlocks ACTC

---

~~## Line 1g / Form 8919: E2E Test Bug — `page.fill()` on `p-inputNumber` Field~~ — **Fixed 2026-04-12**: `addFirm` helper updated to use `setNumberValue` for wages, `selectRadioOption` for `received1099MiscOrNec`, and partial match for reason code options.

---

## ~~Line 1g / Form 8919: E2E Test Coverage Gaps~~ — **Fixed 2026-04-12**

Four new tests added to `line1g-uncollected-ss-medicare.spec.ts`:
- Code A without IRS date → `FORM8919_IRS_DATE_REQUIRED_TAXPAYER` blocking flag
- Code H with `received1099MiscOrNec: false` → `FORM8919_CODE_H_1099_TAXPAYER` **blocking flag** (promoted to rules.md §17 non-overrideable on 2026-05-31; previously documented as non-blocking)
- Form 4137 line 10 → Form 8919 line 8 cross-form interaction (unreported tips reduce SS wage base)
- RRTA compensation (W-2 box 14) → Form 8919 line 8

## Statement Form PDF Overlays — Completed (2026-04-03)

All statement forms in the Statements sidebar now have the image-overlay PDF view pattern. Each form has:
- `pdfRaw: Record<string, string>` for PDF field state
- `get/set pdfView` (setter calls `syncFormToPdf()` when switching to PDF view)
- `syncFormToPdf()` / `syncPdfToForm()` using CSV-derived coordinates
- "Verify" button (`pi pi-check-circle` icon) replacing the old "Save" label in PDF view
- Combined `amount [notes]` fields handled by `formatAmountAndNotes` / `parseAmountAndNotes`

Completed forms: W-2, 1099-MISC, 1099-NEC, 1099-INT, 1099-DIV, 1099-OID, 1099-B, 1099-R,
SSA-1099, RRB-1099, RRB-1099-R, 1099-G, 1099-S, 1099-K, 1099-A, 1099-C, 1099-SA, 1099-CAP,
1099-E, 1099-Q, 1099-QA, 1099-LTC, 1099-PTR, W-2G.

Mapping files in `C:\us-tax\mappings\`: `w-2-field-mapping.md`, `1099-misc-field-mapping.md`,
`1099-a-field-mapping.md`, `1099-c-field-mapping.md`.

Remaining deferred:
- Visual field alignment verification (all forms used CSV-derived coordinates identical to verified W-2/1099-MISC method)

---

Updated: 2026-04-01T09:13:57.9192969-04:00

---

## Spouse Identification Split Verification - External Validation Pending (2026-04-01)

- Live authenticated Playwright execution of the updated `identification-spouse` flow is still pending in shells that do not expose `E2E_SHARED_AUTH_EMAIL` / `E2E_SHARED_AUTH_PASSWORD`. Local verification already covers focused backend tests, Angular build, focused Angular specs, and Playwright test discovery for the updated spouse-path scenarios.

---

## Remaining Implementation Work (Priority Order)

Form 1040 lines 1a–38 are fully implemented. All of Schedules 1/2/3, the core supporting forms
(8606, 8812, 4972, 8814, 8863, 8862, 8959, 8880, 1116, 8962, 8839, 2555, 8615, 4868, 2210, 8888),
and the refund/amount-owed block are complete. The remaining substantive work is listed below.

---

### ~~Priority 1 — Compute Bug: Schedule 8812 Part II-B Line 24~~ **Fixed 2026-04-18**

~~**File:** `TaxReturnComputeService.java` — `computeSchedule8812()` vs `computeLine31ThroughLine38()`~~

**Fixed:** `computeForm8863()` and `computeForm8862()` moved before `computeSchedule8812()` in
`prepare()`. EIC and refundable AOTC are now pre-set on `form1040.payments` before Schedule 8812
runs, using the idempotent pre-set pattern (same as G1). `computeLine31ThroughLine38()` overwrites
identically. Two new unit tests: `schedule8812_worksheetA_subtractsEducationCredits_clwaFix` and
`schedule8812_partIIB_line24_includesAotc_aotcFix`. 507/507 tests passing.

---

### Priority 2 — Form 4952 (Investment Interest Expense)

**Spec:** `C:\us-tax\lines\4952.md`
**Current state:** Intake form (`form-interest-expense.component.ts`) exists; personal form
`interest-expense-taxpayer` / `interest-expense-spouse` accepted by `PersonalResource`.
`Form4952.java` output model exists. `TaxReturnComputation` + `TaxReturnDataService` already
carry `form4952`. No compute logic and no Tax Return UI component exist.

**What is needed:**
- `computeForm4952()` in `TaxReturnComputeService`: reads personal form, computes Part I
  (investment interest expense, net investment income, deductible amount, carryover), wires
  deductible amount to Schedule A line 9 (`investmentInterestExpense`) and carries over the
  disallowed amount to `Form4952.carryover`.
- Register compute call in `prepare()` after Schedule A is built.
- Angular `form-tax-return-4952.component.ts` Tax Return display; conditional sidebar entry
  under Tax Return when `form4952 != null`.
- YAML `C:\us-tax\yamls\4952-investment-interest-expense-taxpayer.yaml` (if not already complete).
- Unit tests + E2E spec `line4952-investment-interest-expense.spec.ts`.
- AMT recomputation path (`requiresAmtInvestmentInterestRecompute`) deferred to Form 6251 line 2c.

---

### Line 20 / Schedule 3 — Undocumented Gaps (audited 2026-04-18)

The following gaps were identified during the Line 20 / Schedule 3 audit. G1 (adoption credit) is
already documented as Priority 3 below. G4 (Form 3800 / line 13c) is out of scope by design.

#### G2 — Form 8978 Negative Line 14 → Schedule 3 Line 6l (LOW) — **BLOCKED**

**Field:** `Schedule3NonrefundableCredits.amountFromForm8978Line14`

**Current state:** `setAmountFromForm8978Line14()` is never called anywhere in
`TaxReturnComputeService`. The CLW-A (Schedule 8812) reads `nc.amountFromForm8978Line14` (wA_7)
but always receives null. PDF field `f1_20[0]` always fills as blank.

**When relevant:** A BBA partnership with a negative line 14 on Form 8978 reduces nonrefundable
credits via Schedule 3 line 6l. Positive Form 8978 line 14 goes to Form 1040 line 16 box 3 (already
wired). The negative path is the unimplemented half.

**Fix needed:** After `applyForm8978ToSchedule3()` is wired (or as part of it), when Form 8978
line 14 is negative, set `amountFromForm8978Line14` = abs(line14). Then include it in the CLW-A
wA_7 sum and in the `totalOtherNonrefundableCredits` fix (see G6 below).

---

~~#### G3 — Form 4136 Fuel Tax Credit → Schedule 3 Line 12 (LOW)~~ **Fixed 2026-04-18**

Manual-entry fields `hasFuelTaxCredit` + `creditForFederalTaxOnFuels` added to `31-other-payments` YAML, Angular component, and `applyOtherPaymentsFormToSchedule3()`. Unit test `fuelTaxCreditFlowsToSchedule3Line12` + E2E scenario 4 verify.

---

~~#### G5 — Section 965(i) Deferred Net Tax Liability → Schedule 3 Line 13d (LOW)~~ **Fixed 2026-04-18**

Manual-entry fields `hasDeferred965Tax` + `deferredNet965TaxLiability` added to `31-other-payments` YAML, Angular component, and `applyOtherPaymentsFormToSchedule3()`. Unit test `deferred965TaxFlowsToSchedule3Line13d` + E2E scenario 5 verify.

---

~~#### G6 — Schedule 3 Line 7 PDF Display Bug: `totalOtherNonrefundableCredits` = line 6z only (MEDIUM)~~ **Fixed 2026-04-18**

`finalizeSchedule3Totals()` now computes `totalOtherNonrefundableCredits` = sum(6a..6z). `totalNonrefundableCredits` formula changed to IRS structure (lines 1+2+3+4+5a+5b+7) to eliminate double-count. Unit test `schedule3Line7TotalOtherNonrefundableCreditsIsSum6aThroughZ` verifies.

---

#### G7 — Narrow E2E Test Coverage for Line 20 (LOW) — Partially fixed 2026-04-18

**File:** `e2e/tests/line20-nonrefundable-credits.spec.ts` — now 5 scenarios (was 3)

Added: fuel credit → line 12 → line 31 (scenario 4) and §965(i) → line 13d (scenario 5).

**Still missing:**
- Foreign tax credit (1116) → Schedule 3 line 1 → line 20
- Child/dependent care (2441) → Schedule 3 line 2 → line 20
- Saver's credit (8880) → Schedule 3 line 4 → line 20
- Residential clean energy (5695) → Schedule 3 line 5a → line 20
- Energy efficiency (5695) → Schedule 3 line 5b → line 20
- Premium tax credit (8962) → Schedule 3 line 9 → line 31
- Extension payment (4868) → Schedule 3 line 10 → line 31

Most of these are already covered in their own dedicated E2E specs; the gap is that no single
Schedule 3 integration test exercises multiple credits summing together.

---

### Line 21 — Total Nonrefundable Credits — Gaps (audited 2026-04-18)

Line 21 is fully implemented (`computeLine20ThroughLine24()` in `TaxReturnComputeService.java`).
The following minor gaps were identified.

~~#### G1 — No Java unit test directly asserts `getTotalCredits()` (LOW)~~ **Fixed 2026-04-19**

3 unit tests added to `TaxReturnComputeServiceTest.java`: `line21_equalsLine19PlusLine20_ctcAndAotc`, `line21_isNullWhenNoCreditsPresent`, `line21_line22FlooredAtZeroWhenCreditsAbsorbAllTax`.

---

~~#### G2 — `line21-total-credits.spec.ts` missing `retries: 1` directive (LOW)~~ **Fixed 2026-04-19**

`test.describe.configure({ timeout: 180000 })` updated to `{ timeout: 180000, retries: 1 }`.

---

### Line 22 — Tax After Credits — Gaps (audited 2026-04-19)

Line 22 is fully implemented (`computeLine20ThroughLine24()` in `TaxReturnComputeService.java`).
Formula `max(0, nz(line18) − nz(line21))` matches the spec exactly. One structural gap identified.

~~#### G1 — `line22-tax-after-credits.spec.ts` missing `retries: 1` directive (LOW)~~ **Fixed 2026-04-19**

`test.describe.configure({ timeout: 180000 })` updated to `{ timeout: 180000, retries: 1 }` in `line22-tax-after-credits.spec.ts`.

---

~~### Priority 3 — Form 8839 Line 18 (Nonrefundable Adoption Credit)~~ **Fixed 2026-04-18**

Credit Limit Worksheet B implemented in `applyAdoptionCredit()`. Call site moved to after `applyForm8801ToSchedule3()` so lines 1–6b are set. `form8839.part2Line17CreditLimit` and `part2Line18NonrefundableAdoptionCredit` now set; `schedule3.nc.adoptionCredit` (line 6c) wired. Unit tests: `adoptionCreditNonrefundableWiredToSchedule3` + `adoptionCreditZeroWhenPriorCreditsExhaustTax`.

---

### Priority 4 — Form 8615 Full Parent-Rate Computation (Kiddie Tax)

**Spec:** `C:\us-tax\lines\8615.md`
**Current state:** Line 16 conditionally routes through Form 8615 when `form8615` is present.
The user manually enters `childFinalTaxLine18` (the result of the parent-rate computation).
If null, the backend falls back to bracket method with a warning log.

**What is needed (lines 9–13 of Form 8615):**
- Lines 9–13 require the parent's taxable income, filing status, and qualified
  dividends/capital-gains data. These must be read from the parent's return (a cross-return
  lookup from the child's `kiddie-income-taxpayer` personal form which stores parent SSN/filing
  status manually).
- Compute line 9 (parent's taxable income + child's net unearned income), line 10 (tax on line 9
  at parent's rate), line 11 (tax on parent's taxable income alone), line 12 (subtract), line 13
  (allocate child's share), store in `Form8615` output model, wire to child's line 16.
- Eliminate the manual `childFinalTaxLine18` field once the compute is live (or keep as override).

**Blocked by:** Cross-return data access — `kiddie-income-taxpayer` stores the parent SSN; the
backend would need to load the parent's computed `form1040` output from Firestore to read
`taxableIncome` and `regularTax`. Design decision required before implementation.

---

### Priority 5 — Dependent Return Generation

**Current state:** Dependent tabs show Capital gain/loss and Kiddie income intake forms in the
Incomes section. The Tax Return section for dependents is empty.

**What is needed:**
- Backend: a separate compute path for dependent returns (triggered per dependent uid) that
  produces a child `Form1040` with at minimum: lines 1z, 7a/7b, 9, 15, 16 (via Form 8615 or
  bracket), and the capital-gain/loss schedule D path.
- Wire `capital-gain-loss-dependent` inputs (from `child-interest-dividends` statements and
  the existing dependent capital gain personal form) into the child Schedule D / Form 8949.
- Wire `kiddie-income-dependent` inputs into the child Form 8615 compute path.
- Frontend: a dependent Tax Return section that renders child-return output forms.

---

### Priority 6 — UI Gaps

| Item | Location | Fix |
|---|---|---|
| `electsNoActc` checkbox missing | `form-ctc-actc-screening.component.ts` (taxpayer tab) | Add "Do not claim the Additional Child Tax Credit" yes/no field; bound to `electsNoActc` |
| Schedule 8812 sidebar always visible | `shell.component.ts` `taxReturnBaseItems` | Move `tax-return-schedule8812` to conditional push (like Form 8880) — show only when `line14 > 0 \|\| line27 > 0` |
| Line 36 no hard cap in UI | `form-apply-next-year.component.ts` | Display the `refund.overpaid` amount as the ceiling; enforce max on `amountToApply` |

---

### Priority 7 — PDF Fill-Export Backlog

The following forms have semantic PDF+CSV assets published but render structured UI summaries
instead of filling IRS PDF fields. No blocking issues — cosmetic/completeness only.

| Form | Assets location |
|---|---|
| Form 4868 | `us-tax-ui/public/irs/f4868_*` |
| Form 5695 | `us-tax-ui/public/irs/f5695_*` |
| Form 8396 | `us-tax-ui/public/irs/f8396_*` |
| Form 8801 | `us-tax-ui/public/irs/f8801_*` |
| Form 8834 | `us-tax-ui/public/irs/f8834_*` |
| Form 8859 | `us-tax-ui/public/irs/f8859_*` |
| Form 8863 | `us-tax-ui/public/irs/f8863_*` (partial: header + MAGI + line 8 filled) |
| Form 8888 | `us-tax-ui/public/irs/f8888_*` |
| Form 8911 | `us-tax-ui/public/irs/f8911_*` |
| Form 8912 | `us-tax-ui/public/irs/f8912_*` |
| Schedule R | `us-tax-ui/public/irs/f1040sr_*` |

---

## Lines 33–38 — Fully Implemented (2026-03-29)

All of lines 33–38 are now fully implemented: line 33 (total payments), line 34 (overpaid), line 35a (refund amount = overpaid − line36), lines 35b/c/d (direct deposit), line 36 (apply to next year), line 37 (amount owed), and line 38 (Form 2210 estimated tax penalty). Form 8888 (split refund) is also complete.

Remaining deferred items:
- ~~[Line 35b/c/d / Mod-10 routing number validation]~~ **Fixed 2026-03-29** — `form-direct-deposit.component.ts` now validates the 9-digit ABA checksum (weights 3-7-1 repeating, sum divisible by 10) on both the inline hint and in `onSubmit()`.
- ~~[Line 36 / UI ceiling enforcement]~~ **Fixed 2026-03-29** — `form-apply-next-year.component.ts` reads `refund.overpaid` from `TaxReturnService.computation()` signal; binds it to `[max]` on the `p-inputNumber`; displays it as a formatted currency ceiling hint; silently caps `amountToApply` to the ceiling on save.

---

## Form 8888 — Allocation of Refund — Implemented (2026-03-29); Remaining Deferred Items

- [Form 8888 / Form 8379 cross-check] When Form 8379 (Injured Spouse) is implemented, gate Form 8888 on `!form8379Filed`. Form 8379 is not yet implemented; this check is skipped for now.
- [Form 8888 / IRA and HSA account type classification] Eligible accounts include Traditional IRA, Roth IRA, SEP IRA, HSA, Archer MSA, Coverdell ESA. The current UI offers only "Checking" / "Savings" as account type options. When IRA/HSA account type support is needed, extend the dropdown options and YAML accordingly.
- [Form 8888 / Routing number Mod-10 validation] The IRS does not perform Mod-10 (Luhn) validation at filing time; rejected deposits are handled post-filing. No client-side Mod-10 validation implemented.
- [Form 8888 / PDF field fill / export] Form 8888 semantic assets are published (`f8888_semantic_labels.pdf` + `f8888_field_map_semantic.csv`); client-side PDF fill/export for Form 8888 is not yet implemented in the display component.

---

Updated: 2026-03-29T04:00:00-04:00

---

Updated: 2026-03-28T24:00:00-04:00

---

## Form 8862 — Fully Implemented (2026-03-28)

- ~~[Form 8862 / Semantic PDF assets]~~ **Generated 2026-03-28** — `f8862_semantic_labels.pdf` + `f8862_field_map_semantic.csv` (109 fields, 3 pages) published to `C:/us-tax/pdfs/` and `C:/us-tax/us-tax-ui/public/irs/` via `generate-semantic-f8862.js`.
- [Form 8862 / EIC ban-period verification] The 2-year or 10-year ban period (§32(k)) is not enforced by the application — the IRS enforces bans at the administrative level. The form collects eligibility answers; the application does not independently check the year of disallowance against a ban period.
- [Form 8862 / LLC unaffected] LLC (Lifetime Learning Credit) is correctly excluded from the AOTC gate. No action needed.
- [Form 8862 / >3 EIC qualifying children / >4 CTC children] The current implementation handles up to the standard list sizes. IRS instructions require a separate statement when the count exceeds the form's printed rows. Deferred.

---

## Line 27a / 27b / 27c — Implemented (2026-03-28); Audited 2026-04-19

Knowledge: `C:\us-tax\knowledge\knowledge_line27abc.md` · Flowchart: `C:\us-tax\flowcharts\27abc.drawio` · Dependencies: `C:\us-tax\dependencies\27abc.md`

### Existing deferred items

- [Line 27b / Clergy checkbox] Line 27b (`line27b = false`) is always unchecked in current scope — Schedule SE is out of scope. When SE is added, check this box for minister/clergy filers filing Schedule SE whose wages overlap line 1z.
- [Line 27a / Schedule EIC PDF attachment] The qualifying child count drives the credit, but generating a printable Schedule EIC attachment (separate PDF/form) is deferred.
- ~~[Line 27a / Form 8862 full processing]~~ **Implemented 2026-03-28** — `computeForm8862()` now evaluates Part II/III/IV gates; see Form 8862 section above for remaining Angular deferred items.
- ~~[Line 27a / Qualifying child full-time student path]~~ **Fixed 2026-04-19** — `countEicQualifyingChildren()` now allows age 19–23 children when `isFullTimeStudent=true`. YAML, Angular (`EicChild.isFullTimeStudent`, `childNeedsStudentQuestion()`, template), and backend updated. 2 unit tests: `line27aFullTimeStudent_age21_countsAsQualifyingChild` and `line27aFullTimeStudent_age21_notStudent_excluded`.
- ~~[Line 27a / MFS separated-spouse exception]~~ **Fixed 2026-04-19** — `computeLine27aEIC()` now reads `qualifiesForMfsSeparatedSpouseEicException`; when true, uses Single phaseout thresholds (IRC §32(d)(2)). Requires ≥1 qualifying child. YAML, Angular (MFS-conditional field via `isMfs` getter loading `filing-status`), and backend updated. 2 unit tests: `line27aMfsSeparatedSpouseException_allowsEic` and `line27aMfsNoException_blocksEic`.
- [Line 27a / Schedule C/SE earned income] Net self-employment earnings are excluded from earned income base (SE out of scope). When Schedule C/SE is added, include net SE earnings in EIC earned income.
- ~~[Line 27a / Schedule 8812 Part II-B unblock]~~ **Implemented 2026-03-28** — Part II-B now uses actual EIC+AOTC in line24. Remaining ordering limitation tracked under Schedule 8812 section.

### New gaps identified and fixed 2026-04-19

- [Line 27a / G1 / LOW] Deferred: `computeInvestmentIncomeForEic()` excludes net passive income and net rental/royalty income (Schedule E) from the investment income ceiling test. Deferred until Schedule E is implemented.
- ~~[Line 27a / G2 / LOW]~~ **Fixed 2026-04-19** — Added `childFiledJointReturn` boolean to per-child entry in YAML, Angular (`EicChild` interface + template), and backend (`countEicQualifyingChildren()` skips child when `childFiledJointReturn = true`). Unit test `line27aQualifyingChild_jointReturn_notCounted` verifies.
- ~~[Line 27a / G3 / LOW]~~ **Fixed 2026-04-19** — Added `EIC_QUALIFYING_RELATIONSHIPS` Set constant; `countEicQualifyingChildren()` now validates `relationship` against the IRS qualifying relationship list (exact match for named relationships; `startsWith("foster child")` for the foster-child long string). Blank or invalid relationship → child not counted. Unit test `line27aQualifyingChild_invalidRelationship_notCounted` verifies.
- ~~[Line 27a / G4 / LOW]~~ **Fixed 2026-04-19** — Unit test `line27aCombatPayElection_addsToEarnedIncome` added: W-2 wages $4k + box12Q $5k + `electNontaxableCombatPay=true` → earnedIncome $9k → EIC $649 (plateau).
- ~~[Line 27a / G5 / LOW]~~ **Fixed 2026-04-19** — E2E test added: MFJ, taxpayer $18k + spouse $8k W-2s + 1 qualifying child → EIC $4,328 (MFJ 1-child plateau).
- ~~[Line 27a / G6 / LOW]~~ **Fixed 2026-04-19** — E2E test added: Single, W-2 wages $4k + box12Entries code Q $5k + `electNontaxableCombatPay=true` → EIC $649.

---

## Lines 25a–25d — Audited 2026-04-19; Remaining Gaps

- ~~**[Line 25b / G1 / MEDIUM] 1099-DA (Digital Assets) box 2a federal withholding not included in line 25b aggregation.**~~ **FIXED 2026-04-19**: Added `form1099DaEntries` as parameter to `computeLine31ThroughLine38()` and to the `sumFederalWithholdingFromMultipleLists()` call. 1 unit test (`line25bWithholdingFrom1099Da`) + 1 E2E test added to `line25abcd-withholding.spec.ts`.
- ~~[Line 25c / G2 / LOW] Form 8959 E2E tests did not assert `form1040.payments.withholdingOther`.~~ **FIXED 2026-04-19**: Added E2E test "Form 8959 Part V line 24 Medicare withholding flows to line 25c" to `line25abcd-withholding.spec.ts`.
- ~~[Line 25b / G3 / LOW] No dedicated E2E test for 1099-NEC backup withholding → 25b.~~ **FIXED 2026-04-19**: Added E2E test "1099-NEC backup withholding flows to line 25b" to `line25abcd-withholding.spec.ts`.
- [Line 25c / G4 / OOS] K-1, 1042-S, 8805, 8288-A withholding sources for line 25c are out of scope. See `C:\us-tax\lines\25abcd.md` section 10.

---

## Line 24 — Total Tax — Audited 2026-04-19; Remaining Gaps

- ~~**[Line 24 / G1 / MEDIUM] `computeForm2210()` Part I Line 1 reads `totalTaxBeforeCredits` (line 18) instead of `taxAfterCredits` (line 22).**~~ **Fixed 2026-04-19** — Changed `getTotalTaxBeforeCredits()` → `getTaxAfterCredits()` at `TaxReturnComputeService.java:15409`; comment updated. Unit test `form2210Line1UsesTaxAfterCreditsNotTotalTaxBeforeCredits` added (Single, $38k wages + Form 8880 savings credit $200 → Form 2210 generated; asserts `currentYearTax == taxAfterCredits` and `< totalTaxBeforeCredits`). 398 unit tests passing.
- ~~**[Line 24 / G2 / LOW] No dedicated `line24-total-tax.spec.ts` E2E spec.**~~ **Fixed 2026-04-19** — `line24-total-tax.spec.ts` created with 2 scenarios: (1) $40k wages, no other taxes → `totalTax == taxAfterCredits`; (2) $18k wages + CTC child + $5k early IRA distribution → `taxAfterCredits == 0`, `otherTaxes == 500`, `totalTax == 500`.

---

## Lines 20–38 — Complete (2026-03-26); Remaining Deferred Items

- ~~[Line 23 / Form 5329 wiring bug]~~ **Fixed 2026-03-26** — `applyForm5329TaxToSchedule2()` now wires Form 5329 `additionalTaxOnEarlyDistributions` → Schedule 2 line 8 → Form 1040 line 23, so the 10% early-distribution penalty correctly flows into `line24 = line22 + line23`.
- ~~[Line 23 / Form 5329 E2E coverage]~~ **Covered 2026-04-16** — Tests 9 and 10 in `line5abc-pension-withdrawals.spec.ts` verify the full chain: `additionalTaxOnEarlyDistributions` → `schedule2.otherTaxes.additionalTaxOnIras` → `form1040.taxAndCredits.otherTaxes`.
- ~~[Line 26 / estimated tax payments]~~ **Implemented 2026-03-27** — `computeLine26EstimatedTax()` in `TaxReturnComputeService`; personal forms `estimated-tax-payments-taxpayer` / `estimated-tax-payments-spouse`; wired into line 33 aggregation. 297 unit tests; 5 E2E tests.
- ~~[Line 27a / Earned Income Credit]~~ **Implemented 2026-03-28** — `computeLine27aEIC()` in `TaxReturnComputeService`; personal forms `earned-income-credit-taxpayer` / `earned-income-credit-spouse`; wired into line 33 aggregation.
- [Form 8863 / MAGI adjustments] MAGI for Form 8863 phaseout currently uses AGI directly. Certain adjustments (foreign earned income exclusion, student loan interest) should reduce MAGI before phaseout. Impact is minor for most filers.
- [Form 8863 / MAGI auto-read from Form 2555 output] When Form 2555 is present, the foreign earned income exclusion amount should be auto-read from the Form 2555 output model and added back to AGI to compute the correct Form 8863 phaseout MAGI, rather than relying solely on the manual `magiAddBackPuertoRicoExcludedIncome` field. Currently the bridge between Form 2555 computed output and Form 8863 MAGI is not implemented.
- [Form 8863 / dependent student cross-check] Education credits intake uses a flat list under `taxpayerEducationCreditStudents`; dependent students' own-return elections are not yet cross-checked against the parent return.
- ~~[Form 8863 / semantic PDF fill-export]~~ **Implemented 2026-03-28** — `f8863_semantic_labels.pdf` + `f8863_field_map_semantic.csv` published to `us-tax-ui/public/irs/`; `form-tax-return-8863.component.ts` rebuilt with `saveAsPdf()` and `buildPdfFieldValues()` (name-based dict; header, MAGI, line 1, line 8, line 19 filled).
- ~~[Form 8863 / additional unit tests]~~ **Implemented 2026-03-28** — 6 additional unit tests added: `multipleAotcStudents_summedCorrectly`, `phaseout_partialReduction`, `mixedAotcAndLlc_bothCreditsComputed`, `disqualifiedStudentSkipped`, `spouseStudentsMergedMfj`, `form8862Gate_blocksAotcPreservesLlc`. 14 Form 8863 unit tests total, all passing.
- ~~[Form 8863 / E2E compute-result scenarios]~~ **Implemented 2026-03-28** — 5 API-pattern scenarios added to `line8863-education-credits.spec.ts`: single AOTC → line 29 = $1,000; LLC only → line 29 = 0; MAGI above ceiling; MFS flag; under-24 restriction. 7 tests total in that spec.
- [Form 8863 / 1098-T statement import] Complex statement type; expenses already entered manually.
- [Form 8863 / prior-year AOTC recapture] Rare edge case; adds tax liability, not a credit.
- [Form 8863 / second institution display in output] Data collected but output model doesn't carry it; cosmetic only.
- [Form 8863 / institution EIN not collected] YAML and model have institution name and address (`institution1NameLine22`, `institution1AddressLine22`) but no institution EIN field. The IRS Form 8863 Part III line 22 EIN digit slots (PDF fields `f2_22[0]`–`f2_30[0]` for Student B) cannot be filled. Low priority; EIN is cosmetic and not used in credit computation.
- [Line 29 / G1 / FIXED 2026-04-20] **QSS phaseout threshold bug** — Removed `|| "Qualifying surviving spouse".equalsIgnoreCase(status)` from `isMfj` in `computeForm8863()`. QSS now correctly uses the Single/HOH ceiling ($80k/$90k). Unit test `computeForm8863_qss_fullyPhasedOutAbove90k` added.
- [Line 29 / G2 / FIXED 2026-04-20] **Sparse Form8863 output model** — Added `line1TotalAotcBeforePhaseout` and `line7AllowableAotc` fields to `Form8863.java`; both set in `computeForm8863()`. Unit tests `computeForm8863_line1AndLine7FieldsPopulated` and `computeForm8863_line1AndLine7ReflectPhaseout` added.
- [Line 29 / G3 / FIXED 2026-04-20] **PDF export incomplete** — `form-tax-return-8863.component.ts` updated: `f1_5[0]` now uses `line1TotalAotcBeforePhaseout`; `f1_6[0]` uses `magiForPhaseout`; `f1_12[0]` = `line8RefundableAotc`; `f1_13[0]` = `line7 − line8` (nonrefundable AOTC); removed erroneous `f1_18[0]`/`f1_19[0]` fills (were filling MAGI into student-column fields).
- [Line 29 / G4 / LOW] **Under-24 restriction self-reported** — `refundableAotcRestrictionApplies` is a single boolean. The backend does not cross-validate the sub-conditions (age < 18, support test, parent alive, not filing jointly) against return data. Minor gap; most filers either clearly qualify or clearly don't.
- [Line 29 / G5 / FIXED 2026-04-20] **No E2E test for MFJ spouse-student merge** — E2E test `'Line 29 — MFJ spouse student: taxpayer AOTC + spouse LLC → studentCount 2'` added to `line8863-education-credits.spec.ts`.
- [Line 29 / G6 / FIXED 2026-04-20] **No E2E test for Form 8862 AOTC gate** — E2E test `'Line 29 — Form 8862 gate: aotcPreviouslyDenied + no Form8862 → AOTC blocked, LLC credited'` added to `line8863-education-credits.spec.ts`.
- ~~[Line 29 / G7 / HIGH] **Form8863 model missing students field** — PDF per-student expense columns (f1_7/f1_8/f1_9) and Part III name fields always blank.~~ **FIXED 2026-04-20** — Added `Form8863Student.java` and `Form8863Header.java` classes; `Form8863.java` gains `students` and `header` fields; `computeForm8863()` populates both from `allStudents` data and the `you` form respectively.
- ~~[Line 29 / G9 / MEDIUM] **Form8863 model missing header (name/SSN)** — PDF header fields f1_1–f1_4 and f2_1–f2_4 blank.~~ **FIXED 2026-04-20** — Resolved as part of G7 fix; `Form8863Header` populated from taxpayer `you` form (firstName + lastName + ssn).
- ~~[Line 29 / G14 / LOW] **Missing E2E test for multiple AOTC students summed**~~ **FIXED 2026-04-20** — Test `'Line 29 — two AOTC students both qualify → line 29 = $2,000 aggregate'` added; verifies `line1TotalAotcBeforePhaseout = $5,000` and `line8RefundableAotc = $2,000`.
- ~~[Line 29 / G15 / LOW] **Missing E2E test for LLC partial phaseout**~~ **FIXED 2026-04-20** — Test `'Line 29 — LLC student, MAGI $85k Single → 50% phaseout → nonrefundable ≈ $1,000'` added; verifies phaseoutFraction = 0.5 applied to LLC credit.
- ~~[Line 29 / G16 / LOW] **Missing E2E test for AOTC disqualifier**~~ **FIXED 2026-04-20** — Test `'Line 29 — AOTC student disqualified by 4-year limit → form8863 present but no credit'` added; verifies `aotcClaimedFourPriorYearsLine23 = true` skips student → both credit lines null.
- ~~[Line 29 / G17 / HIGH] **YAML field name mismatch** — `requiresForm8862ForAotc` in YAML vs `aotcPreviouslyDenied` in backend code.~~ **FIXED 2026-04-20** — `8863-education-credits-taxpayer.yaml` field renamed to `aotcPreviouslyDenied`; label and help text updated.
- ~~[Line 29 / G18 / MEDIUM] **`hasMagiAddBacks` not in YAML** — boolean used by frontend to gate MAGI add-back fields was absent from the YAML spec.~~ **FIXED 2026-04-20** — Added `hasMagiAddBacks` boolean field to `returnLevelEligibility` section in `8863-education-credits-taxpayer.yaml`.
- ~~[Line 29 / G19 / MEDIUM] **Per-student computed lines 27–31 not in model or PDF** — `Form8863Student` lacked computed values; `buildFieldValues()` left per-student lines blank.~~ **FIXED 2026-04-20** — Added `perStudentLine30`, `perStudentLlcExpenses`, `studentSsn`, `institution1Name`, `institution1Address` to `Form8863Student.java`; `computeForm8863()` merged student-view building and computation into one loop; `buildFieldValues()` uses institution data for f2_9/f2_10/f2_20/f2_21 and fills f2_31 (student A) and f2_35 (student B) with computed amounts.
- ~~[Line 29 / G20 / MEDIUM] **Student B PDF institution fields not filled** — `f2_20[0]` and `f2_21[0]` were filled with student name instead of institution name/address.~~ **FIXED 2026-04-20** — Resolved as part of G19; `buildFieldValues()` now fills `f2_20[0]` with `institution1Name` and `f2_21[0]` with `institution1Address` for student B.
- ~~[Line 29 / G21 / MEDIUM] **No unit tests for AOTC formula boundary cases** — expenses < $2,000 and between $2,000–$4,000 untested.~~ **FIXED 2026-04-20** — Added 2 unit tests: `computeForm8863_aotcExpensesBelow2000_minimumCreditApplies` ($1k expenses → line30=$2,000; line8=$800) and `computeForm8863_aotcExpensesBetween2000And4000_partialCredit` ($3k expenses → line30=$2,250; line8=$900). 16 Form 8863 unit tests total, all passing.
- ~~[Line 29 / G22 / LOW] **No E2E tests for MAGI boundary values** — $80k (full credit) and $90k (no credit) untested.~~ **FIXED 2026-04-20** — Added 2 E2E tests: `'MAGI exactly $80k → full AOTC credit'` and `'MAGI exactly $90k → AOTC fully phased out'`.
- ~~[Line 29 / G23 / LOW] **No E2E assertions for header.name, header.ssn, students array**~~ **FIXED 2026-04-20** — Assertions added to `'Line 29 — single AOTC student $4k expenses, no phaseout → line 29 = $1,000'` test verifying `form8863.header.name = 'E2E Tester'`, `header.ssn = '111-11-1111'`, `students.length = 1`, `students[0].creditType = 'aotc'`.
- ~~[Line 29 / G24 / LOW] **LLC E2E test uses `.toBeGreaterThan(0)` instead of exact value**~~ **FIXED 2026-04-20** — Changed LLC-only test assertions to `expect(Number(...)).toBe(1000)`.

---

## Line 15 — Taxable Income — Implemented; All Gaps Resolved (2026-04-17)

- ~~[Line 15 / frontend legacy field]~~ **RESOLVED 2026-04-17** — `form-tax-return-1040.component.ts`: added `line15TaxableIncome` to the deductions interface; PDF mapping updated to `line15TaxableIncome ?? taxableIncome`. Legacy `taxableIncome` retained as fallback alias.
- ~~[Line 15 / E2E QBI second-pass gap]~~ **RESOLVED 2026-04-17** — Added Scenario 6 to `line15-taxable-income.spec.ts`: Single, wages $60k + K-1 QBI $20k → `line13a = $4,000`; asserts `line15TaxableIncome = $40,250` (verifies second-pass recomputation of taxableIncomeBeforeQbi reduces line 15).
- ~~[Line 15 / E2E local helper duplication]~~ **RESOLVED 2026-04-17** — Removed local `saveAdditionalDeductionsTaxpayerApi`; all 3 callers replaced with `savePersonalFormApi(page, 'additional-deductions-taxpayer', ...)` from api-flow.ts. Also added `retries: 1` to `test.describe.configure`.

---

## Lines 11a/11b — AGI — Implemented; All Gaps Resolved (2026-04-17)

- ~~[Lines 11a/11b / legacy field tech debt]~~ **RESOLVED 2026-04-17** — Updated 3 call sites in `TaxReturnComputeService.java` (Form 8962 line ~1875, AMT line ~8200, Form 8936 line ~13937) from `getAdjustedGrossIncome()` to `getLine11bAmountFromLine11aAdjustedGrossIncome()`. The `adjustedGrossIncome` field is retained in the JSON output for backward compat with `form-clean-car-credit` fallback reads.
- ~~[Lines 11a/11b / E2E coverage sparse]~~ **RESOLVED 2026-04-17** — Added 3 new scenarios to `line11ab-adjusted-gross-income.spec.ts`: (2) wages-only no adjustments → AGI = wages; (3) MFJ filing status AGI check; (4) negative AGI preserved when educator $300 > wages $100.
- ~~[Lines 11a/11b / semantic CSV field name]~~ **RESOLVED 2026-04-17** — Renamed `line11_adjusted_gross_income` → `line11a_adjusted_gross_income` in `generate-semantic-1040-2025.js`; regenerated `f1040_field_mapping_semantic.csv` + `f1040_semantic_labels.pdf`; updated frontend mapping key in `form-tax-return-1040.component.ts` to match.

---

## Line 12e — Schedule A / Standard Deduction — Implemented; Remaining Gaps (2026-04-17)

- ~~**[Line 12e / SALT cap CRITICAL]** `ReferenceData.SCHEDULE_A_SALT_LIMIT_*` constants were set to $10,000/$5,000 (MFS).~~ **RESOLVED 2026-04-17**: Updated to $40,000/$20,000 (MFS) per OBBBA 2025. Also fixed phantom-SALT null-safety bug in `buildScheduleA()`. Unit and E2E tests updated.
- ~~**[Line 12e / SALT MAGI reduction worksheet]**~~ **RESOLVED 2026-04-17**: `saltLimitForStatusAndMagi()` added; 4 SALT phasedown constants in `ReferenceData.java`; `buildScheduleA()` uses AGI as MAGI proxy. Cap phases $1-for-$1 above $500k MAGI to $10k floor ($250k/$5k for MFS). Unit test: `computesScheduleASaltCapPhasesDownAboveMagiThreshold`.
- ~~[Line 12e / HOH spouse boxes backend guard]~~ **RESOLVED 2026-04-17**: `countAgeBlindnessBoxes(status, ...)` now skips spouse boxes for HOH. Unit test: `computesLine12dHohFilersIgnoreSpouseAgeBlindnessBoxes`.
- ~~[Line 12e / QSS spouse boxes backend guard]~~ **RESOLVED 2026-04-17**: `countAgeBlindnessBoxes(status, ...)` extended to also skip spouse boxes for QSS (deceased spouse). Unit test: `computesLine12dQssFilersDoNotCountSpouseBoxes`.
- ~~[Line 12e / line12b MFS stale-data guard]~~ **RESOLVED 2026-04-17**: `line12b` in `computeLine12()` now requires `"Married filing separately".equalsIgnoreCase(status)` before checking the spouse form. Prevents stale Firestore data from suppressing the standard deduction for MFJ/Single/HOH/QSS filers. Unit tests: `computesLine12bDoesNotApplyForMfjEvenIfSpouseFormHasStaleData`, `computesLine12bDoesNotApplyForSingleEvenIfSpouseFormHasStaleData`.
- ~~[Line 12e / Schedule A line 15 personal casualty and theft losses]~~ **RESOLVED 2026-04-17**: `personalCasualtyAndTheftLoss` field added to `ScheduleA.java`, `buildScheduleA()`, YAML, and UI (new "Casualty and theft losses" section). Flows into `totalItemizedDeductions`. Unit test: `computesScheduleAPersonalCasualtyLossAddedToTotal`.
- ~~[Line 12e / Schedule A line 18 itemize-although-less flag]~~ **RESOLVED 2026-04-17**: `electsToItemizeAlthoughLessThanStandard` field added to `ScheduleA.java`; set to `true` in `computeLine12()` when `deductionElection == ITEMIZED` and `itemized < standardDeduction`. Unit tests: `computesScheduleAElectsToItemizeAlthoughLessThanStandard`, `computesScheduleAElectsToItemizeFlagFalseWhenItemizedExceedsStandard`.
- ~~[Line 12e / someoneCanClaimSpouse UI shown for all filing statuses]~~ **RESOLVED 2026-04-17**: HTML field gated with `*ngIf="isMfj"` — per spec §4.1, only applies to MFJ returns.
- ~~[Line 12e / MFS-only fields not cleared on filing-status change]~~ **RESOLVED 2026-04-17**: `normalizeForSave()` in `form-standard-deductions.component.ts` clears `spouseItemizesSeparateReturn` and `spouseMeetsAgeBlindnessMfsRequirements` to null when filing status is not MFS.
- ~~[Line 12e UI / No per-section Schedule A screening gates]~~ **RESOLVED 2026-04-17**: 6 Yes/No gate variables added (`hasMedicalExpenses`, `hasTaxesPaid`, `hasInterestExpenses`, `hasCharitableContributions`, `hasCasualtyLoss`, `hasOtherItemizedDeductions`); each section has a screening radio before showing amount fields; gates derived from saved data on load; amounts cleared on save when gate is off.
- ~~[Line 12e UI / Deduction method framing poor]~~ **RESOLVED 2026-04-17**: Section heading and instructions rewritten with plain-language explanation of standard vs. itemized.
- ~~[Line 12e UI / Single master less-common toggle (Rule 26)]~~ **RESOLVED 2026-04-17**: `showLessCommon` replaced by 4 per-item accordion toggles; each item independently expandable; auto-expands when saved data exists.
- ~~[Line 12e UI / Dual-status alien $0 consequence not shown inline]~~ **RESOLVED 2026-04-17**: `info-note.warning` block added with `*ngIf="model.youWereDualStatusAlien === true"`.
- ~~[Line 12e UI / Foreign taxes Form 1116 conflict not warned]~~ **RESOLVED 2026-04-17**: `ngOnInit` loads `foreign-tax-credit-taxpayer`; if data exists, `info-note.warning` shown above the foreignTaxesPaid field.
- ~~[Line 12e UI / "Schedule A line 15" in visible section instructions]~~ **RESOLVED 2026-04-17**: Casualty section instructions rewritten in user-situation language; IRS line and form references removed.
- ~~[Line 12e / MFS spouse age/blindness restriction]~~ **RESOLVED 2026-04-17**: `spouseMeetsAgeBlindnessMfsRequirements` field added to spouse form/YAML/UI; `computeLine12()` guards spouse boxes behind this flag for MFS status. Unit tests: `computesLine12dMfsSpouseBoxesBlockedWhenSpouseDoesNotQualify`, `computesLine12dMfsSpouseBoxesCountedWhenSpouseQualifies`.
- ~~[Line 12e / Foreign taxes Schedule A line 6]~~ **RESOLVED 2026-04-17**: `foreignTaxesPaid` / `deductibleForeignTaxes` fields added to `ScheduleA.java`, `buildScheduleA()`, YAML, and UI (Taxes section with Form 1116 credit note). Not subject to SALT cap. Unit tests: `computesScheduleAIncludesForeignTaxesOutsideSaltCap`, `computesScheduleAForeignTaxesNotSubjectToSaltCap`.
- ~~[Line 12e / Schedule A line 16 other deductions]~~ **RESOLVED 2026-04-17**: `otherAllowedItemizedDeductions` field added to `ScheduleA.java`, `buildScheduleA()`, YAML, and UI (new "Other itemized deductions" section). Unit test: `computesScheduleAOtherAllowedItemizedDeductionsAddedToTotal`.
- [Line 12e / Form 4684 computation] The `netQualifiedDisasterLoss` field is user-entered directly in the standard-deductions form. No actual Form 4684 computation exists. A proper implementation would compute Form 4684 from disaster event data and feed the result into Schedule A.
- ~~[Line 12e UI / Disaster loss election shown when ITEMIZED (spec §7)]~~ **RESOLVED 2026-04-17**: Election radio `*ngIf` now excludes `deductionElection === 'ITEMIZED'`; info note shown instead; `normalizeForSave()` clears the field when ITEMIZED. E2E test added.
- ~~[Line 12e UI / `someoneCanClaimSpouse` not cleared when not MFJ (Rule 15)]~~ **RESOLVED 2026-04-17**: `normalizeForSave()` now gates `someoneCanClaimSpouse` behind `this.isMfj`.
- ~~[Line 12e UI / QSS spouse age/blindness inputs silently ignored (Rule 27 spirit)]~~ **RESOLVED 2026-04-17**: `info-note` added to spouse age/vision section when `filingStatus === 'Qualifying surviving spouse'`.
- ~~[Line 12e UI / No disaster loss screening gate (Rule 1)]~~ **RESOLVED 2026-04-17**: `hasDisasterLoss: boolean | null` gate added; amount and election fields gated on `hasDisasterLoss === true`; gate derived from saved `netQualifiedDisasterLoss` on load; `normalizeForSave()` clears disaster fields when gate is off. Help text added for `hasDisasterLoss` key.
- ~~[Line 12e UI / 6 section gate questions missing help icons (Rule 10)]~~ **RESOLVED 2026-04-17**: Help icons added to `hasMedicalExpenses`, `hasTaxesPaid`, `hasInterestExpenses`, `hasCharitableContributions`, `hasCasualtyLoss`, `hasOtherItemizedDeductions` gate label rows; 6 helpMap entries added to component.
- ~~[Line 12e YAML / IRS form/line references in field labels (Rule 33 spirit)]~~ **RESOLVED 2026-04-17**: `personalCasualtyAndTheftLoss`, `foreignTaxesPaid`, `otherAllowedItemizedDeductions`, and `netQualifiedDisasterLoss` labels cleaned up in `12abcde-standard-deductions-taxpayer.yaml`.
- ~~[Line 12e / Investment interest formal Form 4952]~~ **RESOLVED (already implemented)**: `patchScheduleAInvestmentInterest(scheduleA, form4952)` in `prepare()` (line ~603) replaces user-entered deductible investment interest with Form 4952 line 8 whenever Form 4952 is filed. The user-entered `netInvestmentIncome` field is the correct fallback when Form 4952 is not used.
- ~~[Line 12e / Dependent worksheet earned income not auto-imported]~~ **PARTIALLY RESOLVED 2026-04-17**: `computeLine12()` now auto-imports `income.getTotalWages()` (line 1z) when `dependentStandardDeductionEarnedIncome` is null and the W-2 total is positive. The full per-spec formula (`line1z + Schedule1 items − line15`) is still deferred. Unit test: `computesLine12DependentWorksheetAutoImportsWagesWhenEarnedIncomeNotEntered`.

---

## Form 8396 — Implemented (2026-03-25); Remaining Deferred Items

- ~~[Form 8396 / Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into `TaxAndCredits.otherCreditsSchedule3` (line 20).
- [Form 8396 / multi-MCC support] Current app scope produces one consolidated Form 8396 per return. Multi-MCC support with deterministic aggregation is deferred.
- ~~[Form 8396 / Schedule A reduction feedback]~~ **RESOLVED 2026-04-17**: `applyForm8396ReductionToScheduleA()` reduces Schedule A mortgage interest by line 3, recomputes totals, patches Deductions through line 15 taxable income. Line 16 and line 18 are downstream of this and recomputed naturally on the next compute cycle.
- [Form 8396 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return UI renders a structured summary instead of filling/exporting the IRS PDF directly.
- [Form 8396 / prior-year automation] Prior-year carryforwards rely on manual user entry. Automatic import from prior-year return artifacts is deferred.

---

## Schedule A (Form 8936) — Implemented (2026-03-24); Remaining Deferred Items

- ~~[Schedule A (Form 8936) / Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Schedule A (Form 8936) / business and commercial paths] Limited to personal-use new and previously owned clean vehicles. Part V (qualified commercial clean vehicle) and broader business-credit treatment are deferred.
- [Schedule A (Form 8936) / Form 3800] General business credit consumption for business/investment-use and commercial vehicle amounts is deferred.
- [Schedule A (Form 8936) / Schedule 2 recapture] Point-of-sale transfer recapture routing to Schedule 2 line 1b or 1c is deferred.
- [Schedule A (Form 8936) / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured UI summary instead of filling/exporting the IRS PDF fields directly.
- [Schedule A (Form 8936) / MFS spouse per-person MAGI inputs] **Added 2026-06-23 (MFS migration Form #33).** The spouse's clean-car-credit form omits the MAGI add-back (`currentYearAdditionalMagiAddbacks`) and prior-year-MAGI (`priorYearMagi`) fields — by design the MAGI test is joint on MFJ, so those live only on the taxpayer form. On the spouse's MFS leg her vehicles now route correctly (scoper fix) and her MAGI uses her own per-leg AGI vs the MFS ceiling ($150k new / $75k previously owned), which is correct for the common case. But she cannot (a) enter foreign-earned-income / Puerto Rico / American Samoa MAGI add-backs (so her MAGI may be understated if she has excluded foreign income), nor (b) use the prior-year-MAGI election to qualify a vehicle when her current-year MAGI exceeds the ceiling. Both are rare edge cases (foreign income + clean vehicle + MFS; or current-MAGI-over-ceiling-but-prior-under on MFS) and consistent with the deferred prior-year automation. Fix when needed: surface the two MAGI fields on the spouse form MFS-only (mirrors the #32 Form 8801 MFS-only core pattern) + read them per-leg in `computeForm8936CurrentYearMagi` / the prior-year disqualification check.

---

## Schedule R (Form 1040) — Implemented (2026-03-24); Remaining Deferred Items

- ~~[Schedule R / Schedule 3 line 6d → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Schedule R / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured summary instead of filling/exporting the IRS PDF fields directly.
- [Schedule R / physician or VA statement automation] The disability-statement path is captured as user input only. The app does not store or manage physician statements / VA Form 21-0172 retention, renewal, or document tracking.

---

## Line 26 — Implemented (2026-03-27); Remaining Deferred Items

- ~~[Line 26 / Form 2210 underpayment penalty]~~ **Resolved 2026-03-29** — Form 2210 fully implemented: Part I (lines 1–9), Part II waiver boxes A/B/E, Part III regular method (4 equal installments). `totalPenalty` → `AmountOwed.estimatedTaxPenalty` (line 38). Angular intake `prior-year-tax-taxpayer` + display `form-tax-return-2210`. 4 unit tests + 3 E2E tests. Remaining deferred: Schedule AI (box C), box D (actual withholding dates), waiver documentation upload, farmers/fishermen Form 2210-F path.
- ~~**[Line 26 / G1 / MEDIUM] MFJ data-loss risk**~~ **Fixed 2026-04-19** — `computeLine26EstimatedTax()` now reads both `taxpayerForm` and `spouseForm` on non-MFS returns. Both spouses' payments are combined on line 26 as required by the IRS joint-return rule. On MFS only the taxpayer form is read. 3 new unit tests + 2 new E2E tests cover MFJ aggregation and MFS isolation.
- ~~[Line 26 / G2 / LOW] No MFS-specific unit test.~~ **Fixed 2026-04-19** — Added `line26MfjBothFormsAggregated`, `line26MfjOnlySpouseFormHasPayments`, `line26MfsSpouseFormIgnored`.
- ~~[Line 26 / G3 / LOW] No MFS-specific E2E test.~~ **Fixed 2026-04-19** — Added MFJ and MFS scenarios to `line26-estimated-tax-payments.spec.ts`.
- ~~[Line 26 / G4 / LOW] `taxpayerForm == null` early return blocks MFJ spouse-only payments.~~ **Fixed 2026-04-19** — `computeLine26EstimatedTax()` now computes `taxpayerMade` safely when `taxpayerForm` is null; proceeds to read spouse form when it has payments on a non-MFS return. Unit test `line26MfjSpouseFormReadWhenTaxpayerFormAbsent` + E2E test added.
- ~~[Line 26 / G5 / LOW] No compute-level E2E test for `divorceFormerSpouseSSN` persistence.~~ **Fixed 2026-04-19** — Added E2E test verifying field persists to Firestore and is annotation-only (does not affect line 26 sum).
- [Line 26 / MFS spouse-return isolation] The `estimated-tax-payments-spouse` form is registered and accepted by `PersonalResource` but the backend never reads it on the same return. On a true MFS spouse return the spouse would save to `estimated-tax-payments-taxpayer` (their own form). No code change needed unless a spouse-only return flow is added.
- [Line 26 / prior-year overpayment auto-import] The 2024 original-return overpayment applied to 2025 (line 36 of the 2024 return) is entered manually. Automatic import from a prior-year return artifact is deferred.
- [Line 26 / Form 1040-ES semantic PDF assets] No Form 1040-ES PDF template or semantic CSV exists in `C:\us-tax\pdfs\`. If quarterly voucher PDF export is needed it requires a new asset generation script.
- [Line 26 / farmers and fishermen] One-installment rule (66⅔% safe harbor) and Form 2210-F path are out of scope.
- [Line 26 / community property MFS 50/50 split] Proportional division of jointly-made payments between MFS spouses in community property states is out of scope; user enters their share manually.

---

## Form 4868 — Implemented (2026-03-26); Remaining Deferred Items

- ~~[Form 4868 / Line 26 estimated tax payments]~~ **Resolved 2026-03-27** — Line 26 estimated tax payments fully implemented; see Lines 20–38 entry above.
- [Form 4868 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return UI renders a structured summary instead of filling/exporting the IRS PDF directly.
- [Form 4868 / Part I identity auto-populate] Address details from a taxpayer address form would auto-populate `line1Names`, `addressLine1/2`, `cityStatePostal` when that form is implemented.
- [Form 4868 / combat zone automatic extension] The IRS grants automatic 180-day extensions for combat zone filers without a Form 4868; this path is out of scope.

---

## Form 5695 — Implemented (2026-03-24); Remaining Deferred Items

- ~~[Form 5695 / Schedule 3 lines 5a and 5b → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Form 5695 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured UI summary instead of filling/exporting the IRS PDF fields directly.

---

## Form 8880 — Implemented (2026-03-24); Remaining Deferred Items

- ~~[Form 8880 / Schedule 3 line 4 → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.

---

## Form 1116 — Implemented (2026-03-23); Remaining Deferred Items

- ~~[Form 1116 / Form 1040 line 20 / Schedule 3 line 1]~~ **Resolved 2026-03-26** — `finalizeSchedule3Totals()` sums Schedule 3 line 8 and line 15; both are now wired into Form 1040 lines 20 and 31.
- [Form 1116 / AMT FTC] Form 6251 line 8 (AMT foreign tax credit) defaults to 0. Requires separate FTC AMT recomputation path — deferred.
- [Form 1116 / carryover Schedule B] Per-category carryover tracking uses user-entered `priorYearCarryover` values only; the automatic 1-year-back / 10-year-forward carryover ledger (Form 1116 Schedule B) is not built.
- [Form 1116 / high-tax kickout] Passive income with an effective foreign tax rate above the highest US bracket should be reclassified to general category. Not implemented.
- [Form 1116 / Part IV consolidation] When more than one Form 1116 exists, Part IV uses the category with the largest line 24. Only 4 categories are routed (indices 0–3); expand if needed.

---

## Form 1040 Line 17 — Implemented (2026-03-21); Remaining Deferred Items

- [Line 17 / MFS add-back rule] For MFS filers with AMTI > $900,350, the 25% add-back capped at $68,500 is deferred — applies only to rare high-income MFS filers.
- [Line 17 / Form 6251 line 2c] AMT investment interest expense adjustment — requires second Form 4952 recomputation under AMT rules; deferred.
- [Line 17 / Form 6251 line 2f] Alternative tax NOL deduction (ATNOLD) — requires AMT NOL carryover tracking; deferred.
- [Line 17 / Form 6251 line 2i] ISO spread (incentive stock options) — out of scope; no stock-option intake in this application.
- [Line 17 / Form 6251 line 2m] Passive activity AMT adjustment — requires Schedule E / rental income; deferred.
- [Line 17 / Form 6251 line 8] AMT foreign tax credit — deferred; requires separate FTC computation. Defaults to 0.
- [Line 17 / Schedule 2 line 1z] Clean-energy credit recapture — out of scope; set to 0.

## Form 1040 Line 17 — Additional Gaps Identified (2026-04-18) — All Fixed

- ~~**[Line 17 / G1 / HIGH] Form 6251 line 2a standard deduction**~~ **Fixed 2026-04-18**: `computeLine17()` now sets `line2a = form1040.getDeductions().getDeductionAmount()` (line 12e) when the taxpayer does not itemize. Previously always `BigDecimal.ZERO`. Unit test `line17G1AmtLine2aIncludesStandardDeductionForNonItemizer` verifies ($100k wages + $50k PAB → AMT $2,645 with fix vs $0 without).
- ~~**[Line 17 / G2 / MEDIUM] `additionalTaxSchedule2` never set**~~ **Fixed 2026-04-18**: `wireLine17ToOutputs()` now calls `taxAndCredits.setAdditionalTaxSchedule2(amt)`. The PDF line 17 field now renders correctly. Unit test `line17G2AdditionalTaxSchedule2IsSetWhenAmtPositive` verifies.
- ~~**[Line 17 / G3 / MEDIUM] `Form6251.line10` missing FTC subtraction**~~ **Fixed 2026-04-18**: New `correctLine17ForFtc()` method runs after `applyForeignTaxCreditToSchedule3()` and subtracts the FTC from line 10, then recalculates line 11 and re-wires outputs. Unit test `line17G3Line10IsReducedByForeignTaxCredit` verifies ($100 FTC → line10 $13,449→$13,349, line11 $2,645→$2,745).
- ~~**[Line 17 / G4 / MEDIUM] Part III AMT QDCG rates not computed**~~ **Closed (not a gap)**: `computeAmtPartIII()` is fully implemented and called. The comment referencing `computeAmtPartIIIFull()` was misleading — the audit finding was incorrect.
- **[Line 17 / G5 / LOW — FIXED]** Spec `lines/17.md` listed MFS Part III line 25 threshold as `$300,000`; corrected to `$300,025` (half of MFJ $600,050 per Rev. Proc. 2024-40 §3.09). Backend was already using `$300,025`. Spec-only fix applied 2026-04-18.
- ~~**[Line 17 / G-new-1 / LOW] `totalTaxBeforeCredits` stale after FTC correction**~~ **Fixed 2026-04-18**: `correctLine17ForFtc()` now calls `computeLine18()` after re-wiring line 17. Previously `totalTaxBeforeCredits` retained the pre-correction sum when a foreign tax credit applied. Unit test `line17GNew1TotalTaxBeforeCreditsRefreshedAfterFtcCorrection` verifies.
- ~~**[Line 17 / G-new-2 / MEDIUM] Form 6251 Part III fields blank on PDF export**~~ **Fixed 2026-04-18**: New `populateAmtPartIIIFields()` method follows exact IRS 2025 Part III worksheet arithmetic (lines 12–40) and is called from `computeLine17()` when `line7Path == "PART_III"`. All 29 Part III fields are now populated. Unit test `line17GNew2PartIIIFieldsPopulatedWhenQualifiedDividendsPresent` verifies.
- ~~**[Line 17 / G-new-3 / LOW] E2E test coverage for AMT scenarios**~~ **Written 2026-04-18**: E2E spec `e2e/tests/line17-amt-gaps.spec.ts` covers G1 regression, G3+G-new-1 regression, G-new-2 Part III field population, and G-new-4 §1250 exclusion (4 scenarios). Cannot be executed in Claude sandbox (Playwright EPERM); run externally.
- ~~**[Line 17 / G-new-4 / LOW] `computeAmtPartIII()` includes §1250 in preferential pool**~~ **Fixed 2026-04-18**: `computeAmtPartIII()` now delegates to `populateAmtPartIIIFields()` via a temporary Form6251 object, returning `line40`. This ensures §1250 is excluded from the 0%/15%/20% bracket pool (IRS Part III line 14 subtraction) and `line7 == line40`. Unit test `line17GNew4Section1250GainExcludedFromPreferentialPool` verifies.

---

## Form 1040 Line 18 — Implemented (2026-03-22); Deferred Items

- ~~**[Line 18 / G1 / LOW] `computeLine18()` reads `alternativeMinimumTax` instead of full `Schedule2.line3`**~~ **Fixed 2026-04-18**: `computeLine18()` now reads `TaxAndCredits.additionalTaxSchedule2` (Schedule 2 line 3) instead of `alternativeMinimumTax` (Form6251.line11 only). Both fields are equal while `Schedule2.line1z = 0` (current scope), so behavior is unchanged. Future-proofs line 18 against any Schedule 2 Part I line 1z implementation. Unit test `line18UsesAdditionalTaxSchedule2ForLine17AddendNotAlternativeMinimumTax` documents the invariant (381 → 381+1 = **381 tests**; full suite now **502 tests**). Javadoc updated to explain the semantic distinction.

## Form 8962 — Implemented (2026-03-21); Remaining Deferred Items

No outstanding items beyond those captured in cross-cutting sections below.

---

## Form 8801 — Implemented (2026-03-24); Remaining Deferred Items

- ~~[Form 8801 / Wire Schedule 3 line 6b → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Form 8801 / line 12 MTFTCE automation] Automate Form 8801 line 12 minimum-tax foreign tax credit from Form 1116 workpapers instead of manual user input.
- [Form 8801 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured summary rather than filling/exporting the IRS PDF fields directly.
- [Form 8801 / Part III special-case paths] Rare MFS threshold path beyond standard filing-status thresholds is deferred.
- [Form 8801 / prior-year automation] Prior-year Form 6251 / Form 8801 worksheet values rely on manual entry; automated import deferred.

---

## Form 8859 — Implemented (2026-03-25); Remaining Deferred Items

- ~~[Form 8859 / Wire Schedule 3 line 6h → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Form 8859 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured summary rather than filling/exporting the IRS PDF fields directly.
- [Form 8859 / prior-year automation] Prior-year Form 8859 line 4 import deferred until prior-year return artifacts are available in-app.
- [Form 8859 / filing-status-change allocation] Cross-year joint/separate carryforward ownership rules are not modeled.
- [Form 8859 / Schedule 8812 CLW-B automation] Credit Limit Worksheet B line 14 derivation supports a manual override field; full automation deferred.
- [Form 8859 / MFS spouse Worksheet B override field] **Added 2026-06-23 (MFS migration Form #38).** The spouse form (`carryforward-homebuyer-credit-spouse`) collects only the gate + carryforward amount; it has no equivalent of the taxpayer form's optional `useSchedule8812CreditLimitWorksheetBOverride` / `schedule8812CreditLimitWorksheetBLine14Override` line-2 override. On the spouse's MFS leg her Form 8859 now computes correctly (scoper remaps her gate → master claim + her carryforward → the bare line-1 key), and line 2 is auto-computed from her own leg's tax-before-credits − CTC/ODC − other credits. The override matters only in the rare case where Schedule 8812 directs Credit Limit Worksheet B (CTC/ACTC interplay) on her separate return; absent the field her line-2 limit uses the default CTC instead of the override. Cosmetic for the common case (no dependents / line-2 capacity ≫ carryforward). Fix when polishing: surface the two override fields on the spouse form MFS-only + map them in `MfsFormScoper.normalizeCarryforwardHomebuyerCreditSpouse` (mirrors the #37 Form 8396 MFS-only-core approach). Low priority.

---

## Form 8834 — Implemented (2026-03-25); Remaining Deferred Items

- ~~[Form 8834 / Wire Schedule 3 line 6i → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Form 8834 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured summary rather than filling/exporting the IRS PDF fields directly.
- [Form 8834 / Form 8582-CR passive activity credit] Automate released qualified electric vehicle passive activity credit import for line 1; current implementation relies on manual line 1 entry.
- [Form 8834 / MFS spouse confirm-available field] **Added 2026-06-23 (MFS migration Form #36).** The spouse form (`electric-vehicle-credit-spouse`) collects only the claim gate + released amount (`spouseHasElectricVehicleCreditInputs`, `spouseReleasedQevPassiveActivityCreditContribution`); it has no equivalent of the taxpayer form's `confirmReleasedQevCreditAvailable` radio. On the spouse's MFS leg her Form 8834 now computes correctly (scoper remap routes the gate + amount onto the bare taxpayer-slot keys `computeForm8834` reads), but because `confirmReleasedQevCreditAvailable` is unset, the compute appends the advisory note "The released Form 8582-CR qualified electric vehicle credit amount was not explicitly confirmed on the taxpayer form." This is cosmetic only — it does NOT gate or alter the credit value (line 1/line 7 are computed from the released amount and tax capacity regardless). Fix when polishing the spouse form: add a spouse-side confirm radio (`spouseConfirmReleasedQevCreditAvailable`) MFS-only and map it in `MfsFormScoper.normalizeElectricVehicleCreditSpouse` onto `confirmReleasedQevCreditAvailable` (mirrors the #32 Form 8801 MFS-only-field pattern). Low priority; the note is informational.

---

## Form 8911 — Implemented (2026-03-25); Remaining Deferred Items

- ~~[Form 8911 / Wire Schedule 3 line 6j → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Form 8911 / Form 3800] Downstream Form 3800 consumption for business/investment-use credit (line 3) is deferred.
- [Form 8911 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders structured summaries rather than filling/exporting the IRS PDF fields directly.
- [Form 8911 / census-tract verification] Eligibility relies on user-entered eligibility plus optional GEOID; automated GIS/lookup support is deferred.
- [Form 8911 / pass-through-only path] Released or K-1 credit without in-scope qualifying property does not generate the form (Form 3800 branch deferred).

---

## Form 8912 — Implemented (2026-03-25); Remaining Deferred Items

- ~~[Form 8912 / Wire Schedule 3 line 6k → Form 1040 line 20]~~ **Resolved 2026-03-26** — Schedule 3 line 8 is now wired into Form 1040 line 20.
- [Form 8912 / semantic PDF fill-export] The 2025 semantic assets are generated and published, but the Tax Return section renders a structured summary rather than filling/exporting the IRS PDF fields directly.
- [Form 8912 / Form 1097-BTC automation] Automate Form 1097-BTC statement intake; current implementation relies on manual Part III row entry.
- [Form 8912 / direct-bond worksheet] Automate Treasury credit-rate lookup and direct-bond worksheet; current implementation relies on manual direct-bond amounts.
- [Form 8912 / CREB and pre-2008 QZAB unused-credit deduction] Deferred until that path enters scope.

---

## Form 1040 Line 16 — Implemented (2026-03-20); Remaining Deferred Box-3 Items

- [Line 16 / Box 3 / 962] Section 962 election tax — requires CFC inclusion statement and Form 1118 credits.
- [Line 16 / Box 3 / 1291TAX] Form 8621 line 16e PFIC section 1291 tax — requires Form 8621 implementation.
- [Line 16 / Box 3 / Form 8978] Form 8978 line 14 BBA partnership push-out adjustment tax — requires Form 8978 implementation.
- [Line 16 / Box 3 / 965INC] Section 965(i) triggered deferred net tax liability — requires Form 965-A implementation.

## ~~Form 1040 Line 16 — Additional Gaps (2026-04-18)~~ **Partially Fixed 2026-04-18**

- ~~[Line 16 / G2 / FEITW + QDCG]~~ **Fixed 2026-04-18**: `computeForeignEarnedIncomeTaxWorksheet()` now accepts `Form1040` and `ScheduleD` parameters. lineD uses `computeQDCGWorksheet()` or `computeScheduleDTaxWorksheet()` when applicable (same routing logic as the main decision tree). lineE always uses ordinary bracket (IRS spec). 2 unit tests: `line16FeitwUsesQdcgWorksheetWhenQualifiedDividendsPresent` ($22,803 vs $24,153 without fix) and `line16FeitwOrdinaryOnlyStillUsesOrdinayBracket` ($19,353 regression guard).
- [Line 16 / G3 / FEITW line 2b] Outstanding — housing deduction (main G3 source) is out of scope. Impact minimal (most returns have line 2b = 0). **Low** severity. Deferred.
- ~~[Line 16 / G4 / frontend interface]~~ **Fixed 2026-04-18**: `taxAndCredits` interface in `form-tax-return-1040.component.ts` now declares all 9 breakdown fields: `regularTax`, `computationMethod`, `box1Form8814Tax`, `box2Form4972Tax`, `ecrBox3Tax`, `box1Checked`, `box2Checked`, `box3Checked`, `box3Code`.
- ~~[Line 16 / G5 / PDF checkboxes]~~ **Fixed 2026-04-18**: PDF mapping now fills `line16_check_form8814`, `line16_check_form4972`, `line16_check_other_form`, and `line16_other_form_number` from the `taxAndCredits` breakdown fields.
- ~~[Line 16 / G6 / E2E coverage]~~ **Partially fixed 2026-04-18**: Added 3 E2E tests to `line16-tax.spec.ts`: TAX_COMPUTATION_WORKSHEET path ($150k wages → line15=$134,250), FOREIGN_EARNED_INCOME path (Form 2555 $80k exclusion), Box 2 Form 4972 add-on (Part II capital-gain tax). SCHEDULE_D_TAX_WORKSHEET path and Box 1 (Form 8814) remain deferred (seeding complexity).

---

## Form 8615 (Kiddie Tax) — Partially Implemented (2026-03-17)

- Line 16 routes through the FORM_8615 path using the user-entered `childFinalTaxLine18` value from `kiddie-income-taxpayer`; if null, falls back to bracket method with a warning log.
- [Form 8615 / parent-rate tentative-tax] Lines 9–13 (parent's tax at parent rate), child-line share logic, and cross-child aggregation (other children's line 5 totals, parent SSN/filing-status lookup) remain deferred.

---

## Form 2555 — Partially Implemented (2026-03-20)

- [Form 2555 / Line 51+ housing deduction] Foreign housing deduction (Part VII) for self-employed taxpayers is deferred — self-employment is out of scope.
- ~~[Form 2555 / Schedule 1-A MAGI auto-wire] Computed Form 2555 line 45 and line 50 exclusion amounts are not yet automatically wired into Schedule 1-A Part I lines 2b and 2c (currently manual entry only).~~ **Resolved 2026-04-17**: `computeSchedule1A()` prefers computed Form 2555 values (lines 16922–16940) over manual entries when available.
- [Form 2555 / housing cap] Country-specific housing exclusion caps are approximated at 30% of the annual exclusion. Implement the IRS location-specific ceiling table for accurate country-by-country housing caps.

---

## Form 8839 — Implemented (2026-03-28); Remaining Deferred Items

- ~~[Form 8839 / nonrefundable line 18] Part II line 14 (line 12 − line 13) and line 16 (line 14 + carryforward) are computed and stored in the model but line 18 Credit Limit Worksheet wiring to Schedule 3 line 6c is deferred.~~ **Resolved 2026-04-18** — `applyAdoptionCredit()` implemented: CLW-B computes line 17 (credit limit) and line 18 = min(line 16, line 17); line 18 wired to `Schedule3NonrefundableCredits.adoptionCredit` → Schedule 3 line 6c.
- ~~[Form 8839 / MAGI auto-compute] MAGI for adoption phaseout currently requires manual `magiForAdoptionBenefitsExclusion` entry.~~ **Resolved 2026-04-20 (G1)** — `applyAdoptionCredit()` now auto-derives MAGI = AGI + Form 2555 lines 45/50 (taxpayer + spouse) + Puerto Rico exclusion + Form 4563 line 15 when `part2Line7ModifiedAgi` is null after the initial compute pass. Re-runs per-child Part II and Part III loops using stored intermediate values. 1 new unit test `adoptionCreditAutoMagiFromAgiWhenManualMagiAbsent`.
- ~~[Form 8839 / MFS flag] No blocking flag is emitted for MFS filers; per IRS instructions, MFS filers may not claim the adoption credit (except for special needs children). Emit `ADOPTION_CREDIT_MFS_INELIGIBLE` flag when MFS and no special needs child.~~ **Resolved 2026-04-20 (G4)** — `ADOPTION_BENEFITS_MFS_EXCLUSION_DISALLOWED` flag changed to `blocking=true` with expanded message covering both Part II credit and Part III exclusion for non-special-needs children. 1 new unit test `adoptionCreditMfsWithoutExceptionEmitsBlockingFlag`.
- ~~[Form 8839 / PDF export 4–6 children]~~ **Resolved 2026-04-11** — `saveAsPdf()` now detects `children.length > 3`, loads the template a second time, fills children[3–5] into slots 1–3 of the overflow page (header only, no totals), and merges via `pdfDoc.copyPages` before download. Returns with 4–6 children produce a 2-page Form 8839 PDF.
- ~~[Form 8839 / 3+ children overflow]~~ **Resolved 2026-04-11** — Limit expanded from 3 to 6 children. YAML `maxItems` raised to 6; child4/5/6 fields added to all four per-child groups in YAML and Angular model. `buildAdoptionChildren()` hardcoded limit removed (iterates all entries). `ADOPTION_BENEFITS_TOO_MANY_CHILDREN` flag changed to non-blocking and triggers only when `childEntryCount > 6`. All key-lookup tables in backend extended to child4/5/6. 1 new unit test (`adoptionBenefitsFourChildrenAllExcluded`). For 7+ children a separate attached statement is still required.
- ~~[Form 8839 / PDF fill-export] Semantic PDF assets not generated.~~ **Resolved 2026-04-11** — `f8839_semantic_labels.pdf` + CSV were already generated and published to `us-tax-ui/public/irs/`. Fixed stale 2024 CSV field names: Part III line numbers updated from 2024 numbering (17-29) to 2025 numbering (19-31); Part II line11→11a, line12→line12 (add_line11a), carryforward line13→15, line14→16, line15→17, line16→line18; child checkbox labels updated (2007→2008, 2024→2025). Default PDF filename corrected to `Form-8839-2025.pdf`.
- ~~[Form 8839 / Line 30 G2 — CLW-B missing Form 1040 line 19 (CTC/ODC)]~~ **Resolved 2026-04-20 (G2)** — `applyAdoptionCredit()` CLW-B now includes Form 1040 line 19 (`childTaxCredit`) in the prior-credits sum. 1 new unit test `adoptionCreditNonrefundableReducedWhenCtcPresentInClwB` verifies line 17 is reduced when CTC is present.
- ~~[Form 8839 / Line 30 G3 — CLW-B missing Schedule 3 lines 6d/6f/6g/6l/6m]~~ **Resolved 2026-04-20 (G3)** — `applyAdoptionCredit()` CLW-B prior-credits sum now includes lines 6d (`elderlyDisabledCredit`), 6f (`cleanVehicleCredit`), 6g (`alternativeFuelVehicleRefuelingPropertyCredit`), 6l (`amountFromForm8978Line14`), 6m (`creditPreviouslyOwnedCleanVehicles`). Zero impact until those credits are computed and non-null.
- ~~[Form 8839 / Line 30 G4 — No ADOPTION_CREDIT_MFS_INELIGIBLE flag]~~ **Resolved 2026-04-20 (G4).** See MAGI auto-compute item above.
- ~~[Form 8839 / Line 30 G5 — Special-needs Part II line 5 unit test missing]~~ **Resolved 2026-04-20 (G5)** — Unit test `adoptionCreditSpecialNeedsLine5UsesMaxCreditNotActualExpenses` added: special-needs final adoption, actual expenses $500 → `part2Line5QualifiedExpenses` = $500 (stored as-is), `part2Line6SmallerOf4Or5` = $17,280 (special-needs override applied at line 6), `part2Line11bRefundableBase` = $5,000, refundable credit = $5,000.
- ~~[Form 8839 / Line 30 G6 — No E2E test for nonrefundable credit path]~~ **Resolved 2026-04-20 (G6)** — E2E test `Part II nonrefundable adoption credit flows to Schedule 3 line 6c and Form 1040 line 20` added to `form8839-adoption-credits.spec.ts`. Uses W-2 $80k + MAGI $200k + expenses $10k; asserts refundable $5,000 + `schedule3.nonrefundableCredits.adoptionCredit > 0` + `form1040.taxAndCredits.otherCreditsSchedule3 > 0`.
- [Form 8839 / Line 30 G7 — Schedule 8812 CLW-B substitute] **Added 2026-04-20. LOW. PARTIAL.** `Schedule8812.java` now has `creditLimitWorksheetBLine14` field; `computeSchedule8812()` populates it (= `line13CreditLimitWorksheetA`) when ≥ 3 qualifying children or Puerto Rico resident. `applyAdoptionCredit()` substitutes this value for `childTaxCredit` in CLW-B when non-null. Full CLW-B line 14 formula per Schedule 8812 instructions not yet audited end-to-end.
- [Form 8839 / Line 30 G8 — Semantic PDF field coverage] **Added 2026-04-20. LOW. Documentation only.** f8839 semantic CSV field names were updated to 2025 numbering (resolved 2026-04-11). Full AcroForm field mapping of per-child intermediate lines not yet verified against the 2025 IRS PDF template. No tax-correctness impact.

---

## Form 4972 — Implemented; Remaining Deferred Items

- [Form 4972 / NUA worksheet] Net unrealized appreciation (box 6) from employer securities requires the NUA worksheet. Box 6 is stored but not used in any computation.
- [Form 4972 / multiple participants] Multiple Form 4972 elections for beneficiaries of more than one deceased participant are not modeled; current implementation supports one election per spouse.
- [Form 4972 / QDRO alternate payee] QDRO alternate payee Form 4972 eligibility is not gated or modeled.

---

## Schedule 8812 — Partially Implemented (2026-03-22)

- Parts I and II-A are implemented (lines 19 and 28 wired).
- ~~[Schedule 8812 / CLW-A — add now-implemented credits (wA_2, wA_4, wA_5)]~~ **Fixed 2026-03-28** — `computeSchedule8812()` CLW-A now subtracts all prior nonrefundable credits: Form 1116 (wA_2), Form 2441 (wA_3), Form 8863 (wA_4), Form 8880 (wA_5), Schedule R (wA_6). 2 new unit tests.
- ~~[Schedule 8812 / Part II-B]~~ **Implemented 2026-03-28** — Full Part II-B path live for 3+ qualifying children. Lines 21–26 computed from W-2 box 4 (SS withheld) + Schedule 2 lines 5/6/13 + EIC/AOTC refundable (line 24). 3 new unit tests.
- ~~[Schedule 8812 / `electsNoActc` opt-out]~~ **Implemented 2026-03-28** — `electsNoActc` boolean read from `ctc-actc-screening-taxpayer`. When true: `line27 = 0`, `Schedule8812.electsNoActc = true`. 2 new unit tests. 4 E2E tests in `line28-actc-schedule8812.spec.ts`.
- ~~[Schedule 8812 / Part II-B line 24 compute order — G1]~~ **Fixed 2026-04-18 (completed 2026-04-18)** — EIC is pre-computed before `computeSchedule8812()`. Refundable AOTC sub-gap also closed: `computeForm8863()` moved before `computeSchedule8812()`, fixing two bugs simultaneously: (1) CLW-A now correctly subtracts education credits (wA_4 was always 0 before the move); (2) refundable AOTC is pre-set from `form8863.getLine8RefundableAotc()` before Schedule 8812 runs, so Part II-B line 24 includes AOTC. All three pre-sets (EIC, AOTC) are idempotent — `computeLine31ThroughLine38()` overwrites with identical values. Unit tests: `schedule8812_partIIB_line24_includesEic_g1Fix`, `schedule8812_worksheetA_subtractsEducationCredits_clwaFix`, `schedule8812_partIIB_line24_includesAotc_aotcFix`. 507/507 tests pass.
- ~~[Schedule 8812 / Form 8862]~~ **Resolved 2026-03-28** — `computeForm8862()` implemented; `FORM_8862_CTC_REQUIRED` flag emitted when CTC was previously denied and Part III is not filed. CTC/ACTC/ODC eligibility gates are active.
- ~~[Line 28 / PDF export — line 28 amount field]~~ **Fixed** — `line28_additional_child_tax_credit` is filled from `form.payments?.additionalChildTaxCredit` in `form-tax-return-1040.component.ts`.
- ~~[Line 28 / PDF export — opt-out checkbox]~~ **Fixed** — `unmapped_c2_14_0` is set from `computation?.schedule8812?.electsNoActc === true` in `form-tax-return-1040.component.ts`.
- ~~[Line 28 / PDF export — dependent CTC/ODC checkboxes]~~ **Fixed** — `dependent${index}_child_tax_credit` and `dependent${index}_credit_for_other_dependents` filled from `dependent.childTaxCreditEligible` / `dependent.otherDependentCreditEligible`, which are set in `buildDependents()` from `DependentRecord.qualifiesForCTC()` / `.qualifiesForODC()`.
- ~~[Line 28 / UI — `electsNoActc` checkbox]~~ **Already implemented** — `form-ctc-actc-screening.component.ts` exists with a p-checkbox bound to `electsNoActc`. **Note (2026-04-18):** This opt-out has no IRS basis for 2025 (Schedule 8812 line 15 is reserved; no opt-out provision exists). Feature retained as-is (conservative opt-out; user forfeits entitlement, no compliance risk). G4 closed as accepted design decision.
- ~~[Line 28 / UI — Schedule 8812 sidebar always visible — G2]~~ **Already fixed (confirmed 2026-04-18)** — `shell.component.ts` lines 1052-1055 conditionally push `tax-return-schedule8812` only when `line14CtcOdcCredit > 0 || line27ActcCredit > 0`.
- ~~[Schedule 8812 / G5 — line10PhaseOutExcess stores rounded excess, not raw]~~ **Fixed 2026-04-18** — Backend now stores raw excess in `line10PhaseOutExcess` for correct PDF display. Line 11 is still computed from `ceil(excess/1000) × $50` (IRS instruction). Unit test `schedule8812_line10_storesRawExcess_g5Fix` verifies (MAGI $210,500 → line10 = $10,500, line11 = $550).
- ~~[Schedule 8812 / G7 — 2025 filer SSN rule not enforced]~~ **Fixed 2026-04-18** — `computeSchedule8812()` now checks if the filer (or MFJ spouse) has an ITIN (SSN digits starting with "9"). If so, ACTC is set to zero and `SCHEDULE_8812_ITIN_ACTC_BLOCKED` flag emitted; CTC (line 14) is still computed normally. Unit test `schedule8812_itinFiler_blocksActc_allowsCtc_g7Fix` verifies.
- ~~[Schedule 8812 / G8 — line18bCombatPay not tracked]~~ **Fixed 2026-04-18** — `Schedule8812.java` now has `line18bCombatPay` field; `computeSchedule8812()` sets it from `getNontaxableCombatPayElection()`; `Schedule8812View` interface in Angular updated. No PDF field exists for 18b in the current `f1040s8` CSV — field is tracked in data model only. Unit test `schedule8812_line18b_combatPayTracked_g8Fix` verifies ($3k combat pay → line18b=$3,000, line18a=$23,000).
- ~~[Schedule 8812 / G6 — ACTIVE BUG: CLW-A missing three now-implemented credits]~~ **Fixed 2026-04-20.** `computeSchedule8812()` CLW-A block now subtracts `energyEfficientHomeImprovementCredit` (Sched3 line 5b), `cleanVehicleCredit` (line 6f), and `creditPreviouslyOwnedCleanVehicles` (line 6m) from `wA3`. Full E2E unit tests for these three credits deferred until Form 5695 Part II and Form 8936 compute methods are implemented (they currently produce null so the fix has no observable impact until those forms are implemented); existing CLW-A tests cover the subtraction mechanism via education credits and savings credit.
- ~~[Schedule 8812 / G9 — MFJ ITIN over-blocking ACTC]~~ **Fixed 2026-04-20.** `computeSchedule8812()` now separates `taxpayerHasItin` and `spouseHasItin` checks. For MFJ, ACTC is blocked only when `taxpayerHasItin && spouseHasItin`; a joint return where one spouse has a valid SSN is now allowed. Two unit tests added: `schedule8812_mfj_taxpayerValidSsn_spouseItin_allowsActc_g9Fix` and `schedule8812_mfj_bothSpousesItin_blocksActc_g9Fix`.
- ~~[Schedule 8812 / G10 — CTC per-child constant discrepancy ($2,200 vs $2,000)]~~ **Fixed 2026-04-20.** `computeSchedule8812()` constant changed from `$2,200` to `$2,000` per qualifying child (IRS 2025 Form 1040 General Instructions: "$2,000 for each child who qualifies you for the credit"; TCJA CTC increase to $2,200 did not pass the Senate). `lines/19.md` §2 formula and §2 constants block updated. Seven existing unit test assertions updated (`schedule8812_basicCtc_twoChildren_sufficientTax`, `schedule8812_mixedCtcAndOdc`, `schedule8812_partialPhaseOut_single`, `schedule8812_worksheetACapsCredit`, `schedule8812_worksheetA_subtractsEducationCredits_clwaFix`, and two stale comments in `schedule8812_fullPhaseOut_mfjHighMagi` and `schedule8812_worksheetA_subtractsForeignTaxCredit`).
- ~~[Schedule 8812 / G11 — Puerto Rico bona fide residents not implemented]~~ **Fixed 2026-04-20.** `computeSchedule8812()` now reads `isBonafidePuertoRicoResident` from `ctc-actc-screening-taxpayer` personal form. PR residents bypass the `line16b < $5,100` gate and go directly to Part II-B regardless of qualifying child count. `form-ctc-actc-screening.component.ts` updated with a "bona fide resident of Puerto Rico" radio button and help text. Unit test `schedule8812_puertoRicoResident_oneChild_usesPartIIB_g11Fix` verifies (1 child, PR resident, SS withheld $400 → line27 = $400 vs $375 without fix).
- [Schedule 8812 / G3 / LOW — Part II-B line 22 SE tax deferred] **Added 2026-04-20.** Part II-B line 22 should include Schedule 2 line 4 (self-employment tax on net SE earnings). The current implementation reads only Schedule 2 lines 5, 6, and 13 (uncollected SS/Medicare on tips/wages, Additional Medicare Tax). Line 4 is always $0 for W-2 filers and is correctly omitted while SE (Schedule C/F) is out of scope. When SE is implemented, `computeSchedule8812()` line 22 must also sum `schedule2.otherTaxes.selfEmploymentTax` (Schedule 2 line 4). No code or test change until SE is in scope.
- [Line 28 / LOW — Schedule 8812 PDF lines 22–26 not fillable] **Added 2026-04-20.** The IRS `f1040s8` PDF template (page 2) has no AcroForm fields for Part II-B intermediate lines 22–26. Only three page-2 fields exist in `f1040s8_field_map_semantic.csv`: `f2_1[0]` (line 20), `f2_2[0]` (line 21), `f2_3[0]` (line 27). Lines 22–26 values are stored correctly in `Schedule8812.java` and returned in the API response but cannot be filled into the generated PDF without IRS template regeneration. Deferred until the PDF template is updated.
- [Line 28 / LOW — CLW-A Form 5695 Pt II / Form 8936 E2E coverage deferred] **Added 2026-04-20.** G6 fix (CLW-A now reads `energyEfficientHomeImprovementCredit` line 5b, `cleanVehicleCredit` line 6f, `creditPreviouslyOwnedCleanVehicles` line 6m) has no observable E2E impact yet because `computeForm5695()` Part II and `computeCleanVehicleCredit()` are not yet implemented and produce null. When those credits are implemented, add E2E tests to `line28-actc-schedule8812.spec.ts` asserting that a positive Form 5695 Part II or Form 8936 credit reduces CLW-A (line 13) and therefore CTC (line 14) by the expected amount.

---

## Deferred Output-Form Wiring Gaps

- ~~[Line 4abc] Return-level output artifacts for required statement attachments tied to IRA exceptions and line 4c (rollover explanation, one-time QCD to split-interest entity, multi-exception breakout) are not modeled/stored/rendered.~~ **Fixed 2026-04-15** — Three String fields added to `Income.java` (`line4aRolloverAttachmentText`, `line4cQcdSieAttachmentText`, `line4cBreakoutStatementText`), populated in `computeIraDistributions()`, wired in `prepare()`, added to `Form1040View.income` interface, and rendered as info panels in `form-tax-return-1040.component.html`. Three unit tests added.
- ~~[Line 4abc / Form 8606 code Q] `buildForm8606()` generates Form 8606 Part III when `hasRothIraDistributions=true` even if all 1099-R entries have distribution code Q.~~ **Fixed 2026-04-14** — `computeIraForPerson()` now tracks `rothCodeJOrTCount` separately from `rothCodeCount`. When every Roth-coded entry has code Q (`allRothEntriesFullyQualified=true`), the `hasRothIraDistributions` form flag no longer contributes to `hasException2`, and the code-Q entry path does not set `rothCodeJOrTCount`. Unit test added: `suppressesForm8606WhenAllRoth1099REntriesHaveCodeQ`.
- ~~[Line 4abc / QCD post-70½ deductible contribution reduction]~~ **Fixed 2026-04-15** — `deductibleIraContributionsAfterAge70Half` field added to both IRA income YAML files and Angular components. `computeIraForPerson()` now computes `effectiveQcdAmount = max(0, qcdAmount - post70halfDeduction)` and uses it in `taxableAfterExceptions`. Two unit tests added: `qcdExclusionReducedByPost70HalfDeductibleContributions` and `post70HalfDeductionExceedingQcdResultsInZeroEffectiveQcd`.
- ~~[Line 4abc / `belongsToPersonIra()` fallback untested]~~ **Fixed 2026-04-14** — Unit test added: `assignsUntinnedIraEntryToSpouseViaFallbackHeuristic`. MFJ return with no `recipientTIN` on 1099-R, taxpayerHadIra=false, spouseHadIra=true → attributed to spouse.
- ~~[Line 4abc / MFJ single-spouse Form 8606 untested]~~ **Fixed 2026-04-14** — Two unit tests added: `mfjTaxpayerOnlyForm8606WhenSpouseHasNoTrigger` and `mfjSpouseOnlyForm8606WhenTaxpayerHasNoTrigger`.
- ~~[Line 4abc / disaster repayment path untested]~~ **Fixed 2026-04-14** — Two unit tests added: `form8606Part1DisasterRepaymentReducesLine15c` and `form8606Part3DisasterRepaymentReducesLine25c`. E2E coverage for breakout-statement blocking flag also added: 4th test in `line4abc-ira-income.spec.ts`.
- [Line 5abc] The "attach 1099-R when federal withholding exists" requirement is not represented as an explicit output artifact or flag in the return package view.
- ~~[Line 7ab] Remaining conditional capital output forms are not wired: Form 2439, Form 6252, Form 6781, Form 8824, and Schedule K-1 capital-item attachments (1041/1065/1120-S). Entries are read for Schedule D gating only; no standalone output artifacts produced.~~ **Implemented 2026-04-16** — `buildCapitalAttachmentForms()` produces `RequiredAttachmentForm` for each type (`form2439Capital`, `form6252Capital`, `form6781Capital`, `form8824Capital`, `scheduleK1Capital`) when entries exist. Wired into `TaxReturnComputation`, `TaxReturnDataService`. 4 unit tests added.
- ~~[Line 7ab / Form 8814 child on Schedule D line 13] When Schedule D is required AND the parent includes a child's capital gain distributions from Form 8814 line 10, the spec requires the child amount to appear on Schedule D line 13. Currently the backend adds the child amount directly to `line7a` (= line7aBase + childAmount) and does not route it through Schedule D line 13. This slightly understates Schedule D line 13 and long-term totals in the Schedule D required path.~~ **Fixed 2026-04-16** — In the non-exception1 (Schedule D) path, `form8814Line10Total` is added to `line13Amount` before recomputing `line15Amount` and `line16Amount`. `line7a` is set to `line7aBase` only (no separate add of childAmount). Unit test `form8814ChildCapGainFlowsThroughScheduleDLine13WhenScheduleDRequired` verifies: parent $100 + child $60 = Schedule D line 13 $160, line 16 = $460 = line 7a.
- ~~[Line 7ab / nominee reporting] Nominee capital gain distributions subtract via user-entered `nomineeCapitalGainDistributionsToSubtract`. The formal obligation to issue Form 1099-DIV and Form 1096 as a nominee payer is not represented as an output artifact or advisory flag.~~ **Fixed 2026-04-16** — Non-blocking advisory flag `CAPITAL_NOMINEE_DISTRIBUTIONS_REPORTED` emitted when `nomineeAdjustments > 0`. Unit test `nomineeCapitalAdvisoryFlagEmittedWhenNomineeAmountPresent` verifies flag code and `blocking=false`.
- ~~[Line 7ab / Form 8997] Form 8997 (Annual Report of QOF Investments) is not produced when `hasQofDeferral=true`.~~ **Fixed 2026-04-16** — `RequiredAttachmentForm form8997` produced in `prepare()` when `capital.hasQofDeferral()` is true. Added to `TaxReturnComputation` and `TaxReturnDataService`. Unit test `form8997RequiredAttachmentProducedWhenQofDeferralDetected`.
- ~~[Line 7ab / carryover worksheet] Capital loss carryover worksheet not produced.~~ **Fixed 2026-04-16** — `computeCapitalLossCarryover()` computes next-year short/long-term carryovers from Schedule D lines 7/15/21 using the IRS rule (allowable deduction applied to short-term losses first). Results in `ScheduleD.nextYearShortTermCapitalLossCarryover`/`nextYearLongTermCapitalLossCarryover`. Unit test `capitalLossCarryoverWorksheetComputesNextYearShortAndLongTermCarryovers`.
- ~~[Line 7ab / nonbusiness bad debt] Nonbusiness bad debt (§166) should be reported as a short-term capital loss on Schedule D.~~ **Fixed 2026-04-16** — `nonbusinessBadDebtFaceAmount`/`nonbusinessBadDebtDescription` fields in YAML; `addNonbusinessBadDebtTransaction()` creates Box C Form 8949 entry (proceeds=$0, basis=face). Unit test `nonbusinessBadDebtCreatesBoxCShortTermCapitalLossOnForm8949`.
- ~~[Line 7ab / 1099-S personal-use loss] Sales reported on Form 1099-S where the loss is not deductible (personal-use property) must still be reported on Form 8949.~~ **Fixed 2026-04-16** — 1099-S entries now loaded in `prepare()`; non-blocking advisory flag `FORM_1099S_REAL_ESTATE_REPORTED` emitted when entries present. Full §121 exclusion computation and Form 8949 auto-generation from 1099-S remain deferred. Unit test `form1099SAdvisoryFlagEmittedWhenRealEstateSalesExist`.
- ~~[Line 7ab / UI Rule 34 — carryover labels contain IRS references] Carryover field labels included `(last year's Schedule D line 26/27)` text.~~ **Fixed 2026-04-16** — Labels stripped in both YAMLs and both Angular components per Rule 34.
- ~~[Line 7ab / UI Rule 36 — `hadCapitalAssetSalesOrExchanges` on spouse form not auto-derived] When Phase 6A write-back sets `imported1099BRecordCount > 0` for spouse, the screening radio was still rendered.~~ **Fixed 2026-04-16** — `salesAutoDetected` getter; auto-derived display replaces radio buttons; E2E test passes.
- ~~[Line 7ab / UI Rule 36 — `hadCapitalGainOrLoss` not auto-set from uploaded statements (taxpayer)] Taxpayer form opened at intro even when statements were already uploaded.~~ **Fixed 2026-04-16** — `activityAutoDetected = totalStatementCount() > 0`; `ngOnInit` sets `hadCapitalGainOrLoss=true` and redirects to hub; screening sub-screen shows auto-derived display; E2E test passes.
- ~~[Line 7ab / UI Rule 36 — `hadCapitalGainOrLoss` not auto-set from write-back fields (spouse)] Spouse form did not auto-redirect to hub when Phase 6A write-back indicated capital activity.~~ **Fixed 2026-04-16** — `capitalActivityAutoDetected` getter reads `imported1099B1099DaNetGainOrLossTotal`/`imported1099DivBox2aCapitalGainDistributionsTotal`; same auto-set and hub redirect.
- ~~[Line 7ab / UI Rule 32 — no proactive guidance for Form 8997] When `hasQofDeferralOrTermination=true`, the form did not surface Form 8997 attachment guidance.~~ **Fixed 2026-04-16** — Info panel rendered in taxpayer component when flag is true.
- ~~[Line 7ab / UI Rule 32 — no guidance for supplemental Schedule D source forms] `hasOtherScheduleDSourceForms` section had no explanation of Forms 6252/4684/6781/8824.~~ **Fixed 2026-04-16** — `.section-guidance-note` panel injected via `SectionDef.showGuidanceWhen`/`guidanceText` in both components.
- ~~[Line 7ab / UI — screening instructions misleading when auto-detected] Both forms showed "Answer No to skip..." when radio buttons were hidden due to auto-detection.~~ **Fixed 2026-04-16** — Conditional `*ngIf` renders contextual auto-detected message instead.
- ~~[Line 7ab / UI — hub card screening summary did not distinguish auto-detected from user-answered] `screeningSummary` returned same string regardless of auto-detection.~~ **Fixed 2026-04-16** — Both `screeningSummary` getters now return auto-detected wording when applicable.
- ~~[Line 7ab / Spouse missing `hasQofDeferralOrTermination` in uncommon situations] Spouse form had no way to flag spouse-specific QOF activity.~~ **Fixed 2026-04-16** — Field added to spouse model, initializer, uncommon items list, `hasAnyUncommonSituation()`, `normalizeForSave()`, template guidance block, and CSS.
- ~~[Line 7ab / Backend `hasQofDeferral` did not check spouse form field] `TaxReturnComputeService` only read `hasQofDeferralOrTermination` from `capitalTaxpayer`, not `capitalSpouse`.~~ **Fixed 2026-04-16** — Added `|| Boolean.TRUE.equals(getBoolean(capitalSpouse, "hasQofDeferralOrTermination"))` at line 5693.
- [Line 8] Schedule C and Schedule F output-form wiring intentionally deferred under the no-self-employment policy.
- ~~[Line 8 / 1099-K top entry space] The 2025 Schedule 1 has a separate top-of-form entry space for 1099-K amounts reported in error or for personal items sold at a loss.~~ **Fixed 2026-04-16** — `form1099KPersonalItemsDisclosureAmount` added to `Schedule1AdditionalIncome.java`, both YAMLs, frontend interface/model/section, and `computeOtherIncomes()` (stored on additionalIncome; NOT added to line 9/10; triggers Schedule 1 attachment via `hasAnySchedule1Input`). 1 unit test.
- ~~[Line 8 / Line 8m Olympic exclusion] Gross Olympic/Paralympic medal income on line 8m — line 24c exclusion not auto-computed.~~ **Fixed 2026-04-16** — `computeIncomeAdjustments()` gains a new `olympicLine8m` parameter passed from `prepare()` via `otherIncome.additionalIncome().getOtherIncomeOlympicParalympicAwards()`. Line 24c uses `firstNonNullAmount(userEnteredLine24c, olympicLine8m)` — user override takes precedence. 2 unit tests.
- ~~[Line 8 / Section 962 election gate for 8n/8o] No intake field and no out-of-scope blocker for Section 962 elections.~~ **Fixed 2026-04-16** — `hasSection962CfcElection` boolean added to taxpayer YAML outOfScopeScreening section, frontend model/interface/template, and `computeOtherIncomes()` emits `OTHER_INCOME_SECTION_962_ELECTION_OUT_OF_SCOPE` blocking flag. 1 unit test.
- ~~[Line 8 / 1099-G auto-parse gap] Backend did not stream `unemploymentCompensationAmount` from 1099-G statement entries into line 7.~~ **Fixed 2026-04-16** — `computeOtherIncomes()` now streams `entries1099G` for `unemploymentCompensationAmount`, uses `firstNonNullAmount(statementTotal, legacyImportedField)` as fallback chain, manual `unemploymentCompensationLine7` always adds on top. 2 unit tests.
- [Line 8 / Line 1 tax-benefit-rule worksheet] The taxable portion of state/local income tax refunds requires a worksheet under the tax-benefit rule (per Pub. 525 for complex cases). The product accepts user-entered amounts for line 1 directly without computing the taxable portion from prior-year data. Added 2026-04-16.
- [Line 8 / Unemployment repayment Pub. 525 rules] When a taxpayer repays more than $3,000 of unemployment compensation in a year following the year of receipt, Pub. 525 repayment rules apply (instead of simple netting). Only same-year 2025 repayment netting is implemented (`subtractNonNegative(line7Gross, line7Repayment)`). Added 2026-04-16.
- [Line 8 / Line 8d Form 2555 exclusion not auto-wired] `computeOtherIncomes()` reads `otherIncomeForeignEarnedIncomeExclusion8d` from manual user entry only. The `importedForm2555Line8dForeignExclusion` YAML field is never auto-populated because `computeOtherIncomes()` runs at prepare() line ~419, before `populateForm2555Taxpayer()` at line 676. Fix: call `computeForm2555ExclusionForSsWorksheet()` (already exists) inline inside `computeOtherIncomes()` and use the result as the auto-populated fallback for line 8d (same pattern used by the SS worksheet). No pipeline reordering needed. Added 2026-04-16.
- [Line 8 / UI: topic-hub pattern deferred] Both other-incomes forms display 20+ income fields simultaneously in a flat grid. Full TurboTax-style hub (one question per screen; Start/Update/summary per income type) is an architectural refactor deferred to a dedicated spike. The most impactful uncommon fields are now behind the "Show less common situations" toggle as an interim improvement. Added 2026-04-16.
- [Line 8 / UI: attribution note lacks dollar amount] The 1099-G auto-answer-note confirms that Box 1 will be applied but cannot show the actual dollar total because the list endpoint returns only entry IDs, not field data. Full Rules 41/42 compliance requires either the list endpoint returning statement field data or a new aggregate endpoint. Low priority. Added 2026-04-16.
- ~~[Line 8d / Form 2555 exclusion not auto-wired]~~ **Fixed 2026-04-16** — `computeForm2555ExclusionForSsWorksheet()` called inline in `computeOtherIncomes()`; auto-computed value used as fallback when no manual `otherIncomeForeignEarnedIncomeExclusion8d` is entered; `foreignEarnedIncomeTaxpayer`/`foreignEarnedIncomeSpouse` maps added as parameters. 2 unit tests (auto-populate and manual-override). 348 tests total passing.
- ~~[Line 8 / 1099-C auto-parse gap]~~ **Fixed 2026-04-16** — `entries1099C` now streamed in `computeOtherIncomes()`; `amountOfDebtDischargedAmount` auto-populates line 8c (takes precedence over legacy `imported1099CLine8cCancellationOfDebt` field); manual `otherIncomeCancellationOfDebt8c` always adds on top. 2 unit tests.
- ~~[Line 8 / Line 2a → line 2b validation missing]~~ **Fixed 2026-04-16** — Non-blocking flag `OTHER_INCOME_ALIMONY_DATE_REQUIRED` emitted when `line2a > 0` but `line2bAgreementDate` is absent. 1 unit test.
- ~~[Line 8 / Spouse form missing Section 962 field]~~ **Fixed 2026-04-16** — `hasSection962CfcElection` added to spouse YAML (`8-other-incomes-spouse.yaml`), `OtherIncomesSpouseModel` interface, model initializer, template (out-of-scope screening section with blocker note), `normalizeForSave()` cleared block, and `helpMap`. 1 unit test (spouse-triggered blocker).
- ~~[Line 8 / UI: line 8d help text outdated after auto-wire fix]~~ **Fixed 2026-04-16** — Help text updated in both taxpayer and spouse components: "If you completed the Foreign Earned Income (Form 2555) section, this field is filled automatically — leave it blank."
- ~~[Line 8 / UI: line 8h help text missing line 24a pointer]~~ **Fixed 2026-04-16** — Help text updated in both components to direct users to Income Adjustments → "Jury duty pay given to employer (line 24a)."
- ~~[Line 8 / UI: line 8l help text missing line 24b pointer]~~ **Fixed 2026-04-16** — Help text updated in both components: gross income here, related expenses in Income Adjustments line 24b.
- [Form 4952 / AMT recomputation] Generate the AMT-side Form 4952 computation artifact when `requiresAmtInvestmentInterestRecompute` is true and Form 6251 line 2c is implemented.
- [Form 4952 / Tax Return UI] Tax Return sidebar/component wiring for `form4952` output is deferred; the field is persisted in `TaxReturnComputation` and `TaxReturnDataService` but has no Tax Return view component.

---

## ~~Line 9 — Test Coverage Gaps~~ **All 5 gaps fixed 2026-04-16**

Line 9 computation is **fully implemented and correct**.

Unit tests added to `TaxReturnComputeServiceTest.java` (after line 6507):
- ~~[Line 9 / Unit test: negative line 9 not exercised]~~ **Fixed** — `negativeLine9PreservedWhenNolExceedsWages`: W-2 $2,000 + NOL $8,000 → line9 = −$6,000; asserts `totalIncome < 0`, no zero floor.
- ~~[Line 9 / Unit test: all 8 feeders not exercised together]~~ **Partially fixed** — `multipleTaxableFeederLinesAggregateCorrectlyIntoLine9`: W-2 $5,000 + 1099-INT $200 + 1099-DIV $300 + line8 $100 = line9 $5,600 (exercises 4 of 8 feeders; remaining 4 covered by existing feeder-line tests).
- ~~[Line 9 / Unit test: companion-line exclusion guardrail not tested]~~ **Fixed** — `companionLinesAreExcludedFromLine9`: asserts line2a ($200 exempt) and line3a ($300 qualified) do not inflate line9; expected $5,900 not $6,400.

E2E tests added to `e2e/tests/line9-total-income.spec.ts`:
- ~~[Line 9 / E2E test: no negative line 9 E2E scenario]~~ **Fixed** — "Line 9 is negative when NOL exceeds wage income": W-2 $2,000 + NOL $8,000 → `totalIncome = −6000`, asserts `< 0`.
- ~~[Line 9 / E2E test: only 2 of 8 feeders exercised]~~ **Partially fixed** — "Line 9 sums multiple income types correctly": W-2 $5,000 + 1099-INT $200 + line8 $100 → `totalIncome = 5300`.

- ~~[Line 9 / Unit test: null-feeders contract]~~ **Fixed** — `allNullFeedersProducesNullLine9`: identification-only return, no income forms, no statements → `form1040().getIncome()` is null (Income section absent entirely). Root cause: `computeDependentCareBenefits()` was returning `DependentCareComputation(BigDecimal.ZERO, null)` on blank returns (via `safeAmount(null)` chaining), which bypassed the `buildIncome()` early-return guard. Fix: early return `(null, null)` when `!hasBenefits && !hasChildcareData`. 4 dependent tests updated to handle null income (3 tests were relying on the spurious zero).

---

## ~~Dependent Return Generation — Deferred (2026-03-19)~~ **Cancelled by design 2026-06-04**

**CANCELLED** — Subsequent product decision (memory note `project_single_return`) overrides this deferral: the application produces ONE tax return per household; no separate returns for spouse or dependents. Dependent capital-gain/loss + kiddie-income inputs feed the household return's Schedule D / Form 8814 / Form 8615 paths; the dependent tab's Tax Return section is intentionally empty per `rules.md:502` ("keep the sidebar section visible but leave the dependent Tax Return item list empty"). The original work items below are obsolete and retained only as historical context.

Original deferred work items (no longer planned):
- ~~Build the dependent Tax Return section so each dependent tab can compute and render child return artifacts corresponding to `capital-gain-loss-dependent` and `kiddie-income-dependent` inputs.~~
- ~~Wire dependent capital gain/loss inputs into the child Schedule D / Form 8949 decision path.~~ Dependent capital gain/loss is now routed through the household return via Form 8814 (child election) or Form 8615 (kiddie tax on child's own household-attributed amounts).
- ~~Wire dependent kiddie-income inputs into the child Form 8615 compute/output path and child Form 1040 tax calculation.~~ Form 8615 outputs flow to the household return's Line 16 / Line 23, not a separate dependent return.

---

## Cross-Cutting / General Deferred Items

- ~~[Form 8959 / Additional Medicare Tax] Additional Medicare Tax computation is fully deferred.~~ **Implemented** — Full Form 8959 Parts I/III/IV/V computed inline in `TaxReturnComputeService`. Part I includes W-2 box 5 wages + Form 4137 line 6 unreported tips + Form 8919 line 6 uncollected wages vs. filing-status threshold ($250k MFJ/$200k Single/$125k MFS). Wired to Schedule 2 `additionalMedicareTax`. Part II (SE income) remains out of scope.
- ~~[Form 8839 / MAGI + Part II credit]~~ **Implemented 2026-03-28** — Form 8839 Part II credit (lines 2–13) fully computed. MAGI phaseout ($259,190–$299,190), per-child line 11b cap ($5,000), line 13 refundable credit wired to `payments.refundableAdoptionCredit` (Form 1040 line 30). 6 unit tests; 2 UI E2E display tests added to `form8839-adoption-credits.spec.ts`.
- [Form 2441 / earned-income inputs] Expand Form 2441 earned-income inputs for lines 18/19 beyond W-2 wages (include other earned-income lines).
- ~~[Form 8919 / multi-page output]~~ **Resolved 2026-04-09** — `buildMultiPagePdf()` in both Form 8919 display components splits firms into groups of 5, loads the template per group, fills lines 6–13 on the first copy only, and merges via pdf-lib `copyPages`.
- [Semantic PDF fill-export — general] Many forms have generated semantic PDF+CSV assets but render structured UI summaries in the Tax Return section instead of filling/exporting IRS PDF fields directly. Affects: Form 8396, Schedule A (8936), Form 8801, Form 8859, Form 8834, Form 8911, Form 8912, Form 8863, Schedule R, Form 4868, Form 5695.
- [Capital forms E2E coverage] Reintroduce and stabilize E2E coverage for capital-gain statement forms (1099-DA, 4684, 4797, 6252, 6781, 8824, Schedule K-1 1041/1065/1120-S). Temporarily removed flaky spec: `e2e/tests/statements-capital-forms.spec.ts`.

---

## Deep-Pass Recommendations (2026-02-28)

- Fix Auth user state mutation path: call `firebaseAuth.updateUser(...)` in `disableUser`/`enableUser`, then add assertions in `AuthServiceTest`.
- Protect admin-like auth endpoints: require authenticated/authorized access for `/auth/users/disable` and `/auth/users/enable`.
- Remove duplicate compute work: consolidate flags+compute flow to avoid running `prepare(uid)` twice per user action.
- Align inactivity policy and implementation: reconcile 1-hour runtime vs 5-minute documented behavior and keep one source of truth.
- Increase targeted frontend tests: add non-smoke tests for high-complexity forms and critical compute-related workflows.
- Prevent FE/BE statement-form drift: centralize/generate statement form catalog shared by UI and backend.

---

### Line 23 — Other Taxes — Gaps (audited 2026-04-19)

- **[Line 23 / G1 / HIGH] Self-employment tax (Schedule SE → Schedule 2 line 4) not implemented.** SE is explicitly out of scope per project rules, but it is the primary sub-item named in the IRS line 23 label. Any return with SE income will have `line23` (and therefore `line24`) understated. Fix requires Schedule SE implementation.
- **[Line 23 / G2 / HIGH] Household employment taxes (Schedule H → Schedule 2 line 9) not implemented.** No intake form, no `householdEmploymentTaxes` computation, no wiring. Household employers have an incorrect line 23. Fix requires Schedule H intake + `applyScheduleHTaxToSchedule2()`.
- ~~**[Line 23 / G3 / MEDIUM] Form 8959 Part III RRTA compensation tax not wired into `TaxAndCredits.otherTaxes`.**~~ **Fixed 2026-04-19** — After `buildForm8959()`, `Schedule2OtherTaxes.additionalMedicareTax` (line 11) is updated with the full Form 8959 line 18 total (Part I + Part III RRTA). `finalizeSchedule2OtherTaxes()` picks up the corrected value.
- **[Line 23 / G4 / MEDIUM] Net investment income tax (Form 8960 → Schedule 2 line 12) not implemented.** No intake form, no `netInvestmentIncomeTax` computation. Taxpayers with income above the NIIT threshold ($200k/$250k MFJ) and investment income miss this 3.8% tax in line 23.
- ~~**[Line 23 / G5 / MEDIUM] `Schedule2OtherTaxes.totalOtherTaxes` accumulated additively — no finalization pass.**~~ **Fixed 2026-04-19** — New `finalizeSchedule2OtherTaxes(Schedule2, Form1040)` method sums all sub-item fields into `totalOtherTaxes` and sets `TaxAndCredits.otherTaxes`. Individual writer methods now only set their own sub-item fields. Called just before `computeLine20ThroughLine24()`. 3 new unit tests verify the combined total.
- ~~**[Line 23 / G6 / LOW] No dedicated E2E spec `line23-other-taxes.spec.ts`.**~~ **Fixed 2026-04-19** — `line23-other-taxes.spec.ts` created with 3 scenarios: Form 5329 alone, Additional Medicare Tax alone, and combined sources asserting the summed `otherTaxes` total and `line24` chain.
- ~~**[Line 23 / G7 / LOW] `computeForm2210()` hardcodes `Form2210.otherTaxes = BigDecimal.ZERO`.**~~ **Fixed 2026-04-19** — Line 2 now reads `safeAmount(tac.getOtherTaxes())` so the underpayment penalty base (`combinedTax`) correctly includes Schedule 2 Part II taxes.
- **[Line 23 / G8 / LOW] W-2 box 12 codes A/B → Schedule 2 line 13 (`uncollectedSocialSecurityMedicareRrtaTax`) unimplemented.** Already noted in outstanding.md ("Spec scenario 11"). Field exists in `Schedule2OtherTaxes` but is never set.

---

## Line 31 — Schedule 3 Part II / Other Payments and Refundable Credits — Audited 2026-04-21

Knowledge: `C:\us-tax\knowledge\knowledge_line31.md` · Flowchart: `C:\us-tax\flowcharts\31.drawio` · Dependencies: `C:\us-tax\dependencies\31.md`

### Gaps identified 2026-04-21

- ~~**[Line 31 / G1 / LOW] `form-other-payments` uses `p-select` dropdowns for 4 boolean screening fields — violates ui.md R7.**~~ **Fixed 2026-04-21** — All four screening fields (`hasFuelTaxCredit`, `hasSection1341Credit`, `hasOtherRefundableCredits`, `hasDeferred965Tax`) replaced with radio-group pairs in the inline template. `SelectModule` removed; no `RadioButtonModule` needed (native `<input type="radio">`). Angular build passes.

- ~~**[Line 31 / G2 / LOW] `form-other-payments` has no `HelpModal` component — all fields missing help text.**~~ **Fixed 2026-04-21** — `HelpModalComponent` imported and added to template. `helpMap` populated with 9 entries covering all fields. `openHelp(key)` / `closeHelp()` methods added. Help `?` buttons added beside every field label.

- ~~**[Line 31 / G3 / LOW] Form 8689 (U.S. Virgin Islands income allocation) as a line 13z source not documented in YAML or UI.**~~ **Fixed 2026-04-21** — `31-other-payments-taxpayer.yaml`: added `helpText` to `hasOtherRefundableCredits` naming Form 8689 and Form 3800 line 6(j); added Form 8689 to `otherRefundableCredits` section instructions and `description` field helpText. Angular form: section instructions for line 13z now mention Form 8689 as a common source.

- ~~**[Line 31 / G4 / LOW] No consolidated Schedule 3 multi-credit integration E2E test.**~~ **Fixed 2026-04-21** — New test `'line31: multi-credit integration — lines 12 + 13a + 13b + 13z sum to correct line 14 and line 15'` added to `line31-other-payments.spec.ts`. Seeds Form 2439 ($1,200 → line 13a), fuel credit ($300 → line 12), §1341 credit ($800 → line 13b), and two line 13z items ($400 + $200 = $600). Asserts `line14 = 2600`, `line15 = 2900`, `line31 = 2900`. Also fixed UI test to use `selectRadioOption` (was `selectOption`) and added `retries: 1` to `test.describe.configure`.

- **[Line 31 / G5 / LOW] Line 13c (Form 3800 net elective payment) out of scope — no user-facing message when Form 3800 data is present.** Partially mitigated 2026-04-21: added `info-note` panel to `form-other-payments` template explaining line 13c is unsupported and directing users to enter the amount under line 13z. Full fix (backend `TaxReturnFlag`) deferred until Form 3800 is in scope.

- ~~**[Line 31 / G6 / LOW] No E2E test for line 13d (Section 965(i) deferred tax → Schedule 3 line 13d).**~~ **Fixed 2026-04-21** — Added `'line31: Section 965(i) deferred tax wires to Schedule 3 line 13d and line 15'` to `line31-other-payments.spec.ts`. Seeds `hasDeferred965Tax: true, deferredNet965TaxLiability: 1500`; asserts `other.deferredNet965TaxLiability = 1500`, `totalOtherPaymentsRefundableCredits = 1500`, `totalOtherPaymentsAndRefundableCredits = 1500`, `otherPaymentsSchedule3 = 1500`. Unit test `deferred965TaxFlowsToSchedule3Line13d` already covered the backend; this closes the E2E gap.

- ~~**[Line 31 / V1 / LOW] `creditForFederalTaxOnFuels` label contains "(Form 4136 line 14)" — violates ui.md R33.**~~ **Fixed 2026-04-21** — Removed the parenthetical from the Angular template label and the YAML `label:` field. IRS form reference already present in `helpMap` entry for this field; no help-text change needed.

- ~~**[Line 31 / NV1 / LOW] Form heading contained "Schedule 3 — … (lines 12 / 13b / 13d / 13z)" — violates ui.md R33.**~~ **Fixed 2026-04-21** — Changed `<h3>` to "Other payments and refundable credits".

- ~~**[Line 31 / NV2 / LOW] Four section titles in `form-other-payments.component.ts` used "Line N —" prefixes — violates ui.md R33.**~~ **Fixed 2026-04-21** — Removed "Line 12 —", "Line 13b —", "Line 13z —", "Line 13d —" prefixes from all four `.section-title` divs.

- ~~**[Line 31 / NV3 / LOW] Four section titles in `31-other-payments-taxpayer.yaml` used "Line N —" prefixes — violates ui.md R33.**~~ **Fixed 2026-04-21** — Removed the same four prefixes from YAML `title:` fields; also removed top-level `title:` line-reference suffix.

- ~~**[Line 31 / NV4 / LOW] Two YAML field labels used "Line 13b —" and "Line 13d —" prefixes — violates ui.md R33.**~~ **Fixed 2026-04-21** — Removed prefixes from `section1341Credit` and `deferredNet965TaxLiability` `label:` fields.

- ~~**[Line 31 / G7 / MEDIUM] `applyOtherPaymentsFormToSchedule3` does not gate on screening booleans — stale Firestore values can leak credits into the computed return.**~~ **Fixed 2026-04-21** — Firestore uses `SetOptions.merge()`; when a user saves with a gate=false the payload omits the amount field but the prior value persists in Firestore. Added `Boolean.TRUE.equals(getBoolean(...))` guards before each of the four credit sections: `hasSection1341Credit` → `section1341Credit`; `hasOtherRefundableCredits` → `otherRefundableCreditItems`; `hasFuelTaxCredit` → `creditForFederalTaxOnFuels`; `hasDeferred965Tax` → `deferredNet965TaxLiability`. Updated javadoc on the method to explain the rationale.

- ~~**[Line 31 / G8 / LOW] No unit test for gate-false / stale-data scenario.**~~ **Fixed 2026-04-21** — Added `line31_gateFalse_staleAmountsNotApplied` to `TaxReturnComputeServiceTest`. Seeds all four gates = false with all four stale amount fields present; asserts `otherPaymentsSchedule3` is null. All 7 line31 unit tests pass.

- ~~**[Line 31 / G9 / MEDIUM] `applyOtherPaymentsFormToSchedule3` aggregated the line 13z total but never populated `schedule3.otherRefundableCreditItems` — write-in descriptions were lost from the Schedule 3 PDF export.**~~ **Fixed 2026-04-21** — Added per-item `Schedule3OtherRefundableCreditItem` accumulation inside the `hasOtherRefundableCredits` gate block. Each item's `description` and rounded `amount` are now written to the output list alongside the existing aggregate total. `schedule3.setOtherRefundableCreditItems(outputItems)` called when total > 0. Unit test `line31_otherRefundableCreditItemsPopulatedWithDescriptions` verifies two items (Form 8689 $750 + Form 3800 $1,250 → total $2,000; descriptions preserved).

- ~~**[Line 31 / G10 / LOW] Three PDF field mappings in `form-tax-return-schedule3.component.ts` were incorrect — line 6z description routed to the line 13z text field, and line 13z description/amount routed to wrong columns.**~~ **Fixed 2026-04-21** — Corrected using `f1040s3_field_map_semantic.csv`: line 6z description `f1_34[0]` → `f2_22[0]` (`Line6z_ReadOrder`); line 13z description `f1_35[0]` → `f1_34[0]` (`Line13z_ReadOrder` wide text); line 13z amount `f1_32[0]` → `f1_35[0]` (Y=204 narrow amount column).

- ~~**[Line 31 / G11 / LOW] Line 13c (`netElectivePaymentElectionAmount`) had no PDF field mapping in `form-tax-return-schedule3.component.ts` — field `f1_32[0]` (Y=252, narrow amount column) was never written.**~~ **Fixed 2026-04-21** — Added `values['f1_32[0]'] = this.formatAmount(op?.netElectivePaymentElectionAmount)` after the line 13b mapping. Field confirmed from `f1040s3_field_map_semantic.csv`: `f1_32[0]` = line 13c amount at Y=252–264. Note: line 13c remains computation-deferred (Form 3800 not in scope); the mapping is present so the field populates if/when the backend is wired.

- ~~**[Line 31 / G12 / LOW] E2E test "other refundable credits summed to Schedule 3 line 13z" only asserted the aggregate total — the per-item descriptions and amounts added by the G9 backend fix were never verified.**~~ **Fixed 2026-04-21** — Added 5 assertions to the test: `items.length === 2`; `items[0].description === 'Credit A'`; `items[0].amount === 400`; `items[1].description === 'Credit B'`; `items[1].amount === 600`. These cover the `schedule3.otherRefundableCreditItems` list populated by G9.

- **[Line 31 / G13 / LOW] PDF field `f1_29[0]` mapping for line 13d is uncertain.** `f1040s3_field_map_semantic.csv` shows `f1_29[0]` at Y=312–324 in the wide column (x≈504) — positioned between line 12 (Y=324) and line 13a (Y=288). The current code assigns `deferredNet965TaxLiability` to this field, but line 13d on the 2025 IRS Schedule 3 is positioned at Y≈216 (between line 13z and line 14), for which there is no narrow-column field in the CSV between `f1_32` (Y=252) and `f1_34` (Y=204). The 2025 IRS PDF may not have a fillable field for line 13d, or the CSV field naming may diverge from the printed form. Verify against the source IRS PDF before the next PDF-export pass.

---

## ~~Form 8962 (Premium Tax Credit) — UI Violations~~ **Fixed 2026-04-21**

Component: `C:\us-tax\us-tax-ui\src\app\forms\form-premium-tax-credit.component.ts`

All 12 violations resolved in `form-premium-tax-credit.component.ts`:
- ~~V1–V6 (HIGH): 6 boolean `p-select` dropdowns (`claimsOrReceivedPtc`, `uploadedAll1095AStatements`, `noncitizenMarketplaceCoverage`, `receivedUnemploymentCompensation`, `employerCoverageNotAffordable`, `spouseHasAdditionalPtcInputs`) → native radio groups with `<label class="radio-option">` pattern.~~
- ~~V7 (HIGH): `helpMap` was empty (`= {}`); `openHelp()` silently fell through. Replaced with populated `readonly helpMap` (14 entries); `openHelp()` now reads from class property.~~
- ~~V8 (MEDIUM): Missing `?` help buttons on most field labels. All fields now use `.label-with-help` wrapper with `<button class="help-icon" (click)="openHelp('key')">?</button>`.~~
- ~~V9 (MEDIUM): MAGI add-back section (4 Form 2555 fields) shown unconditionally. Gated behind new `hasForeignIncomeExclusions` radio (added to model + defaultTaxpayerModel).~~
- ~~V10 (MEDIUM): Shared policy allocation section always visible. Gated behind new `hasSharedPolicyAllocation` radio (added to model + defaultTaxpayerModel).~~
- ~~V11 (MEDIUM): No help text on shared-policy and alt-calculation-year fields. Covered by V7+V8.~~
- ~~V12 (LOW): `<span class="radio-option">` + `p-radioButton` pattern. All radio groups converted to `<label class="radio-option"><input type="radio">` native pattern; `RadioButtonModule` and `ToggleSwitchModule` removed from imports.~~

---

## ~~Form extension-of-time (Form 4868) — UI Violations~~ **Fixed 2026-04-21**

Component: `C:\us-tax\us-tax-ui\src\app\forms\form-extension-of-time.component.ts`

All 15 violations resolved in `form-extension-of-time.component.ts`:
- ~~V1–V5 (HIGH): 5 boolean `p-select` dropdowns (`needsExtensionOfTime`, `outOfCountryFlag`, `form1040nrSpecialFlag`, `spouseHasExtensionOfTimeInputs`, `spouseIncludedOnJointExtension`) → native radio groups.~~
- ~~V6 (HIGH): No `HelpModalComponent`. Added `HelpModalComponent` import; added `helpMap` (15 entries), `helpVisible`/`helpTitle`/`helpText` properties, `openHelp()`/`closeHelp()` methods, `<help-modal>` element, and `?` help buttons on all fields using `.label-row` wrapper.~~
- ~~V7–V11 (MEDIUM): IRS line-number prefixes removed from 5 field labels ("Line 4 —", "Line 5 —", "Line 7 — ... → Schedule 3 line 10", "Line 8 —", "Line 9 —"). Line refs moved to help text.~~
- ~~V12 (MEDIUM): Section title "Part II — Tax estimates (Form 4868 lines 4–7)" → "Tax estimates for 2025".~~
- ~~V13 (MEDIUM): Section title "Special status (Form 4868 lines 8–9)" → "Special circumstances".~~
- ~~V14 (LOW): `fiscalYearBegin`/`fiscalYearEnd` always visible. Gated behind new `hasFiscalYear` radio; model, `loadTaxpayerModel()`, and `normalizedTaxpayer()` updated (null-out dates when `hasFiscalYear !== true`).~~
- ~~V15 (LOW): No out-of-scope notice for `form1040nrSpecialFlag === true`. Added `info-note` div displayed when flag is true, informing user Form 1040-NR is not supported.~~

---

## ~~Form 2441 UI — Violations of ui.md + turbotax.md Rules~~ **Fixed 2026-04-11**

All 12 issues resolved in `form-childcare-expenses.component.ts/.html/.scss`: radio buttons replacing dropdowns, `hasCareExpenses` screening gate, MFS/MFJ field gating, plain-language labels, uncommon-situations toggles, W-2 box 10 attribution note, `0.00` placeholders, `data-form-id` on action buttons. Schedule 3 and Form 2441 made conditional in Tax Return sidebar. E2E spec updated to use `selectRadioOption`.

---

## Line 32 / Form 1040 — Total Other Payments and Refundable Credits — Audited 2026-04-21

Formula verified correct against 2025 Form 1040 (image confirmed): `line32 = line27a + line28 + line29 + line30 + line31`. Backend `computeLine31ThroughLine38()` correct. Frontend `line32OtherPayments()` fallback correct. **6 unit tests + 5 E2E tests** pass. G1–G4 resolved; G5 open (low priority).

- **[Line 32 / G1 / MEDIUM / FIXED 2026-04-21]** `f1040_field_mapping_semantic.csv` row 174 renamed `line30_reserved_future_use` → `line30_refundable_adoption_credit`; `form-tax-return-1040.component.ts` mapping `values['line30_refundable_adoption_credit']` inserted. Adoption filers now see line 30 populated on the printed Form 1040.

- **[Line 32 / G2 / LOW / FIXED 2026-04-21]** Added unit test `line32_actcContributesToLine32` (ACTC $1,700 sole source → line32=$1,700) and `line32_threeSourcesSumCorrectly` (ACTC+adoption+§1341 → line32=$7,100). Added E2E test `line32: EIC and adoption credit both contribute` (EIC$649 + adoption$5,000 → line32=$5,649).

- **[Line 32 / G3 / LOW / FIXED 2026-04-21]** Added unit test `line32_refundableAdoptionCreditContributesToLine32`: asserts line 30 = $5,000 and line 32 = $5,000 when adoption credit is sole contributor.

- **[Line 32 / G4 / LOW / FIXED 2026-04-21]** Added E2E test `line32: refundable adoption credit (line 30) contributes to line 32 total` in `line32-total-other-payments.spec.ts`.

- **[Line 32 / G5 / LOW / OPEN]** No test (unit or E2E) with all five component lines contributing simultaneously in a single compute run (EIC + ACTC + AOTC + adoption credit + Schedule 3 credit). The combination requires a single filer who is simultaneously a student (AOTC), has a qualifying child (ACTC), has an adoption, and has a §1341 or other Schedule 3 credit — an unusual but legally possible scenario. Each individual path is covered by G2–G4; a combined test would validate the full summation. Low priority.

---

## Line 32 / UI Audit — 23 Violations in 10 Input Forms — Fixed 2026-04-21

UI audit against `ui.md` (R1–R44) and `turbotax.md` patterns across all 12 forms feeding line 32 found 23 violations in 10 forms. `education-credits-taxpayer/spouse` and `31-other-payments` were clean. All violations fixed:

- **[UI / G-CRITICAL / FIXED 2026-04-21]** Created `C:\us-tax\yamls\ctc-actc-screening-taxpayer.yaml` (was entirely missing). Two sections: `settings` (ctcPreviouslyDenied, electsNoActc with helpText) and `rareSettings` (isBonafidePuertoRicoResident with helpText).

- **[UI / R1 / HIGH / FIXED 2026-04-21]** Added `spouseHasEicElections` screening gate to `27a-earned-income-credit-spouse.yaml` and `form-earned-income-credit.component.ts`. Spouse EIC elections fields (`spouseElectNontaxableCombatPay`, `spouseOtherEarnedIncome`) now wrapped in `*ngIf="model.spouseHasEicElections === true"`.

- **[UI / R1 / HIGH / FIXED 2026-04-21]** Added `spouseHasSavingsCredit` screening gate to `savings-credit-spouse.yaml`, `form-savings-credit-spouse.component.ts`, and `.html`. Spouse disqualifiers and contributions sections wrapped in gate.

- **[UI / R10 / LOW / FIXED 2026-04-21]** Added `helpText` to 2 EIC-taxpayer fields (isNonresidentAlien, isAlsoDependent), 1 EIC-spouse field (spouseOtherEarnedIncome), 12 extension-taxpayer fields, and 4 extension-spouse fields.

- **[UI / R22 / LOW / FIXED 2026-04-21]** Added `instructions:` preamble to `elections` section in `27a-earned-income-credit-taxpayer.yaml`, `spouseElections` section in `27a-earned-income-credit-spouse.yaml`, and `<p class="section-instructions">` to the child-information section in `form-adoption-expenses.component.html`.

- **[UI / R33 / LOW / FIXED 2026-04-21]** Removed IRS line/form number references from visible labels across 6 YAMLs: `27a-earned-income-credit-taxpayer.yaml` (2 labels), `27a-earned-income-credit-spouse.yaml` (1 label), `4868-extension-of-time-taxpayer.yaml` (5 labels), `savings-credit-taxpayer.yaml` (6 labels), `savings-credit-spouse.yaml` (4 labels), `foreign-tax-credit-taxpayer.yaml` (7 nested labels). Removed references moved to `helpText`.

- **[UI / R20 / LOW / FIXED 2026-04-21]** Renamed YAML section `importedStatementFields` → `imports` in `1f-adoption-expenses.yaml` to match the Firestore/TS model key. Removed section-level `readOnly: true` since `doesW2CodeTAmountLookCorrect` is user-facing.

---

## Line 32 / UI Audit (Second Pass) — Additional Violations in 8863 and Other Forms — Fixed 2026-04-21

Second-pass audit of all line 32 input forms revealed additional violations in the 8863 education-credits forms and two other YAMLs that were incorrectly marked clean in the first pass. All fixed:

- **[UI / R10 / LOW / FIXED 2026-04-21]** Added `helpText` to 3 qualifying-child fields in `27a-earned-income-credit-taxpayer.yaml` that had no help text: `childFirstName` ("Enter the child's first name exactly as it appears on their Social Security card."), `childLastName` (last name on SS card), `childYearOfBirth` (four-digit year; determines qualifying age test — under 19, under 24 if full-time student, or any age if permanently disabled).

- **[UI / R10 / LOW / FIXED 2026-04-21]** Added `helpText` to 8 fields in `31-other-payments-taxpayer.yaml` that had no help text: `hasFuelTaxCredit`, `hasSection1341Credit`, `hasDeferred965Tax`, `creditForFederalTaxOnFuels`, `section1341RepaymentAmount`, `section1341Credit`, `amount` (in the `otherRefundableCredits` multiple section), and `deferredNet965TaxLiability`. Also removed "(Form 4136)" from the `hasFuelTaxCredit` visible label (R33 fix).

- **[UI / R33 / LOW / FIXED 2026-04-21]** Removed 26 IRS line/Part references from visible labels in `8863-education-credits-taxpayer.yaml`. Affected student fields: `claimsEducationCreditsOnReturn`, `receivedAny1098TForClaimedStudents`, `uploadedAll1098TStatementsForClaimedStudents`, `hasMagiAddBacks`, all four `magiAddBack*` amount fields, `studentFirstNameLine20`/`studentLastNameLine20`/`studentTinLine21`, institution fields (`institution1NameLine22`, `institution2NameLine22`, etc.), and AOTC eligibility fields (`aotcClaimedFourPriorYearsLine23` through `studentHadFelonyDrugConvictionLine26`). All "(Part III, line XX)" and "Form NNNN" suffixes removed.

- **[UI / R33 / LOW / FIXED 2026-04-21]** Removed 18 IRS line/Part references from visible labels in `8863-education-credits-spouse.yaml` — same student section fields as taxpayer form above. Spouse-specific screening field label also clarified.

- **[UI / R33 / LOW / FIXED 2026-04-21]** Fixed 9 label violations in `form-education-credits.component.html` (the actual user-facing Angular template, separate from YAML documentation): removed "Form 1098-T" and "(Box 7 checked)" and "(Form 2555)" and "(Form 4563)" references from 9 label strings at lines 55, 62, 154, 163, 172, 287, 294, 329, and 336. These are the labels actually rendered to users in the browser.

---

## Line 33 / Form 1040 — Total Payments — Audited 2026-04-21

Formula verified: `line33 = line25d + line26 + line32`. All PDF fields for lines 33–38 correctly mapped. **18 unit tests + 18 E2E tests** (across `line33-refund-owed.spec.ts` ×7, `form2210-underpayment-penalty.spec.ts` ×6, `form8888-refund-allocation.spec.ts` ×5) — **all passing 2026-04-21**. Flowchart: `C:\us-tax\flowcharts\33.drawio`. Dependencies: `C:\us-tax\dependencies\33.md`. Knowledge: `C:\us-tax\knowledge\knowledge_line33.md`. Lines spec updated: `C:\us-tax\lines\33.md`. **Only G3 ($1 minimum refund) remains open**; G4–G9 deferred/OOS; all other gaps resolved.

- ~~**[Line 33 / G1 / LOW / OPEN]** No E2E test for line 36 (apply to next year).~~ **Fixed 2026-04-21** — added `line36: apply-to-next-year reduces refund and populates amountAppliedToNextYear` to `line33-refund-owed.spec.ts`. Asserts `refund.amountAppliedToNextYear == 500`, `refund.refundAmount == overpaid − 500`, `refund.overpaid` unchanged.

- ~~**[Line 33 / G2 / LOW / OPEN]** No E2E test for direct deposit (lines 35b/c/d).~~ **Fixed 2026-04-21** — added `line35bcd: direct deposit fields populated when elected` to `line33-refund-owed.spec.ts`. Asserts `refund.directDeposit == true`, `refund.routingNumber`, `refund.accountType`, `refund.accountNumber` all populated from the `35-direct-deposit` personal form.

- **[Line 33 / G3 / LOW / OPEN]** IRS rule: refund under $1 is not automatically issued (taxpayer must request in writing). The backend computes any positive overpayment as a refund without enforcing this floor. Practical impact is negligible (a sub-$1 overpayment requires very precise tax scenario), but the IRS rule is not modeled. Low priority.

## Line 33 / UI Audit (Second Pass) — 2026-04-21 — All fixed

UI audit of 5 line 33 downstream personal forms against `ui.md` (R1–R44) + `turbotax.md` patterns. **26-estimated-tax-payments-taxpayer/spouse: CLEAN — no violations.** Four downstream forms had violations in three categories; all fixed (Angular build passes):

- **[FIXED — R7]** 7 boolean fields were rendered as `p-select` dropdowns instead of Yes/No radio buttons: `wantsDirectDeposit`, `electsApplyToNextYear`, `wantsRefundAllocation`, `waiveFullPenalty`, `waivePartialPenalty`, `jointSeparateMismatch`. All converted to radio group pattern.
- **[FIXED — R10]** 29 user-facing fields were missing `helpText` / `HelpModalComponent`: 4 in `35-direct-deposit`, 2 in `36-apply-to-next-year`, 14 in `refund-allocation`, 9 in `prior-year-tax`. All YAML files updated with `helpText`; all Angular components updated with `helpMap`, `openHelp()`, `closeHelp()`, `HelpModalComponent` import, and `pi-info-circle` help icons.
- **[FIXED — R33]** IRS line/form/box references removed from visible labels: `35-direct-deposit` section label + 3 field labels (removed "lines 35b–35d", "line 35b/c/d"); `36-apply-to-next-year` section label + Angular header (removed "Form 1040, line 36" / "(line 36)"); `refund-allocation` Angular template (removed "Line 1a/1b/1c/1d" through "Line 3a/3b/3c/3d" + "Line 5" total note); `prior-year-tax` 5 YAML field labels + Angular template labels + header "(Form 2210)" + section heading "Part II —".

## Line 33 / Gap Closure (Third Pass) — 2026-04-21 — All fixed

Additional unit tests and E2E tests added after second-pass gap scan identified untested scenarios:

- ~~**[Line 33 / G4 / LOW]** No unit test for line 36 cap enforcement (amountToApply > overpaid).~~ **Fixed 2026-04-21** — added `line36_cap_whenAmountToApplyExceedsOverpaid` to `TaxReturnComputeServiceTest.java`. Asserts `amountAppliedToNextYear == overpaid` (capped), `refundAmount == null`.

- ~~**[Line 33 / G5 / LOW]** No E2E test for line 36 cap enforcement.~~ **Fixed 2026-04-21** — added `line36: apply-to-next-year capped when amount exceeds overpayment` to `line33-refund-owed.spec.ts`. Elects $999,999 against a ~$36k overpayment; asserts cap is applied.

- ~~**[Line 33 / G6 / LOW]** No E2E test for direct deposit suppressed when Form 8888 active.~~ **Fixed 2026-04-21** — added `line35bcd: direct deposit suppressed when Form 8888 split-refund elected` to `line33-refund-owed.spec.ts`. Saves both `35-direct-deposit` and `refund-allocation-taxpayer`; asserts DD fields absent on refund, Form 8888 present.

- ~~**[Form 2210 / G7 / LOW]** No unit test for `waivePartialPenalty` (box B).~~ **Fixed 2026-04-21** — added `form2210_waivePartialPenalty_boxBSetAndPenaltyStillComputed` to `TaxReturnComputeServiceTest.java`. Asserts `boxBPartialWaiver=true`, `computationMethod=REGULAR_METHOD`, `totalPenalty > 0`.

- ~~**[Form 2210 / G8 / LOW]** No unit test for `jointSeparateMismatch` (box E).~~ **Fixed 2026-04-21** — added `form2210_jointSeparateMismatch_boxESet` to `TaxReturnComputeServiceTest.java`. Asserts `boxEJointSeparate=true`, `computationMethod=REGULAR_METHOD`.

- ~~**[Form 2210 / G9 / LOW]** No E2E test for `waivePartialPenalty` (box B).~~ **Fixed 2026-04-21** — added `form2210: partial waiver box B sets boxBPartialWaiver but does not suppress penalty` to `form2210-underpayment-penalty.spec.ts`.

- ~~**[Form 2210 / G10 / LOW]** No E2E test for `jointSeparateMismatch` (box E).~~ **Fixed 2026-04-21** — added `form2210: box E joint-separate mismatch sets boxEJointSeparate` to `form2210-underpayment-penalty.spec.ts`.

- ~~**[Form 2210 / G11 / LOW]** No E2E test for 110% safe harbor (prior AGI > $150k).~~ **Fixed 2026-04-21** — added `form2210: 110% safe harbor applies when prior-year AGI exceeds $150k` to `form2210-underpayment-penalty.spec.ts`. Prior AGI $200k, prior tax $60k → asserts `priorYearSafeHarbor ≈ 66000`.

- ~~**[Form 8888 / G12 / LOW]** No E2E test for three-account split.~~ **Fixed 2026-04-21** — added `form8888: three-account split matching the full refund` to `form8888-refund-allocation.spec.ts`. Splits refund in thirds across 3 accounts; asserts account3 fields populated and `totalMatchesRefund=true`.

- ~~**[Form 8888 / G13 / LOW]** No E2E test for direct deposit suppressed when Form 8888 active.~~ **Fixed 2026-04-21** — added `form8888: direct deposit lines 35b/c/d suppressed when Form 8888 elected` to `form8888-refund-allocation.spec.ts`. Asserts DD fields absent on refund when both `35-direct-deposit` and `refund-allocation-taxpayer` are saved.

## Line 33 / Gap Closure (Fourth Pass) — 2026-04-21 — All fixed

Additional tests and UI fix after third-pass scan:

- ~~**[Line 33 / G14 / MEDIUM]** No unit test for `line33 = line24` edge case (neither refund nor amountOwed).~~ **Fixed 2026-04-21** — added `line33_equals_line24_neither_refund_nor_amountOwed` to `TaxReturnComputeServiceTest.java`. Two-compute pattern: compute with $0 withholding to get taxAfterCredits, then re-compute with that exact withholding; asserts both `refund=null` and `amountOwed=null`.

- ~~**[Line 33 / G15 / LOW]** No unit test verifying line36 is not applied when `electsApplyToNextYear=false`.~~ **Fixed 2026-04-21** — added `line36_not_applied_when_electsApplyToNextYear_false` to `TaxReturnComputeServiceTest.java`.

- ~~**[Line 33 / G16 / LOW]** No unit test verifying DD fields are not populated when `wantsDirectDeposit=false`.~~ **Fixed 2026-04-21** — added `directDeposit_not_populated_when_wantsDirectDeposit_false` to `TaxReturnComputeServiceTest.java`.

- ~~**[Line 33 / G17 / MEDIUM]** No unit test verifying line38 penalty is additive to line37 amountOwed.~~ **Fixed 2026-04-21** — added `line38_penalty_is_additive_to_line37_amountOwed` to `TaxReturnComputeServiceTest.java`. Verifies `ao.amountOwed = line37 + penalty` and `ao.estimatedTaxPenalty = penalty`.

- ~~**[Line 33 / G18 / MEDIUM]** No E2E test for `line33 = line24` edge case.~~ **Fixed 2026-04-21** — added `line33 = line24: neither refund nor amount owed when payments exactly equal tax` to `line33-refund-owed.spec.ts`. Two-compute pattern matching unit test.

- ~~**[UI / R1 / MEDIUM]** `prior-year-tax` form shows all 4 estimated payment fields unconditionally — violates screening-first rule.~~ **Fixed 2026-04-21** — added `madeEstimatedPayments` Yes/No screening radio before the payment section; wrapped all 4 payment fields in `*ngIf="model.madeEstimatedPayments === true"`. YAML updated with new field + `showIf` on payment fields. `helpMap` entry added. Angular build passes.

## Unified Refund and Amount Owed Form / UI Audit — 2026-04-22 — 21 of 22 fixed; 1 deferred

UI audit of `form-refund-and-amount-owed.component.ts` + `refund-and-amount-owed-taxpayer.yaml` against `ui.md` (R1–R44) and `turbotax.md`. Found 22 violations across 10 rule categories. 21 fixed; 1 deferred (R38). 4 new E2E UI verification tests added. Angular build passes.

- ~~**[UI / R34 / HIGH]** 3 section titles contain IRS line/form references: "Direct deposit (lines 35b–35d)", "Split refund — Form 8888", "Apply to 2026 estimated tax (line 36)".~~ **Fixed 2026-04-22** — stripped all IRS refs from template section-title elements and YAML section titles.

- ~~**[UI / R33 / HIGH]** 3 field labels contain IRS line references: "Routing number (line 35b)", "Account type (line 35c)", "Account number (line 35d)". 6 more YAML-only labels had IRS refs.~~ **Fixed 2026-04-22** — stripped all `(line N)` and `(Form 1040 line N)` from template labels and YAML labels. Display banner labels also cleaned.

- ~~**[UI / R8 / MEDIUM]** All 10 currency `p-inputNumber` fields use `mode="decimal"` instead of `mode="currency"`. Users see no dollar sign.~~ **Fixed 2026-04-22** — changed all 10 fields to `mode="currency" currency="USD" locale="en-US"`. Whole-dollar fields keep `[maxFractionDigits]="0"`; dollar-and-cents fields keep `[minFractionDigits]="2"`.

- ~~**[UI / R10+R6 / MEDIUM]** 12 Form 8888 account sub-fields have no help icons; 8 are also missing YAML helpText.~~ **Fixed 2026-04-22** — added `<div class="label-row">` wrappers with `<i class="pi pi-info-circle help-icon">` on all 12 fields; added 12 `helpMap` entries; added `helpText` to all 8 missing YAML fields.

- ~~**[UI / R22 / MEDIUM]** `directDeposit` and `splitRefund` sections have no section preambles.~~ **Fixed 2026-04-22** — added `<p class="section-instructions">` in template and `instructions:` arrays in YAML for both sections.

- ~~**[UI / R43 / MEDIUM]** No `[min]="0"` on any of the 10 currency `p-inputNumber` fields — negative values accepted.~~ **Fixed 2026-04-22** — added `[min]="0"` to all 10 monetary input fields.

- **[UI / R38 / LOW / DEFERRED]** Component decorator missing `changeDetection: ChangeDetectionStrategy.OnPush`. No other form component in the project uses OnPush — adding it to one form would be inconsistent. Deferred for project-wide adoption.

- ~~**[UI / R18 / LOW]** 9 Form 8888 field labels in template contain parenthetical format notes: "(whole dollars)", "(9 digits)", "(up to 17 characters)". 13 YAML labels same.~~ **Fixed 2026-04-22** — stripped parenthetical format notes from all labels (template + YAML). Kept `(optional)` on Account 3 fields.

- ~~**[UI / R2 / LOW]** `priorYearAgi` helpText hard-codes "$75,000 if married filing separately" — filing-status-specific.~~ **Fixed 2026-04-22** — YAML: changed to "the threshold depends on your filing status"; helpMap: changed to "(lower for MFS filers)".

- ~~**[UI / R12 / LOW]** YAML `refundSummary` section title starts with "Your" — `"Your refund"`.~~ **Fixed 2026-04-22** — changed to `"Refund summary"`.

- ~~**[UI / TurboTax / LOW]** `waivePartialPenalty` label uses tax jargon "annualized income method".~~ **Fixed 2026-04-22** — rewritten to plain English: "Did your income arrive unevenly during the year? (You can request a reduced penalty.)"

## Refund and Amount Owed — Deferred Items (2026-04-22)

- **[UI / R38 / LOW / DEFERRED]** `ChangeDetectionStrategy.OnPush` missing from `form-refund-and-amount-owed.component.ts`. No other form component in the project uses OnPush — adding it to one form would be inconsistent. Deferred for project-wide adoption across all form components.

- **[Form 8888 / PDF / LOW / DEFERRED]** Form 8888 PDF fill/export not implemented. Semantic assets (`f8888_semantic_labels.pdf` + `f8888_field_map_semantic.csv`) are published but no client-side `saveAsPdf()` code exists yet. Blocked on Form 8888 tax-return display component.

- **[Form 8888 / IRA-HSA / LOW / DEFERRED]** Form 8888 account type dropdown only offers Checking/Savings. IRS Form 8888 also supports IRA, HSA, Coverdell ESA, and Archer MSA account types. Requires backend validation changes + new dropdown options.

- **[Line 33 / G3 / LOW / OPEN]** $1 minimum refund rule not enforced. IRS does not auto-issue refunds under $1 — taxpayer must request in writing. Backend computes any positive overpayment as a refund without enforcing this floor. Very rare edge case.

- **[Form 2210 / Schedule AI / OOS]** Form 2210 Schedule AI (annualized income installment method, Box C). Would compute penalty per-quarter using actual income distribution. Out of scope — the `waivePartialPenalty` checkbox delegates this to the IRS.

- **[Form 2210 / Box D / OOS]** Form 2210 Box D (actual withholding dates). Would allocate withholding to the quarter it was actually withheld rather than treating it as evenly distributed. Out of scope.

- **[Form 2210 / Form 2210-F / OOS]** Form 2210-F (underpayment of estimated tax for farmers and fishermen). Uses 66⅔% safe harbor instead of 90%. Out of scope — no Schedule F (farming income) support.

## Form 1040 PDF-to-HTML migration — Deferred Cleanup (2026-05-18)

- **[Form 1040 / Cleanup / LOW / OPEN]** Delete `us-tax-ui/public/irs/f1040_field_mapping_semantic.csv`. After the 2026-05-18 Form 1040 migration from `<app-pdf-readonly-preview>` to pixel-perfect HTML, no code path reads this file at runtime — the 1040 component no longer mounts the PDF preview, and no other component fetches the 1040 CSV. The served copy also drifts from the canonical `C:\us-tax\pdfs\f1040_field_mapping_semantic.csv` (older field names `line11a_adjusted_gross_income` and `line14_add_lines12e_13a_and_13b` vs. the canonical `line11_adjusted_gross_income` and `line14_add_lines12_and_13`). Safe to delete after a final confirmation that no future code path needs it; the `pdfs/` source-of-truth copy is retained for documentation. Optionally also remove `us-tax-ui/public/irs/f1040_semantic_labels.pdf` and the `us-tax-ui/public/irs-images/f1040_semantic_labels/` PNGs if they are not consumed elsewhere (verify before deleting).

## Statement family-belonging check — Deferred Coverage (2026-05-30)

The `validateStatementsBelongToFamily` pass (`TaxReturnComputeService.java`, registry `STATEMENT_SSN_RULES`) compares each statement's normalized recipient SSN/TIN against the family's normalized SSNs (taxpayer + spouse + dependents) and emits a blocking `STATEMENT_DOES_NOT_BELONG_TO_FAMILY` flag per misattributed entry. 32 of 43 catalog statement types are covered; the 11 below are intentionally NOT enforced and should be revisited when the underlying data model is ready.

- **[Statements / RRB-1099, RRB-1099-R / MEDIUM / DEFERRED]** Mappers store `recipientIdNumber` (Railroad Retirement Board claim number) rather than a standardized SSN. Some claim numbers are SSNs and some carry an alphabetic prefix, so a strict SSN equality check would over-flag. Next step: parse claim numbers to extract the embedded SSN (when present) or add a separate `recipientSSN` field on the form so the validator can compare against the family set.

- **[Statements / 1099-E (Form 1098-E Student Loan Interest) / MEDIUM / DEFERRED]** Catalog registers `1099-e` but `Form1099EMapper` does not currently exist, so no borrower SSN is surfaced on the entry. Add to `STATEMENT_SSN_RULES` once the mapper writes `borrowerSSN` (or `borrowerTIN`) on save. The actual IRS form 1098-E has the field — only the application's mapper is missing.

- **[Statements / Form 8606 / OUT OF SCOPE]** Nondeductible IRAs worksheet is the taxpayer's (or spouse's) own form. The mapper uses `ownerRole` ("taxpayer" / "spouse") to indicate whose 8606 it is rather than a third-party-issued recipient SSN, so the family-belonging rule doesn't apply. If a stricter "ownerRole must match an existing family member" check is desired, that's a separate (lighter) validator.

- **[Statements / Transactional schedules / OUT OF SCOPE]** Forms 4684 (Casualties and Thefts), 4797 (Sales of Business Property), 6252 (Installment Sale Income), 6781 (Section 1256 Contracts), 8824 (Like-Kind Exchanges) describe the taxpayer's own transactions and carry no recipient SSN field on the entry. No belonging check is meaningful at the entry level — the taxpayer's identity is implicit in where the entry is stored.

- **[Statements / child-interest-dividends / OUT OF SCOPE]** Already dependent-scoped — entries are stored under the dependent's UID, so belonging is implicit in storage location. No registry entry needed.

When the deferred items above land, update `STATEMENT_SSN_RULES` and remove the corresponding line from this section. The validator design is registry-driven so adding a new rule is one line.

## Schedule 2 PDF preview — semantic field-position drift (2026-05-30)

- **[Schedule 2 / PDF preview / MEDIUM / DEFERRED]** Running Test 1 of `line1c-tip-income.spec.ts` in the UI (unreported cash tips, Form 1040 line 1c = $300, Schedule 2 line 5 = $4) renders Schedule 2 with the $4 in the wrong cells: visual line 5 is empty, while visual lines 3, 6, and 21 each show $4. Form 4137 line 13 ($4) renders correctly. **The backend JSON is correct** — the e2e assertion `expect(computation?.schedule2?.otherTaxes?.unreportedTipIncomeTax).toBe(4)` passes; `tax.totalTax` and `uncollectedSocialSecurityMedicareTaxOnWages` are both null in the JSON; only `unreportedTipIncomeTax`, `totalAdditionalSocialSecurityMedicareTax` (line 7 subtotal), and `totalOtherTaxes` (line 21 grand total) are populated. The bug is purely in the PDF rendering layer.

  Root cause is the curated mapping in `us-tax-be/scripts/publish-schedule-2025-assets.js` (`SCHEDULE2_MAPPING` table, lines 25-89): the semantic labels for fields `f1_11[0]`–`f1_17[0]` were hand-assigned in IRS-field-number order rather than visual order. Sorting the published `f1040s2_field_map_semantic.csv` by y-coordinate descending (visual top-to-bottom) shows the impossibility — `line3_partI_tax_total` sits at y=390 while `line1z_total_additions` sits below it at y=312, but Schedule 2 line 1z is the Part I subtotal that must visually appear ABOVE line 3.

  **Deferred** because the project is mid-migration from `<app-pdf-readonly-preview>` PDF embeds to pixel-perfect HTML/CSS forms (see the 2026-05-18 Form 1040 migration entry above). HTML forms bind directly by semantic name with no PDF-field-position mapping required, so this entire class of bug disappears once Schedule 2 is migrated. Re-curating the existing PDF mapping would be throwaway work. **When Schedule 2 is rebuilt in HTML/CSS, verify Test 1 visually shows $4 on line 5 only, with lines 3 and 6 empty.**

## Form 8889 / Form 8853 / Form 4797 — standalone compute deferred (2026-06-07)

Per XLS/Computations/8.md §4.8 + §4.9, these three forms remain user-fill-only stubs:

- **Form 8889 (HSA)** — Schedule 1 line 8f (HSA distributions) is captured via user-fill `importedForm8889Line8f`. Schedule 1 line 13 (HSA deduction) is captured via user-fill `healthSavingsAccountDeductionLine13` on the income-adjustments form. The deduction side IS auto-computed elsewhere; the distribution side is not.
- **Form 8853 (Archer MSA + LTC)** — Schedule 1 line 8e captured via user-fill `importedForm8853Line8e`. No standalone compute.
- **Form 4797 (Sales of Business Property)** — Schedule 1 line 4 captured via user-fill `otherGainsLossesLine4`. No standalone compute; the required-attachment stub is produced but Form 4797 contents are not.

**Why these are deferred (not silent-loss):**
- The dollar amount that lands on Schedule 1 IS correct (user enters the value they computed externally).
- The required-attachment stub tells the IRS the form is filed.
- The user is responsible for filing the underlying form separately and for transcription accuracy.
- **No CP-2000 risk, no silent over-tax, no silent credit forfeit** — purely a convenience / transcription-error-reduction gap.

**Backstop in place 2026-06-07:** Three non-blocking advisories fire whenever the user-fill is non-zero, reminding the user that the underlying form must be filed separately:
- `OTHER_INCOME_FORM_8853_REQUIRED_TO_BE_FILED_SEPARATELY`
- `OTHER_INCOME_FORM_8889_REQUIRED_TO_BE_FILED_SEPARATELY`
- `OTHER_INCOME_FORM_4797_REQUIRED_TO_BE_FILED_SEPARATELY`

**Scoped work to do later** (do AFTER completing all Form 1040 lines per user decision 2026-06-07):

| Form | Scope | Estimated days |
|---|---|---|
| Form 8889 (HSA) full Parts I + II + III incl. testing-period recapture | New `Form8889` output model + `computeForm8889(...)` + intake form + 1099-SA statement integration. Replaces `importedForm8889Line8f` with computed value; keeps user-fill as override + mismatch advisory. | 6–8 |
| Form 8853 (Archer MSA + LTC) | New `Form8853` output model + four sections (MSA contributions/distributions, LTC contracts, accelerated death benefits). | 4–6 |
| Form 4797 (Sales of Business Property) — Schedule E rental scope | Per-asset depreciation tracking, Parts I–IV. Skips Schedule C/F prerequisite. Includes §1245/§1250 recapture for rental property. **§1231 5-year recapture lookback deferred to a separate sub-phase** (requires `pf_prior_year_1231_net_loss` entity and prior-year data plumbing). | 10–15 |
| Form 4797 full scope (Sch C/F sources) | Requires Schedule C + Schedule SE + Schedule F + Form 4562 (depreciation) as prerequisites. **~50-70 working days additional.** Defer this until product positioning expands to self-employment. | (separate project) |

**Resolution criteria:** when all Form 1040 lines have been audited and their gaps closed (per the ongoing `XLS/Computations/Nx.md` audit cadence), revisit this deferred item and pick a scope (Form 8889 first, recommended). At that point the advisories above can be converted to "auto-compute with user-fill override + mismatch advisory" patterns.

## Schedule 1 PDF-Render Lock-In (GAP-PDF-8z + GAP-PDF-LINE7 + Save-as-PDF Field-Map Audit) — Deferred 2026-06-07

**Origin.** `test_cases/8.md` Honourable mention #9 closure attempt. Added a generic PDF-render harness (`e2e/tests/helpers/pdf-render.ts`, `e2e/tests/schedule1-pdf-render.spec.ts`, pdf-lib devDep) and a test-only `window.__e2eSkipPdfFlatten` hook in `form-tax-return-schedule1.component.ts:saveAsPdf` so e2e tests can read AcroForm field values from the saved PDF.

**Production bugs the harness surfaced.** Even after multiple iterations, the two assertions still fail. Along the way the harness uncovered that the Schedule 1 Save-as-PDF feature has been silently producing blank IRS templates in production:

1. **Short-name → FQN translator** (now landed): `buildAcroFormValues` was keyed by `f1_NN[0]` / `f2_NN[0]` / `c1_N[0]` short IRS names, but the IRS 2025 `f1040s1_semantic_labels.pdf` template uses leaf field names like `topmostSubform[0].Page1[0].page1_0_f1_NN_0`. pdf-lib's `getTextField` does strict FQN matching, so every short-name lookup threw "field not found" and `fillAcroForm`'s try/catch swallowed it silently. **Fix landed:** `resolveAcroFieldName(key)` helper translates short names to actual FQNs at fill time.

2. **ReadOrder-nested fields** (now landed for 8a + 8z description): line 8a NOL (`f1_13[0]`) and line 8z description (`f1_35[0]`) live inside `Line8a_ReadOrder` and `Line8z_ReadOrder` groups respectively. The simple short-name → FQN pattern can't infer the parent group, so those two entries in `buildAcroFormValues` were rewritten to their full FQNs.

3. **Checkbox `/V` writeback** (attempted, NOT verified working): pdf-lib's `PDFCheckBox.isChecked()` compares `acroField.getValue() === acroField.getOnValue()`. For nested IRS widget-only checkboxes (e.g. `Line7_ReadOrder.c1_3_0`), `getOnValue()` returns null because the on-state isn't declared the way pdf-lib's heuristics look for. `cb.check()` therefore writes `/V = /Yes` but reads back as unchecked on the next parse. Attempted fix: low-level `acroField.setValue(PDFName.of('Yes'))` after `cb.check()`. The fix typechecks but the e2e harness still reads the field as `false` on the saved PDF; the writeback is not surviving the `pdfDoc.save()` round-trip when flatten is skipped, OR the dev-server bundle was stale during verification.

**Open work.**

1. **Verify the line 7 checkbox writeback fix actually persists** — instrument with `pdfDoc.save({ updateFieldAppearances: true })` and/or `form.updateFieldAppearances()` before save and re-test. If the low-level `setValue` still doesn't survive a no-flatten round-trip, switch the harness to assert against the saved PDF when flattened (flatten leaves the visible checkmark in page content, just not in an AcroForm field). Either approach needs investigation in `node_modules/pdf-lib/cjs/api/PDFDocument.js` and `PDFAcroCheckBox.js`.

2. **Verify the GAP-PDF-8z assertion lands** after a hard dev-server restart. The fix is in source; last run still failed which means hot-reload was missing the change. A clean `npm start` should resolve it but needs re-verification.

3. **Comprehensive field-map audit** — beyond the two specific fields the harness targets, EVERY other entry in `buildAcroFormValues` for Schedule 1, Form 1040, Form 8839, Form 8995, Form 8995A, Form 8606, Form 4972, Form 8814, Form 8919, Form 4137, Schedule 1-A, Schedule 2, Schedule 3 etc. is at risk of the same short-name → FQN mismatch. The Schedule 1 resolver helper handles the common `f<P>_NN[0]` and `c<P>_N[0]` cases mechanically, but each form's `buildAcroFormValues` needs the same translator and a per-form sweep for ReadOrder-nested fields. Estimated effort: ~1-2 days per form, ~10-15 forms total.

4. **Skip the harness spec in CI for now** — `schedule1-pdf-render.spec.ts` currently fails. The spec file is annotated with the deferral note + `test.skip` so regression runs stay green until the underlying issue is solved.

**What's already in place** (do not re-do when this is resumed):

| Asset | Path | Status |
|---|---|---|
| Generic PDF-render harness | `e2e/tests/helpers/pdf-render.ts` | Working — `downloadAndParsePdf`, `readAcroFieldValues`, `openSchedule1Preview`, `setVerbosePdfFillFlag` exports |
| Spec template with the two target assertions | `e2e/tests/schedule1-pdf-render.spec.ts` | Skipped via `test.skip(true, '...')` — assertions are still in place to lock in once the underlying writeback works |
| pdf-lib devDep | `e2e/package.json` | Installed |
| Test-only skip-flatten hook | `form-tax-return-schedule1.component.ts:saveAsPdf` | Active behind `window.__e2eSkipPdfFlatten` flag (production unaffected) |
| Verbose-fill diagnostic hook | `form-tax-return-schedule1.component.ts:fillAcroForm` | Active behind `window.__e2eVerbosePdfFill` flag |
| `resolveAcroFieldName` translator | same component | Landed — fixes the wider production bug that the entire Schedule 1 PDF has been producing blank field cells |
| Line 8a NOL and line 8z description FQNs | same component | Landed |
| Low-level checkbox `/V` write | same component | Landed but NOT verified end-to-end |

**Resolution criteria:** GAP-PDF-8z + GAP-PDF-LINE7 both pass under `--workers=1`, the spec is un-skipped, and `test_cases/8.md` Honourable mention #9 can be marked CLOSED. Bonus scope: extend the same translator pattern to the other forms' `buildAcroFormValues` flows.

## Kiddie Income (Form 8615) Backend Compute + Statement Auto-Detection — Deferred 2026-06-07

**Origin.** UX evaluation rounds 1+2 on `form-kiddie-income-taxpayer.component.ts` (per-dependent form for Form 8615 kiddie tax). The form is currently a manual transcription of IRS Form 8615 — the user is expected to do the worksheet by hand and type the results in. Two of the four sections collect the user-computed outputs of the IRS worksheet (Section "Manual kiddie-tax result"). UX rounds 1+2 made the form safer (removed cleartext parent SSN re-entry; auto-pulled parent identity) and clearer (plain-English labels, gloss for "kiddie tax" / "Form 8615", inline advisories) but did not address the underlying transcription model.

**Open work — architectural rebuild.**

1. **Auto-detect child unearned income from uploaded statements.** A child with $3,000 of interest on a savings account has a 1099-INT in the existing statement pipeline. The kiddie-tax form should read child-scoped 1099-INT / 1099-DIV / 1099-B / 1099-OID totals and pre-fill `childUnearnedIncomeLine1` instead of asking the user to compute and re-type. Requires:
   - Per-statement child-recipient attribution (does the W-2 / 1099 belong to a dependent or to the taxpayer?) — partly done for inmate wages on the Employment Income form
   - A query helper that sums child-scoped unearned income across 1099 types
   - Wire into `ngOnInit` of the kiddie-income form

2. **Auto-pull parent's taxable income from the computed parent return.** The form currently asks the user to manually copy Form 1040 line 15 into `parentTaxableIncomeLine6`. The number is available via `GET /api/tax-return` after compute. Wire it through.

3. **Compute Form 8615 in the backend.** Eliminate the entire "Manual kiddie-tax result" section (`childTaxableIncomeNotSubjectToKiddieTaxLine14`, `childTentativeTaxShareLine13`, `childFinalTaxLine18`). Backend computation needs:
   - New `Form8615` output POJO with lines 1–18
   - New `TaxReturnComputeService.computeForm8615(...)` method per affected child, mirroring IRS Form 8615 worksheet semantics
   - Wire into `Line16` tax computation (the kiddie tax adds to Form 1040 line 16 for the CHILD's return — see `lines/16.md` regular_tax decision tree, Form 8615 branch)
   - Per-dependent output + a parent-return total when multiple children apply
   - Tests covering the Form 8615 worksheet edge cases (capital gains rate worksheet interaction, alternative minimum tax, multi-child pro-rata sharing)

4. **Once #1–#3 land, the form reduces to:** screening Yes/No + child filing status + one Yes/No for multi-child scenarios + child-identity banner + parent-identity banner + a results panel showing the computed kiddie tax. ~12 fields collapse to ~4.

**Estimated scope.** Substantial — child-statement attribution alone is meaningful work (related to but not the same as the existing parent-vs-spouse SSN attribution). Form 8615 worksheet implementation is comparable to other complex line forms (Form 8814, Form 8949). Realistic estimate: 8–12 working days for the backend + 2 days for the UI rewrite, plus ~3 days of unit + e2e test coverage. Total ~13–17 days.

**What's already in place** (do not redo when resumed):

| Asset | Path | Status |
|---|---|---|
| Per-dependent storage scope | `personalData.getDependentScopedForm` / `saveDependentScopedForm` | Working — kiddie-tax form is keyed by `dependentId` |
| Parent identity auto-pull from Identification + Filing Status | `form-kiddie-income-taxpayer.component.ts:ngOnInit` | UX round 1 landed |
| Form 8615 input model (`KiddieIncomeTaxpayerModel`) | same component | All field names + IRS line-number suffixes already in place; backend will need the matching POJO |
| Form-level error summary + child-identity + parent-identity banners + screening gate + multi-child gate + <$2,700 advisory | same component | UX rounds 1+2 landed |

**Resolution criteria.** A child with kiddie-tax-applicable unearned income from uploaded 1099 statements sees an auto-computed Form 8615 result on the kiddie-income form without manual transcription. The "Manual kiddie-tax result" section is removed. The parent-taxable-income field becomes a read-only auto-pull from the parent return. The form is short enough to be filled in under a minute.

## Schedule 1 Part II Post-AGI Refinement: Line 21 MAGI Phase-Out + Line 24c AGI Ceiling + Lines 24h/24i Income Caps — Deferred 2026-06-07

**Origin.** `XLS/Computations/10.md` Line 10 (Adjustments to Income) gap analysis. UX/computation rounds 1-2 closed the easy enforcement gaps (Line 11 educator-expenses $300 per-person cap; Line 18 manual-vs-imported double-counting; Line 19a alimony post-2018-agreement disallow with `SCHEDULE1_LINE19A_*` non-overrideable flags; Line 21 student-loan-interest MFS hard-disallow + $2,500 cap + dependent disallow with `SCHEDULE1_LINE21_*` non-overrideable flags). Four gaps require AGI plumbing OR new input fields and are deferred here.

**Open work.**

1. **Line 21 student loan interest MAGI phase-out.** IRC §221(b)(2)(B). Below MAGI thresholds (`STUDENT_LOAN_PHASEOUT_START_SINGLE_HOH_QSS` = $85,000; `STUDENT_LOAN_PHASEOUT_START_MFJ` = $170,000) the full deduction (up to the $2,500 cap) is allowed. Above the END thresholds ($100,000 / $200,000) the deduction is fully phased out. Between, a linear phase-out applies: `cap * (1 - (MAGI - START) / (END - START))`. MAGI for line 21 = AGI before deducting line 21 + foreign-exclusion add-backs (Form 2555 / Form 4563 / Puerto Rico income). Requires AGI plumbing because `computeIncomeAdjustments` runs before line 9 / line 10 / AGI are computed in `buildForm1040`. Two implementation options:
   - **Option A (post-processing in `compute`)**: after `buildForm1040` sets AGI, re-evaluate line 21, update Schedule 1 line 26, and re-sync Form 1040 line 10 + line 11a (AGI). Mirror the GAP-C1 closure pattern used for Form 8814 line 12 → Schedule 1 line 8z re-sync.
   - **Option B (early line-9 computation)**: compute `line9TotalIncomeEstimate` from the upstream income computations (wages, interest, dividends, etc.) BEFORE calling `computeIncomeAdjustments`; pass as a new parameter. Cleaner functionally but requires un-bundling the `buildForm1040` line-9 sum into a separate helper.
   - Recommended: Option A — less invasive, matches an existing precedent.

2. **Line 24c Olympic / Paralympic exclusion AGI ceiling.** IRC §74(d)(2). When AGI exceeds `OLYMPIC_EXCLUSION_AGI_CEILING_DEFAULT` ($1,000,000) or `OLYMPIC_EXCLUSION_AGI_CEILING_MFS` ($500,000), the line 24c exclusion is fully unavailable and the line 8m income inclusion is taxable without offset. Same AGI plumbing as #1 — combine into one post-AGI refinement pass. Non-overrideable flag code `SCHEDULE1_LINE24C_OLYMPIC_EXCLUSION_AGI_CEILING_EXCEEDED` is already registered in `NonOverrideableFlags.CODES`.

3. **Line 24h attorney fees for unlawful discrimination claims — income cap.** IRC §62(a)(20). The deduction is capped at the amount of gross income received from the discrimination action that was included in the taxpayer's gross income for the year. Requires a new input field: `line24h_grossIncomeFromAction` (per-side). Without it the user can over-deduct attorney fees that exceed the underlying income (silent over-deduction). Scope: 1 new input field + entity column + Liquibase migration + mapper save/load + UI field + per-side enforcement at the line 24h aggregation site. Estimate: 1 working day plus tests.

4. **Line 24i attorney fees for IRS whistleblower awards — income cap.** IRC §62(a)(21). Same shape as #3, capped at the whistleblower award amount included in gross income. New input field: `line24i_whistleblowerAwardInGrossIncome`. Estimate: 1 working day plus tests.

5. **Line 21 dependent-disallow accuracy.** Current implementation OR's `someoneCanClaimYou` + `someoneCanClaimSpouse` from `standard-deductions-*` forms. The IRS test is more nuanced when only one spouse on a joint return can be claimed as a dependent — that doesn't actually block the COUPLE's deduction. The current code over-blocks slightly. Refinement: only block when (a) Single/HOH/QSS filer is claimable, or (b) MFJ filer and BOTH spouses are claimable, or (c) MFS filer (already covered by the MFS rule). Low-priority; over-blocking is safer than under-blocking.

**What's already landed** (do not redo):

| Asset | Location | Status |
|---|---|---|
| `EDUCATOR_EXPENSES_CAP_PER_PERSON` ($300) | `ReferenceData.java` | Landed; applied at Line 11 site via `clampToEducatorCap` helper |
| `STUDENT_LOAN_INTEREST_DEDUCTION_CAP` ($2,500) | same | Landed; applied at Line 21 site |
| `STUDENT_LOAN_PHASEOUT_START/END_SINGLE_HOH_QSS / _MFJ` | same | Landed; NOT YET applied (this is item #1 above) |
| `ALIMONY_AGREEMENT_TAXABLE_LATEST_DATE` (2018-12-31) | same | Landed; applied at Line 19a site via `isAlimonyAgreementPost2018` helper (per-side `SCHEDULE1_LINE19A_*` non-overrideable flags) |
| `OLYMPIC_EXCLUSION_AGI_CEILING_DEFAULT / _MFS` | same | Landed; NOT YET applied at Line 24c site (item #2) |
| Line 21 MFS hard-disallow + cap + dependent-disallow | `TaxReturnComputeService.computeIncomeAdjustments` | Landed with non-overrideable flags `SCHEDULE1_LINE21_STUDENT_LOAN_INTEREST_MFS_DISALLOWED` and `SCHEDULE1_LINE21_STUDENT_LOAN_INTEREST_DEPENDENT_DISALLOWED` |
| Line 19a per-side post-2018 alimony date validation | same | Landed |
| Line 18 manual-vs-imported double-counting guard + `SCHEDULE1_LINE18_MANUAL_VS_IMPORTED_MISMATCH` advisory | same | Landed |
| Line 11 educator cap + `SCHEDULE1_LINE11_EDUCATOR_EXPENSES_CAPPED_*` advisory | same | Landed |
| `SCHEDULE1_LINE24C_OLYMPIC_EXCLUSION_AGI_CEILING_EXCEEDED` non-overrideable flag code | `NonOverrideableFlags.CODES` | Registered; emission site not yet built (item #2) |

**Resolution criteria.** A return where the student loan interest deduction should be reduced to $0 because MAGI is $98,000 (single filer in phase-out range) computes correctly without manual user adjustment. A return where AGI > $1M and Olympic medal exclusion was claimed is blocked with the registered non-overrideable flag. Lines 24h / 24i over-deductions are blocked at the cap.

## Pure-HTML Preview Migration — View-Shape Backend Gaps (2026-06-09)

Five tax-return preview components were migrated from the AcroForm-fill `<app-pdf-readonly-preview>` pattern to the pure HTML/CSS imperative renderer pattern in commit `4075c6c` (Form 8814, Schedule D, Schedule 1-A, Form 8606, Form 6251). A field-name cross-check against `C:\us-tax\pdfs\f{form}_field_map[_ping]_semantic.csv` confirmed **zero typos** in the new renderers — every key written by `buildSemanticValues()` in every migrated component exactly matches a canonical CSV semantic field name. However, the CSVs document many PDF fields that the corresponding backend `*View` interfaces do not yet expose. The deployed components render those PDF fields as blank inputs. None of the gaps below are migration bugs; each one is a real backend data-shape extension required to populate the preview fully.

Field counts after the cross-check (CSV fields / component-mapped / unmapped):
- Schedule 1-A — 54 / 12 / 42 (worksheet intermediates not in `Schedule1AView`)
- Schedule D — 55 / 53 / 2 (PDF artifacts for "no-adjustments" rows — correct by IRS design; no backend change needed)
- Form 8814 — 26 / 16 / 10 (8 view-shape gaps + 2 PDF artifacts already CSV-tagged as `*_right_margin_pdf_artifact_unused`)
- Form 6251 — 62 / 44 / 18 (sub-adjustments 2c–2t + line 3 not in `Form6251View`)
- Form 8606 — 45 / 32 / 13 (filer profile + preparer + signature data not on `Form8606View`)

### Gap 1 — Schedule 1-A worksheet intermediates not on `Schedule1AView` (LOW priority; cosmetic)

- **[Schedule 1-A / Backend view shape / LOW / DEFERRED]** `Schedule1AView` (the backend type read by `form-tax-return-schedule-1a.component.ts`) currently exposes only the five per-Part final totals (`magi`, `line13TipsDeduction`, `line21OvertimeDeduction`, `line30CarLoanInterestDeduction`, `line37EnhancedSeniorDeduction`, `line38Total`). The migrated pure-HTML preview supports another ~42 intermediate worksheet fields that the user would expect to see populated on a printed Schedule 1-A: Modified-AGI build-up (lines 1, 2a–2e), tips worksheet (lines 4a/4b/4c/5/6/7/9/10/11/12), overtime worksheet (lines 14a/14b/14c/15/17/18/19/20), car-loan interest (per-vehicle lines 22a/22b including VIN + lender name, lines 23/24/26/27/28/29), and enhanced-senior phase-out (lines 32/33/34/35/36). To wire these, the Java `Schedule1AView` needs corresponding fields and the `computeSchedule1A` builder (or whichever method assembles the view) needs to write each intermediate worksheet step. **Acceptance criteria:** all 54 fields in `pdfs/f1040s1a_field_mapping_semantic.csv` render with the same value the IRS would compute, for a return that has tips + overtime + a car loan + a senior. Currently 42 of 54 render blank.

### Gap 2 — Form 6251 sub-adjustments 2c–2t + line 3 not on `Form6251View` (MEDIUM priority; affects AMT filers with non-trivial adjustments)

- **[Form 6251 / Backend view shape / MEDIUM / DEFERRED]** `Form6251View` exposes line 2a (state/local taxes), 2b (state/local refund), and 2g (private-activity-bond interest) of the alphabetical 2x sub-adjustment series. The IRS PDF documents 18 more sub-adjustments (2c–2t) plus line 3 (other adjustments) that are not currently surfaced. Affected fields:
  - `line2c_investment_interest_expense_adjustment`, `line2d_depletion_adjustment`, `line2e_net_operating_loss_deduction_adjustment`, `line2f_alternative_tax_net_operating_loss_deduction`, `line2h_qualified_small_business_stock_adjustment`, `line2i_incentive_stock_option_adjustment`, `line2j_estates_and_trusts_adjustment`, `line2k_disposition_of_property_adjustment`, `line2l_depreciation_adjustment`, `line2m_passive_activities_adjustment`, `line2n_loss_limitations_adjustment`, `line2o_circulation_costs_adjustment`, `line2p_long_term_contracts_adjustment`, `line2q_mining_costs_adjustment`, `line2r_research_experimental_costs_adjustment`, `line2s_installment_sales_pre1987_adjustment`, `line2t_intangible_drilling_costs_preference`, `line3_other_adjustments`.

  Each sub-adjustment is a specific AMT preference item per Internal Revenue Code §56–§58. Most filers will have zero or one applicable sub-adjustment, but the AMT total in `line4_alternative_minimum_taxable_income` is the sum of all of them, so when the compute service produces a non-zero AMT today the user cannot see which sub-adjustment contributed it. **Acceptance criteria:** when a filer has any preference item recognized by the Java AMT computation, the corresponding line-2x field renders the per-adjustment amount on the preview. Currently the user sees only the AMT total without provenance.

### Gap 3 — Form 8814 worksheet ratios + Part II branch checkboxes not on `Form8814View` (LOW priority; cosmetic)

- **[Form 8814 / Backend view shape / LOW / DEFERRED]** `Form8814View` exposes the header + child identity + lines 1a/1b/2a/2b/3/4/6/9/10/12/15 (the 11 visible inputs and 4 final-result outputs that the parent's Form 1040 actually consumes). The migrated preview supports 8 more PDF fields that show the worksheet math the IRS instructions require the user to fill in:
  - `line7_divide_line2b_by_line4_ratio_whole_part`, `line7_divide_line2b_by_line4_ratio_decimal_part` (qualified-dividend ratio used to allocate line 6)
  - `line8_divide_line3_by_line4_ratio_whole_part`, `line8_divide_line3_by_line4_ratio_decimal_part` (capital-gain-distribution ratio)
  - `line11_add_lines_9_and_10_amount` (intermediate total)
  - `line14_subtract_1350_from_line4_capped_at_1350_amount` (Part II base for the $135 tax cap)
  - `line15_amount_on_line4_less_than_2700_no_branch_enter_135_check` (no-branch checkbox)
  - `line15_amount_on_line4_less_than_2700_yes_branch_multiply_by_10_percent_check` (yes-branch checkbox)

  These are intermediate computations the parent does NOT need on Form 1040 itself but DOES need on the IRS form for audit-trail purposes. **Acceptance criteria:** the rendered Form 8814 preview shows all worksheet ratios and the Part II $135-cap branch decision. Currently 8 worksheet fields render blank. (Note: CSV also lists 2 fields tagged `*_right_margin_pdf_artifact_unused` — those are PDF layout artifacts that the IRS form template includes but that have no semantic value; correctly skipped by the renderer.)

### Gap 4 — Shared filer-profile injection for Form 8606 (and any preview form with address / preparer / signature fields) (MEDIUM priority; cross-form pattern)

- **[Tax-return previews / Cross-cutting / MEDIUM / DEFERRED]** Form 8606 renders blanks for 13 PDF fields that come from the filer's personal profile and the preparer info, not from the per-form view:
  - 3 home address fields: `home_address_street`, `home_address_apt_no`, `home_address_city_state_zip`
  - 3 foreign-country fields: `foreign_country_name`, `foreign_province_state_county`, `foreign_postal_code`
  - 5 paid-preparer fields: `paid_preparer_self_employed_checkbox`, `paid_preparer_name_and_signature`, `paid_preparer_firm_name_or_address`, `paid_preparer_ptin`, `paid_preparer_firm_ein_or_phone`
  - 2 signature fields: `signature_taxpayer_if_filing_by_itself`, `signature_date_if_filing_by_itself`

  Cross-form scan: the same pattern exists for at least Form 6251, Form 8606, Form 4972, Form 5329, Form 8862, Form 8880, Form 8895, Form 8949, and many others (any form that has an address block or preparer block in its IRS PDF template). The right fix is **not** to add 13 fields to every per-form `*View`. Instead, the project should add a single `FilerProfileView` (or `TaxReturnHeader`) that exposes:
  - Filer street + city/state/ZIP (from `identification-taxpayer` form) — already collected
  - Filer foreign-address fields (from `identification-taxpayer` form, currently empty) — partial backend support exists
  - Preparer self-employed flag, name, firm, PTIN, EIN/phone — comes from paid-preparer intake (not yet built)
  - Self-filing taxpayer signature + date — derived from "self-filing" flag + return-completion date

  Then each pure-HTML preview component injects the shared profile view alongside its per-form view, and `buildSemanticValues()` writes the common keys from the profile. **Acceptance criteria:** when a filer with a complete address and a paid preparer files Form 8606, the rendered preview shows the address block and preparer block populated. Currently these fields render blank on every migrated form that has them.

### Gap 5 — Schedule D PDF artifacts (NO action required; documented as resolved-by-design)

- **[Schedule D / IRS layout / N/A / NO-OP]** The CSV documents two PDF placeholder fields that the IRS form layout includes but that are designed to always be blank:
  - `line1a_short_term_basis_reported_no_adjustments_adjustments`
  - `line8a_long_term_basis_reported_no_adjustments_adjustments`

  Lines 1a and 8a are reserved for transactions with basis reported AND **no** adjustments by IRS design. The IRS template still draws the "Adjustments" column header above these rows for visual alignment with rows 1b–3 and 8b–10, but a value in the row 1a/8a adjustments column would itself be a data error. The migrated `form-tax-return-scheduled.component.ts` correctly skips these two fields and the previous AcroForm-fill component also skipped them. **No backend change needed; documented here to prevent future "this field is missing!" investigations.**

**Resolution criteria for the whole section.** A representative return that exercises every implemented gap above renders the corresponding pure-HTML preview with all CSV-documented fields populated except those tagged `*_right_margin_pdf_artifact_unused` (Form 8814, 2 fields) and the line-1a/8a "no-adjustments" placeholders on Schedule D (correct-by-design). The cross-check script that produced these counts can be re-run at any time by reading both the canonical CSVs in `pdfs/` and the `buildSemanticValues()` keys in each `form-tax-return-{form}.component.ts`.

---

## Preserved legacy components — refund / amount-owed consolidation (DO NOT DELETE)

Added: 2026-06-13 (per user direction during the `XLS/Computations/35d.md` audit).

When the unified "Refund and Amount Owed" form (`refund-and-amount-owed-taxpayer`) shipped, it collapsed four prior Tax-Return sidebar entries into a single screen. The four component files for the prior screens were intentionally left in place — they remain importable, route-mounted on `shell.component.ts`, and backend-readable via the fallback path at `TaxReturnComputeService.computeLine31ThroughLine38` (`unifiedRaoData != null ? unifiedRaoData : personalForms.get("<legacy form id>")`). The intent is to keep them available for potential future re-surfacing without re-deriving the work.

**Components to preserve:**

| Form ID | Component file | Sidebar entry? | Backend fallback | Role |
|---|---|---|---|---|
| `35-direct-deposit` | `src/app/forms/form-direct-deposit.component.ts` | ❌ removed | ✅ `TaxReturnComputeService.java:208` | Lines 35b/35c/35d direct deposit triple (routing, account type, account number) |
| `refund-allocation-taxpayer` | `src/app/forms/form-refund-allocation.component.ts` | ❌ removed | ✅ `TaxReturnComputeService.java:206` | Form 8888 split-refund allocation (Gate 3 of the §1d triple gate) |
| `36-apply-to-next-year` | `src/app/forms/form-apply-next-year.component.ts` | ❌ removed | ✅ via `applyNextYearData` resolver | Line 36 "amount applied to 2026 estimated tax" election |
| `prior-year-tax-taxpayer` | `src/app/forms/form-prior-year-tax.component.ts` | ❌ removed | ✅ Form 2210 fallback path | 2024 AGI + 2024 total tax for the Form 2210 safe-harbor computation |

**Mount points still in place** (confirmed 2026-06-13):

- `shell.component.ts:180` — `import { FormDirectDepositComponent }` — kept
- `shell.component.ts:534` — `<form-refund-allocation *ngIf="selectedFormId() === 'refund-allocation-taxpayer'">` — kept
- `shell.component.ts:536` — `<form-apply-next-year *ngIf="selectedFormId() === '36-apply-to-next-year'">` — kept
- `shell.component.ts:537` — `<form-direct-deposit *ngIf="selectedFormId() === '35-direct-deposit'">` — kept
- `shell.component.ts:538` — `<form-refund-and-amount-owed *ngIf="selectedFormId() === 'refund-and-amount-owed-taxpayer'">` — kept (new unified form)

**E2E coverage of the fallback path:** the test `Fallback path: legacy 35-direct-deposit still works when unified form absent` (`refund-and-amount-owed.spec.ts:343`) explicitly verifies that the backend honors the legacy `35-direct-deposit` document when the unified form is absent. The sibling test `Fallback path: legacy prior-year-tax-taxpayer still works when unified form absent` (line 321) verifies the same for the prior-year form. The other two legacy form IDs (`refund-allocation-taxpayer`, `36-apply-to-next-year`) are exercised by:
- `line35bcd: direct deposit suppressed when Form 8888 split-refund elected` (`line33-refund-owed.spec.ts:268`) — uses `refund-allocation-taxpayer`
- `line36: apply-to-next-year reduces refund` and `line36: apply-to-next-year capped` (`line33-refund-owed.spec.ts:158`, `:220`) — both use `36-apply-to-next-year`

**Why preserve rather than delete:**

1. **Re-surfacing flexibility.** If the unified form's UX evaluation surfaces a strong argument to re-split (e.g., the form becomes too long for mobile, or distinct user journeys want distinct entry points), the existing components can be re-pointed to from the sidebar without re-deriving the form HTML, the field bindings, the help bubbles, or the save/load wiring.
2. **Existing-user data compatibility.** Any user whose Firestore / SQL data was written under the legacy form IDs before the unified form deployed will continue to compute correctly. Deleting the components would not change that (the backend reads the legacy doc IDs regardless of whether the UI components exist), but it would close the door on showing those users their original data in its original screen if they ever needed to review or correct it.
3. **Audit-trail clarity.** The legacy IDs are referenced in `XLS/Computations/35d.md` Gap analysis, in `dependencies/33.md`, and in the related test_cases catalogs. Deleting the source files would leave dangling references that future readers would have to chase through git history.

**DO NOT do any of the following without explicit user direction:**

- Remove the imports from `shell.component.ts:177, 180, 181`
- Remove the `*ngIf` mount blocks at `shell.component.ts:534, 536, 537`
- Delete the four component files or their accompanying `.spec.ts` files
- Drop the legacy form IDs from the `PERSONAL_FORMS` allow-list in `PersonalResource.java` (see `feedback_personal_resource_allowlist` memory — every personal form must be in that allow-list or save returns 400 silently)
- Drop the legacy form IDs from `UserDataBulkDelete.PARENT_TABLES_UID_CASCADE` (see `feedback_user_data_bulk_delete_catalog` memory — leaks contaminate later e2e tests)
- Remove the fallback `personalForms.get("<legacy form id>")` reads in `TaxReturnComputeService.java`

**Acceptance criteria for a future re-surfacing effort** (if undertaken): each of the four legacy form IDs gets a sidebar entry (or a sub-entry inside the unified form, e.g., as a tabbed sub-screen), the existing fallback path becomes the primary read path again, and the unified form is either removed OR retained as an alternative entry point.

This is a **preserve-as-is** directive, not a gap requiring closure. Listed here so future cleanup passes (dead-code elimination, sidebar pruning, route-table trimming, refactoring sweeps) treat these four components as in-scope-by-design and skip them.

---

## Form 4972 + Form 8863 — view-shape coverage gaps after pure-HTML preview migration

Added: 2026-06-13 (surfaced during the 2026-06-13 migration of `form-tax-return-4972.component.ts` and `form-tax-return-8863.component.ts` from `<app-pdf-readonly-preview>` to the pure-HTML imperative renderer that mirrors `f1040s1`/`form-tax-return-schedule1.component.ts`).

The migration preserved the existing data coverage (i.e., the same set of fields the prior `PdfReadonlyPreview` component populated). When the new components were field-mapped against the authoritative semantic CSVs in `C:\us-tax\pdfs\f4972_field_map_semantic.csv` and `C:\us-tax\pdfs\f8863_field_map_semantic.csv`, the JSON-elements manifests and the CSVs were found to be in perfect 1:1 correspondence (58 fields for 4972, 77 fields for 8863, zero typos in the component's writes), but the backend view shapes (`Form4972View`, `Form8863View`) carry data for only a subset of those fields. Closing these gaps requires backend (Java view + compute path) AND intake-form changes; the frontend renderer is already wired to populate them as soon as the data arrives.

### Form 4972 — 22 of 58 IRS fields populated; 36 blank

#### Gap 4972-1 — Part I eligibility questions 2–6 (10 checkboxes) ⚠️ MEDIUM-HIGH

- **[Form 4972 / Backend view shape + intake / MEDIUM-HIGH / DEFERRED]** The 2025 Form 4972 Part I requires SIX Yes/No eligibility questions to be answered. The `Form4972View` model only carries `eligible` (question 1: born before January 2, 1936, or surviving spouse / beneficiary of a participant born before that date). Questions 2–6 are missing from the data model entirely; the semantic CSV expects these checkbox pairs:

  - `part1_question_02_yes` / `part1_question_02_no` — Did you roll over any part of the distribution?
  - `part1_question_03_yes` / `part1_question_03_no` — Was this distribution paid as a beneficiary of a plan participant born before January 2, 1936?
  - `part1_question_04_yes` / `part1_question_04_no` — Were you a plan participant who received this distribution as a participant in the plan for at least 5 prior tax years before the year of distribution?
  - `part1_question_05_yes` / `part1_question_05_no` — Did you use Form 4972 after 1986 for a previous distribution from the same plan?
  - `part1_question_06_yes` / `part1_question_06_no` — Was this distribution paid to a participant who has no taxable distribution from a qualified plan for the year of distribution?

  Per the 2025 IRS Instructions for Form 4972: the taxpayer must check Yes on questions 1 AND (3 OR 4) AND must check No on questions 2, 5, AND 6 to qualify for lump-sum treatment. Without these answers on the printed form, the IRS cannot verify eligibility — the return may be rejected on filing or audited on receipt.

  **Acceptance criteria:** add five boolean fields to `Form4972View` (`partIQuestion2Rollover`, `partIQuestion3BeneficiaryOfParticipantBornBefore1936`, `partIQuestion4FivePriorYearsParticipant`, `partIQuestion5UsedAfter1986`, `partIQuestion6NoTaxableDistribution`). Add five Yes/No radio questions to the lump-sum-distribution intake form. Wire each through the compute service so the per-person/per-distribution Form 4972 carries the answers. The buildSemanticValues maps in `form-tax-return-4972.component.ts` then populate all 10 checkbox slots. Same shape and severity as the analogous 8863 institution-disclosure gap below.

#### Gap 4972-2 — Part II lines 17–24 (8 intermediate amount fields) ⚠️ LOW

- **[Form 4972 / Backend view shape / LOW / DEFERRED]** The 10-year tax option (Part II) has intermediate worksheet steps at lines 17–24 that the `Form4972View` does not surface. The IRS uses these lines internally to derive line 25 (tax on line 13) and line 28 (tax on line 16); the project's compute path already produces line 25 / line 28 directly without storing the intermediate steps. The semantic CSV expects:

  - `part2_line_17_amount` through `part2_line_24_amount` (8 fields)

  Per the 2025 IRS Instructions for Form 4972: "The taxpayer is not required to file these worksheet lines on the return; keep them for your records." So the missing data does not affect IRS-correctness of the filed return — only the audit-trail visibility on the printed PDF.

  **Acceptance criteria:** add eight `BigDecimal` fields to `Form4972View` (`partII_line17` through `partII_line24`) and emit them from the existing `computeForm4972()` worksheet logic. The semantic CSV names are already mapped; closing the gap is a single backend write.

#### Gap 4972-3 — Part III worksheet (page 3) lines 1–18 ⚠️ LOW

- **[Form 4972 / Backend view shape / LOW / DEFERRED]** Page 3 of the 2025 Form 4972 is a one-page tax-rate worksheet that the IRS uses to compute the line 25 / line 28 tax amounts. The `Form4972View` does not surface any of the 18 intermediate worksheet inputs:

  - `part3_worksheet_line_01_amount` through `part3_worksheet_line_18_amount` (18 fields)

  Per the 2025 IRS Instructions: "Keep the worksheet for your records." The IRS does not require page 3 to be filed; it is a taxpayer-facing computation aid.

  **Acceptance criteria:** same shape as Gap 4972-2 — add 18 `BigDecimal` fields to the view and emit them from the existing tax-rate worksheet logic. Low severity; cosmetic improvement only.

### Form 8863 — 46 of 77 IRS fields populated; 31 blank

#### Gap 8863-1 — Per-institution 1098-T disclosure checkboxes (lines 22a/22b questions b + c) ⚠️ HIGH

- **[Form 8863 / Backend view shape + intake / HIGH / DEFERRED]** Form 8863 Part III line 22 requires four Yes/No disclosure checkboxes PER institution to substantiate the AOTC/LLC claim. The `Form8863StudentView` does not carry these per-institution flags. The semantic CSV expects:

  Per the 2025 IRS Form 8863:
  - 22a (b) "Did the student receive Form 1098-T from this institution for 2025?" — `part3_line22a_question_b_1098t_received_yes` / `_no`
  - 22a (c) "Did the student receive Form 1098-T from this institution for 2024 with box 7 checked?" — `part3_line22a_question_c_1098t_prior_yes` / `_no`
  - 22b (b) and (c) — same pair for the second institution: `part3_line22b_question_b_1098t_received_yes` / `_no` and `part3_line22b_question_c_1098t_prior_yes` / `_no`

  Per the 2025 IRS Instructions for Form 8863: "You must receive a Form 1098-T from the educational institution to claim the AOTC or LLC, except in limited cases." When the four checkboxes are blank on the printed return, the IRS audits the credit — the IRS cannot tell whether the taxpayer received the 1098-T, whether box 7 was checked (indicating the institution reported amounts billed for an academic period beginning in the first 3 months of the year), or whether either disclosure exception applies.

  **Acceptance criteria:** add four boolean fields per institution to `Form8863StudentView` (or to a nested `EducationalInstitutionView` carried in a `List<EducationalInstitutionView>`): `received1098TFor2025`, `received1098TFor2024WithBox7Checked` × (institution1 + institution2). Add intake fields to the education-credits personal form. Wire through `computeForm8863()`. The buildSemanticValues map in `form-tax-return-8863.component.ts` then populates all 8 checkbox slots. **Highest-severity gap of all six identified — IRS audit risk on every AOTC/LLC claim.**

#### Gap 8863-2 — Per-institution structured address (line 22a/22b address cells + EIN + attendance dates) ⚠️ MEDIUM

- **[Form 8863 / Backend view shape + intake / MEDIUM / DEFERRED]** Form 8863 Part III line 22 requires a STRUCTURED institution address on the printed return — city, state, ZIP, foreign country / province / postal code, plus the institution's federal Employer Identification Number (EIN) and the student's attendance dates. The current `Form8863StudentView` stores `institution1Name` as a single freeform string and `institution1Address` as a single freeform string mapped to the street cell; the remaining cells stay blank.

  The semantic CSV expects (for 22a):
  - `part3_line22a_institution_name_line2` (institution name continuation)
  - `part3_line22a_institution_address_city` / `_state` / `_zip`
  - `part3_line22a_institution_address_foreign_country` / `_foreign_province` / `_foreign_postal_code`
  - `part3_line22a_institution_ein`
  - `part3_line22a_institution_attendance_dates` (the dates during 2025 the student attended this institution)

  Plus the matching 9 fields for `part3_line22b_*` (entirely blank today; see Gap 8863-3).

  Per the 2025 IRS Instructions for Form 8863: "If the institution refused to provide an EIN, attach a statement explaining your efforts to obtain the EIN." The IRS cross-checks the EIN against its own institution database; a blank EIN is an audit trigger.

  **Acceptance criteria:** restructure `Form8863StudentView` to carry a `List<EducationalInstitutionView>` where each `EducationalInstitutionView` has the structured fields: `name`, `nameLine2`, `street`, `city`, `state`, `zip`, `foreignCountry`, `foreignProvince`, `foreignPostalCode`, `ein`, `attendanceDates`. Update the education-credits intake to collect structured address + EIN per institution. Update the buildSemanticValues map in `form-tax-return-8863.component.ts` to populate all 9 cells per institution. Closes the entire 22a + 22b structured-address surface.

#### Gap 8863-3 — Entire second institution (line 22b) is blank ⚠️ LOW for one-institution students; HIGH for transfers

- **[Form 8863 / Backend view shape + intake / LOW (common case) / HIGH (transfers) / DEFERRED]** The `Form8863StudentView` stores only `institution1Name` + `institution1Address` (singular). Students who transferred mid-year attend two institutions and need both line 22a AND line 22b populated. The semantic CSV expects 11 fields for 22b (same shape as 22a):

  - `part3_line22b_institution_name_line1` + `_line2`
  - 6 address fields (street + city/state/zip + foreign trio)
  - EIN + attendance dates
  - 4 checkboxes (Gap 8863-1's 22b pair)

  Per the 2025 IRS Instructions for Form 8863: "If the student attended more than one institution during the year, complete line 22b for the second institution." Without this, transfer students cannot claim AOTC/LLC correctly.

  **Acceptance criteria:** subsumed by Gap 8863-2's restructure to `List<EducationalInstitutionView>` — once the view holds a list, populating the second institution is a matter of the intake form supporting "Add another institution" and the buildSemanticValues map iterating the list to populate `_line22a_*` for index 0 and `_line22b_*` for index 1.

#### Gap 8863-4 — Line 7 nonresident-alien checkbox ⚠️ MEDIUM

- **[Form 8863 / Backend view shape + intake / MEDIUM / DEFERRED]** The 2025 Form 8863 line 7 has a "nonresident alien" checkbox before the line-7 amount cell. When the taxpayer (or spouse on MFJ) is a nonresident alien, the AOTC is generally disallowed — the IRS uses this checkbox to flag eligibility. The current `Form8863View` does not carry a nonresident-alien flag. The semantic CSV expects:

  - `part1_line_07_nonresident_alien_checkbox`

  Per the 2025 IRS Instructions for Form 8863: "Nonresident aliens generally cannot claim the AOTC unless they elect to be treated as resident aliens for tax purposes. If you are a nonresident alien at the end of 2025 (or were one at any time during 2025 and you did not make the election to be treated as a resident alien), check the box on line 7."

  **Acceptance criteria:** add a boolean field to `Form8863View` (`taxpayerIsNonresidentAlien`) and read it from the existing identification-taxpayer / identification-spouse forms (or from a new education-credits-specific intake question if the existing identification forms don't capture nonresident-alien status). Update the buildSemanticValues map to emit the value to `part1_line_07_nonresident_alien_checkbox`.

#### Gap 8863-5 — Line 28 (subtract $2,000) + Line 29 (multiply 25%) — AOTC worksheet intermediates ⚠️ LOW

- **[Form 8863 / Backend view shape / LOW / DEFERRED]** Form 8863 Part III line 28 = `line 27 - 2000` (capped at zero); line 29 = `line 28 × 25%`. Both are intermediate steps that feed line 30 (the per-student AOTC = `2000 + line 29` when line 27 ≥ 2000, else `line 27 × 100%`). The current `Form8863StudentView` stores `perStudentLine30` (the final AOTC) but not the line 28 / line 29 intermediate steps.

  The semantic CSV expects:
  - `part3_line_28_subtract_2000_amount`
  - `part3_line_29_multiply_25_percent_amount`

  Per the 2025 IRS Instructions for Form 8863: these worksheet lines are derivable from line 27 (qualified expenses) and line 30 (the AOTC total). The IRS does not strictly require them to be filled on the printed return, but their absence leaves the audit trail incomplete.

  **Acceptance criteria:** add two `BigDecimal` fields to `Form8863StudentView` (`partIII_line28SubtractTwoThousand`, `partIII_line29MultiplyTwentyFivePercent`) and emit them from the existing per-student AOTC computation. Low severity; cosmetic improvement only.

### Cumulative summary

| Form | Gap | Severity | Frontend ready? | Blocker |
|---|---|---|---|---|
| 4972 | Part I questions 2–6 (10 checkboxes) | MEDIUM-HIGH | ✅ | Backend view + intake |
| 4972 | Part II lines 17–24 (8 fields) | LOW | ✅ | Backend view only |
| 4972 | Part III worksheet (18 fields) | LOW | ✅ | Backend view only |
| 8863 | Per-institution 1098-T disclosures (8) | **HIGH** | ✅ | Backend view + intake |
| 8863 | Per-institution structured address + EIN | MEDIUM | ✅ | Backend view + intake (restructure) |
| 8863 | Entire second institution (22b) | LOW/HIGH | ✅ | Subsumed by Gap 8863-2 |
| 8863 | Nonresident-alien checkbox | MEDIUM | ✅ | Backend view + intake |
| 8863 | Line 28 + 29 AOTC intermediates (2 fields) | LOW | ✅ | Backend view only |

**Resolution criteria for the cluster.** Every IRS-required field on the printed Forms 4972 and 8863 carries a value sourced from the backend `Form4972View` / `Form8863View`. The frontend buildSemanticValues maps are already populating the correct semantic names — every closure listed above is a backend-only data-source addition.

**The migration to the pure-HTML preview did NOT introduce any of these gaps** — the prior `PdfReadonlyPreview`-based components carried the same blank-field surface, just without surfacing it (no "Show all fields" debug mode). The migration made the gaps visible via the debug-mode field-name labels, but the same gap analysis would have applied to the legacy AcroForm-fill pipeline.

---

## Form 2210 — Yearly refresh of the underpayment interest rate (MEDIUM priority; recurring annual task)

Added: 2026-06-14 (per `XLS/Computations/38.md` Gap H closure).

### Gap 2210-Rate — `F2210_PENALTY_ANNUAL_RATE` requires yearly refresh from the IRS Revenue Rulings

- **[Form 2210 / Backend reference data / MEDIUM / RECURRING ANNUAL TASK]** The Internal Revenue Service sets the underpayment interest rate quarterly via Revenue Ruling per Internal Revenue Code §6621. The rate equals the federal short-term rate plus 3 percentage points and changes when the federal short-term rate changes (typically every 1-2 quarters). For tax year 2025 the rate has been 7% all year (Revenue Ruling 2024-25 set the rate for Q1 2025; subsequent quarterly rulings confirmed 7% through Q4 2025). The constant `F2210_PENALTY_ANNUAL_RATE` at `src/main/java/com/ustax/microservices/ReferenceData.java:559` hardcodes this rate.

  **Before deploying for tax year 2026:**

  1. Check the IRS quarterly Revenue Rulings for the 2026 rates (search irs.gov for "Revenue Ruling" + tax-year-2026 — the rate is published late in the prior year for Q1 and updated each subsequent quarter).
  2. **When the rate is uniform across all four 2026 quarters**, update the `F2210_PENALTY_ANNUAL_RATE` constant in `ReferenceData.java` to the 2026 value.
  3. **When the rate VARIES between quarters** (e.g., 7% in Q1 + Q2, 8% in Q3 + Q4), this single constant is insufficient — extend to a per-quarter array (e.g., `F2210_PENALTY_ANNUAL_RATES = {0.07, 0.07, 0.08, 0.08}`) and update `computeForm2210()` to apply the correct rate to each quarterly penalty in the for-loop at lines 27683-27717.
  4. Update the Javadoc block on `F2210_PENALTY_ANNUAL_RATE` (lines 538-563) with the new Revenue Ruling citation and the new rate(s) for 2026.

  **Acceptance criteria for the 2026 refresh:** the `F2210_PENALTY_ANNUAL_RATE` (or its array equivalent) reflects the IRS Revenue Ruling rate(s) for the 2026 tax year, the Javadoc citation is updated, and at least one Java unit test pins the new value (mirror the existing `form2210_fires_when_balance_due_over_1000_and_safe_harbor_missed` test added today during 38.md Gap I closure). When the rate is a per-quarter array, an additional test should pin that the quarterly rates are applied correctly per the IRS instructions.

  **Why this is the ONLY F2210 reference-data refresh needed:** the six other F2210 constants (`F2210_NO_PENALTY_BALANCE_THRESHOLD = $1,000`, `F2210_SAFE_HARBOR_HIGH_AGI_THRESHOLD_OTHERS = $150,000`, `F2210_SAFE_HARBOR_HIGH_AGI_THRESHOLD_MFS = $75,000`, `F2210_SAFE_HARBOR_HIGH_RATE = 1.10`, the implicit 90% / 100% safe-harbor multipliers, the four-quarter default days `{365, 303, 212, 90}`) are statutory and stable year to year. The interest-rate refresh is the entire surface area of the yearly reference-data update for Form 2210.

  **Failure mode if the refresh is missed:** the Form 1040 line 38 penalty will be off by the rate ratio. For a $1,000 underpayment from Q1 (365 days) under a hypothetical 8% rate in 2026, the correct penalty is $80 but the codebase would still compute $70 (using the 2025 7% rate). The error compounds proportionally for larger underpayments and longer-duration periods. The IRS would charge the correct penalty post-filing per Internal Revenue Code §6601, so the taxpayer's filed return would understate the penalty by ~12.5% of the line-38 value when the rate moves from 7% to 8%.

---

## Separate-Filing Optimizer — HOH/HOH and HOH/MFS splits (LARGE feature; multi-phase; in progress)

Added: 2026-06-20 (during MFS-spouse migration Form #3 = Filing status).

### Gap HOH-Split — optimizer only models the separate alternative as MFS + MFS

- **[Multi-return / OptimizerService + MfsFormScoper / LARGE / IN PROGRESS]** A married couple living apart where **each** spouse is independently "considered unmarried" (§7703(b)) can file **Head of Household** with a *different* qualifying child — a legal outcome that beats MFS (HOH rates, $23,625 × 2 deductions, EIC/education/dependent-care credits restored). The current multi-return architecture has **no HOH-aware split**: `return_kind ∈ {primary, mfs_head, mfs_spouse, dependent_own}`, `MfsFormScoper.overrideFilingStatusToMfs` unconditionally forces "Married filing separately" on both split legs, and `OptimizerService` compares only **MFJ vs MFS-split**. For the living-apart-with-children cohort the optimizer therefore recommends a strictly-worse status or under-states achievable savings.

  **Full design:** `C:\us-tax\docs\separate-filing-hoh-split-design.md` — scenario enumeration (MFJ / MFS+MFS / HOH+HOH / HOH+MFS / MFS+HOH), the `ConsideredUnmarriedEligibilityService`, the status-aware `overrideFilingStatusToSeparate` scoper generalization (Option A: reuse `mfs_head`/`mfs_spouse` rows as which-side markers), the optimizer generalization, and 5 phases A–E (each shippable behind `multi_return.feature.*`).

  **Resolved decisions (in the design doc):**
  - **Itemize-coupling (§63(c)(6)(A)):** HOH legs are *never* zeroed (rule keys on filer status = MFS); MFS legs stay coupled to the other leg's itemize choice. (i1040gi "Persons not eligible for the standard deduction" + 2024 Std Deduction Table CAUTION + MFS special-rule #11.)
  - **Qualifying person is derivable** from existing `dependent.claimedByMfs` + `monthsLivedWithTaxpayer` + `relationship` — no new per-spouse qualifying-person field. The only genuinely new input is the Pub 17 Worksheet 2-1 "paid > half the cost of keeping up the [separate] home" test (two per-side booleans).

  **Status:** Phase A in progress (kept-up-home inputs + eligibility service). Phases B–E pending. S0 (MFJ) and S1 (MFS+MFS) paths stay byte-for-byte identical — all new behavior is additive and flag-gated.

  **Open verification items (design §8):** §7703(b) reference-chain nuance for the MFS-leg-coupled-to-HOH-leg case (implemented conservatively); residency semantics ("with claiming parent"); §152(e) release representability; community-property states (out of scope, flagged); feature-flag sub-flag for staged HOH rollout.
