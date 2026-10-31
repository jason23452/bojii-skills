# Coding subagent：新建與續作的生命週期取捨

查證日期：2026-11-01。範圍：官方文件與供應商工程報告；未執行模型實驗、未執行公開原碼。OpenCode 僅採 V2 文件。本 repo 的流程前提來自本次需求摘要，本文件不代替主 agent 的本地規則盤點。

## 結論

建議採「**同票單 owner，預設同 session 續作；獨立審查首次使用新 context，修正後回到同 reviewer 複查**」。這是兼顧任務連續性與審查隔離的工程政策，不是已證實最快、最便宜的方案。

- OpenCode V2 明確支援新建 fresh-context 子 session，以及傳回 `sessionID` 繼續同一子對話；因此不必在實作、測試、排錯、修正之間反覆重建 owner。[1][2]
- **Resume 不是免費**：保存對話與模型快取是不同機制；仍會有輸入、快取讀寫、新輸出與工具成本。快取能否命中取決於 provider、model、prefix、TTL、路由與 harness 行為。[4][6]
- **新建不必然更快**：較短輸入可能有利，但交接、重新探索、重建快取與遺漏資訊造成的返工也有成本。現有來源沒有本 repo 的 fresh-versus-resume 對照實測。[3][4][7][8]
- **新 session 不等於獨立觀點**：fork 可繼承整段實作對話；persistent memory 與帶結論的交接也可能把既有假設帶入。首次獨立 reviewer 應使用未參與實作的 fresh context，從 spec、diff 與驗證證據建立判斷；這是流程上的獨立性，不保證統計上的獨立或更高抓錯率。[3]

## 1. 先分清五件事

| 概念 | 本文定義 | 不應混同 |
| --- | --- | --- |
| Agent profile | 可重用的角色、prompt、model 與權限設定 | 同 profile 再呼叫，不代表繼續上次對話。[1][3] |
| Fresh / new | 建立新的任務對話，由派工資料及載入規則開始 | 不代表不讀 repo 文件，也不代表一定沒有跨 session 記憶。[1][3] |
| Resume | 以既有 ID 繼續同一任務對話 | 不保證未經 compaction、不保證快取仍有效。[2][3][4] |
| Fork | 從既有對話複製背景後分支；此處具體能力以 Claude Code 為例 | 雖是另一執行分支，並非乾淨輸入 context。[3] |
| Persistent memory / prompt cache | 前者是可再次載入的持久知識；後者重用模型對 prefix 的運算 | 記憶不等於完整 transcript；cache 不等於任務記憶或免費 token。[3][4][6] |

Owner 是 repo 的責任歸屬，session 是工具容器。即使容器不可恢復而必須換新，也應明確承接原票、檔案狀態與剩餘責任，而非默默改成多人分段擁有。

## 2. 已確認的工具能力與界線

### OpenCode V2：本 repo 最直接的依據

官方 Agents 頁寫明 subagent 在前景或背景 child session 以 fresh context 執行；Tools 頁寫明 `subagent` 接受完整 prompt，回傳的 `sessionID` 可用來繼續同一 child conversation。前景等待結果，背景完成後通知 parent；預設 nesting depth 為一。[1][2]

Tools 頁另確認 `session_move` 可指定目前或另一個 `sessionID`，移到相對或絕對目錄；搬移在 safe boundary 生效，依賴目的地的工作應放在後續呼叫。因此「主 session 留在 dev、只把開發子 session 移到 worktree」有直接能力依據。它不等於 worktree、資料庫、環境變數與埠號都已正確隔離，也不保證移動後 cache 命中。[2]

這兩頁沒有承諾 resume 的費用、速度、跨版本持久化細節，也沒有提供 Claude Code 式 fork／persistent memory 的同等保證。不能從 V1 `task_id` 或其他產品語法推導 V2 行為。實際呼叫參數仍以當次可用工具 schema 為準。[1][2]

### Claude Code：resume、fork、記憶的明確區別

