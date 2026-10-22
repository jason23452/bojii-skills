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

## 發布

推送符合 `vX.Y.Z` 的 tag（例如 `v0.1.0`）會觸發 GitHub Actions：執行測試、建立 skills pack、產生 SHA-256 checksum，並發布 GitHub Release。Tag 版本必須與根目錄 `package.json` 的版本一致。CLI 本身由 npx 從該 GitHub tag 直接執行，不發佈到 npm registry。
