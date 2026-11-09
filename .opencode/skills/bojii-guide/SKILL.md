---
name: bojii-guide
description: "bojii-skills 使用導覽：依目前專案與任務狀態，說明如何開始及下一個適用流程。"
disable-model-invocation: true
---

# bojii-skills：如何開始

先讀專案 `AGENTS.md`／`CLAUDE.md` 與現有任務，再讀準備推薦的 skill。此文件是導覽，實際執行以各 skill 與其權威規範為準。依使用者已提供的狀態直接選路；只有無法判斷目標時才詢問，不要求重述已確認需求。

## 選擇起點

| 現在的情況 | 下一步 |
| --- | --- |
| 首次使用，尚未配置 tracker／領域文件指引 | `/setup-bojii-skills`；已有設定沿用，只補缺項 |
| 不知道該從哪裡開始 | 說明目前 repo、目標與已完成成果，本導覽給出下一個可執行指令 |
| 有想法，需求與方案尚未確認 | 有 repo 用 `/grill-with-docs`；無工作目錄用 `/grill-me` |
| 接手未完成成果、恢復中斷或搬移既有工作環境 | `/project-handoff` 核對基線；已有 spec／tickets 可直接 `/implement-spec`，由其自動判斷接手盤點 |
| Spec／tickets 已完成規劃審查 | `/implement-spec <spec 或 feature 路徑>`，自動由 `setup-testing` 確認環境並生成 `test.md`，就緒後開始實作 |
| 已有 spec，尚未拆票 | `/to-tickets <spec 路徑>` |
| 已釐清需求，尚未形成 spec | `/to-spec`，接著 `/to-tickets` |
| 單一已定義任務，不需整份 spec 協調 | `/implement <ticket 或需求>`；只要 test-first 行為實作則 `/tdd` |
| 程式故障、測試失敗或效能退化 | `/diagnosing-bugs`，依證據建立最小重現與修正 |
| 單獨配置目前環境如何測試 | `/test`，附測試範圍與環境限制 |
| 只想審查變更 | `/code-review <固定基準>`，提供需求來源；這是差異審查，不是全庫接手盤點 |

上述指令是在 agent 對話中使用的 skills，不是 PowerShell／bash 指令。初始化、規劃與實作是不同階段；導覽不因使用者詢問流程就自動執行整個專案。

## 一般開發路線

1. **釐清與研究**：`/grill-with-docs` 先調查影響方案的未知，再確認需求與決策。需可執行答案時用 `/prototype`；需資料查證時用 `/research`。範圍大到無法直接規劃時才用 `/wayfinder` 逐項釐清，再轉 spec。
2. **形成產品交付**：`/to-spec` → `/to-tickets`，依 `docs/agents/spec-and-tickets.md` 確認產品 AC、程式碼 TODO、修改邊界與依賴，完成獨立交付推演；環境準備留給實作入口。已完成的步驟沿用，不重做。
3. **自主交付**：tickets 規劃審查完成後使用 `/implement-spec`，先自動載入 `setup-testing` 確認環境、完成前置實測與 `test.md`，就緒後才派出獨立 owner。實作期間僅依 `test.md` 執行測試環境操作，完成 TDD、審查、整合及驗收，最終同步文件證據。
4. **必要時跑先導票**：只有本次路徑缺少可信開發基線，才選現有小型真實票，隨功能交付補最小基礎；不要求先全庫 review 或預建完整腳手架。
5. **持續改善**：已確認的先導阻力／審查缺陷依 `docs/agents/review-prevention.md` 自動沉澱適用能力，後續票沿用。修正停滯依 `docs/agents/review-convergence.md` 診斷／裁決，不盲目重複 review。
6. **交付與回顧**：必要驗收與約定收尾完成才結束。`implement-spec` 預設提交本地；推送、tag 或發布須有明確授權。寫 PR body 使用 `/pr`，回顧整段工作的環境改善可用 `/retro`。

`implement-spec` 必跑票級獨立審查及 PR 前最終 integration review；完整雙軸 `/code-review` 僅於明確要求時額外執行。`/implement` 則依自身流程呼叫完整 review。Session 續作／換新遵循 `docs/agents/session-lifecycle.md`，不以固定 context 大小或每票清空作通則。

## 可直接使用的範例

```text
/setup-bojii-skills
/grill-with-docs 我想新增訂單查詢，先研究現有 API 與資料權限。
/to-spec
/to-tickets .scratch/order-query/spec.md
/implement-spec .scratch/order-query/spec.md
```

已有工作時只選適用入口：

```text
/project-handoff 接手目前未完成成果，核對可沿用基線及阻擋。
/implement-spec .scratch/order-query/spec.md 繼續未完成工作。
/code-review main 需求來源是 .scratch/order-query/spec.md。
```

## 其他入口

- 外部回報尚未整理：`/triage`；已由 `to-tickets` 完成的票不重做 triage。
- 架構改善機會：`/improve-codebase-architecture`；設計模組介面用 `/codebase-design`。
- 領域術語與 ADR：`/domain-modeling`；驗證入口用 `/test`。
- 本流程的跨環境／對話交接與成果接手統一使用 `/project-handoff`；票級文件在各自 worktree 維護並隨程式整合。
- 只有人能完成的外部設定：`/wizard`；寫 agent 文件用 `/writing-for-agents`。

回覆時給出「目前階段、下一個指令、必要輸入、完成後接哪一步」即可，依問題補充原因，不重貼整份技能清單。
