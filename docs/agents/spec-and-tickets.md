# Spec 與 tickets 建立後的確認流程

## 適用範圍

需求規劃階段建立／修改 spec、tickets，須依下節確認提交。`implement-spec` 依已確認需求更新 TODO、狀態、驗收證據、交接與 commit 指標，屬執行進度，可直接提交。

`implement-spec` 中維持原範圍／驗收的拆票、依賴調整、責任移轉，依 [implement-spec.md](implement-spec.md) 的跨票移轉流程記錄提交；不得縮減需求或降低標準。超出 spec 的決策依阻擋流程保留待決、繼續其他工作，不冒充進度更新。

## 需求規劃階段的提交確認

- 產出完成後用 `question` 提供「直接 commit（建議）」「先修改」，不以一般文字確認。
- 選修改則用 `question` 收集方向，改完重問，直到明確選 commit；只提交本次 spec／tickets 變更，排除其他工作。
- 單獨產出 spec 或 tickets 時，完成即問；同流程產出兩者時，全部完成後問一次。
