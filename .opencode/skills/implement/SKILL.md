---
name: implement
description: "實作單一獨立任務；整份 spec、多票或需跨票協調的工作使用 implement-spec。"
disable-model-invocation: true
---

# Implement

先讀 `AGENTS.md` 與任務來源。本入口僅處理無跨票協調需求的單一獨立任務；若輸入為整份 spec、整組 tickets，或該票屬於進行中的多票批次，交回 `/implement-spec <路徑>`，不在本入口逐票實作。該流程的派工、隔離與整合規則見 `docs/agents/implement-spec.md`。

1. 使用者提供 ticket 時，依 tracker 讀取並說明票名；引用有歧義才詢問。核對範圍與驗收，不將共用執行流程加入產品 TODO。
2. 根據實作 TODO／驗收查 repo，檢查所需環境、有效設定與操作授權，依 `docs/agents/environment-contract.md` 準備並驗證實際依賴；準備狀態另記執行紀錄，不改寫 spec／tickets。
3. 使用 `tdd` 完成適用的行為迴圈，以 `test` 選擇必要檢查；純文件變更採適當替代檢查。
4. 完成後使用 `code-review` 審查固定基準的變更，修正阻擋問題並重驗受影響範圍。
5. 核對實際分支與 staged diff，只提交本次交付；沿用專案要求的隔離與提交規則，不直接提交未知工作分支。
