---
name: to-spec
description: "將已討論的需求、決策與研究整理成可驗收 spec，供後續拆票。"
disable-model-invocation: true
---

# To Spec

將既有對話與 codebase 理解整理成規格。先讀專案 `AGENTS.md`、tracker 與 `docs/agents/spec-and-tickets.md`（存在時）；以該規劃契約為準。沿用 glossary、ADR 與已確認研究，不重開完整訪談。

## 流程

1. 核對使用者問題、已定案範圍、正常／失敗／例外及版本限制；只查缺少或已變動的事實。
2. 為產品行為建立穩定 AC，指明可觀察結果、權限／資料政策與必要驗收環境。
3. 沿用或確認測試邊界，依局部、元件、API／契約與真實 runtime／E2E 分層；選能證明行為的最小邊界，避免把全部案例推到最高層。
4. 整理決策、操作授權、必要準備與研究證據。缺少產品決策或權限時，用 `question` 精準補齊；一般實作細節留給 owner。關鍵方案尚未證實者標明規劃缺口。
5. 撰寫 spec、完成獨立審查與必要複查，依專案規則提交。若同時要求 tickets，形成兩者後統一審查與確認；只要求 spec 時，票級開工推演標待拆票。

## Spec 內容

- **Problem Statement／Solution**：使用者問題與預期成果。
- **User Stories／AC**：涵蓋全部已確認需求，正常與必要例外可驗證，避免為篇幅重複列舉。
- **Implementation Decisions**：公開契約、重要取捨、相容性、已驗證版本及決策來源；引用權威文件，不寫逐函式實作指令。
- **Testing Decisions**：情境、測試層級、先例、實際環境與通過條件。
- **開工準備與授權**：操作範圍、必要資源、已知恢復方式、準備責任與未解項目。
- **Out of Scope／Further Notes**：明確界線、研究與 ADR 連結、後續承接。

狀態依實際缺口與 tracker 分流規則判定，不一律標成可完整開工。原型片段只有在精準表達已確認契約時才保留，並註明來源及限制。
