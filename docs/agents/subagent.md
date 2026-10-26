# Implement-spec 的 subagent 交接與主 agent 續作

僅適用於 `implement-spec`；完成、阻擋、TDD 與合併條件見 [implement-spec.md](implement-spec.md)。`grilling`／`grill-me`／`grill-with-docs` 使用 [grilling.md](grilling.md)，其他 skills 依各自流程，不套用本文。

## 派工時建立交接契約

每次派工提供以下資訊；既有內容引用路徑／段落，不複製整份規格：

- 整體目標、spec／ticket 路徑、本輪切片範圍及對應驗收項目。
- subagent 角色、允許修改的範圍、worktree 絕對路徑與 branch。
- 前一輪證據、目前 Red／Green 狀態，以及本輪完成的可驗證條件。
- 要求依下方格式回報；明確區分「本輪完成」「ticket 完成」與「整份 spec 完成」。

## 多 session 的目錄與修改權

- **執行表**：主 agent 單獨維護 ticket、角色、session ID、worktree 絕對路徑、branch、基底／依賴 SHA、切片、狀態、唯一寫入者；subagent 透過回報更新，不取代 ticket 驗收條件。
- **唯一位置**：主 repo 的 `<project-root>/.scratch/<feature>/execution-state.md`。根目錄依 worktree 規則解析，開工時記錄絕對路徑並隨每次派工提供，不隨 session 目錄改變。其他 worktree 的副本不作即時依據；此本機紀錄不提交到 ticket／integration。
- **進度來源**：表內連結 ticket branch／commit 與證據絕對路徑，依實際 worktree、最新驗收成果更新，不沿用其他分支舊狀態。票券文件由負責角色在其 branch 更新提交，最終合併；既有權威紀錄先核對恢復，不另建或覆蓋未知內容。
- **並行邊界**：不同 ticket 用獨立 worktree；同票 Test／Green 用不同 session 依序修改；每個 session 同時只接一個修改任務。探索唯讀，不能把變動中檔案的觀察當穩定驗收證據。
- **接手核對**：新啟動或恢復 session，先唯讀核對實際目錄、`git rev-parse --show-toplevel`、branch、HEAD、`git status --short`、必要測試與依賴 SHA；回報 session ID／結果，主 agent 核准並登記寫入者後才派修改。
- **目錄設定**：明確設定子 session directory；移動時指定閒置子 session ID，移後重查。Prompt 路徑或主 agent 切換目錄不算子 session 已切換。無法設定時，檔案全用絕對路徑、shell 全指定 workdir／等效參數；無法保證位置就暫緩，不猜路徑或試寫。
- **基準**：可接手前一角色未提交測試，但逐檔核對路徑、diff／hash、歸屬。未知變更先查明，不以 reset、clean 或覆寫消除差異。
- **修改權**：原角色回報並停寫 → 確認背景 shell／測試／產生器結束 → 主 agent 驗收釋放 → 接手者核對基準 → 授權。Commit、合併、文件更新、清理亦適用；主 agent 不與 subagent 同時操作同一 worktree。
- **退回／恢復**：測試修正前 Green 交回修改權，Test 修正並更新基準後再交還。取消／逾時須確認程序與工具已停止才改派；不明時保留 worktree、推進其他票。中斷恢復核對表格與實際 session／程序／Git，不憑舊「閒置」狀態重複派寫入任務。

## Subagent 回報格式

每次回報均須包含以下欄位。不適用者寫明原因；尚未驗證者保留為未完成。

1. **本輪狀態**：已完成／需另一角色接手／受阻、實際完成範圍。工具的 `completed` 只代表呼叫結束，不代表 ticket 完成。
2. **交付位置**：session ID、實際 worktree、branch、HEAD／commit（若有）、變更檔案，以及未提交變更與其歸屬；明列是否已停止所有寫入及仍在執行的背景程序。
3. **驗證證據**：執行命令、工作目錄、結果及對應驗收項目；區分實際通過、預期 Red、環境失敗與未執行，較長輸出提供證據檔案路徑。Test agent 另提供 [implement-spec 的測試品質與有效 Red](implement-spec.md#測試品質與有效-red) 所要求的契約依據、覆蓋對照及 Red 證據；修改既有測試時附修改分類與重新驗證結果。
4. **剩餘工作**：逐項列出本票 TODO／驗收的未驗證、未實作、受阻狀態及已知依賴；整份 spec 由主 agent 盤點。
5. **下一次交接**：接手角色、具體動作、所需輸入、完成條件；不能只寫「後續處理」。
6. **阻擋與解鎖**：失敗證據、已試方案／結果、所需外部條件、仍可推進工作；無阻擋明寫「無」。

Subagent 提出接手建議，主 agent 審查並依下方流程派工；Green 發現測試需調整時交回 Test。

## 主 agent 接收後的必做流程

每次收到 subagent 結果後，依序執行：

1. **驗收本輪**：核對 worktree、diff、角色修改邊界與驗證證據。缺少證據或回報不完整時，要求原 subagent 補齊或重新派工；不能直接接受其完成宣告。
2. **核對剩餘工作**：對照 ticket 原始 TODO／驗收項目及 spec，更新實際進度。Subagent 的剩餘清單是交接輸入，不取代主 agent 自行核對。
3. **立即接續行動**：
   - 本輪未通過：派回相應角色修正或補證據。
   - 有效 Red：派 Green agent 實作。
   - 切片通過但 ticket 未完成：先依 implement-spec 的「Green 切片提交檢查點」保存完整交付，再派 Test agent 建立下一個尚未覆蓋行為的 Red；不適用 TDD 的工作依已記錄的替代驗證方式續作。
   - Ticket 驗收完成：更新票券狀態，重新計算依賴並派出下一張可執行 ticket。
   - 所有 tickets 完成：執行整合、整體驗證與收尾；發現缺口時重新派工。
   - 存在阻擋：依 implement-spec 的阻擋判定處理，並繼續其他可推進工作。
4. **確認已交接**：只要還有可執行工作，就必須實際發出下一個工具呼叫或 subagent 委派；「接下來會做」「尚未完成」等進度文字不能代替派工，也不能作為最終回覆結束任務。

等待背景 subagent 時保留 session ID、角色、待回報工作，依工具約定等完成通知後續接驗收；不重複派工，也不要求使用者再次觸發 `implement-spec`。

## 任務結束門檻

- 摘要依最新回報、驗收 commit、ticket 對照與實際狀態，區分本輪完成／仍未完成／正在執行／下一步；來源不一致先核對，不沿用舊摘要。
- 最終回覆前盤點整份 spec：有工作就實際派工，有背景工作就等待通知後續作；摘要不能取代工具執行。僅符合下列門檻才結束。

核對剩餘驗收、執行中 subagent、整合／收尾狀態後，僅在整體完成，或依 implement-spec 證實外部阻擋且無其他可推進工作時結束。

環境中斷後先讀 spec、tickets、交接證據與 Git 狀態，確認既有 subagent 是否仍執行，再續接；舊摘要不是完成證據。