- 一般非 fork 子代理不繼承 parent 完整聊天；起始內容含自身 prompt、派工訊息及適用的專案指引等。官方列出 built-in Explore／Plan 的載入例外。[3，What loads at startup]
- 可恢復的子代理以 agent ID／name 接收後續訊息；官方說明保留先前 tool calls、結果與對話歷史。子代理仍可能 auto-compact，不能理解成每次 request 永遠裝入全部原始內容。[3，Resume subagents、Auto-compaction]
- 查證時文件特別列出：built-in Explore／Plan 是 one-shot，不回傳可 resume 的 agent ID；需要延續時應選 general-purpose 或 custom subagent。這是 Claude Code 的產品／版本限制，不能套到 OpenCode Explore。[3]
- 子 transcript 與 parent 分開保存；parent compaction 不會清掉它。重啟後需恢復相同 parent session，並受 transcript retention 管理；官方預設清理期間為 30 天。[3，Resume subagents]
- Fork 繼承 parent 的 system prompt、tools、model 與全部既有對話；其後工具輸出不灌回 parent，僅回報結果。適合需要大量共同背景的分支，但不適合作為「沒看過實作思路」的 reviewer。[3，Fork the current conversation]
- `memory: user/project/local` 提供跨對話目錄；啟用時注入 `MEMORY.md` 前 200 行或 25 KB（先達者），並可讀其他檔案。它是選擇性持久知識，不是 resume transcript，也不是 cache。[3，Enable persistent memory]

### Codex：支持分工方向，不冒充精確 resume 契約

官方 Subagents 頁確認 spawning、routing follow-up instructions、等待與關閉 thread；也明說子代理各自使用模型與工具，因此比可比較的單代理流程消耗更多 token。建議優先用於 read-heavy、可獨立並行的工作，並提醒同時寫程式會有衝突及協調成本。[5]

該頁足以支持「把研究與 noisy logs 移出主對話」「保持清楚寫入責任」，不足以推導特定版本 `resume_agent` 參數、關閉後可恢復期限、或新 thread 是否繼承完整 parent history。本研究不替這些未在所引頁面確認的細節下結論，也不將 Codex 的權限繼承規則套到 OpenCode。[5]

## 3. 時間與成本：有機制證據，沒有本 repo 勝負數據

### Resume 的利益與代價

**機制事實：**Claude Code 每次 request 會送出當下 context；resume 可重用仍有效且相符的 cached prefix。一般子代理建立自身 cache，恢復時可以讀回它；fork 因 prefix 相同而可能重用 parent cache。快取過期或前段內容／model 改變會影響命中。[4]

**工程推論：**同票續作有機會省下重新定位程式碼、理解失敗測試、重建取捨的工作，尤其是短間隔修正。然而長而不相關的歷史、過時假設與已壓縮掉的細節也可能造成負擔；續作仍應讀最新 diff、環境狀態與驗收資料，不能只相信記憶。[4][8]

### New 的利益與代價

**機制事實：**fresh 子對話隔離舊探索過程；同時必須取得任務所需背景。Claude Code 一般子代理與 parent 的 system prompt／tool set 不同，因此首次不直接讀 parent cache；同目錄、同 prefix 的不同 session 則可能共享部分 cache。session ID 本身不是通用的 cache 命中條件。[3][4]

**工程推論：**新任務或獨立審查可以避免舊思路直接主導；但若派工摘要不完整，會付出重讀、重推導或錯失約束的代價。短 context 只是其中一個變數，不能直接推出總交付時間較短。[7][8]

### TTL 與 provider 不能省略

- Claude Code 查證時文件提供五分鐘與一小時 TTL，預設依主對話／其他 request、訂閱或 API／cloud 等類別決定；subagent 通常落在五分鐘類別，可依版本與設定調整。一小時寫入價格較高，不能一律視為更省。[4，Cache lifetime]
- Gateway 是否保留 `cache_control`、provider／model 支援、model 或 tools 變更，均可能改變 cache 效果。[4]
- OpenAI 官方同樣明言維持 session 不保證 cache hit，且最低可快取長度、TTL、讀寫價格與路由行為依 model 而異。不能把 Anthropic 的五分鐘／一小時規則套到 OpenAI 或整個 OpenCode。[6]
- 即使命中，cached input 仍依適用費率計價，新輸入／輸出與工具工作照樣存在。訂閱方案的用量消耗也不能直接當成每次實際增額帳單。[3][4][6]

應比較的總量是「交接與重新探索 + 模型輸入處理／輸出 + 工具執行 + 協調等待 + 返工」，費用則按實際 usage 與當時價格分拆 uncached input、cache read、cache write、output 及工具費，避免重複加總已包含在 input 中的 cache token。[4][6]

## 4. 研究報告能支持到哪裡

Anthropic 的多代理研究系統報告支持：廣度優先、可分成獨立方向的研究適合並行；清楚的派工邊界與精簡 artifact 回報可減少重複及傳話損失。報告也指出多依賴、需共享大量 context 的工作較難受益，多數 coding 工作比研究少一些真正可並行的部分。[7]

