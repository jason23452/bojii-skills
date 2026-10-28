---
name: update-skills
description: 使用 GitHub 公開 repo 的 npx CLI 更新目前專案的 skills，預設採最新 tag，也可指定版本。
disable-model-invocation: true
---

使用 GitHub 公開 repo 的 npx CLI 更新目前專案的 skill 套件，預設採用最新已發布 tag，也接受使用者指定版本。成功更新後，必須透過互動式 `question` 詢問使用者是否要 commit；不得改用 repo 本機原始碼代替公開 CLI，也不得自行推送遠端。

## 流程

1. 確認目前專案根目錄與 Git 狀態；記錄更新前已修改、已 staged 或未追蹤的檔案，避免把既有工作納入此次 commit。
2. 若使用者指定版本，使用該 tag；否則從公開 GitHub Release 解析最新 tag（可使用 `gh release view --repo jason23452/bojii-skills --json tagName --jq .tagName`；若沒有 `gh`，使用 GitHub 公開 Releases API）。若指定 tag 或 latest tag 沒有已發布 Release，停止並回報。
3. 使用選定 tag 從 GitHub 公開 repo 透過 npx 執行 CLI。OpenCode 的 shell 通常不是互動式終端，必須傳入 CLI 的 `--yes`，否則遇到既有檔案時會因無法讀取覆寫確認而中止：`npx --yes --package=github:jason23452/bojii-skills#<tag> -- bojii-skills update --project-dir <目前專案根目錄> --version <tag> --yes`。執行前已記錄 Git 狀態，執行後列出實際覆寫與新增檔案；`--yes` 只授權本次 skills 更新覆寫同路徑檔案，不得刪除 payload 未包含的舊檔案。預設永遠使用最新已發布 tag；只有使用者指定時才使用其他 tag。不要改用 npm registry、GitHub CLI tarball、repo 本機 CLI 原始碼或 `--global`。
4. 若 npx/GitHub 下載失敗、tag 無效或 CLI 的 payload checksum 驗證失敗，停止並回報，不 fallback 到其他來源。若使用者取消更新，回報結果，不進入 commit 詢問。
5. 更新成功後，列出更新版本及本次實際變更檔案；即使沒有檔案變更，也照常用 OpenCode 互動式 `question` 詢問使用者是否要 commit。建議選項置於第一個並標示「（建議）」；選項為「Commit 本次更新」與「不 commit」。
6. 若使用者選擇不 commit，不建立 commit，回報工作目錄狀態。若選擇 commit，只提交此次更新造成且更新前沒有既有修改的檔案；保留所有更新前已修改、已 staged 或未追蹤的工作。Commit message 使用 repo 慣例並包含更新版本。
7. 若沒有可安全獨立提交的更新檔案，或 CLI 的變更與更新前工作無法可靠區分，不要冒險 commit；說明原因並保留現況。任何情況都不得推送 worktree 或 branch 至遠端。

## 完成條件

- CLI 更新成功或明確回報失敗/取消。
- 非互動 shell 的更新不得因等待覆寫輸入而失敗；使用 `--yes` 後仍須回報更新前後差異。
- 更新成功後已透過互動式 `question` 取得使用者的 commit 決定。
- 若同意 commit，commit 僅包含可確認由此次更新產生的檔案；無遠端 push。
