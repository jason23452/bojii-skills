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

`Status` 表示工作應交由誰處理、資訊是否足夠；票級前置由 `Blocked by` 表示，環境與驗收證據由開工準備紀錄及驗收清單表示。

- `needs-triage`：尚未完成範圍、責任或處理方式的分流。
- `needs-info`：下一步確實需要使用者補充資訊或決策，記錄具體問題與受影響範圍。
- `ready-for-agent`：需求、責任、驗收及必要授權已足夠，Agent 可在既定邊界內承接；可包含建立環境、準備 fixture、研究與驗證。它不表示前置票已完成、環境已就緒或驗收已通過。
- `ready-for-human`：交付工作確實需要人員執行；技術尚待查證本身不構成此標籤的理由。
- `wontfix`：已決定不處理。

已分流的下游票可標 `ready-for-agent` 並保留 `Blocked by`，由前置驗收解鎖。獨立研究任務以問題、實驗邊界及結果交付明確為準，可行性是研究輸出；其標籤不表示相依產品方案已可實作。產品批次須先通過 [規劃期可行性門檻](grilling.md#規劃期可行性門檻)。外部服務暫不可用等執行阻擋另記原因，不自動退回 `needs-triage`。

決策或授權確認後立即重新判定受影響標籤，與 spec、依賴及開工準備紀錄同步。Spec 使用相同標籤時表示可交給 Agent 協調推進，不表示所有下游票可同時執行。詳細收尾流程見 [spec-and-tickets.md](spec-and-tickets.md)。
