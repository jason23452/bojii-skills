---
name: sdd
description: 依已確認 ticket 的 TODO／AC 進行規格驅動實作；implement-spec 的票級選擇器選定 SDD 時使用。適用於需求已定案的票，不負責建立或改寫 spec。
---

# Specification-Driven Development

SDD 是依既有 ticket 規格直接完成交付的方法，不是另一套拆票流程，也不代表免測。使用者已確認的 ticket TODO／AC 是實作與驗收依據；不另造 spec、不擴大已授權範圍。

## 執行方式

1. 閱讀派工 ticket，確認負責的 TODO、AC、修改邊界、依賴與已確認的驗收方式。需求或公開契約有歧義時，依 `implement-spec` 流程處理，不自行改寫規格。
2. 依 TODO／AC 直接實作最小充分成果，優先沿用 repo 既有模組、慣例與有效成果；不為了 SDD 增加設計文件、流程審批或中間交接。
3. 依行為與驗收需要新增、修改或重用測試。測試可在實作前、中或後撰寫；SDD 不要求每個行為都先製造 Red，也不因選了 SDD 而省略必要測試。
4. 載入 `test` skill，依 integration 的權威 `test.md` 及 [implement-spec](../../../docs/agents/implement-spec.md) 選擇最小充分驗證，完成 TODO／AC 所需的測試或其他適當驗收證據。純文件或無可執行行為的變更採適當文件檢查。

## 方法界線

- 不把一般新增行為自動切換成 TDD；只有明確的 test-first 要求，或新證據顯示先寫可重現失敗能明顯降低返工時，才依 `implement-spec` 規則重新判斷是否改採 TDD。
- 測試預期值來自 ticket／spec 的已確認行為，不從產品實際輸出反推；保留必要斷言，不以通過為由放寬驗收。
- 交付完成仍以所有負責 TODO／AC 有充分證據為準；票級審查、整合與回報依 `implement-spec` 流程，不由本 skill 取代。
