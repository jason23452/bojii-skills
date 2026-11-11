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
| 接手未完成成果，尚無明確下一個任務 | `/project-handoff` |
| 單獨配置目前環境的測試方式 | `/test`，附測試範圍與環境限制 |
| 只要審查變更 | `/code-review <固定基準>`，附需求來源 |

Spec／tickets 僅記錄產品需求、程式碼 TODO、修改責任、依賴與驗收。啟動 `implement-spec` 後，先建立 `<spec_name>-merge` integration worktree，再由主 agent 建立主 repo 唯一可寫的 `execution-state.md`。`setup-testing` 追查測試需求與系統邊界、確認目標及操作範圍，產生並提交主 repo 執行權威 `test.md` 初稿後，才依稿執行 smoke；smoke 通過後更新並提交可放行版本。兩份文件的初版及後續重要更新都同步提交至 merge branch。環境就緒後才進行各票自動實作、測試、審查及整合。最終文件快照與驗收證據供最終審查及交付。使用者無需另行觸發 `setup-testing`，`implement-spec` 不重做另一套環境確認。完整雙軸 review 僅於明確要求時額外執行。

`ask-matt` 已改為 `bojii-guide`，`setup-matt-pocock-skills` 已改為 `setup-bojii-skills`。舊名稱保留轉向入口；更新時允許覆寫這些舊入口，避免繼續讀到舊流程。設定完成不代表產品環境已就緒，也不會先建立整套業務腳手架。

## 發布

推送符合 `vX.Y.Z` 的 tag（例如 `v0.1.0`）會觸發 GitHub Actions：執行測試、建立 skills pack、產生 SHA-256 checksum，並發布 GitHub Release。Tag 版本必須與根目錄 `package.json` 的版本一致。CLI 本身由 npx 從該 GitHub tag 直接執行，不發佈到 npm registry。