該報告的 **90.2%** 是其內部研究評估中「多代理架構對單代理」的表現差異；「約 15 倍 token」以 chat interactions 為比較對象；「研究時間最多減少 90%」涉及多代理與平行工具呼叫的改變。**三者都不是 fresh-versus-resume 的實驗，不可拿來替本 repo 宣稱提升百分比。**[7]

長任務 harness 報告支持用 progress artifact、Git 歷史、明確 feature list、增量實作與開工驗證來跨 context 延續。它同時指出 compaction 不足以解決所有接手問題，並把單一通用 coding agent 與專業多代理何者更好列為未解問題。因此可用來支持「必要換 context 時留下可靠交接」，不能推導「每個階段都應新建」。[8]

## 5. 套用本 repo 的階段決策

下表均為**工程建議**；工具依據見前述節次，尚未以本 repo 實測驗證效益。

| 階段 | 預設生命週期 | 理由與必要輸入 |
| --- | --- | --- |
| Grilling 多路可行性研究 | 每個獨立研究方向 new；該方向追問 resume | 不同研究路徑分離；給來源範圍、問題、交付物與停止條件，避免多人重查同一題。[7] |
| 新票開工 | new owner session | 以票、spec、基準 commit、驗收與環境契約定界；不是拿上一張票的 owner 對話無限加料。 |
| 同票實作 → 測試 → 排錯 → 修正 | resume 同 owner | 保留已定位的程式路徑與失敗證據；不要只因切換活動名稱就換 agent。 |
| 首次獨立票級／spec 審查 | new reviewer context，未參與產出 | 避免把實作者的對話延續成「獨立」審查；提供規範、spec、base/head、diff 與驗證證據，要求自行取證。 |
| Owner 依審查修正 | resume owner | 附 finding ID、位置與可重現條件，保留責任連續性。 |
| Reviewer 複查同輪修正 | resume 原 reviewer | 附新 head、增量 diff、finding 對照與新測試證據；既要確認舊 finding，也要查修正引入的回歸。 |
| 要求第二次完全獨立評估 | new、未參與此前判斷的 reviewer | 與「原 reviewer 複查」目的不同；不能把 resume 複查標成另一份獨立證據。 |
| 子 session 搬到 worktree | 保留 ID，移動後續作 | 主 session 留 dev；只移指定 child。safe boundary 後再確認目錄、branch／HEAD 與環境，避免下一步沿用舊路徑。[2] |
| 缺 key／外部設定但部分工作可做 | 同 owner 先完成不依賴阻擋的部分，再暫停 | 不把尚未執行的整合驗收標為通過；集中回報缺少項目、用途、放置位置與受阻驗收，由主 session 一次向人確認。 |
| 人工補值後 | resume 原 owner；原 reviewer 需要時再 resume | 傳「哪些項目已就緒」與環境位置即可，無需把 secret 值寫入交接；重查環境及剩餘驗收。TTL 過期可能重建 cache，但不是必須換 session 的理由。[4][8] |
| Context 已嚴重偏題／壓縮遺失關鍵資料 | 可選 new＋明確交接 | 先留下已驗證狀態與下一步；交接後核對 repo 現況。不是每隔固定輪數必換。 |

### 「必須新建」與「可選換 context」

**流程上必須新建：**要求未參與實作／撰寫的首次獨立審查，或明確要求第二份獨立評估。這是本 repo 建議採用的審查契約，不是 API 強制限制。即使 new，也應避免注入實作者完整推理、先前 reviewer 的結論式摘要或含該案既有判斷的共用記憶；提供可查證事實不會破壞合理的資訊共享。

**工具上必須改用新容器：**既有 session／transcript 已不可恢復，或所用產品的該 agent 本來就不支援 resume（例如查證時 Claude Code built-in Explore／Plan）。以最新 artifact 接手，不能聲稱仍保有原對話。[3]

**可選：**跨票、任務已換問題、持續繞圈、context 高比例是無關資訊，或必須改變執行設定時，可在自然斷點重建。跨票建新是預設責任切分；context 大、等待很久、cache 冷、搬 worktree、收到 review finding，均不單獨構成「必須新建」的技術理由。[2][4][8]

### 最小交接資料

