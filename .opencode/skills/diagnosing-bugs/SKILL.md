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

以足以定位根因及驗證修復的最低總成本建立回饋；已有適用證據就沿用，新增實驗只補尚未釐清的缺口。

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

### 完成判準：足以定位與驗證的回饋

確認以下事項即可進入根因判定或修復，不要求先完成理想化重現：

- **失敗證據**：有可執行重現，或足以支持根因判定的既有事故證據／契約違約證據；明列症狀、來源與適用版本，區分觀察事實及待驗證推論。已有充分證據時不為製造 Red 重跑事故。
- **驗證路徑**：已選定能檢查預期行為及原缺陷的最小入口與斷言；修復後仍須實測，不能只以讀碼宣稱修復成功。入口受阻時沿離線路徑處理，明列未涵蓋的原驗收。
- **成本與可重複性**：按必要依賴及故障特性選擇最快充分的方法；長時間、併發或間歇問題可使用有限時限的量測／受控重播，不以秒級完成或完全確定性作為放行條件。
- **自主執行**：優先由 agent 執行並保存脫敏結果；只有確實需要使用者操作的外部條件才使用 `scripts/hitl-loop.template.sh`。

尚無足以定位的證據時，繼續查契約或建立針對性 probe；沒有實際重現就不宣稱已重現，原情境未驗證就保留該驗收缺口。

## Phase 2: Reproduce + minimise

依證據缺口選擇執行重現或沿用有效事故證據；只有額外執行能區分假設或確認間歇性時才重跑。

Confirm:

- [ ] The loop produces the failure mode the **user** described, not a different failure that happens to be nearby. Wrong bug = wrong fix.
- [ ] 證據足以支持本次定位；間歇性問題記錄觸發條件與重現限制，不一律要求多次重跑。
- [ ] You have captured the exact symptom (error message, wrong output, slow timing) so later phases can verify the fix actually addresses it.

### Minimise

重現過大或訊號不明時，移除能降低定位成本的無關輸入、依賴及步驟，保持同一故障模式。縮小操作須能減少假設或驗證成本，已有充分定位時直接進入修復。

Why bother: a minimal repro shrinks the hypothesis space in Phase 3 (fewer moving parts left to suspect) and becomes the clean regression test in Phase 5.

能區分根因並支援修復驗證即完成；不要求逐一證明所有剩餘元素都不可移除。

需要新增證據時才執行或縮小重現；具體外部條件阻擋時沿離線路徑繼續，保留驗證缺口。

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

**效能分支**：先以計時 harness、profiler 或 query plan 取得可比量測，再依證據修復。已定位熱點就直接驗證修法；只有需要定位引入回歸的版本，且具備可比較基線與有效判定訊號時才使用 bisect。

## Phase 5: Fix + regression test

保留足以證明原缺陷的失敗證據，選擇能驗證真實錯誤模式的測試邊界。已有有效重現或原始證據時，可直接修復後補回歸；先寫失敗測試能降低返工或使用者明確要求 test-first 時，才採測試先行。不為補齊 Red → Green 歷程而重做已充分證明的步驟。

A correct seam is one where the test exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow (single-caller test when the bug needs multiple callers, unit test that can't replicate the chain that triggered the bug), a regression test there gives false confidence.

若現有邊界不足，先沿真實呼叫鏈選擇最小可行的整合入口或 harness，記錄仍未覆蓋的行為；不僅因缺少單元測試 seam 就認定架構有缺陷或要求重構。

If a correct seam exists:

1. 將最小重現保存為回歸案例，沿用有效的原始失敗證據；必要時在隔離副本驗證案例能捕捉修正前的缺陷，不改壞目前交付來製造 Red。
2. 完成修復並執行回歸，確認預期行為與受影響合法情境通過；測試及修復的撰寫順序依上述原則選擇。
3. 回到原始情境驗證，不以縮小重現取代尚未涵蓋的原驗收；同版本且仍適用的成功證據直接沿用。

### 根因模式與 CI 防線

確認根因並修復後，依 `docs/agents/review-prevention.md` 的「根因模式的通用防線」將本次教訓接入既有驗證入口。原情境回歸負責證明 bug 已修；通用檢查負責攔截其他位置再次使用相同錯誤模式。使用 `test` 選擇最小適用工具與驗證方式，交付規則／測試位置、適用範圍、執行命令及實際結果，供後續 code-review 沿用。

## Phase 6: Cleanup

Required before declaring done:

- [ ] 原缺陷及必要驗收已有充分修復證據；沿用同版本且仍適用的成功結果，只補跑證據缺口。沒有可執行的原始重現時，以涵蓋已證實根因與必要行為的實測判定，不為收尾強制重建 Phase 1；仍未覆蓋的原情境明記未完成，不宣稱已完整修復原問題。
- [ ] Regression test passes (or absence of seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed (`grep` the prefix)
- [ ] Throwaway prototypes deleted (or moved to a clearly-marked debug location)
- [ ] The hypothesis that turned out correct is stated in the commit / PR message, so the next debugger learns
