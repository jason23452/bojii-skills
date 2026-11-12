# Implement-spec：整票派工與連續推進

僅適用於 `implement-spec`；開工、測試、審查、整合與全量完成條件以 [implement-spec.md](implement-spec.md) 為準。子代理新建、續作與換新依 [session 生命週期](session-lifecycle.md)。Grilling 調查使用 [grilling.md](grilling.md)。

## 一票一位 owner

每張新票建立獨立實作 subagent session；主 agent 負責協調與整合，不能以自己連續實作多票取代派工。相依票解鎖後同樣另開 owner；同票修正與續作 resume。主 agent 一次交付整票，不將每個測試拆成派工。提供：

- spec／ticket、TODO／AC、研究／決策／授權的 context pointers。
- 完整交付結果、必要依賴的已驗證 integration SHA、環境的準備／預檢／fixtures／驗收／清理入口，以及 implement-spec 環境就緒門檻的證據；尚待 owner 完成的環境準備須列明責任與放行條件。
- owner 修改範圍、worktree 絕對路徑、branch、完成條件及執行表位置。
- 主 repo 執行權威 `test.md` 的絕對路徑與 hash／版本，以及主 agent 維護的 `execution-state.md` 路徑。Owner 與 reviewer 唯讀使用，不修改 worktree 副本或把其變更混入候選；測試證據與文件缺口回報主 agent。主 agent 依 [環境契約的文件快照規則](environment-contract.md#產生文件的-merge-branch-快照) 同步提交兩份文件，reviewer 唯讀檢查 `<spec_name>-merge` branch 中的最新快照。
- 與其他票共用部分的唯一 owner 及變更協調邊界；owner 發現需跨界修改時先回報主 agent 調整責任與依賴，再取得寫入範圍，不能自行改入別票成果。
- [測試執行規則](test-execution.md)、已知耗時與證據位置。其他資料按下表分支提供，續派只傳變動與未完成責任。

| 派工情況 | 追加資料 |
| --- | --- |
| 審查修正／複查 | [審查收斂](review-convergence.md)與[根因預防](review-prevention.md)、有效 findings／版本／完成條件、已知共用能力及停滯裁決 |
| 交付／審查 | [交付管線](delivery-pipeline.md)、固定 base／head、必要驗證與背景工作位置 |
| 真實先導票 | [先導規則](implement-spec.md#以真實先導票建立開發基線)、選擇理由、待驗證阻力及實際下游 |
| 接手／中斷後恢復 | 依 `project-handoff` 整理獨立於 session 的基線、失敗與清理證據，由新 session 採目前 skills 承接；連續執行中的單次測試逾時由原 owner 排錯 |

### 派結果，不派每一步

Owner 自主完成產品、測試、fixtures、排錯與驗證，直到可交付；普通失敗、Red／Green、重構及票內切換由 owner 連續處理。只在準備交付／中斷、需跨票協調、實際外部受阻或產品契約需決策時回報主 agent。發現外部阻擋後，仍完成本票其餘可執行工作。

主 agent 派工描述「要恢復的行為、修改邊界、有效證據與完成條件」，讓 owner 選擇內部修復順序。具體命令可作已驗證入口或最小重現，不變成每一步需回報核准的腳本。一次交回同輪有效 findings，包含修正、必要回歸與交付；只有跨票資源協調、操作界線、證據矛盾或停滯裁決才介入執行細節。

修復派工包含「定位 → 最小重現 → 修復 → 受影響回歸 → 原驗收重驗」的完整責任，以及可調整的 runner／fixture 與文件差異回報入口。Owner 核對實際 scripts 的工作目錄與參數，與派工命令不符時先查明並依環境契約校正。普通失敗由同一 owner 連續處理；需暫停時列具體條件及其來源，依 [授權沿用](implement-spec.md#授權沿用) 區分使用者限制、重試預算與內部交接。

## 跨票 TODO 邊界

Owner 以本票 TODO／AC 為實作與進度更新範圍。可唯讀其他票理解契約；不得自行實作、改寫、刪除或勾選其他票的 TODO／驗收，也不能因其檔案存在於自己的 worktree 就視為已取得修改權。

開始整票與發現需擴大修改時，依 tickets 索引的[票對判定](spec-and-tickets.md#跨票互斥與平行判定)，核對本票行為、共用契約與預計 diff；相同檔案不必然越界，不同檔案也不代表無衝突。新增交集時只暫停重疊部分，回報相關票／TODO、符號或契約及原因，繼續票內獨立工作；一般 TODO 切換無需審批。

例如 01 實作共用 API，02／03 負責消費端時，01 交付約定 API 及自身測試，不順手完成 02／03 的接線或修改其驗收。若確實必須一起變更，回報具體 TODO ID、原因及影響；主 agent 先協調受影響 owner 停止重疊工作，依 implement-spec 的責任移轉更新兩側責任與依賴，再由指定唯一 owner 實作。僅因編譯或測試失敗，不構成自行承接別票的授權。

主 agent 核對新增衝突後，協調受影響 owner 停止重疊寫入，選定唯一修正者、順序或責任移轉；同步兩票及索引的判定，交接精確成果後續派。維持需求範圍的內部協調自行完成，各 owner 只更新自己的票。移轉保留原要求及完成證據；交付時將實際 diff 對照本票 TODO／AC 與已核准移轉，非本票成果先釐清歸屬，不夾帶整合。

## 執行表與唯一寫入者

- 主 agent 維護 `<project-root>/<execution-doc-dir>/<feature>/execution-state.md`，預設 `<execution-doc-dir>` 為 `.scratch`；若該路徑遭忽略或不受版本控制，改用 `docs/testing` 或其他已追蹤 spec 目錄，並與 `test.md` 同置。執行表記錄 ticket、owner／reviewer session、worktree、branch、已驗證基線、狀態與證據，以及從 TODO／AC 推導的環境準備、操作授權與恢復入口；主 repo 檔案是唯一即時來源，owner 回報證據，由主 agent 唯一寫入。首次派工前及會改變續作／交付判定的排程節點，將同一 repo-relative 路徑的版本同步並提交至 `<spec_name>-merge` branch；路徑使用 repo-relative 表示，內容不得包含秘密、憑證值或個人資料。各次更新節點依 [環境契約](environment-contract.md#產生文件的-merge-branch-快照) 判定，不為讀取或輪詢提交。
- Ticket 文件記錄可版本控制的程式碼 TODO／驗收進度；執行表引用，不另維護第二套產品完成條件，也不把環境操作反向寫成產品 TODO。
- 文件更新依 [即時狀態與固定證據的分工](environment-contract.md#即時狀態與固定證據的分工)：派工使用當次核實的 Git 基線；handoff／evidence 引用固定受測與交付版本，不為純文件 commit 造成的 HEAD 前進反覆派修 chronology。
- 每個未完成項目另記 `next_action`（下一個具體工具動作）及 `blocker`（無、背景 session／程序、或待使用者決策）；恢復時依 Git／程序實況核對後續作。
- 背景工作另記最近一次派工的工具結果、session／job ID 與狀態（執行中、已回報、失敗／中斷、未知）。Session ID 只表示對話存在；執行表中的「修正中」須有已接受且尚未結束的背景呼叫支持。
- 阻擋與依賴細化到成果及 TODO／驗收 ID，記錄已交付 commit、可用的 integration SHA、未完成責任與解除條件；票級摘要可為部分完成／部分受阻，不能代替逐項狀態。
- 不同票使用獨立 worktree；同一 worktree 同時一位寫入者。Reviewer 唯讀審查 owner 已停寫的穩定 commit；合併由唯一 merger／主 agent 操作。
- 寫入權移轉或修改候選前確認原角色及受影響背景測試／產生器停止，再核對實際 branch、HEAD、diff、未追蹤檔與歸屬。固定候選上的唯讀審查可依交付管線與隔離的驗證並行；未知變更保留查明。
- 同票預設 resume，必要時依 session 生命週期交接換新；切換角色、恢復中斷、基線變動時做必要核對。每個內部測試迴圈不重新建立 session 或登記修改權。

## Session 綁定

主對話固定留在使用者的 `dev` 工作區，作為協調入口；建立 integration／票級 worktree 不移動主 session。啟動時記錄主 session 的原始目錄，若該目錄不是承載 `dev` 的 worktree，先釐清使用者指定的協調位置，不自行切換目錄或 checkout 分支。

主 agent 的整合、測試與清理命令以工具的 `workdir` 指向目標 worktree，讀寫檔案使用明確路徑。只有子代理需綁定其工作目錄；呼叫 `session_move` 時必須明確指定已核對的子 `sessionID`，不得省略或填入主 session ID。使用者另行明確要求移動主對話時才依該要求處理。

使用 worktree 前依工具當下 schema 與平台規則建立、驗證綁定；不假設 subagent 有 `directory` 參數。

OpenCode V2 的綁定程序：

1. 首次建立唯讀子 session，取得 ID 與預設目錄，確認沒有背景寫入。
2. 主 agent 獨立呼叫 `session_move`，明確帶該子 `sessionID` 與 worktree 絕對路徑；移動與依賴新目錄的續派分開呼叫。
3. 下一次呼叫先唯讀驗證預設目錄（不以 `workdir`／`cd` 覆蓋）、Git top-level、branch、HEAD、status、依賴基準及相對讀檔；讀取目標 `AGENTS.md` 與適用規則。符合預期後，依本次派工的條件授權直接開始整票實作，無須另回主 agent 等待第三次核准。
4. 不符時停在唯讀狀態，回報預期／實際與錯誤，由主 agent 修正綁定。後續中斷恢復先核對；正確就續作，不重做初始化。

Worktree 建立位置與 session 綁定是不同檢查；前者依 worktree skill 與 Git 實值驗證，後者以預設工具上下文驗證。

## 交付回報

以精簡摘要及證據路徑回報，不重貼完整規格與輸出：

1. **狀態與交付**：依 [TODO 的獨立完成判定](spec-and-tickets.md#todo-的獨立完成判定) 更新本票勾選與證據，分列本票未完成項目、下游承接及跨票 AC；不因下游未實作而保留已完成 TODO 未勾。工具 `completed` 只代表呼叫結束。
2. **位置與版本**：worktree、branch、commit、修改檔案及未提交變更歸屬；是否停寫、背景程序狀態。Session／job ID 用於當次調度或選填追溯，交接資料本身須可獨立使用。
   同時提供本票 `project-handoff` 文件路徑及所屬候選 commit；一票一份，在本票 worktree 維護並隨交付整合，不改寫別票文件。
3. **驗證**：AC 對應、命令／工作目錄、結果、環境與證據位置；區分通過、有效 Red、環境失敗及未執行。
   審查修正另附根因預防判定、採用位置與證據，格式依 [根因預防規則](review-prevention.md)。
4. **阻擋與下一步**：未解問題、已試方案、必要外部條件與仍可推進工作；部分交付另列可分離成果、精確 commit、涵蓋及未涵蓋的驗收。阻擋立即回報主 agent，由主 agent 依權威流程集中詢問使用者；內部修復仍由原 owner 接續。

## 主 agent 的持續排程

產品派工前須已建立 `<spec_name>-merge` integration worktree、取得 `setup-testing` 的初始環境放行與 `test.md`，並提交 `execution-state.md` 初始快照；尚未放行時下列排程僅推進環境準備、查證與必要補問，不派產品 owner。放行後依 `test.md` 執行；文件缺口依 [診斷與修訂](environment-contract.md#診斷與修訂) 由主 agent 更新並同步提交後續派受影響驗證，owner 同時繼續界線內可執行的診斷。

每次收到 owner／reviewer 回報、背景完成通知或整合驗證結果，跑完以下迴圈才決定是否等待：

1. 核對交付版本、TODO／AC、證據與背景呼叫的最新工具結果，更新執行表。完成、失敗或中斷通知立即結束該次「執行中」狀態；有剩餘工作即選下一動作，不沿用舊的等待描述。
2. 依下表選出下一個具體動作，寫入 `next_action`；只有實際缺少的條件才記為 `blocker`。
3. 有可執行動作就立即呼叫工具／派工，依結果再次排程；進度說明使用 commentary，不作任務結束回覆。審查與必要驗證皆通過後，才核對交付與 integration 的 Git 狀態並整合／驗證；長驗證以有期限的背景工作執行時繼續處理其他回報，不輪詢或阻塞整份排程。
4. 無可執行動作時，依下方結束門檻區分等待背景工作、等待必要輸入或全部完成。

| 狀態 | 下一步 |
| --- | --- |
| owner 回報局部完成，尚有可自主完成工作 | 預設 resume；符合換新條件時先交接，再由新 session 承接剩餘責任，不新增 Test／Green 配對 |
| 聲稱等待但沒有有效背景呼叫，或呼叫已失敗／中斷 | 尚未派工則立即派工；連續執行中的呼叫結束則核對剩餘工作後續派。任務中斷後接手依 `project-handoff` 整理文件並新建 owner；先核對必要程序歸屬及原寫入者已停止，無法確認時明記狀態未知及解除方式，不宣稱 owner 正在工作 |
| 局部外部受阻且有可分離成果 | 依 implement-spec 部分交付門檻審查、整合並解鎖下游；原 owner 保留剩餘責任 |
| 新發現外部阻擋 | 記錄具體受影響項及待補條件，重算同票／跨票可執行工作；仍有工作時不發出阻塞式問題 |
| 程式就緒、驗證中（或驗證已完成但未審查） | 固定 base／head，安排必要驗證與獨立 reviewer 並行；無法並行則串行並記錄原因 |
| 審查或驗證單邊完成 | 更新證據；另一邊未完成則繼續其他工作，收齊後交原 reviewer 核對最終結果 |
| 審查／驗證發現阻擋缺陷 | 依交付管線收齊有效 findings 或取消前提已失效的工作，再一次交原 owner 修正並完成適用根因預防；跨票協調唯一 owner，完成後針對變更複查 |
| 審查修正符合停滯觸發條件 | 優先依審查收斂規則核對版本與證據、診斷或裁決，再派明確下一動作；不重送相同修正要求 |
| 審查與必要驗證皆通過、可整合 | 核對基線漂移，串行合入 integration、跑合併結果的受影響回歸，通過後解鎖下游 |
| 整票已整合且回歸通過、尚未清理 | 立即依 implement-spec 票級即時清理保存證據、停止使用中的程序並移除本票 worktree／對應本地 branch／專屬資源，確認釋放容量後重算派工；不等待其他票完成 |
| 票級清理失敗 | 核對殘留 worktree、branch 或資源的歸屬並排錯／重試，記錄具體阻擋；該票保持已整合、待清理，其他無相依工作繼續 |
| 清理條件未滿足 | 依 implement-spec 票級即時清理自主完成剩餘交付、整合修復、證據保存、程序停止或成果歸屬調查；條件解除立即清理，不以「還不能清」結束任務 |
| 測試逾時／停滯或工具中斷 | 原 owner 依測試執行規則保留證據、核對並清理程序、縮小重現後續作；派工不得僅要求提高時限重跑 |
| 聲稱次數／授權耗盡、文件缺口或共享修復越界 | 先核對原始限制；主 agent 校正自加門檻、更新 test.md 或協調責任後立即續派完整修復。真實使用者限制仍有效，不受限的離線診斷繼續 |
| 全票整合完成 | 執行最終整合驗證，將最終 `test.md` 與 `execution-state.md` 快照同步並提交至 `<spec_name>-merge` branch，再固定 PR base／integration head 並派獨立 integration reviewer；缺口交明確 owner 修正、重驗與複查 |
| 最終整合驗證與 integration review 皆通過 | 核對兩份最終快照已提交於 `<spec_name>-merge` integration branch，與主 repo 權威版本及 hash 一致且由 reviewer 核對；再產生 PR 報告及收尾。缺漏驗收交回修復；實際發布依既有授權，base／head 變更依影響範圍重驗與複查 |

每次更新後重算所有可執行成果及票內剩餘工作，依依賴、檔案所有權及環境容量平行派出；同一票仍維持單一 owner。等待背景工作時保留 ID 並等通知，不重複派工或輪詢。

## 結束門檻

逐項核對整份 TODO、驗收、審查、整合修正及收尾後，以目前狀態處理：

- **可推進**：執行 `next_action`，回到排程迴圈。
- **僅等待背景工作**：以已接受且尚未結束的背景呼叫為依據，保留 session／job ID，依工具通知機制暫時交還控制；通知到達即回到排程迴圈，不需使用者再次啟動。正常等待不輪詢；使用者要求繼續或中斷恢復時，先核對既有工具結果，沒有有效執行依據就走上表恢復分支，不重複回覆「正在等待」。
- **需要外部輸入**：依 implement-spec 確認全部剩餘工作確實受阻且無可推進項目，明記未完成及必要問題；取得答案後續作。
- **使用者暫停／取消**：停止新派工，處理執行中工作的交接，記錄可恢復狀態並遵循指示。
- **全部完成**：全部必要項目及約定收尾均有證據，才回覆整份交付結果。
