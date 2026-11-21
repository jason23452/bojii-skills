---
name: implement-spec
description: "依已確認的 spec 與 tickets 自主實作，持續完成全部 TODO、驗收、整合與收尾。"
disable-model-invocation: true
---

# Implement Spec

先讀專案 `AGENTS.md`、權威流程 `docs/agents/implement-spec.md` 與排程規則 `docs/agents/subagent.md`。下列是執行順序；細節以權威文件為準，分支指引在遇到對應情況時載入。

## 核心流程

1. **啟動即建立交付位置**：先核對 spec 身分、跨 spec blocker 與 `dev` Git 基線；未受阻即建立或核實 `<spec_name>-merge` integration worktree，直接在其中初始化並提交 `execution-state.md`。主 session 留在 dev，以明確路徑與 `workdir` 操作 integration。
2. **完整盤點與環境放行**：讀完整 spec、tickets、決策與研究，建立 TODO／AC、責任與成果依賴圖，更新 integration 執行表。再自動載入 `setup-testing`，直接在 integration 產生並提交 `test.md` 初稿、smoke 結果及後續重要狀態。取得就緒結果後才進入產品派工，不另自行確認一套環境；有缺項先留在該流程解除。
3. **整票派工**：主對話留在 dev；主 agent 派工前依權威流程的票級 SDD／TDD 選擇器判斷每票實作規模，並在派工中註明方法與理由。每票新建 owner，綁定票級 worktree，一次交付完整目標、邊界與驗收。所有可獨立開工票背景並行，同票續作 resume。
4. **Owner 自主交付**：依派工選定的方法完成實作；SDD 使用 `sdd` skill 依 ticket TODO／AC 開發，TDD 使用 `tdd` skill 以單元測試執行 test-first；兩者都以 `test` 完成必要驗證。普通失敗在 owner 內處理。主 agent 協調依賴與跨票問題，不逐步派工。
5. **審查與整合**：載入 `docs/agents/delivery-pipeline.md`，固定候選並行驗證與獨立審查；問題整批交原 owner 修正、原 reviewer 複查。證據匯合後整合、跑回歸、即時清理票級資源並解鎖下游。
6. **全量收尾**：全票整合後，主 agent 指定唯一 owner 依完整 spec／AC 在最終 integration 驗收階段實際新增或補齊所需的 Playwright E2E 測試、納入並固定候選後實跑；再定稿並提交 `test.md` 與 `execution-state.md`，完成獨立 integration review、PR 報告與約定收尾。TDD 的 Red → Green → Refactor 使用單元測試，Playwright E2E 不作為逐票 TDD 測試。實作期間以 integration 的 `test.md` 為共同基線，方法修復與邊界變更依環境契約「診斷與修訂」分流；reviewer 核對 branch 內兩份交付快照與工作檔的 hash／版本，精確版本與全部必要證據一致才回報完成。

## 分支入口

| 情況 | 處理入口 |
| --- | --- |
| 恢復中斷／搬移既有工作 | 先沿 ticket、`execution-state.md`／`test.md` 與 Git 證據續作；只有必要資訊缺漏或環境前置條件改變時使用 `project-handoff` |
| 缺少可信開發基線 | 權威流程「以真實先導票建立開發基線」 |
| 修正與重驗需要判斷授權 | 權威流程「授權沿用」 |
| 審查 finding、反覆修正或爭議 | `docs/agents/review-convergence.md`；預防措施依 `review-prevention.md` |
| 測試入口反覆卡關 | `docs/agents/environment-contract.md`「驗證入口的收斂」 |
| 局部受阻或需調整責任 | 權威流程第 6 節；變更票券責任依 `docs/agents/spec-and-tickets.md` |

## 持續排程

每次回報後依 `subagent.md` 選定並實際執行下一動作。有有效背景呼叫才等待；正式實作期間主 agent、owner 與 reviewer 不呼叫 `question` 工具，範圍內必要操作視為已同意並自主執行。真正缺少授權或必要輸入時，只暫停受影響操作、記錄並回報，其他無相依工作繼續。一次呼叫或單票結束不等於整份完成，也不需使用者再次輸入本命令。遠端推送／發布依使用者明確授權。
