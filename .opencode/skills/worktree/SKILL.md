---
name: worktree
description: implement-spec 準備或恢復環境時自動使用，亦可直接要求建立 Git worktree；依實際依賴選擇本機、混合或容器模式，配置並驗證隔離環境。
---

建立指定 worktree 與其隔離環境。使用者直接要求建立 worktree，或啟動 `implement-spec`，主 agent 即自動載入本流程；依 `docs/agents/environment-contract.md`「環境自主處理」完成必要配置、實作、排錯及真實驗證，不另詢問一般環境操作授權，也不要求 spec／tickets 預寫準備方法。

## 環境模式

- 先讀實作階段的本機執行表，依 TODO／AC 與 repo 設定確認驗收需要的環境；直接呼叫時自行盤點。未指定模式時依 `docs/agents/environment-contract.md` 的測試執行模式選擇，載入 test 的 [測試方式配置](../test/references/test-setup.md)，分別決定 runner、應用與服務位置。
- 本機模式使用 worktree 專屬程序、ports 與隔離 fixtures，執行 Git 步驟 1～4 及設定與驗證步驟 8～10 的適用部分。混合模式只為必要服務執行 Docker 步驟；容器模式對相關群組執行完整適用流程。
- 使用容器的資源須有專屬 containers、network、ports 與 volumes。資料依 repo 可重現的 migration／seed／fixtures 初始化；驗收明確需要本地 `dev` volume 副本時才執行步驟 5～6 的複製，來源或操作授權缺口在建立資源前釐清。
- 模式與理由記入執行表；已有適用決策則沿用。所有模式都須驗證隔離；純文件工作無執行資源時記錄依據。下方 Docker 設定與檢查僅適用實際使用容器的部分。

## 流程

建立 worktree 後依 `docs/agents/subagent.md` 的 Session 綁定規則使用；`implement-spec` 的主對話留在 `dev` 工作區，只將子代理綁定至對應 worktree。

初始化與續作先唯讀盤點 repo 的準備／預檢／清理入口，再依下方步驟建立 Git worktree 與適用的隔離設定。入口缺口在目標 worktree 內補齊；需以程式修改才能完成隔離時，可先派工補設定／harness，再啟動服務。依 `docs/agents/environment-contract.md` 在隔離目標實跑並確認就緒後，才放行依賴它的驗收。環境設定、啟動結果與驗證證據由主 agent 彙整至既有執行表。

需要 `.env.test` 或其他測試參數時，載入 test 的 [環境參數指引](../test/references/test-env.md)，按指定來源傳遞必要設定並產生本 worktree 專屬值；Git 建立 worktree 不會帶入未追蹤的憑證檔。

