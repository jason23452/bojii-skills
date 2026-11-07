---
name: implement-spec
description: "依已確認的 spec 與 tickets 自主實作，持續完成全部 TODO、驗收、整合與收尾。"
disable-model-invocation: true
---

# Implement Spec

先讀專案 `AGENTS.md`、權威流程 `docs/agents/implement-spec.md` 與排程規則 `docs/agents/subagent.md`。下列是執行順序；細節以權威文件為準，分支指引在遇到對應情況時載入。

## 核心流程

1. **核對任務**：讀完整 spec、tickets、決策與研究，建立 TODO／AC、責任與成果依賴圖。
2. **準備環境**：從驗收推導必要資源，依 `docs/agents/environment-contract.md`「環境自主處理」自行準備、修復與重驗，記入本機執行表；載入 `worktree` 建立 integration／票級隔離環境，依就緒證據放行相依工作。
3. **整票派工**：主對話留在 dev；每票新建 owner，綁定票級 worktree，一次交付完整目標、邊界與驗收。所有可獨立開工票背景並行，同票續作 resume。
4. **Owner 自主交付**：使用 `test`、`tdd` 完成實作、fixtures、排錯與驗證；普通失敗在 owner 內處理。主 agent 協調依賴與跨票問題，不逐測試派工。
5. **審查與整合**：載入 `docs/agents/delivery-pipeline.md`，固定候選並行驗證與獨立審查；問題整批交原 owner 修正、原 reviewer 複查。證據匯合後整合、跑回歸、即時清理票級資源並解鎖下游。
6. **全量收尾**：全票整合後完成 spec／跨票驗證及獨立 integration review，再產生 PR 交付報告與約定收尾；精確版本與全部必要證據一致才回報完成。

## 分支入口

| 情況 | 處理入口 |
| --- | --- |
| 恢復中斷／搬移既有工作 | `project-handoff`：核對目前規則、原始授權與實際執行狀態 |
| 缺少可信開發基線 | 權威流程「以真實先導票建立開發基線」 |
| 修正與重驗需要判斷授權 | 權威流程「授權沿用」 |
| 審查 finding、反覆修正或爭議 | `docs/agents/review-convergence.md`；預防措施依 `review-prevention.md` |
| 測試入口反覆卡關 | `docs/agents/environment-contract.md`「驗證入口的收斂」 |
| 局部受阻或需調整責任 | 權威流程第 6 節；變更票券責任依 `docs/agents/spec-and-tickets.md` |

## 持續排程

每次回報後依 `subagent.md` 選定並實際執行下一動作。有有效背景呼叫才等待；全部可推進工作用盡才集中詢問必要外部輸入。一次呼叫或單票結束不等於整份完成，也不需使用者再次輸入本命令。遠端推送／發布依使用者明確授權。
