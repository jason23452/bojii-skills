# Node.js test runner

- 確認實際 Node 版本、loader、setup 與 scripts；使用 Node 內建 runner 支援的參數，不混用 Jest 等其他 runner 的選項。需要額外選項時先核對本地 `node --help`。
- 先依公開行為選單檔或案例重現，再跑受影響集合。記錄篩選條件，避免將篩選後的成功當完整集合通過；`test:unit` 與 `test:integration` 若指向相同 glob，不能宣稱兩者已隔離。
- Fixture 使用獨立暫存目錄與動態／專屬 ports；核對 mock 的路徑、輸入、回應格式及錯誤語意與當前依賴版本相符，非預期請求應明確失敗。
- 對 server、stream、timer、retry 與子程序使用明確 teardown。測試取消須傳遞至受測非同步工作；案例 timeout 不代表整個程序退出，另依測試執行規則設外層有限時限。
- 驗證資源生命週期時，斷言取消後停止重試、釋放資源與正常退出。不要用強制退出讓洩漏案例變綠；平行測試的最後一行輸出不必然是實際卡點。