1. 閱讀根目錄 `AGENTS.md`、`docs/agents/implement-spec.md`，以及 repo 中 Docker/環境設定文件。依 worktree 類型套用命名：integration worktree 為 `<spec_name>-merge`；ticket worktree 為 `<spec_name>-tickets-<number>`。
2. 以 `git worktree list --porcelain` 第一筆 worktree 記錄辨識主 repo 的絕對路徑，作為 `<project-root>`；即使目前位於 linked worktree，也使用同一個主 repo 根目錄，不以目前目錄的 `git rev-parse --show-toplevel` 取代。若主 repo 為 bare 或路徑無法確認，先釐清 repo 根目錄再建立。檢查 Git 狀態、現有 worktree/branch、Docker Compose 設定、`.env` 範本與執行中的容器。不得覆蓋既有路徑、分支、設定或使用者資料；本 skill 只處理本地環境，不執行推送。使用者明確要求的發布由 implement-spec 的 PR 門檻與授權規則處理。
3. integration worktree 從本地 `dev` 建立；ticket worktree 從對應 spec 的 `<spec_name>-merge` branch 建立。先解析並記錄來源 commit；來源工作區有未提交修改時，判斷本票是否依賴它。無相依即可從已確認 commit 建立並保留原修改；需要未提交成果時先協調 owner 交付。來源名稱缺少時先查既有分支及交接紀錄；只有仍無法確定 base 或成果歸屬時才詢問，不自行替換基底。建立後依環境契約的「流程版本同步」核對實際規則。
4. 依根目錄 `AGENTS.md` 的位置規則，計算 `<project-root>/.worktree/<worktree-name>` 的絕對路徑；名稱必須是單一目錄名稱，且解析後的父目錄必須是主 repo 內的 `.worktree`（包含檢查 symlink/junction 的實際指向）。確認該目錄已列入 repo 的 ignore 設定，再使用可明確指定路徑的 `git worktree add` 建立對應 branch；若工具無法指定或保證此路徑，改用 Git 指令。建立後以 `git worktree list --porcelain` 核對實際登錄路徑與預定路徑一致、branch 正確，且檔案內容基於預期 base；全部符合才繼續初始化環境。委派 subagent 時提供已解析的絕對路徑及相同驗證要求。
5. **僅驗收明確需要 `dev` 資料副本時**，從 Docker 設定、labels、Compose project/service 與 container mounts 交叉辨識來源 volume；仍無法辨識時只暫停依賴該副本的工作並詢問來源。一般測試略過來源辨識，使用 migration／seed／最少 fixtures。
6. 為需要持久化資料的服務建立專屬 volume，預設由 repo 入口初始化；僅步驟 5 適用時複製已確認來源。副本與來源完全分離，來源保持不變；若一致複製必須停止 `dev` 容器，沿用已確認停止／恢復授權，缺少時才詢問該差額。
7. 為使用容器的 worktree 配置唯一的 Compose project name、container 名稱、network 與 host ports。受測程式的 image 從該 worktree 程式碼建置並使用專屬 tag，不使用另一 worktree 的應用 image；資料庫等第三方服務可共用鎖定版本的不可變 image，其 containers 與可變資料仍須獨立。挑選尚未占用的 ports，並將實際 port 對應記錄在該 worktree 的本機環境設定中。
8. 若 repo 有 E2E 測試，為 E2E server 分配此 worktree 專屬且未占用的 port，並將 app server 與測試 runner 的 `baseURL`/port 一起設定為該值。優先使用既有環境變數或 runner CLI；若設定寫死而無法隔離，在此 worktree 中調整為可配置並保留原預設值，執行 E2E 驗證。不得讓測試連到 `dev` 或其他 worktree 的 server。
9. 優先使用 repo 既有可覆寫的環境變數或 Compose override 隔離設定；本機設定與 secrets 不得寫入 tracked 檔案或輸出到對話。若設定無法區分環境資源，依已授權範圍補齊 worktree 本地設定並驗證；必須異動共享設定且契約未涵蓋時，才使用 `question` 確認該差額。
10. 啟動隔離環境，核對程序的工作目錄、app/E2E ports、測試 runner 的 `baseURL`、上游 endpoint 及可變資料／fixtures 路徑；Docker 模式另核對 containers、image tags 與 volume mounts，確認實際使用此 worktree 的程式碼與專屬資源。執行健康檢查及指定驗收，記錄 worktree/branch、base、資源歸屬及結果，不揭露 secrets。全部適用檢查通過才標示環境就緒；僅建立 Git 目錄不算完成。完成後依開工契約清理本次資源，保留約定的 integration 與證據。

## 隔離與安全

`implement-spec` 的票級資源依 `docs/agents/implement-spec.md`「票級即時清理」：每票完整交付、審查及 integration 回歸通過後立即保存證據，移除該票 worktree、containers、network、專屬 image tag／可安全移除的 image、volumes 與自有程序，確認 ports 釋放。Integration 保留至整份驗收；部分交付票保留續作必要資源。清理時點由該流程統一決定，不延至整批結束。

- Worktree 之間不得共用可變執行資源：container、network、受測應用 image tag、host port 與 volume 均須有 worktree 專屬識別。
- Network 隔離與外連限制依環境契約分開判定；專屬 network 本身不要求另建 proxy 或禁止外連。
- Volume 使用獨立初始化資料；採 `dev` 副本時是一次性複製，不是共享 volume 或持續同步，後續變更不回寫 `dev`。
- Docker 的 image layer cache 可由 daemon 共用；受測應用使用 worktree 自建的專屬 image tag，第三方服務沿用步驟 7 的版本與資料隔離規則，不需另建 Docker daemon。
- 不刪除、清空或重建既有 `dev` volume，也不清理無法明確歸屬此 worktree 的 Docker 資源。Port 或資源所有權不明時，自行查證或另選專屬資源續作；只有驗收必須使用該既有資源且無法查明時才詢問。