無論 resume 或 new，都應能從 repo artifact 重建：票與 spec、owner／reviewer ID、工作目錄與基準／目前 commit、未提交變更、已完成與未完成驗收、具體失敗證據、阻擋項目與下一步。主 session 保存索引與精簡回報，長 log／研究內容保存在有路徑的 artifact。Resume 時傳增量並重讀變動處；new 時傳完整但精簡的接手包。[2][7][8]

## 6. 證據分級與未證實主張

1. **工具能力：**本文件引用的官方產品文件可證明其文件化契約；版本更新後須重查，不把不同產品互相類推。
2. **工程建議：**上述 owner、reviewer、阻擋續作及交接政策是依機制與需求提出的設計；尚未證實改善多少時間、費用或缺陷率。
3. **使用者 issue／論壇主張：**本次未以任何使用者 issue 作為已證實行為的依據。若後續找到「resume 特別慢／丟 context／cache 沒命中」的報告，只能先列為特定版本的待重現線索；必須具備版本、provider、最小重現與 trace，或維護者確認／修復證據，才可提升證據等級。
4. **仍未知：**本 repo 各角色實際 usage、provider cache 命中、session move 對 request prefix 的影響，以及 fresh reviewer 相對 resume 的抓錯差異。所引材料沒有這些本地結果。

## 7. 最小本地量測方案（僅方案，未執行）

先從現有工作 trace 觀察，不主動發動付費實驗。若後續決定做對照，可採以下最小 pilot；它只能辨認明顯問題，不能支撐普遍速度／費用排名。

1. **固定條件：**記錄 harness 版本、provider、精確 model／effort、工具與權限、repo commit、任務 prompt、context 長度、compaction 與實際 TTL 設定。選「同票追加修正」及「補值後完成驗收」兩種代表情境。
2. **兩個條件：**A 恢復原 owner；B 新建 owner 並提供同一份經核對的狀態包。從等價檔案／環境快照出發，避免 A 的改動先被 B 看見；B 的交接生成成本須計入總流程，也另報純續作成本。
3. **分開記錄 warm／cold：**記錄間隔並用 provider usage 確認 cache read／write，不能僅按「五分鐘內」推定命中。交錯 A/B 順序，記錄共同 prefix 的跨 session cache 污染；兩種情境各做數組配對重複才看趨勢。
4. **量測四類結果：**完成到相同驗收標準的 wall-clock（另列人工等待）、首次有效進展時間、全流程 input／cache read／cache write／output／工具費，以及漏掉約束、重讀量、工具呼叫量與返工次數。費用按當時費率計算；訂閱用量與實際增額支出分列。
5. **審查獨立性另看：**在固定已知缺陷的 diff 上，分別觀察 fresh 首審及原 reviewer 複查的漏報／誤報與 finding 閉環；兩者任務目的不同，不混成同一個速度排名，也不把第二輪熟悉題目的優勢當成 fresh 劣勢。
6. **報告限制：**列每組原始量測及範圍，不只平均值；若品質不同，先比較是否達驗收，再談速度／費用。沒有 usage 欄位、樣本太少或環境不等價時，明列無法下結論。

## 一手來源

所有連結均於 2026-11-01 查證；產品文件是可變動頁面，以下結論不等同永久版本保證。

1. OpenCode V2，**Agents**，Modes／Model／System：<https://opencode.ai/v2/docs/agents>。
2. OpenCode V2，**Tools**，Subagent／Sessions／Worktrees：<https://opencode.ai/v2/docs/tools>。
3. Claude Code，**Create custom subagents**，What loads at startup／Resume subagents／Auto-compaction／Fork the current conversation／Enable persistent memory：<https://code.claude.com/docs/en/sub-agents>。
4. Claude Code，**How Claude Code uses prompt caching**，Resuming a session／Cache lifetime／Cache scope／Subagents and the cache：<https://code.claude.com/docs/en/prompt-caching>。
5. OpenAI Codex，**Subagents**，Availability／Why subagent workflows help／Orchestration and thread controls：<https://developers.openai.com/codex/agent-configuration/subagents>（原入口 <https://developers.openai.com/codex/subagents> 導向此頁）。
6. OpenAI API，**Prompt caching**，Why prompt caching matters／Cache lifetime／Cache location／Monitor cache performance：<https://developers.openai.com/api/docs/guides/prompt-caching>。
7. Anthropic Engineering，**How we built our multi-agent research system**，2025-06-13：<https://www.anthropic.com/engineering/multi-agent-research-system>。
8. Anthropic Engineering，**Effective harnesses for long-running agents**，2025-11-26：<https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents>。
