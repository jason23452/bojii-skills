---
name: merge
description: 合併多個已標註可合併的 `<spec_name>-merge` worktree。
disable-model-invocation: true
---

負責將使用者指定或已確認可合併的多個 spec integration worktree 依序整合至指定目標分支。合併前先確認來源與目標，不從 worktree 名稱推定內容已就緒。

## 流程

1. 閱讀根目錄 `AGENTS.md` 與 `docs/agents/implement-spec.md`，遵循 worktree 命名、完成條件與 repo 安全規則。
2. 使用 `git worktree list` 盤點 worktree。候選來源必須符合 `<spec_name>-merge` 命名，並有對應的 spec/PR 或其他明確資料確認已完成實作、tickets 已整合、隔離環境已清理且已標註「可合併」。名稱符合不等於已就緒；無法驗證的候選不得合併。
3. 確認目標分支及其 worktree。若使用者未指定目標，或候選來源/「可合併」狀態有歧義，使用 OpenCode 互動式 `question` 工具詢問；不要以一般文字提問或自行猜測目標。
4. 確認目標 worktree 位於目標分支且工作目錄乾淨。列出將合併的來源、目標分支與任何排除項目；若使用者的請求未能明確涵蓋這批來源，先透過互動式 `question` 工具確認範圍。
5. 在目標 worktree 中一次合併一個已確認來源分支，依序保留可追溯的 merge commits。每次合併前確認來源 worktree 沒有未提交變更，且來源分支包含的提交仍可合併。
6. 每次合併後執行 repo 指定或受影響範圍的驗證。遇到衝突時，暫停後續合併，檢查衝突檔案、來源 `<spec_name>-merge` worktree 對應的 spec/tickets，以及目標分支相關文件與程式碼，釐清雙方原本要保留的行為。
7. 根據調查結果整理可行的解衝突方法、各自影響與建議，透過 OpenCode 互動式 `question` 工具交由使用者決策；收到決策前不要自行選擇或套用解法。依使用者決策解決衝突並執行驗證，通過後才繼續合併其餘來源。若驗證失敗或仍有歧義，再整理原因與選項請使用者決定。
8. 完成後回報目標分支、成功合併的來源、未合併的來源及原因、驗證結果。除非使用者明確要求，不刪除來源 `<spec_name>-merge` worktree 或其資源。

## 安全界線

- 不合併未標註可合併、未完成驗證、工作目錄不乾淨或狀態無法確認的來源。
- 不在來源 worktree 直接改寫或重置分支；所有整合作業都在目標 worktree 完成。
- 不使用會覆蓋或丟棄未提交工作的操作。遇到未知狀態先停下並釐清。
