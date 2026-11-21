---
name: handoff
description: 將已核實的工作狀態整理成可攜交接摘要，供新 session 續作。
argument-hint: "下一個 session 的用途"
disable-model-invocation: true
---

撰寫交接文件，摘要已核實的工作狀態，讓新 session 能繼續任務。若涉及 repository，先檢查 `AGENTS.md`、相關 spec／ticket、執行紀錄、Git 狀態及驗證證據；以這些權威紀錄為準，不沿用過時的對話說法。將文件存到作業系統的暫存目錄，不要存入目前 workspace；Windows 優先使用 `%LOCALAPPDATA%\Temp\opencode`（若可用），否則 `%TEMP%`；其他系統使用 `$TMPDIR`，若未設定則 `/tmp`。

文件須包含「建議技能」段落，列出下一位 agent 應透過 Skill 工具載入的 skills。

不要重複其他既有產物（spec、計畫、ADR、issue、commit、diff）已記錄的內容；改以路徑或 URL 引用。

交接摘要須自足且可執行：列出已核實成果、未完成工作、阻擋、責任歸屬、證據位置及下一步。不要記錄 subagent session ID；它們是暫時的工具路由資訊，不屬於交接狀態。暫存目錄中的 handoff 不是 repository 產物，不要 stage 或 commit。

移除 API key、密碼或個人識別資訊等敏感內容。

若使用者提供參數，將其視為下一個 session 的工作焦點，據此調整文件內容。
