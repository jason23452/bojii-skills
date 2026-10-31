# Playwright UI／API 驗證

## 邊界與環境

- 讀取既有 Playwright config、projects、fixtures、webServer、reporter 與 CI；先確認使用者要驗收的入口、角色及部署政策。
- 沿用 `docs/agents/test-execution.md` 的前置資源契約。`baseURL`、BFF／runtime endpoint 與 ports 由設定注入，準備、UI 與清理必須指向同一測試環境；測試使用建立操作實際回傳的 Project ID／路徑。
- 驗收「UI 建立 Project」時透過 UI；驗收後續聊天或其他行為時可由產品 API fixture 建立 Project 並確認就緒。建立失敗就停止受影響案例，不能先跳到假設存在的固定路徑。
- 為每次執行建立可辨識所有權的資料；測試可獨立執行、重試或平行，不依賴前一案例留下的 Project。清理僅刪除本次建立的資源，部分建立或中斷後先核對再恢復。
- Browser context 隔離不代表後端資料、帳號或共用 profile 隔離；平行 worker 使用各自的資料與 context。只能使用同一 live 實例且操作互相影響時，指定單一 driver 串行驗證。

## 撰寫與驗收

- 依可見角色、label、文字或 repo 約定的 test ID 定位，避免綁 CSS 結構。使用可觀察的就緒條件與 runner 支援的等待斷言，不以固定 sleep 猜測載入完成。
- 明列 mocked UI 測試與真實 UI → BFF → runtime 驗收。前者驗證 UI 邊界；後者不得攔截被驗收的產品 API 並回傳成功假資料。外部服務可依已確認契約使用測試替身，證據須標示替身邊界。
- 情境覆蓋依 spec／ticket 決定，包含必要錯誤、重試、切換、晚到回應及重新載入；驗證實際可見結果與副作用，不只檢查 HTTP 200。
- 先跑單案例確認前置接線，再擴至受影響範圍及要求的 projects／完整集合。Retry 用來觀察不穩定性，不用來掩蓋固定失敗；紀錄首次失敗與最終結果。

## 診斷與清理

- 依既有 reporter 保留失敗 trace、截圖及必要的 console／network 證據，注意 trace 可能包含測試資料或憑證。只輸出已遮蔽的診斷資訊。
- 首次 drive 及異常後依專案 Doctor 核對實例；環境正常但頁面狀態異常時重設已知狀態後重驗。清理測試資料與程序後，確認 trace／截圖等證據仍可讀。
- 區分資料準備、webServer 啟動、locator／斷言、產品 API、runtime 與 teardown 失敗。HTML 報告開啟服務不是測試完成門檻；使用 repo 的非互動執行方式，避免命令等待人工關閉報告。
- 測試時限、webServer 時限、全套執行及外層程序清理依有限等待規則配置；瀏覽器案例退出後仍須核對自有 Vite／BFF 等子程序已按生命週期關閉。
