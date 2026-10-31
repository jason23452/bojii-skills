---
name: test
description: 規劃或執行驗證、撰寫或修改測試，以及執行 lint、typecheck、build 時使用。統一選擇 repo 既有工具，按需載入 Playwright、Node.js test runner 與 lint 指引，管理前置資源、結果及交付證據。
---

# 統一驗證入口

以單一入口管理驗證，不要求專案採用單一測試層級。先沿用 repo 工具與已確認驗收邊界，避免為同一行為另建第二套 runner。

## 1. 決定驗證範圍

1. 讀取 `AGENTS.md`、spec／ticket、變更範圍、package scripts、鎖檔與 CI 設定，確認實際工具、指令、工作目錄及環境；命令名稱不等於測試範圍。
2. 建立精簡驗證清單：行為／品質要求、負責的檢查、前置條件、通過方式。沿用既定邊界；普通測試設計自行處理，只有影響產品契約或驗收範圍時才確認。
3. 工具選擇順序：已確認驗收 → repo 既有工具 → 使用者偏好。Web UI／HTTP API 在既有或已同意採用 Playwright 時優先共用它；純邏輯、程序取消與資源生命週期使用能直接證明行為的既有底層 runner。已有其他框架時沿用，不為符合本 skill 遷移工具。
4. 必須新增工具且 repo 無既定方案時，先說明理由與依賴影響並確認。沒有相應工具或前置條件時記錄缺項，不將「沒執行」當成通過。

## 2. 按工具載入指引

| 工作 | 載入 |
| --- | --- |
| 首次建立專案驗證入口，或既有入口因環境／程式變動失效 | [專案專屬驗證入口](references/project-verification.md)；沿用既有位置，補齊 Launch／Doctor／Drive／Evidence／Cleanup |
| Playwright UI／API、瀏覽器 fixtures、trace 診斷 | [Playwright](references/playwright.md) |
| Node.js 內建 test runner | [Node.js test](references/node-test.md) |
| lint／格式靜態檢查 | [Lint](references/lint.md) |
| 新增行為、回歸修復的 Red → Green → Refactor | `tdd` skill；本入口選擇邊界，TDD 負責開發節奏 |
| 失敗、停滯或未知原因 | `diagnosing-bugs` skill |

其他 runner 讀取其既有設定及對應版本的指引；只載入本次需要的工具資料。

## 3. 準備與執行

- 依專案 `docs/agents/environment-contract.md` 的依賴分流，逐項核對檢查需要的工具鏈、設定與資源。無服務依賴的 lint、typecheck、build 或純邏輯測試，工具鏈與必要設定就緒即可執行；實際需要服務的檢查才要求該服務及 fixtures 就緒。沒有該文件時，沿用 repo 準備入口並核對相同依賴。
- 需要產品環境的驗證先跑通最薄路徑；新建環境或依賴升級時核對受影響的 fixture／API 契約。首次產生或修正產品驗證入口時，實跑啟動、Doctor、一條真實路徑、證據保存及清理；未實跑者保持草稿，只阻擋依賴它的驗收。多入口功能依驗證地圖分別追蹤。
- 先讀專案 `docs/agents/test-execution.md`，依其前置資源、有限時限、輸出、取消與清理規則執行；沒有該文件的專案仍須設定有限時限、保留退出結果並清理自有資源。
- 實作內迴圈先跑最小相關行為；功能交付時執行受影響套件的既有 lint、typecheck、build 與規定測試。CI 或 spec 要求完整集合時保留該門檻。純文件變更執行適用的文件檢查，不為無關套件做全量 build。
- Lint、型別、建置及行為測試各自證明不同事項，結果分開記錄。沒有對應 script 時先查其他已配置入口，不能臆造命令或用別項成功替代。
- 同一版本、環境與範圍的有效結果可沿用。重跑由內容變動、整合或新疑慮觸發；可獨立且不爭用資源的檢查才平行。

## 4. 結果與放行

記錄每項命令／工作目錄、版本與環境、退出結果、證據及未解事項，區分通過、失敗、前置受阻、未執行及不適用。已知舊問題附可比證據，不自行降低必要門檻。

`implement-spec` 中的前置受阻回報到具體 TODO／驗收，由主 agent 依 `docs/agents/implement-spec.md` 的局部受阻、部分交付與集中詢問規則排程；先完成其他可執行檢查。測試入口不因單項缺 key 而要求整票等待，也不以替身結果放行必要的真實驗收。

全部適用且必要的檢查通過、所需資源已清理才回報驗證完成；有缺項則交回原任務追蹤並繼續排錯。驗證完成不代表整份 spec 已完成。
