# 開發語言

- 開發過程中的溝通、說明、文件與程式碼註解，請使用繁體中文。
- 程式碼中的識別字（例如變數、函式、類別名稱）及必要的技術術語可維持英文，並遵循專案既有慣例。

## Agent skills

### Grilling 互動提問

使用 `grilling`、`grill-me` 或 `grill-with-docs` 時，遵循互動式提問流程，並在訪談達成共識後更新相關領域文件。詳見 `docs/agents/grilling.md`。

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain docs layout. See `docs/agents/domain.md`.

### Implement-spec code review

使用 `implement-spec` 時遵循 repo 專屬流程。詳見 `docs/agents/implement-spec.md`。

### Subagent 交接

執行 `implement-spec` 的 subagent 派工、回報與續作時，主 agent 與 subagent 都必須遵循 `docs/agents/subagent.md`。其他流程使用各自的交接規則。

### Spec 與 tickets 規劃及收尾

建立／修改 spec、拆分 tickets 或修正 TODO／驗收責任與依賴時，遵循 `docs/agents/spec-and-tickets.md`；tickets 建立後須由未參與撰寫的獨立子代理盤查環境與完整實作的阻擋，提前確認待決事項，再收尾提交。

### Worktree 隔離

每次建立 worktree（包含主 agent 與 subagent）都必須放在主 repo 的 `.worktree/<worktree-name>`。建立路徑的辨識與驗證遵循 `.opencode/skills/worktree/SKILL.md`；配置 Docker 隔離環境時亦遵循該 skill 的安全界線。
