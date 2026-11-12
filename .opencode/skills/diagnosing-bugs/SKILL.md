---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow.
---

# Diagnosing Bugs

A discipline for hard bugs. Skip phases only when explicitly justified.

When exploring the codebase, read `GLOSSARY.md` (if it exists) to get a clear mental model of the relevant modules, and check ADRs in the area you're touching.

## Redact

This skill has you show commands, outputs and captured artifacts. **Redact every secret first**: write `<REDACTED>` in its place. Build loops against env vars, so the credential stays in the environment rather than in what you show. Captured artifacts carry auth headers: quote only the lines that carry the signal.

脫敏輸出不足時，先核對錯誤捕捉邊界與實際呼叫鏈，補足安全的階段／斷言 ID、錯誤分類、欄位及預期／實際型別；秘密與私人 payload 仍遮蔽。能由程式、固定版本 API／SDK 或本機重現取得的資訊自行查證；只有確實無法取得的外部證據或權限才詢問使用者。執行時沿專案 `docs/agents/test-execution.md` 的「可診斷的驗證入口」，區分產品失敗、cleanup 與 evidence 轉換失敗。

## Phase 1: Build a feedback loop

以能抓住該問題的快速 pass/fail 訊號作為排錯核心。先讀實際呼叫鏈、型別、版本契約及既有失敗證據，據此選擇最小重現；讀碼與提出待驗證假設是建立迴圈的方法，不能取代修復後的實測。

Spend disproportionate effort here. **Be aggressive. Be creative. Refuse to give up.**

### Ways to construct one, in roughly this order

1. **Failing test** at whatever seam reaches the bug: unit, integration, e2e.
2. **Curl / HTTP script** against a running dev server.
3. **CLI invocation** with a fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** (Playwright / Puppeteer) that drives the UI and asserts on DOM/console/network.
5. **Replay a captured trace.** Save a real network request / payload / event log to disk; replay it through the code path in isolation.
6. **Throwaway harness.** Spin up a minimal subset of the system (one service, mocked deps) that exercises the bug code path with a single function call.
7. **Property / fuzz loop.** 使用固定 seed、有限案例數與總期限提高失敗重現率，保存首次失敗與最小輸入。
8. **Bisection harness.** If the bug appeared between two known states (commit, dataset, version), automate "boot at state X, check, repeat" so you can `git bisect run` it.
9. **Differential loop.** Run the same input through old-version vs new-version (or two configs) and diff outputs.
10. **HITL bash script.** Last resort. If a human must click, drive _them_ with `scripts/hitl-loop.template.sh` so the loop is still structured. Captured output feeds back to you.

Build the right feedback loop, and the bug is 90% fixed.

### Tighten the loop

Treat the loop as a product. Once you have _a_ loop, **tighten** it:

- Can I make it faster? (Cache setup, skip unrelated init, narrow the test scope.)
- Can I make the signal sharper? (Assert on the specific symptom, not "didn't crash".)
- Can I make it more deterministic? (Pin time, seed RNG, isolate filesystem, freeze network.)

A 30-second flaky loop is barely better than no loop; a 2-second deterministic one is tight, a debugging superpower.

### Non-deterministic bugs

對非確定性問題，使用固定 seed、受控併發或時間條件提高重現率，保存量測及最小失敗輸入。依專案時限與操作預算執行；離線 fuzz 的案例集合與有副作用的 runtime 操作分開計算，不能以批次迴圈繞過操作限次。

### When you genuinely cannot build a loop

Runtime 不可執行、授權已限次或歷史輸出不足時，先走離線路徑：

1. 從失敗邊界反查實際 producer、adapter、consumer 及例外處理，核對固定版本 schema、API／SDK 與型別；區分已觀察事實、程式必然違約及尚待驗證推論。
2. 使用脫敏既有輸入或版本契約 fixture，呼叫實際產品／runner 函式建立最小重現。對 evidence 問題測到 producer → projector → serializer，不只測人工整理好的最終物件。
3. 若仍缺關鍵訊號，在既有修改範圍內補最小診斷與離線回歸；需要修訂測試入口或跨票責任時交主 agent 依既有流程處理，繼續其他可執行調查。

