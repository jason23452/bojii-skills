# 開發語言

- 開發過程中的溝通、說明、文件與程式碼註解，請使用繁體中文。
- 程式碼中的識別字（例如變數、函式、類別名稱）及必要的技術術語可維持英文，並遵循專案既有慣例。

## Agent skills

### 如何開始

使用 `/bojii-guide` 依目前專案與任務選擇流程；首次設定或補齊 tracker、領域文件及流程入口使用 `/setup-bojii-skills`。

### Grilling 互動提問

使用 `grilling`、`grill-me` 或 `grill-with-docs` 時，先完成影響方案與拆票的可行性研究，再確認實作共識並更新領域文件。調查、必要實驗與未解事項門檻見 `docs/agents/grilling.md`。

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.

### Implement-spec 整票自主交付

使用 `implement-spec` 時，依 `docs/agents/implement-spec.md` 的結果導向交付，從已定案的 TODO／AC 盤點環境與操作授權，自動載入 `worktree` 建立隔離環境；每票新建獨立實作 subagent owner，可獨立開工票背景平行派出。主 agent 派工前依每票實作範圍選擇 SDD／TDD；TDD 以單元測試執行 Red → Green → Refactor，Playwright E2E 依完整 spec／AC 於全票整合後的最終驗收階段新增或補齊並實跑；owner 經獨立票級審查後逐票整合。全票驗收、最終 integration review、PR 交付報告與 `implement-spec` 階段的約定收尾完成後，才結束 `implement-spec`；這不包含將 integration worktree 合併至 `dev` 或合併後清理，兩者屬於獨立的 `/merge` 流程。正式實作期間主 agent、owner 與 reviewer 不使用 `question` 工具；已授權範圍內自主決策執行，超出範圍只暫停受影響操作並記錄回報，不推定新增授權。

`implement-spec` 完成、TODO／AC 全數完成或候選標示「可合併」，都不代表授權合併。不得自動將 integration worktree 合併至 `dev` 或自動啟動 merge skill；須等待使用者明確要求合併並指定來源範圍。未收到要求時保留 integration worktree／branch 與必要資源並回報待命；使用者已要求合併但範圍不明時，依 merge skill 釐清後再執行。

### 專案接手

接手既有成果、恢復中斷任務或搬移環境時，先沿用 repo 既有權威紀錄；需攜帶上下文至新 session 時使用 `/handoff`，交接文件不記 subagent session ID。`implement-spec` 正常派工與續作以 ticket、integration `execution-state.md`／`test.md` 及 Git／驗證證據交接，不另建每票 handoff 文件。從零開發、首次建環境及正常新票派工沿用一般開工流程。

### 測試與靜態檢查

配置測試方式、選擇本機／混合／容器模式、配置 `.env.test`，或規劃／執行測試、lint、typecheck、build 時，使用 `test` skill 作為統一入口；沿用 repo 工具與驗收邊界，按實際依賴配置並驗證。

環境失敗、憑證同步或最終驗收缺設定時，依 `docs/agents/environment-contract.md`「環境故障的執行閉環」以實際工具結果診斷、修復並續作；已授權來源依測試憑證指引完成同步與載入，不以口頭承諾或重複詢問取代執行。

實作與驗收需要設定時，已授權直接複製 dev `.env` 為暫用 `.env.test`；依 `.opencode/skills/test/references/test-env.md`「已授權的 dev 設定暫用方式」配置、禁止秘密輸出與 Git 提交，並於依賴驗收完成後刪除本任務副本。

`implement-spec` 啟動時完成 spec／跨 spec blocker／Git 基線的最小核對後，立即建立或核實 `<spec_name>-merge` integration worktree，再由主 agent 直接在其中產生、維護及提交唯一權威 `execution-state.md` 與 `test.md`。主 agent 的 OpenCode session 仍留在 `dev`，以明確路徑與 `workdir` 操作 integration。`setup-testing` 完成環境確認、前置實測與 `test.md` 後才放行產品實作。放行後以 integration 的 `test.md` 為測試基線；它不是通用操作授權清單，也不阻擋派工授權內的環境啟動／修復。方法缺漏依 `docs/agents/environment-contract.md` 自主修復並回報，文件由主 agent 唯一修訂；推送／發布／部署等操作另依明確任務授權判斷。路徑與提交時點依該契約「產生文件的 merge branch 快照」及 `docs/agents/subagent.md`「執行表與唯一寫入者」；最終版本供 integration review 核對。

所有 command／測試（含安裝、建置、環境操作及背景命令）依 `docs/agents/test-execution.md` 的共同執行上限：每次有期限，同一操作每輪最多 3 次含首次，時限依序為 T、2T、4T；成功即結束該輪，失敗先診斷及清理。新變更的必要驗證與失敗重試分開計算，輪次依該文件判定。

### Subagent 交接

執行 `implement-spec` 的 subagent 派工、回報與續作時，主 agent 與 subagent 都必須遵循 `docs/agents/subagent.md`。其他流程使用各自的交接規則。

### Spec 與 tickets 規劃及收尾

建立／修改 spec、拆分 tickets 或修正 TODO／驗收責任與依賴時，遵循 `docs/agents/spec-and-tickets.md`。Spec 定義產品需求，ticket TODO 定義程式碼交付；環境準備與共用執行流程由實作入口處理。Tickets 建立後由未參與撰寫的獨立子代理核對交付、修改邊界、依賴與驗收責任，再收尾提交。

### Worktree 隔離

每次建立 worktree（包含主 agent 與 subagent）都必須放在主 repo 的 `.worktree/<worktree-name>`。建立路徑的辨識與驗證遵循 `.opencode/skills/worktree/SKILL.md`；配置 Docker 隔離環境時亦遵循該 skill 的安全界線。
