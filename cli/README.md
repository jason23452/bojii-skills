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
