---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
---

依明確基準與審查範圍，對已提交或未提交變更進行兩軸審查：

- **Standards**：核對既有 CI／自動檢查的覆蓋與有效結果，以及本次交付適用的明文契約。
- **Spec**: does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

兩軸皆由 agent 自動執行，不要求使用者人工讀碼或審查放行。以 spec／TODO／AC、實際接線與驗證證據為判準；已由適用 CI 覆蓋且通過的錯誤模式直接採認，不再逐行掃描同類問題。

過去 bug 經 `diagnosing-bugs` 修復後建立的通用防線，依 `docs/agents/review-prevention.md`「根因模式的通用防線」核對適用性與結果；沿用對本候選有效的證據。發現新的具體 bug 或已證實漏報時，交修正 owner 診斷、修復並補足防線，不在每次 review 重跑診斷流程。

本 repo 的 reviewer 生命週期依 `docs/agents/session-lifecycle.md`：首次及全新獨立審查使用未參與產出的新 session；同輪修正複查預設續用各軸原 reviewer，回報明列類型。保留兩軸分離，不把 resume 複查當成另一份全新獨立證據。

審查與修正銜接依 `docs/agents/review-prevention.md`：兩軸 reviewer 唯讀提供具體缺陷的根因與預防候選；有實作 owner 時交回其流程自主建立適用措施，單獨審查則只回報。

進入修正複查時，主 agent、owner 與兩軸 reviewer 都載入 `docs/agents/review-convergence.md`，以穩定 finding ID 對照版本、完成條件及證據，停滯或爭議依該規則收斂；保留兩軸分列，跨軸相同根因可引用同一修正項。

## Process

### 1. Pin the fixed point

沿用使用者指定的基準與範圍。要求審查目前未提交修改時，以 `HEAD` 為基準；分支／PR 則使用指定 base 的 merge-base。只有無法從要求與上下文判定時才詢問。

先以 `git status --short` 核對變更種類，固定適用的 diff 命令與檔案清單：

| 審查範圍 | 比較方式 |
| --- | --- |
| 已提交分支／PR | `git diff <base>...HEAD`；記錄 `git log <base>..HEAD --oneline` |
| 全部未提交變更 | `git diff HEAD --`，涵蓋 tracked 檔案的 staged 與 unstaged 最終結果 |
| 僅 staged | `git diff --cached --`，讀取 index 版本，不以工作樹內容替代 |
| 僅 unstaged | `git diff --`，以 index 為基準 |
| 指定 commit 至目前工作樹 | `git diff <base> --`；另記錄 base 至 HEAD 的 commits |

範圍包含工作樹新增檔案時，另以 `git ls-files --others --exclude-standard` 列出未追蹤檔案，核對歸屬並讀取適用內容；它們不會出現在一般 diff。僅 staged 或已提交範圍不混入未追蹤檔案。秘密檔只核對追蹤／ignore 狀態，不將內容放入審查輸出。

派工前確認使用到的 Git refs 可解析，且該範圍的 diff 或新增檔案非空；無變更就回報該範圍無可審內容。記錄 base／head SHA、diff、檔案清單及未提交內容的版本／hash，供兩軸核對同一候選；審查期間停止相關寫入，變更後只複查受影響範圍。未提交工作不得僅以 HEAD SHA 代表受審版本。

### 2. Identify the spec source

優先沿用使用者已指定或確認的需求來源：指定文件／issue，以及目前對話中已確認的需求、修正與完成條件。對話需求也是有效規格，不因缺少 spec 文件再次索取文件或跳過 Spec 軸；不把 agent 的建議自行當成已確認需求。

來源尚不明時，再查 commit 的 issue 引用與 `docs/`、`specs/`、`.scratch/` 中對應文件。來源互有差異時，沿用使用者明確確認的修訂；仍會影響判定的歧義才集中詢問。確實沒有任何可核對需求且使用者確認無規格時，Spec 軸才標示「無需求來源，未審查需求符合度」。

派工提供精簡的已確認需求、完成條件及來源定位（文件行號、issue 或對話訊息／原文摘錄）；保留必要限制與範圍，不要求為審查另建 spec 文件。

### 3. Identify the standards sources

讀取 repo 的 `AGENTS.md` 與變更範圍適用的規範；存在 `CODING_STANDARDS.md` 或 `CONTRIBUTING.md` 時核對相關條款。找出既有 CI／驗證入口及本次候選的結果，確認規則啟用、掃描範圍與證據適用性。必要證據缺失時記錄需要補跑的檢查，不以 agent 逐行模擬工具替代。

不附加通用 code smell 巡查清單。工具未涵蓋的事項，只針對本次交付的具體規範違反或可達缺陷提出 finding，附契約、證據及可觀察完成條件；依 `docs/agents/review-convergence.md` 採認最小充分實作與驗證。新增 CI 防線依 `docs/agents/review-prevention.md`，由實際缺陷修復觸發，不以缺少某工具作為一般交付的阻擋。

### 4. Spawn both sub-agents in parallel

Issue both sub-agent calls together, in the foreground, and aggregate the reports they return.

首次／新視角審查為兩軸各建新 session；修正複查則在同一輪各軸原 session 傳入修正範圍、新版本與 finding 對照。原 session 不可恢復時依生命週期交接，仍標示修正複查。

兩軸派工都附 `docs/agents/review-prevention.md` 與 `docs/agents/review-convergence.md` 路徑並要求載入：核對既有自動檢查證據，具體缺陷附根因與必要預防候選；修正複查只核對原問題、修正影響及新增證據。預防資訊隨原 finding 呈現，不另計為缺陷；下列 400 words 限制適用摘要，必要 finding 與預防證據可另附精簡清單。

**Standards sub-agent prompt** should include:

- The full diff command and commit list.
- 第 3 步取得的適用規範、CI／驗證入口、候選版本及有效結果。
- 第 1 步的範圍、未追蹤檔案及候選證據；未提交審查的 commits 可為空，兩軸須讀取同一受審版本。
- 派工要求：核對既有自動檢查是否涵蓋本次修改且通過；已涵蓋事項採認工具證據，不重做相同掃描。只回報必要檢查缺口，以及工具未涵蓋的具體明文契約違反或可達缺陷，附要求、證據與完成條件。不要求使用者人工審查，不追加 smell 清單或偏好性重構。摘要 400 words 以內。

**Spec sub-agent prompt** should include:

- The diff command and commit list.
- 已確認需求與完成條件，以及文件／issue／對話來源摘錄。
- 第 1 步的範圍、未追蹤檔案及候選證據，與 Standards 使用同一版本。
- 派工要求：回報需求缺漏／部分完成、未要求的範圍擴張，以及看似已實作但行為錯誤的項目；每項引用對應需求的文件行號或對話原文，附具體證據與完成條件。摘要 400 words 以內。

只有第 2 步確認沒有任何可核對需求時才跳過 Spec 子代理，並在最終報告明記；缺少 spec 檔案本身不構成跳過理由。

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes: that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
