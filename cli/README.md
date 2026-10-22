# bojii-skills CLI

Node.js CLI 透過公開 GitHub repo 執行，用來安裝/更新本 repo 的 `AGENTS.md`、`docs/` 與 `.opencode/`。CLI 從 GitHub Releases 下載並驗證 skills pack。

需求：Node.js 20+、npm/npx、Git，以及系統可執行 `tar`。

## 使用方式

預設使用最新已發布 tag；先從 GitHub Releases 取得 tag，再透過 npx 從該 tag 執行 CLI：

```sh
TAG=$(gh release view --repo jason23452/bojii-skills --json tagName --jq .tagName)
npx --yes --package="github:jason23452/bojii-skills#${TAG}" -- bojii-skills update --version "${TAG}"
```

指定版本時，package spec 與 `--version` 使用相同 tag：

```sh
npx --yes --package="github:jason23452/bojii-skills#v0.1.0" -- bojii-skills update --version v0.1.0
```

命令：

```sh
npx --yes --package="github:jason23452/bojii-skills#<tag>" -- bojii-skills install [--global | --project-dir <path>] --version <tag> [--yes]
npx --yes --package="github:jason23452/bojii-skills#<tag>" -- bojii-skills update  [--global | --project-dir <path>] --version <tag> [--yes]
npx --yes --package="github:jason23452/bojii-skills#<tag>" -- bojii-skills version
```

- 預設安裝到目前 Git 專案根目錄；`--project-dir` 可指定其他專案路徑。
- `--global` 安裝到 `~/.config/opencode/`，將 `.opencode/` 內容映射到全域設定根目錄。
- 預設下載最新 GitHub Release；`--version vX.Y.Z` 可指定版本。
- 遇到同路徑但內容不同的檔案會列出並詢問是否覆寫。`--yes` 可直接覆寫，請只在確定時使用。
- 相同內容不重寫；Release 中已刪除的舊檔案不會自動移除。

目前 Release 來源固定為 `jason23452/bojii-skills`。

## 與既有 skills 共存

安裝採逐檔合併，不會清空或替換整個 `.opencode/` 或 `skills/` 目錄：

- 既有的其他 skills、設定檔，以及同一 skill 內安裝包未包含的額外檔案都會保留。
- 同路徑且內容相同的檔案不重寫；內容不同時會列出衝突並詢問是否覆寫。
- `--yes` 只略過覆寫確認，不會刪除其他檔案；取消確認則不修改目的端。
- 全域安裝的 `~/.config/opencode/skills/` 也遵循相同規則。

例如專案已有 `.opencode/skills/my-skill/SKILL.md`，安裝包新增 `.opencode/skills/grilling/SKILL.md` 後，兩個 skills 都會存在。

## 開發與驗證

執行 `npm test` 可驗證指令入口、參數解析、Release 下載與 checksum、解壓及安裝流程。測試使用本機產生的壓縮檔與模擬 HTTP 回應，不需要連線 GitHub；環境仍需提供 `tar`。

- `cli/src/cli.mjs`：指令入口、終端輸出與覆寫確認。
- `cli/src/arguments.mjs`：解析及驗證參數。
- `cli/src/release.mjs`：下載、checksum 驗證與解壓，下載逾時為 120 秒。
- `cli/src/install.mjs`：目標目錄、衝突預檢、檔案複製與暫存清理。
- `cli/src/files.mjs`、`cli/src/paths.mjs`：檔案操作與安裝路徑驗證。

下載採串流寫入；任一下載失敗時，會等待其他下載結束再清理暫存目錄。所有目的端路徑會先檢查衝突與檔案類型，確認覆寫後才開始複製。
