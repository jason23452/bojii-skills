# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

## 分流與執行狀態

`Status` 表示工作應交由誰處理、資訊是否足夠；票級前置由 `Blocked by` 表示，環境狀態由實作階段的本機執行表表示，產品驗收證據對應票內驗收清單。

- `needs-triage`：尚未完成範圍、責任或處理方式的分流。
- `needs-info`：下一步確實需要使用者補充資訊或決策，記錄具體問題與受影響範圍。
- `ready-for-agent`：需求、修改責任與驗收已足夠，可交給 Agent 承接。實作入口再推導環境需求及確認操作授權；此標籤不表示前置票已完成、環境已就緒或驗收已通過，也不要求把環境準備列為產品 TODO。
- `ready-for-human`：交付工作確實需要人員執行；技術尚待查證本身不構成此標籤的理由。
- `wontfix`：已決定不處理。

已分流的下游票可標 `ready-for-agent` 並保留 `Blocked by`，由前置驗收解鎖。獨立研究任務以問題、實驗邊界及結果交付明確為準，可行性是研究輸出；其標籤不表示相依產品方案已可實作。產品批次須先通過 [規劃期可行性門檻](grilling.md#規劃期可行性門檻)。外部服務暫不可用等執行阻擋另記原因，不自動退回 `needs-triage`。

決策或授權確認後立即重新判定受影響標籤；產品責任同步 spec／依賴，執行條件同步本機執行表。Spec 使用相同標籤時表示可交給 Agent 協調推進，不表示所有下游票可同時執行。規劃交接見 [spec-and-tickets.md](spec-and-tickets.md)，執行收尾見 [implement-spec.md](implement-spec.md)。
