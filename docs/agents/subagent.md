# Implement-spec：整票派工與連續推進

僅適用於 `implement-spec`；開工、測試、審查、整合與全量完成條件以 [implement-spec.md](implement-spec.md) 為準。Grilling 調查使用 [grilling.md](grilling.md)。

## 一票一位 owner

主 agent 一次交付整票，不將每個測試拆成派工。提供：

- spec／ticket、TODO／AC、研究／決策／授權的 context pointers。
- 完整交付結果、必要依賴的已驗證 integration SHA、環境／fixtures／驗收入口。
- owner 修改範圍、worktree 絕對路徑、branch、完成條件及執行表位置。

owner 自主完成產品、測試、fixtures、排錯與驗證；本票內部的 Red／Green、重構及普通檢查失敗不需交回主 agent 核准。需改跨票契約或範圍、發生實際外部阻擋、準備交付／中斷時才回報。已確認契約直接沿用，一般實作細節自行決定。

## 執行表與唯一寫入者

- 主 agent 維護 `<project-root>/.scratch/<feature>/execution-state.md`，記錄 ticket、owner／reviewer session、worktree、branch、已驗證基線、狀態與證據；以主 repo 的絕對位置為即時來源，本機執行表不提交。
- Ticket 文件記錄可版本控制的 TODO／驗收進度；執行表引用，不另維護第二套產品完成條件。
- 不同票使用獨立 worktree；同一 worktree 同時一位寫入者。Reviewer 唯讀審查 owner 已停寫的穩定 commit；合併由唯一 merger／主 agent 操作。
- 交接前確認原角色及背景測試／產生器停止，再核對實際 branch、HEAD、diff、未追蹤檔與歸屬。未知變更保留查明。
- 固定 session 續作同票，保留既有上下文；切換角色、恢復中斷、基線變動時做必要核對。每個內部測試迴圈不重新建立 session 或登記修改權。

## Session 綁定

使用 worktree 前依工具當下 schema 與平台規則建立、驗證綁定；不假設 subagent 有 `directory` 參數。

OpenCode V2 的綁定程序：

1. 首次建立唯讀子 session，取得 ID 與預設目錄，確認沒有背景寫入。
2. 主 agent 獨立呼叫 `session_move`，明確帶該子 `sessionID` 與 worktree 絕對路徑；移動與依賴新目錄的續派分開呼叫。
3. 下一次呼叫先唯讀驗證預設目錄（不以 `workdir`／`cd` 覆蓋）、Git top-level、branch、HEAD、status、依賴基準及相對讀檔；讀取目標 `AGENTS.md` 與適用規則。符合預期後，依本次派工的條件授權直接開始整票實作，無須另回主 agent 等待第三次核准。
4. 不符時停在唯讀狀態，回報預期／實際與錯誤，由主 agent 修正綁定。後續中斷恢復先核對；正確就續作，不重做初始化。

Worktree 建立位置與 session 綁定是不同檢查；前者依 worktree skill 與 Git 實值驗證，後者以預設工具上下文驗證。

## 交付回報

以精簡摘要及證據路徑回報，不重貼完整規格與輸出：

1. **狀態與交付**：本票 TODO／驗收完成情況、實際行為及未完成項目；工具 `completed` 只代表呼叫結束。
2. **位置與版本**：session、worktree、branch、commit、修改檔案及未提交變更歸屬；是否停寫、背景程序狀態。
3. **驗證**：AC 對應、命令／工作目錄、結果、環境與證據位置；區分通過、有效 Red、環境失敗及未執行。
4. **阻擋與下一步**：未解問題、已試方案、必要外部條件與仍可推進工作。正常完成時交獨立 reviewer；內部修復仍由原 owner 接續。

## 主 agent 的持續排程

收到回報後核對實際成果、TODO／AC 與證據，依情況立即執行：

| 狀態 | 下一步 |
| --- | --- |
| owner 提前回報局部完成 | 沿用同一 session 繼續剩餘本票工作，不新增 Test／Green 配對 |
| 本票完成 | 派獨立 reviewer 檢查穩定交付 |
| 審查發現阻擋缺陷 | 一次交原 owner 修正，完成後針對變更複查 |
| 審查通過 | 串行合入 integration、跑受影響回歸，通過後解鎖下游 |
| 環境或產品失敗 | 原 owner 排錯；必要時派專項唯讀診斷，持續其他可執行工作 |
| 全票完成 | 執行最終整合驗證及約定收尾；缺口轉為未完成修正項並繼續 |

每次更新後重算所有可執行票，依依賴、檔案所有權及環境容量平行派出。等待背景工作時保留 ID 並等通知，不重複派工或輪詢。

## 結束門檻

主 agent 逐項核對整份 spec／tickets 的 TODO、驗收、審查、整合修正及收尾。仍有可執行工作就實際呼叫工具／派工，仍有背景工作就等待並接續；「下一步會做」不能代替執行或作為結束理由。

所有必要項目完成才回報完成。只有依 implement-spec 證實全部剩餘工作受外部條件阻擋且無可推進工作時，才明記未完成、等待必要輸入；取得輸入後按執行表、Git 與程序實況恢復，不要求使用者重新啟動 `implement-spec`。
