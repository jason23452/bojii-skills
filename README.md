# bojii-skills

本 repo 發布 OpenCode skills 與專案指引，包含 `AGENTS.md`、`docs/` 和 `.opencode/`。CLI 可將指定 GitHub Release 的內容安裝或更新到目前專案或 OpenCode 全域設定。

## 下載與使用

需求：Node.js 20+、npm/npx、Git 與 `tar`。

預設取得最新已發布 tag，透過 npx 從公開 GitHub repo 執行 CLI：

```sh
TAG=$(gh release view --repo jason23452/bojii-skills --json tagName --jq .tagName)
npx --yes --package="github:jason23452/bojii-skills#${TAG}" -- bojii-skills update --version "$TAG"
```

要固定使用特定版本時，將 tag 同時指定在 package spec 與 `--version`：

```sh
npx --yes --package="github:jason23452/bojii-skills#v0.1.0" -- bojii-skills update --version v0.1.0
```

預設更新目前 Git 專案。使用 `--global` 更新到 `~/.config/opencode/`，或使用 `--project-dir <path>` 指定專案：

```sh
npx --yes --package="github:jason23452/bojii-skills#${TAG}" -- bojii-skills update --global --version "$TAG"
npx --yes --package="github:jason23452/bojii-skills#${TAG}" -- bojii-skills update --project-dir C:/path/to/project --version "$TAG"
npx --yes --package="github:jason23452/bojii-skills#${TAG}" -- bojii-skills update --version v0.1.0
```

若目的端有同路徑但內容不同的檔案，CLI 會列出並詢問是否覆寫；`--yes` 可略過確認。已移除的舊檔案不會自動刪除。

安裝採逐檔合併，既有 `.opencode/skills/` 中的其他 skills 與同一 skill 內安裝包未包含的額外檔案都會保留；全域安裝也適用。

## 如何開始

安裝後，在 agent 對話中使用以下 skills（不是終端機命令）：

| 情境 | 起點 |
| --- | --- |
| 不知道下一步 | `/bojii-guide`，附上目標與目前成果 |
| 首次配置專案 | `/setup-bojii-skills`；已有配置只補缺項 |
| 想法尚未釐清 | `/grill-with-docs` → `/to-spec` → `/to-tickets` |
| Spec／tickets 已完成規劃審查 | `/implement-spec .scratch/<feature>/spec.md`；先建立 merge worktree 並提交執行表初始快照；`setup-testing` 確認目標後提交 `test.md` 草稿，smoke 通過後提交放行版，再開始實作 |
| 已完成實作，使用者明確要求合併至 `dev` | `/merge`；只合併使用者指定的來源。TODO 完成或標示「可合併」不會自動合併 |
| 需要把未完成成果交給新 session | 核對 repo 權威紀錄後使用 `/handoff` 產生可攜交接摘要 |
| 單獨配置目前環境的測試方式 | `/test`，附測試範圍與環境限制 |
| 只要審查變更 | `/code-review <固定基準>`，附需求來源 |

Spec／tickets 僅記錄產品需求、程式碼 TODO、修改責任、依賴與驗收。`implement-spec` 啟動時完成最小核對即建立 `<spec_name>-merge`，主 agent 直接在其中產生、維護及提交 `execution-state.md` 與 `test.md`；主 session 仍留在 `dev`。自動執行 `setup-testing` 並通過環境驗證後，才進行各票實作、審查及整合。文件路徑、提交節點與舊流程遷移以 [環境契約](docs/agents/environment-contract.md#產生文件的-merge-branch-快照) 為準；完整流程見 [implement-spec](docs/agents/implement-spec.md)。完整雙軸 review 僅於明確要求時額外執行。

`ask-matt` 已改為 `bojii-guide`，`setup-matt-pocock-skills` 已改為 `setup-bojii-skills`。舊名稱保留轉向入口；更新時允許覆寫這些舊入口，避免繼續讀到舊流程。設定完成不代表產品環境已就緒，也不會先建立整套業務腳手架。

## 發布

推送符合 `vX.Y.Z` 的 tag（例如 `v0.1.0`）會觸發 GitHub Actions：執行測試、建立 skills pack、產生 SHA-256 checksum，並發布 GitHub Release。Tag 版本必須與根目錄 `package.json` 的版本一致。CLI 本身由 npx 從該 GitHub tag 直接執行，不發佈到 npm registry。
