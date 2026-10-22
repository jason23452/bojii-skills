# Implement-spec 流程

## 開工前確認阻擋

- 開始實作前，先完整閱讀 spec 與所有 tickets，並檢查 repo、工具及目前可用的環境設定，確認整份 spec 是否有阻擋因素。
- 阻擋因素包括缺少必要的環境參數、憑證或存取權、依賴或工具、必要輸入資料，以及尚未決定且會影響實作方向的需求。
- 不得猜測或以臨時假設掩蓋阻擋因素。先列出所有已知阻擋及其影響，透過互動式 `question` 工具向使用者確認需要的資訊或決策；不要要求使用者在對話中貼出秘密憑證。
- 確認阻擋已排除後再開始完整實作。若沒有阻擋，直接進入實作，不要為了形式多加確認。
- 實作途中若發現新的阻擋，立即說明受影響範圍與所需資訊；在可行範圍內繼續不受阻擋的工作，待阻擋解除後完成剩餘部分。

## 完整實作

- 目標是完成整份 spec 及其所有 tickets，不只完成部分票券或留下未實作項目。持續處理可解鎖的工作，直到整份 spec 完成；若仍有阻擋，清楚列出未完成項目及原因。
- integration/合併 worktree 固定命名為 `<spec_name>-merge`；`<spec_name>` 使用 spec 的名稱，並轉成適合 worktree 名稱的格式。
- 每張 ticket 的實作 worktree 固定命名為 `<spec_name>-tickets-<number>`；`<number>` 使用 issue tracker 中該 ticket 的編號。
- 按專案慣例執行相關測試與驗證，並依 `implement-spec` 原有流程完成整合、票券收尾及回報。
- 全部 tickets 完成並確認變更已合併後，刪除各 ticket/implementer 使用的 worktree；只保留包含完整合併結果的 integration worktree。刪除前確認沒有未合併工作或使用者變更。
- 刪除 ticket worktree 時，同步清理專屬於該 worktree 隔離環境的 Docker 資源：停止並刪除容器、刪除專屬 volumes 與 images，並釋放容器所佔用的 ports。先用名稱、labels 或其他明確關聯確認資源歸屬；不得刪除其他 worktree、專案共用或使用者既有的資源。若無法確認資源是否專屬，先保留並詢問使用者。

## PR HTML 文件

- 通過下方 PR 發送條件後，在最終合併的 `<spec_name>-merge` worktree 中建立 `pr/<識別碼>.html`，讓文件隨實作一起進入合併分支；不要只放在不會合併的 implementer worktree。
- `<識別碼>` 使用對應的 PR 編號；若尚未建立 PR，使用 spec 或主要 ticket 的識別碼，不要虛構編號。
- 使用 `pr` skill 的內容架構撰寫 HTML：Summary、Evidence、Merge Danger。摘要使用適合變更的視圖；Evidence 記錄實際的前後驗證結果；Merge Danger 說明可逆性與影響範圍。HTML 必須有效，不能只把 Markdown 原文存成 `.html`。
- 只填入已知且可驗證的內容；尚未取得的前後證據或資訊要明確標示，不得捏造。

## PR 發送條件

- 只有在所有 tickets 都已實作完成、變更都已合併至 `<spec_name>-merge`，且所有 ticket worktree 與其專屬隔離環境資源（containers、images、volumes、ports）都已清理後，才可建立或發送 PR；不得提前建立 draft PR。
- PR 建立後，確認平台的合併狀態、必要檢查與衝突狀態，再將 PR 標註為目前可以合併。若任何條件未通過或無法確認，明確回報阻擋原因，不得標註為可合併。

## Code review

使用 `implement-spec` 完成實作後，不要自動呼叫 `code-review`；是否執行 code review 由使用者決定。
