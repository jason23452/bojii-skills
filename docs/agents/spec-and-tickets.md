# Spec 與 tickets 建立後的確認流程

- 完成 spec 與其 tickets 的建立或更新後，使用 OpenCode 互動式 `question` 工具詢問使用者要直接 commit，還是先修改內容；禁止以一般文字提出這項確認。
- 提供「直接 commit（建議）」與「先修改」選項。只有使用者選擇 commit 時才提交，且 commit 僅包含本次建立或更新的 spec/tickets 檔案，不包含其他工作目錄變更。
- 若使用者選擇先修改，透過互動式 `question` 工具收集修改方向，完成修改後再次詢問要 commit 還是繼續修改；直到使用者明確選擇 commit 才提交。
- 若只建立或更新 spec、尚未建立 tickets，或反之，則在該次產出完成後詢問；若同一流程會產出兩者，等兩者都完成後再詢問一次。
