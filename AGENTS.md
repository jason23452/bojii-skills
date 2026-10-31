# 開發語言

- 開發過程中的溝通、說明、文件與程式碼註解，請使用繁體中文。
- 程式碼中的識別字（例如變數、函式、類別名稱）及必要的技術術語可維持英文，並遵循專案既有慣例。

## Agent skills

### Grilling 互動提問

使用 `grilling`、`grill-me` 或 `grill-with-docs` 時，先完成影響方案與拆票的可行性研究，再確認實作共識並更新領域文件。調查、必要實驗與未解事項門檻見 `docs/agents/grilling.md`。

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.

### Implement-spec 整票自主交付

使用 `implement-spec` 時，依 `docs/agents/implement-spec.md` 核對開工契約，自動載入 `worktree` skill 建立並驗證隔離環境，再由單一 owner 自主完成每票 TDD、排錯與驗收，獨立票級審查後逐票整合；全部 TODO、驗收及收尾完成才結束。

### 專案接手

接手既有成果、恢復中斷任務或將既有工作移至另一環境時，使用 `project-handoff` skill；從零開發、首次建環境及正常新票派工沿用一般開工流程。觸發判定與遺留依賴盤點見該 skill。

### 測試與靜態檢查

配置 `.env.test` 測試參數，或規劃／執行測試、lint、typecheck、build 時，使用 `test` skill 作為統一入口；沿用 repo 工具與驗收邊界，按需載入環境配置與工具指引。

### Subagent 交接

執行 `implement-spec` 的 subagent 派工、回報與續作時，主 agent 與 subagent 都必須遵循 `docs/agents/subagent.md`。其他流程使用各自的交接規則。

### Spec 與 tickets 規劃及收尾

建立／修改 spec、拆分 tickets 或修正 TODO／驗收責任與依賴時，遵循 `docs/agents/spec-and-tickets.md`；tickets 建立後須由未參與撰寫的獨立子代理盤查環境與完整實作的阻擋，提前確認待決事項，再收尾提交。

### Worktree 隔離

每次建立 worktree（包含主 agent 與 subagent）都必須放在主 repo 的 `.worktree/<worktree-name>`。建立路徑的辨識與驗證遵循 `.opencode/skills/worktree/SKILL.md`；配置 Docker 隔離環境時亦遵循該 skill 的安全界線。
