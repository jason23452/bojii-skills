---
name: implement-spec
description: "依已確認的 spec 與 tickets 自主實作，持續完成全部 TODO、驗收、整合與收尾。"
disable-model-invocation: true
---

# Implement Spec

先讀專案 `AGENTS.md` 與其指向的執行規範。本套件的權威流程是 `docs/agents/implement-spec.md`，規劃契約見 `docs/agents/spec-and-tickets.md`，派工見 `docs/agents/subagent.md`；適用時先完整載入，不只依此摘要執行。

## 核心流程

1. 讀取整份 spec、全部 tickets、決策／研究／授權與準備紀錄。確認開工契約可直接執行；缺口在受影響產品實作前補齊，已定案內容沿用。
2. 建立完整 TODO／AC 責任對照與依賴圖，自動載入 `worktree` skill，依開工契約建立 integration 及票級 worktrees 與隔離環境；不需使用者另行呼叫。依權威流程的環境就緒門檻驗證後，才開始依賴該環境的工作。保留既有成果，核對 Git 基底，使用合併處理依賴。
3. 主對話留在使用者的 `dev` 工作區協調，依 `docs/agents/subagent.md` 的 Session 綁定規則將子代理移至票級 worktree；整合命令指定 `workdir`。對所有可獨立開工票指派單一 owner，能平行則背景執行。一次提供整票目標與驗收，透過 context pointers 傳遞資料。
4. Owner 使用 `tdd`，測試前讀取 `docs/agents/test-execution.md`，以有限時限及可追蹤輸出執行；逾時或中斷先診斷與清理再續作。自主完成產品、fixtures、排錯、重構及必要驗證，直到本票完整交付；不逐測試切換 Test／Green 代理。
5. 穩定交付由獨立 reviewer 檢查需求、實作及測試品質。問題交原 owner 修正，針對修正複查；證據符合版本與環境才通過。
6. 每次交付、審查或驗證回報後，執行 `docs/agents/subagent.md` 的排程迴圈：更新狀態、決定並實際執行下一動作。逐票合入 integration、跑回歸，通過後立即解鎖下游。
7. 全票完成後驗證全部 spec AC 與跨票整合；缺口轉為未完成修正項繼續執行。完成所有必要驗收、提交與約定收尾才結束。

## 連續執行

- 子代理完成一次呼叫或一張票不是整份任務完成。仍有 TODO 就派工／執行，背景工作完成後接續，無需使用者再次輸入本命令。
- 原範圍內的設計細節及排錯由 owner 決定。已知權限、產品決策與驗收在規劃完成；僅新的必要外部條件或契約矛盾升級，保持未完成狀態並推進其他工作。
- 流程未提供獨立規範的專案仍遵循上述單一 owner、獨立審查、逐票整合及全量完成原則；遠端推送／發布需使用者明確授權。
