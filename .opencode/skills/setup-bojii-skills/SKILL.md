---
name: setup-bojii-skills
description: "初始化或補齊專案的 bojii-skills 設定：issue tracker、triage labels、領域文件布局及開發流程入口。"
disable-model-invocation: true
---

# 初始化 bojii-skills

配置技能使用的專案入口，完成後交回 `/bojii-guide` 選擇工作流程。這是設定程序，不建立業務腳手架、不替代環境就緒檢查，也不自動啟動產品實作。

## 1. 盤點與沿用

讀取 repo 的 `AGENTS.md`、`CLAUDE.md`、`docs/agents/`、Git remotes、`.scratch/`、`GLOSSARY.md`／`GLOSSARY-MAP.md`、ADR 位置及 workspace 設定。核對安裝的 skills 與執行規範檔案實際存在。

既有設定、使用者修改及已確認選擇優先；重跑只補缺項或處理使用者要求的變更。Git remote 不代表 tracker 已選定，monorepo 也不代表領域必須分成多個 context。先簡述可沿用項目與缺口，再處理真正未定的選擇。

## 2. 補齊專案選擇

### Issue tracker

已有 `docs/agents/issue-tracker.md` 或明確慣例時沿用。未定時，依現況推薦 GitHub、GitLab 或本地 Markdown，請使用者選一次；其他 tracker 取得實際取票、寫票與依賴操作方式。

本地票券使用 `.scratch/<feature>/spec.md` 與 `issues/<NN>-<slug>.md`。GitHub／GitLab 分別使用 `gh`／`glab`，先核對登入與 repo；外部 PR 納入 triage 的設定維持模板預設關閉，除非另有要求。

### Triage labels

只有安裝 `triage` 才配置。沿用既有映射；缺少時使用 `needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。既有 tracker 用不同名稱時確認映射，避免重複建立同義標籤。

### 領域文件

沿用既有布局；沒有布局時採 single-context：根目錄 `GLOSSARY.md` 與 `docs/adr/`。只有確實存在多個領域 context 且需要分開維護時才確認 multi-context。此步記錄讀取規則，不為填滿目錄而建立空白詞彙表、ADR 或架構框架。

## 3. 寫入與驗證

1. 使用下方模板產生缺少的設定，已有文件以最小差異更新。單純補齊已選方案直接執行；切換 tracker、取代既有慣例或含未定選擇時，先說明差異並取得確認。
2. 更新既有 agent 指引：只有一個 `AGENTS.md`／`CLAUDE.md` 時使用它；兩者皆有時依 repo 權威與引用關係選擇，不複製兩套規範；無法判定時詢問。兩者皆無則建立 `AGENTS.md`。僅更新對應的 `## Agent skills` 區塊，保留其他內容與既有流程指引。
3. 寫入 tracker、領域文件與適用的 triage 指標；若目標 repo 的 `docs/agents/implement-spec.md` 等規範已存在，補上導覽及必要流程指標。指向不存在文件前先修復安裝缺口，不產生懸空路徑或自行編造另一套規範。
4. 外部 tracker 缺少標籤時，在已確認目標與授權內建立；權限不足則列出必要輸入，本地可做的設定先完成。
5. 核對模板佔位符已填入、連結可解析、指標無重複與互斥規定。重跑時無缺口即回報已就緒，不覆寫未變內容。

指標範例（依實際安裝與現有內容合併）：

```markdown
## Agent skills

### 如何開始

使用 `/bojii-guide` 選擇適用流程；首次設定或補齊配置使用 `/setup-bojii-skills`。

### Issue tracker

[本專案選定的 tracker 摘要]，見 `docs/agents/issue-tracker.md`。

### Triage labels

[實際 label 映射摘要]，見 `docs/agents/triage-labels.md`。

### Domain docs

[實際領域文件布局]，見 `docs/agents/domain.md`。

### 自主交付

執行 `implement-spec` 時讀取 `docs/agents/implement-spec.md` 與 `docs/agents/subagent.md`；依其條件啟用真實先導票、根因預防與審查收斂。
```

未安裝 triage 時略過其區塊；不存在且尚未安裝的流程文件不寫入引用，回報安裝缺口。

## 模板

- [GitHub tracker](issue-tracker-github.md)
- [GitLab tracker](issue-tracker-gitlab.md)
- [本地 Markdown tracker](issue-tracker-local.md)
- [Triage label 映射](triage-labels.md)
- [領域文件讀取規則與布局](domain.md)

其他 tracker 依已確認操作流程編寫，不猜測 API 或工具。外部 label 建立失敗不標為已完成。

## 4. 完成與下一步

回報已沿用／更新的檔案、已驗證設定及未完成項目。設定就緒不代表執行環境就緒；不要求使用者重跑已完成設定。

- 只有想法：`/grill-with-docs` → `/to-spec` → `/to-tickets`。
- 已有 spec／tickets：`/implement-spec <路徑>`，自動核對開工條件與必要接手基線。
- 只有待接手成果、尚無下一個需求：`/project-handoff`。
- 不確定：`/bojii-guide`。
