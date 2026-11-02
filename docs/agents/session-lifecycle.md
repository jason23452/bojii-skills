# 子代理 session 生命週期

適用於研究、規劃審查、實作與程式審查的子代理。依任務連續性、角色獨立性及上下文品質決定 new／resume；依據與未實測限制見 [研究紀錄](../research/subagent-session-lifecycle.md)。Agent profile 是角色設定，session 是對話容器，owner 是責任歸屬，三者分開管理。

## 選擇 new 或 resume

| 情境 | 預設動作 |
| --- | --- |
| 新票或不同研究方向 | 新 session，提供完整但精簡的任務資料 |
| 同票實作、測試、排錯及依 finding 修正 | Resume 同 owner，傳新增證據與變動，不逐測試換代理 |
| 同研究方向追問 | Resume 原研究 session；問題已轉向時另開 |
| 首次獨立審查 | 新建未參與產出的 reviewer session，不將實作者 session 改角色充當獨立審查 |
| 修正後確認原 finding 及修正影響 | Resume 原 reviewer；原 session 不可用時交接 finding 與範圍給新 reviewer，仍標修正複查 |
| 同一候選 base／head 靜態審查完成，補齊待驗證證據 | Resume 原 reviewer，屬同輪審查續作；沒有 finding 也不另開新視角審查 |
| 使用者要求全新／獨立再審，或無待複查修正而要求再找盲點 | 新 reviewer，重新取證；不把原 reviewer 續查稱為另一份獨立審查 |
| 缺 key／外部條件解除後 | 預設 resume 原 owner，先核對版本、有效設定與剩餘驗收；等待時間本身不是換新理由 |
| 搬移子 session 至目標 worktree | 保留 session ID，移動完成後再驗證綁定及續作 |

「繼續檢查」若有明確新修正及待確認 finding，按修正複查處理；固定候選仍待驗證證據者按同輪續作。上一輪已完整結案、無發現且此次沒有待複查修正時，按新視角審查處理。派工與回報明列審查類型及範圍，正常交付不額外強制增加一輪新審查。

## 何時更換同票 session

- 原 session 無法恢復或工具不支援 resume 時，從交接紀錄新建。
- 反覆使用已失效的基線／已排除假設，或壓縮後遺失關鍵限制時，先提供一次精簡的現況校正；仍無法依新證據推進，則在安全斷點交接換新。可先派新 context 的唯讀診斷者取證，原 owner 仍是唯一寫入者。
- 單純測試失敗、票尚未完成、context 較長、快取過期或時間／輪數預算到達，不直接構成換新或結束任務的理由；換新也不能替代最小重現、排錯與必要驗收。

## 交接與審查輸入

1. Resume 傳新 HEAD／diff、finding 或待辦 ID、變動證據與下一動作；要求讀取變動處，不反覆貼整份歷史。
2. New 提供 spec／票與授權、工作目錄、基準／目前 SHA、未提交與未追蹤成果歸屬、已驗證事實、未證實假設、已排除方案及證據、未完成驗收、程序／資源狀態與下一動作。長 log 留在證據檔，以路徑引用；不傳 secrets。
3. 全新 reviewer 從規格、程式 diff、設定與原始驗證證據取證，不 fork 實作者或前 reviewer 的整段對話，不將「前輪已通過」作為結論前提。前輪 finding 可在完成自身檢查後用於對照，避免遺漏已知問題；修正複查則一開始提供 finding 對照。
4. 寫入者換 session 前，確認原 owner 與自有背景寫入程序已停止。保留 worktree、分支、有效環境與未提交成果，更新 owner/session 對照及交接理由。新 session 先唯讀核對，再取得寫入責任；無法確認原寫入者停止時，不啟動第二位寫入者。
5. `implement-spec` 的新 session 依 [Session 綁定](subagent.md#session-綁定) 移至既有票級 worktree，使用 `project-handoff` 僅核對變動與證據缺口。同票同時仍只有一位 owner；主對話留在 dev，不因換 context 重建環境或重問已確認需求。

## 成本與有效性

快取重用模型輸入前段的運算，不縮短上下文或保證判斷品質。Session 保存與 provider cache 是不同機制；同 ID 不保證命中，新 ID 也不代表完全未命中。不能僅為猜測快取收益而忽略審查獨立性或保留失焦 session。

優先沿用既有 usage／執行紀錄觀察完成時間、有效進展、重讀與返工；可取得時分列 input、cache read/write、output 及 provider／model。無 usage 就明列未知，不為湊數追加模型呼叫；不宣稱未量測的速度或費用改善。依任務及品質證據調整，無固定每幾輪換新規則。
