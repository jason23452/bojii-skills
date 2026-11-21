---
name: merge
description: 使用者明確要求時，依指定範圍合併已標註可合併的 `<spec_name>-merge` worktree。
disable-model-invocation: true
---

只有使用者明確要求將來源合併至本地 `dev` 時才執行本 skill。TODO／AC 完成、來源標註「可合併」、PR 報告存在或 `implement-spec` 收尾，都不是合併授權；未收到明確要求時停止於待合併狀態，不主動詢問或合併。使用者已明確要求但來源範圍不清楚時，依流程詢問並等候確認。`main` 分支由使用者自行合併；本 skill 不合併或推送至 `main`。

## 流程

1. 閱讀根目錄 `AGENTS.md` 與 `docs/agents/implement-spec.md`，遵循 worktree 命名、完成條件與 repo 安全規則。
2. 使用 `git worktree list` 盤點 worktree。候選來源必須符合 `<spec_name>-merge` 命名，並有對應的 spec/PR 或其他明確資料確認已完成實作、tickets 已整合、票級隔離環境已清理、PR 交付報告存在且可讀，並已標註「可合併」。這些條件只代表來源具備候選資格，不代表使用者已授權合併；只處理使用者明確要求涵蓋的來源。來源 integration worktree 的資源須能依執行表確認歸屬，於本流程最後清理。名稱符合不等於已就緒；無法驗證的候選不得合併。
3. 將本地 `dev` 作為唯一預設目標，確認承載 `dev` 的 worktree。若本地 `dev` 分支或其 worktree 不存在、或來源/「可合併」狀態有歧義，使用 OpenCode 互動式 `question` 工具釐清；不要自行改用 `main` 或其他分支。
4. 列出將合併的來源、目標 `dev` 與任何排除項目；僅在使用者已明確要求合併、但其請求未能明確涵蓋來源範圍時，才透過 OpenCode 互動式 `question` 工具確認。不得因有其他「可合併」候選而擴大範圍。檢查 `dev` worktree：只容許本次來源對應的 `pr/<識別碼>.html` 報告檔為未提交變更，且須確認報告與來源一一對應、來源分支不會覆寫報告路徑；其他任何變更或歸屬不明的報告先釐清，不覆蓋、不混入提交。
5. 在目標 worktree 中一次合併一個已確認來源分支，依序保留可追溯的 merge commits。每次合併前確認來源 worktree 沒有未提交變更，且來源分支包含的提交仍可合併。
6. 每次合併後執行 repo 指定或受影響範圍的驗證。遇到衝突時，暫停後續合併，檢查衝突檔案、來源 `<spec_name>-merge` worktree 對應的 spec/tickets，以及目標分支相關文件與程式碼，釐清雙方原本要保留的行為。
7. 根據調查結果整理可行的解衝突方法、各自影響與建議，透過 OpenCode 互動式 `question` 工具交由使用者決策；收到決策前不要自行選擇或套用解法。依使用者決策解決衝突並執行驗證，通過後才繼續合併其餘來源。若驗證失敗或仍有歧義，再整理原因與選項請使用者決定。
8. 確認本次納入的所有來源都已成功合併至 `dev` 且各次驗證通過後，完成 spec 解鎖與追蹤文件提交，再開始來源清理：
   - 將本次成功合併的來源視為已完成 spec，掃描 `.scratch/**/spec.md` 的 spec-level `Blocked by`。只移除明確指向這些已完成 spec 的依賴；其他未完成 blocker 保留。若某 spec 沒有剩餘 blocker，改為 `Blocked by: 無`；保留其 `Status`，不自動啟動其 `implement-spec`。
   - 核對每個成功來源對應的 PR 報告內容及最終審查證據，將報告與實際更新的下游 spec 路徑一併用明確 `git add -- <paths>` 加入 `dev` 的單一文件提交（例如 `docs: 提交 PR 報告並解除已完成 spec 的阻擋`）。不使用 `git add -A`；已提交的報告不重複提交，沒有 blocker 更新時只提交報告。
   - 若來源缺少報告、報告證據不符、`Blocked by` 歸屬不明或文件提交失敗，暫停後續清理並補齊／釐清。若合併或驗證中途受阻，保留來源 worktree、branch、資源及未提交文件，先處理阻擋。
9. 對本次成功合併的每個來源，先依 `git worktree list --porcelain` 記錄 worktree 的精確絕對路徑與其 `refs/heads` 本地 branch，再依來源 `execution-state.md`／`test.md` 核對專屬程序、containers、network、volume、image tag 及 ports：只停止／移除明確屬於該來源的程序和資源，釋放其 ports；保留 `dev`、其他 worktree、共用 image layers/build cache、使用者資料及歸屬不明的資源。使用 `git worktree remove` 移除來源後，分別確認該路徑已不在 `git worktree list --porcelain` 中，且磁碟上的精確目錄也已不存在（Windows 用 `Test-Path -LiteralPath $worktreePath` 確認為 `False`；POSIX 用 `test ! -e "$worktree_path"` 確認成功）。若 Git 登錄已移除但目錄仍存在，依 worktree skill 核實路徑位於主 repo 的 `.worktree` 內、不是任何已登錄 worktree，並檢查殘留內容確屬該來源；只有歸屬明確且沒有使用者／未知資料時，才刪除該精確目錄，不刪 `.worktree` 父目錄、不用廣域清理或 `--force`。歸屬不明或含未知內容時停止並回報，不刪 branch。確認磁碟路徑不存在後，才從 `dev` worktree 對記錄的來源 branch 執行 `git branch -d -- <branch>`；不使用 `-D`，不刪除遠端 branch。若 branch／worktree 仍被使用或安全刪除遭拒，停止該項清理並排錯，不強制移除。
10. 重查本次來源的專屬程序／containers／network／volume／image tag 已清理、ports 已釋放、worktree 路徑不在 Git 登錄且磁碟目錄不存在、本地 branch 均已移除；記錄無法清理項目及原因後，回報目標分支、成功合併／未合併來源、驗證結果與逐來源清理結果。若 branch 已刪但實體目錄仍殘留，清理仍視為未完成；只可依已記錄的精確路徑及來源歸屬檢查後移除，無法確認時保留並回報。未納入本次確認範圍或未成功合併的來源不清理。

## 安全界線

- 不合併未標註可合併、未完成驗證、工作目錄不乾淨或狀態無法確認的來源。
- 本 skill 的合併只在本地 `dev` 分支進行，不執行遠端推送或將 `dev` 合併至 `main`。使用者另行明確要求發布時，交由 implement-spec 的 PR 門檻與授權規則處理；本地 merge 結果是新候選，不能直接沿用來源 integration 的舊審查結論。
- 不在來源 worktree 直接改寫或重置分支；所有整合作業都在目標 worktree 完成。只在全部確認來源成功合併及驗證後，依流程移除來源 integration worktree 的 Git 登錄、磁碟實體目錄、本地 branch 與專屬資源；Git 登錄或 branch 消失不能代替實體目錄不存在的檢查。
- 不使用會覆蓋或丟棄未提交工作的操作。遇到未知狀態先停下並釐清。