只有上述路徑仍受具體外部條件阻擋，才列已試方法、所缺證據及最小必要輸入詢問使用者。離線證實的缺陷可修復並驗證，但原 runtime／端到端驗收保留未完成；使用者明確限制不因找到新缺陷而失效。

### Completion criterion: a tight loop that goes red

Phase 1 is done when the loop is **tight** and **red-capable**: you can name **one command** (a script path, a test invocation, a curl) that you have **already run at least once** (show the invocation and its output, redacted), and that is:

- [ ] **Red-capable**: it drives the actual bug code path and asserts the **user's exact symptom**, so it can go red on this bug and green once fixed. Not "runs without erroring"; it must be able to _catch this specific bug_.
- [ ] **Deterministic**: same verdict every run (flaky bugs: a pinned, high reproduction rate, per above).
- [ ] **Fast**: seconds, not minutes.
- [ ] **Agent-runnable**: you can run it unattended; a human in the loop only via `scripts/hitl-loop.template.sh`.

完成判準適用於可執行的重現；離線路徑須明記涵蓋的缺陷與未涵蓋的原始症狀。尚無 red-capable 命令時繼續讀碼、查契約與設計 probe，推論保持待驗證，不宣稱已重現或修復原問題。

## Phase 2: Reproduce + minimise

Run the loop. Watch it go red as the bug appears.

Confirm:

- [ ] The loop produces the failure mode the **user** described, not a different failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] The failure is reproducible across multiple runs (or, for non-deterministic bugs, reproducible at a high enough rate to debug against).
- [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.

### Minimise

Once it's red, shrink the repro to the **smallest scenario that still goes red**. Cut inputs, callers, config, data, and steps **one at a time**, re-running the loop after each cut, and keep only what's load-bearing for the failure.

Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving parts left to suspect) and becomes the clean regression test in Phase 5.

Done when **every remaining element is load-bearing**: removing any one of them makes the loop go green.

可執行時先重現並縮小；因具體外部條件無法執行時沿離線路徑繼續，保留驗證缺口。

## Phase 3: Hypothesise

原因未明時列出少量有證據支持且可區分的假設，按可能性排序；已有明確型別／契約違約時直接建立其最小回歸，不為湊數杜撰其他原因。局部缺陷已證實不代表它是整次失敗的唯一原因。

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe: discard or sharpen it.

**Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly ("we just deployed a change to #3"), or know hypotheses they've already ruled out. Cheap checkpoint, big time saver. Don't block on it; proceed with your ranking if the user is AFK.

## Phase 4: Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger / REPL inspection** if the env supports it. One breakpoint beats ten logs.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Never "log everything and grep".

**Tag every debug log** with a unique prefix, e.g. `[DEBUG-a4f2]`. Cleanup at the end becomes a single grep. Untagged logs survive; tagged logs die.

**Perf branch.** For performance regressions, logs are usually wrong. Instead: establish a baseline measurement (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second.

## Phase 5: Fix + regression test

Write the regression test **before the fix**, but only if there is a **correct seam** for it.

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.

**If no correct seam exists, that itself is the finding.** Note it. The codebase architecture is preventing the bug from being locked down. Flag this for the next phase.

If a correct seam exists:

1. Turn the minimised repro into a failing test at that seam.
2. Watch it fail. If you forced the red by mutating code or a fixture, `diff` against a pristine copy to prove the mutation landed before you trust it.
3. Apply the fix.
4. Watch it pass.
5. Re-run the Phase 1 feedback loop against the original (un-minimised) scenario.

## Phase 6: Cleanup

Required before declaring done:

- [ ] Original repro no longer reproduces (re-run the Phase 1 loop)
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is stated in the commit / PR message, so the next debugger learns
