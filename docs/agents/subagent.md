# Implement-spec 的 subagent 交接與主 agent 續作

本文件僅適用於 `implement-spec` 的 subagent 派工、回報與主 agent 續作。完成、阻擋、TDD 角色及合併條件仍以 [implement-spec 流程](implement-spec.md) 為準。

`grilling`、`grill-me` 與 `grill-with-docs` 的調查 subagent 使用 [grilling 流程](grilling.md) 的調查回報與訪談交接規則，不套用本文件的格式或實作續作門檻。其他 skill 亦遵循各自流程。

## 派工時建立交接契約

主 agent 每次派工都提供以下資訊；既有內容以文件路徑與段落引用，避免複製整份規格：

- 整體目標、spec／ticket 路徑、本輪切片範圍及對應驗收項目。
- subagent 角色、允許修改的範圍、worktree 絕對路徑與 branch。
- 前一輪證據、目前 Red／Green 狀態，以及本輪完成的可驗證條件。
- 要求依下方格式回報；明確區分「本輪完成」「ticket 完成」與「整份 spec 完成」。

## 多 session 的目錄與修改權

- 主 agent 在 `.scratch/<feature>/execution-state.md` 維護執行表，逐列記錄 ticket、角色、session ID、worktree 絕對路徑、branch、基底／依賴 SHA、目前切片、狀態與唯一寫入者。由主 agent 單獨更新；subagent 透過回報提供變更。此表記錄執行狀態，不取代 ticket 的驗收條件。
- 不同 ticket 可同時執行，各自使用獨立 worktree。Test 與 Green 使用不同 session，但依序操作同一 ticket worktree；一個 session 同時只承接一個修改任務。探索角色唯讀，結果不得被當成對正在變動檔案的穩定驗收證據。
- 啟動新 session 或恢復舊 session 時，先以不修改檔案的前置階段核對實際工作目錄、`git rev-parse --show-toplevel`、branch、HEAD、`git status --short`、必要測試檔與依賴 SHA。回傳 session ID 與核對結果，由主 agent 核准並記錄寫入者後，才委派修改階段。
- Prompt 中指定路徑不代表 session 已切換。若工具可指定子 session 的 directory，就明確設定；若需移動 session，須明確指向該子 session ID，並在其閒置時操作，再重新核對。只切換主 agent 目錄不能證明其他 subagent 已切換。
- 若工具無法為子 session 設定目錄，所有檔案操作使用絕對路徑，所有 shell 呼叫明確指定 workdir（或使用工具支援的等效目錄參數）。先確認這些操作均可固定於指定 worktree；無法保證時暫緩該修改任務，不能猜測相對路徑或試寫檔案。
- 接手時的預期 Git 狀態可以包含前一角色交付的未提交測試，但須逐檔核對已記錄的路徑、diff／hash 與歸屬。未知變更先查明；不得用 reset、clean 或覆寫讓狀態看似一致。
- 修改權交接順序固定為：原角色回報並停止寫入 → 確認其背景 shell／測試／產生器已結束 → 主 agent 驗收並釋放寫入者 → 接手角色核對基準 → 主 agent 授予修改權。同一 worktree 的 commit、合併、文件更新與清理也須取得此修改權；主 agent 不與 subagent 同時操作。
- Subagent 等待測試修正時，須先交回修改權才讓 Test agent 接手；修正後重新記錄基準，再交還 Green。取消或逾時不能直接當成寫入已停止，先確認程序及工具狀態，再改派；無法確認時保留該 worktree 並推進其他獨立票券。
- 中斷恢復時核對執行表與實際 session／程序／Git 狀態，不能只憑表上「閒置」或舊回報就發出第二個寫入任務。

## Subagent 回報格式

每次回報均須包含以下欄位。不適用者寫明原因；尚未驗證者保留為未完成。

1. **本輪狀態**：已完成／需另一角色接手／受阻，以及本輪實際完成的範圍。工具顯示 `completed` 只代表此次 subagent 呼叫結束，不代表 ticket 已完成。
2. **交付位置**：session ID、實際 worktree、branch、HEAD／commit（若有）、變更檔案，以及未提交變更與其歸屬；明列是否已停止所有寫入及仍在執行的背景程序。
3. **驗證證據**：執行命令、工作目錄、結果及對應驗收項目；區分實際通過、預期 Red、環境失敗與未執行，較長輸出提供證據檔案路徑。Test agent 另提供 [implement-spec 的測試品質與有效 Red](implement-spec.md#測試品質與有效-red) 所要求的契約依據、覆蓋對照及 Red 證據；修改既有測試時附修改分類與重新驗證結果。
4. **剩餘工作**：逐項列出本 ticket 尚未完成的 TODO／驗收項目，指出已實作但未驗證、尚未實作或受阻的部分。列出範圍限於本票及已知依賴，整份 spec 的盤點由主 agent 負責。
5. **下一次交接**：指定接手角色、下一個具體動作、所需輸入與完成條件。例如「請主 agent 派 Test agent 為 production launcher 接線建立下一個有效 Red」，不能只寫「後續再處理」。
6. **阻擋與解鎖條件**：若受阻，列出失敗證據、已試方案及結果、所需外部條件，以及仍可推進的工作；沒有阻擋就明寫「無」。

Test agent 的有效 Red 應交給 Green agent；Green agent 發現測試需調整時交回 Test agent。切片 Green 後仍有未覆蓋驗收項目，下一步是下一輪 Test，不是宣布整張 ticket 完成。Subagent 提出接手建議，由主 agent 審查及派工。

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

若下一步正等待已啟動的背景 subagent，保留其 session ID、角色及待回報工作，依工具約定等待完成通知；收到通知後從上述驗收步驟接續。這是等待狀態，不是要求使用者再次輸入 `implement-spec` 的停止點，也不重複派出同一工作。

## 任務結束門檻

- 每次進度摘要以最新 subagent 回報、已驗收 commit、ticket 驗收對照與實際執行狀態為依據，區分「本輪完成」「仍未完成」「正在執行」及「下一步」。來源有落差時先核對，不沿用舊摘要把已完成工作再次列成進行中。
- 最終回覆前，主 agent 檢查整份 spec 而非只檢查最後一個 subagent：有可執行工作就實際接續派工；有在執行的背景工作就保留等待與回報後續作狀態；只有符合下述結束門檻才輸出任務結論。摘要是進度資訊，不能取代狀態轉移與工具執行。

主 agent 只有在整體完成條件全部通過，或已依 implement-spec 證實外部阻擋且沒有其他可推進工作時，才能結束任務。結束前須核對剩餘驗收項目、尚在執行的 subagent 及整合／收尾狀態。

若執行環境中斷，恢復後先讀 spec、tickets、交接證據與實際 Git 狀態，確認既有 subagent 是否仍在執行，再續接未完成步驟；不可把前一輪進度摘要視為整體完成證據。
