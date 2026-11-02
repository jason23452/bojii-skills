---
name: implement-spec
description: "依已確認的 spec 與 tickets 自主實作，持續完成全部 TODO、驗收、整合與收尾。"
disable-model-invocation: true
---

# Implement Spec

先讀專案 `AGENTS.md` 與其指向的執行規範。本套件的權威流程是 `docs/agents/implement-spec.md`，規劃契約見 `docs/agents/spec-and-tickets.md`，派工見 `docs/agents/subagent.md`；適用時先完整載入，不只依此摘要執行。

## 核心流程

1. 讀取整份 spec、全部 tickets、決策與研究，核對程式碼交付、修改邊界及依賴。接手既有成果、恢復中斷或搬移環境時，依 `project-handoff` 核對續作基線；首次開發及正常新票派工直接核對交付契約，已定案內容沿用。
2. 根據完成的 TODO／AC 盤點工具、環境、資源與操作授權，方法、狀態與證據記入本機執行表，不回填 spec／ticket 的環境準備 TODO。自動載入 `worktree` skill，建立 integration 及票級隔離環境；依權威流程的就緒門檻放行相依工作。保留既有成果，核對 Git 基底，使用合併處理依賴。
   缺少本次開發路徑的可信基線時，依 `docs/agents/implement-spec.md` 的「以真實先導票建立開發基線」自主選現有真實票，隨交付補齊最小基礎；已有適用證據直接沿用，無相依票持續平行。
3. 主對話留在使用者的 `dev` 工作區協調，每票新建實作 subagent owner，依 `docs/agents/subagent.md` 綁定至獨立票級 worktree；整合命令指定 `workdir`。所有可獨立開工票以背景派工並行，同票續作 resume 原 owner。未派出的可執行票須有具體阻擋紀錄；工具不支援子代理時回報，不以主 agent 逐票代做。一次提供整票目標、修改範圍與驗收。
4. Owner 使用 `test` 統一選擇驗證入口與適用的 lint／typecheck／build，並使用 `tdd` 完成行為迴圈；執行遵循 `docs/agents/test-execution.md`，逾時或中斷先診斷與清理再續作。自主完成產品、fixtures、排錯、重構及必要驗證，直到本票完整交付；不逐測試切換 Test／Green 代理。
5. 穩定交付由新建的獨立 reviewer 檢查需求、實作及測試品質。問題交原 owner 修正；發現缺陷時依 `docs/agents/review-prevention.md` 自主完成根因預防判定與適用措施，不逐項詢問使用者。修正迴圈依 `docs/agents/review-convergence.md` 追蹤停滯並自主診斷／裁決。預設由原 reviewer 複查；新視角審查與同票換新依 `docs/agents/session-lifecycle.md`，證據符合版本與環境才通過。
6. 每次交付、審查或驗證回報後，執行 `docs/agents/subagent.md` 的排程迴圈：更新狀態、決定並實際執行下一動作。整票合入 integration 且回歸通過後，立即依權威流程的「票級即時清理」保存證據並移除本票 worktree／專屬執行資源，不等全部票完成。局部受阻時依部分交付門檻整合可分離成果並解鎖下游；原票保留未完成責任與續作必要資源。
7. 全票整合後固定 PR base／integration head，驗證全部 spec AC 與跨票整合，並依權威流程派獨立 reviewer 完成最終 integration review。缺口交 owner 修正、重驗與複查；兩者通過才產生可發布 PR 報告及收尾。發布或更新 PR 前確認 base／head 與通過版本一致，變更時重驗並複查。

## 連續執行

交付時載入 `docs/agents/delivery-pipeline.md`：固定候選 base／head 後並行必要驗證與唯讀審查，兩者匯合才放行；基線變動依影響同步，實際合併結果另驗證。增量檢查與快取經 `test` 的對應指引判定。

- 子代理完成一次呼叫或一張票不是整份任務完成。仍有 TODO 就派工／執行，背景工作完成後接續，無需使用者再次輸入本命令。
- 原範圍內的設計細節及排錯由 owner 決定。新阻擋立即記錄到具體成果／驗收，先完成所有可自主推進工作，再依權威流程集中請使用者補充必要條件；取得輸入後重驗並恢復對應工作，不降低驗收或假稱整票完成。
- 流程未提供獨立規範的專案仍遵循上述單一 owner、獨立審查、逐票整合及全量完成原則；遠端推送／發布需使用者明確授權。
