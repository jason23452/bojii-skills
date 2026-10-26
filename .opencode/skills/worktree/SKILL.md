---
name: worktree
description: 建立 Git worktree 或 ticket/integration worktree 時，配置各自隔離的 Docker 執行環境與從本地 dev volume 複製的獨立資料。
---

建立指定 worktree 與其隔離環境。每個 worktree 使用獨立的 ports、Docker containers、images、network 與 volume；唯一的資料初始化來源是本地 `dev` 環境的 volume 副本。此 skill 會建立本機資源，只能由使用者明確呼叫。

## 流程

1. 閱讀根目錄 `AGENTS.md`、`docs/agents/implement-spec.md`，以及 repo 中 Docker/環境設定文件。依 worktree 類型套用命名：integration worktree 為 `<spec_name>-merge`；ticket worktree 為 `<spec_name>-tickets-<number>`。
2. 以 `git worktree list --porcelain` 第一筆 worktree 記錄辨識主 repo 的絕對路徑，作為 `<project-root>`；即使目前位於 linked worktree，也使用同一個主 repo 根目錄，不以目前目錄的 `git rev-parse --show-toplevel` 取代。若主 repo 為 bare 或路徑無法確認，先釐清 repo 根目錄再建立。檢查 Git 狀態、現有 worktree/branch、Docker Compose 設定、`.env` 範本與執行中的容器。不得覆蓋既有路徑、分支、設定或使用者資料；任何 worktree/branch 都不得推送至遠端。
3. integration worktree 從本地 `dev` 建立；ticket worktree 從對應 spec 的 `<spec_name>-merge` branch 建立。若來源 branch 不存在、狀態不乾淨，或名稱/來源有歧義，透過互動式 `question` 工具釐清，不要自行改用其他 base。
4. 依根目錄 `AGENTS.md` 的位置規則，計算 `<project-root>/.worktree/<worktree-name>` 的絕對路徑；名稱必須是單一目錄名稱，且解析後的父目錄必須是主 repo 內的 `.worktree`（包含檢查 symlink/junction 的實際指向）。確認該目錄已列入 repo 的 ignore 設定，再使用可明確指定路徑的 `git worktree add` 建立對應 branch；若工具無法指定或保證此路徑，改用 Git 指令。建立後以 `git worktree list --porcelain` 核對實際登錄路徑與預定路徑一致、branch 正確，且檔案內容基於預期 base；全部符合才繼續初始化環境。委派 subagent 時提供已解析的絕對路徑及相同驗證要求。
5. 從 `dev` worktree 的 Docker 設定辨識正在使用的 volume。使用 Docker labels、Compose project/service 名稱與 container mounts 交叉確認來源；若無法明確辨識 `dev` volume，停止 Docker 初始化並透過互動式 `question` 工具請使用者指出來源。
6. 為新 worktree 建立獨立命名的 volume，將 `dev` volume 的資料複製到新 volume；不得讓新 worktree 與 `dev` 或其他 worktree 共用同一 volume。來源 volume 保持不變。若需停止 `dev` 容器才能取得一致資料，先透過互動式 `question` 工具詢問；不得未經同意停止或修改 `dev` 環境。
7. 為每個 worktree 配置唯一的 Compose project name、container 名稱、network、image tag 與 host ports。Image 必須從該 worktree 的程式碼建置並使用該 worktree 專屬 tag；不得直接使用另一 worktree 的 image。挑選尚未占用的 ports，並將實際 port 對應記錄在該 worktree 的本機環境設定中。
8. 若 repo 有 E2E 測試，為 E2E server 分配此 worktree 專屬且未占用的 port，並將 app server 與測試 runner 的 `baseURL`/port 一起設定為該值。優先使用既有環境變數或 runner CLI；若設定寫死而無法隔離，在此 worktree 中調整為可配置並保留原預設值，執行 E2E 驗證。不得讓測試連到 `dev` 或其他 worktree 的 server。
9. 優先使用 repo 既有可覆寫的環境變數或 Compose override 隔離設定；本機設定與 secrets 不得寫入 tracked 檔案或輸出到對話。若 Compose 設定無法安全地區分 project、image、volume 或 ports，先說明缺少的設定，使用互動式 `question` 工具確認後再調整，不要默默修改共享設定。
10. 啟動隔離環境並驗證 containers、image tags、volume mounts、app/E2E host ports 與 E2E `baseURL` 都屬於此 worktree；執行健康檢查及可用的 E2E 測試。回報 worktree/branch、base、port 對應、Docker 資源名稱及驗證結果，不揭露 secrets。

## 隔離與安全

- Worktree 之間不得共用可變執行資源：container、network、image tag、host port 與 volume 均須有 worktree 專屬識別。
- Volume 是從 `dev` 複製資料後建立的獨立副本，不是 bind mount、共享 volume 或持續同步。後續 worktree 資料變更不回寫 `dev`。
- Docker 的 image layer cache 可能由 Docker daemon 在底層共用；隔離要求是使用 worktree 專屬 image tag，且執行該 worktree 自己建置的 image，不代表另建 Docker daemon。
- 不刪除、清空或重建既有 `dev` volume，也不清理無法明確歸屬此 worktree 的 Docker 資源。若 port 或資源所有權不明，先停下釐清。
