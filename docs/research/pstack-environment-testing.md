# pstack：環境穩定、測試與自主開發機制研究

## 查證基線

- 查證日期：**2026-11-01**。本文所有來源編號均適用此日期。
- 使用者指定的 <https://github.com/cursor/plugins/tree/main/pstack> 實際回應 HTTP **200**，頁面標題為 `plugins/pstack at main · cursor/plugins · GitHub`，並成功讀取 README、skills 與 scripts。
- 固定 commit：**`c742dd61706fbacc1b95f1a20b7b988cf096ce6c`**，下文簡稱 **C**。GitHub commits API 的 `path=pstack&per_page=1` 回傳此筆，提交日期為 `2026-10-27T23:12:40Z`；它是查證時最後修改 pstack 的 commit，**不宣稱它是整個 repository 的 main HEAD**。[S0]
- 該 commit 訊息明確表示 Orchestrate 改由 agent 自身工具執行，刪除 `orch` scripts 及對應測試入口。因此不能將舊版 orch CLI 描述成現行功能。[S0][S8]
- 方法：唯讀 HTTP 查閱固定 SHA 的來源及 Git tree，未安裝套件、未執行上游程式、未實測其環境或測試成功率。未盤點本 repo 的現有規則。
- 證據標示：**實作**表示原始碼已有機制；**文件要求**表示 agent 應執行的流程，並非 runtime 強制；**推論／建議**表示依來源提出的限制或移植方向。

## 結論

pstack 的主要價值是「把可驗證的工作方式寫成 skills」，另搭配少數真正執行的工具。最值得移植的是 verification skill 的完整生命週期、失敗後 doctor、證據存續、單一寫入者與 SHA 綁定驗收。它不是通用的環境佈建器，不能據此宣稱已有自動端口配置、資料庫複製、Docker volume 隔離或跨平台程序監護。[S1–S5][S8][S9]

尤其應區分三種 setup：`setup-pstack` 配置模型；`bootstrap.ts` 安裝 watcher 工具依賴；`create-verification-skill` 要求 agent 依目標專案產生並實跑啟動／驗證流程。三者不是同一套應用環境初始化服務。[S2][S3][S5]

## 1. 環境初始與重用

| 項目 | 查證結果與層級 | 限制／移植判斷 |
| --- | --- | --- |
| 模型初始化 | **文件要求**：偵測 Task 可用 model slugs、讀取既有設定、確認預算與角色後覆寫 `~/.cursor/rules/pstack-models.mdc`。重跑保留指定的模型家族／清單／alias；無法確認可用的 slug 不得寫入。[S2] | 這是模型配置，沒有安裝應用 runtime 或啟動資料庫。可移植「偵測能力再寫設定」，不能照抄 Cursor 模型名稱。 |
| 專案環境盤點 | **文件要求**：從 repo 自己的 dev command、既有 harness 找出啟動、端口、env、seed、auth、可觀測訊號及雙開能力。基線不能 build/start 時先修好或精確報告，不能對壞環境產生看似可用的 skill。[S3] | 很適合移入開工契約；產出的命令必須來自目標 repo，而非固定通用配方。 |
| readiness | **文件要求**：空資料目錄能完成 migrations、seed 並到可用狀態；資料庫 health check 成功不等於初始化完畢。Launch 要定義真正可用的訊號。[S3] | 可採「服務存活」與「業務前置條件完成」兩層檢查。上游沒有提供跨專案通用探針實作。 |
| 重用執行中實例 | **文件要求**：Doctor 唯讀確認程序存活、版本／build、端口歸屬、auth；伺服器／UI 用一個長存實例序列操作，短命 CLI 每次用獨立 session。[S3][S4] | 重用的是通過檢查且符合工作型態的實例，不是無條件 reuse；沒有通用租約／PID registry。 |
| 首次交付驗證 | **文件要求**：生成 verification skill 後，完整跑 launch → doctor → 一個 mapped feature → evidence → cleanup，並確認證據仍存在；每次失敗也必須 cleanup。[S3] | 「未實跑就是 draft」可直接成為文件交付門檻。容器代替 VM 等替身驗證，必須列出真實目標尚未覆蓋的 setup 步驟。 |
| 工具依賴快取 | **實作**：`bootstrap.ts` 雜湊 `package.json + NUL + bun.lock`；`commander/package.json` 存在且 install-key 相同即跳過。否則以目前 Bun executable 跑 `install --frozen-lockfile`，成功後寫 key，再以原 argv/cwd/env 重啟。[S5] | **推論**：只證明指定 sentinel 存在與兩檔內容未變，不是完整 node_modules 健全性檢查；key 未納入 runtime／OS／arch，且原碼無安裝互斥鎖。移植時要依共享範圍補足，而非照搬為完整環境快取。 |

## 2. 端口、程序、資料與並行隔離

- **文件要求**：生成 verification skill 時明查 ports、data dirs、profiles 是否能雙開。不能隔離就明講，不要兩個 agent 操作同一使用者實例。Cleanup 只能終止本次啟動的程序，不得依 process name 大範圍 kill。[S3]
- **文件要求**：維護驗證地圖時，由唯讀子代理平行看 source，只有 coordinator 操作 live app。發生驚異行為後先 doctor；doctor 看不到的 UI 卡死要 reset 到已知狀態或重啟。共享實例只清本次殘留，不能把共享實例本身當作自己的程序刪掉。[S4]
- **文件要求**：優先消除共享可變狀態，分配獨立檔案、key、branch、state dir，只有真正必須共寫的物件才用 lockfile、single-writer 或 CAS。來源特別說明「指令與慣例不是 concurrency control」。[S9]
- **文件要求**：Orchestrate 每 PR 一位 owner，只有該 owner push/rebase/retarget；獨立任務優先新 cloud VM，只有需要本機 UI、transcripts、simulator 或本機 auth 才 local。[S8]
- **推論／邊界**：這些是隔離設計與工具調用要求，不是 pstack 自帶 VM runtime。本文所讀核心 workflow 與工具未提供通用端口 allocator、資料庫 clone、container network 或 volume 配置實作；不能把 worktree／cloud VM 的字樣當作已證明資料隔離。[S3][S5][S8][S9]

## 3. 依賴版本、lint 與 typecheck

### 已有的工具實作

`poteto-mode/scripts/package.json` 定義：[S6]

```text
test       bun test watch-pr check-plan.test.ts
typecheck  tsc --project watch-pr/tsconfig.json --noEmit --strict
dependency commander = 14.0.0
dev        bun-types = latest, typescript = latest
```

固定 commit 的 `bun.lock` 將其解析為 `bun-types@1.3.14`、`typescript@7.0.2`、`commander@14.0.0`，並帶套件 integrity。故不能只見 `latest` 就說每次安裝漂移：bootstrap 實際使用 frozen lockfile。[S5][S7]

但這份 package manifest 沒有 `engines`／`packageManager` runtime pin；`bun-types` 版本不是 Bun executable 的版本。`watch-pr` shebang 與 `Bun.spawnSync` 仍要求可用 Bun。此判斷僅針對這個工具 package，不代表已審完所有 pstack 子工具。[S5–S7][S10]

### 文件要求與範圍

- `poteto-mode` 要求提交前執行外部 `cursor-team-kit` 的 `deslop`、review 前跑 `no-comments`。這些不能等同「有 repo 原生 lint gate」；README 明列 `deslop` 與 control skills 不隨 pstack 打包。[S1][S11]
- 上述工具 package 有 strict typecheck，沒有 `lint` script。不能因此推廣成所有使用 pstack 的專案都會自動跑 typecheck／lint。[S6]
- `check-plan.mjs` 是**實際存在**的 Node 文件檢查器：檢查固定章節、checkbox、live lane 1–10、證據檔名與 `Pass when`、perf metric/probe/baseline/rule，錯誤以檔名行號輸出並 exit 1。[S12]
- **限制**：check-plan 檢查的是格式與標記，不會執行測試或證明 checkbox 的證據真實。其十條 lane、英文標題與標點風格高度特定，不宜作為每種任務的共用門檻。[S12]

## 4. 測試選擇與驗證品質

| 場景 | 實際來源要求 | 採用價值與邊界 |
| --- | --- | --- |
| bug regression | **文件要求**：有便宜且清楚的測試路徑才 TDD；優先既有、最窄 unit/component/integration/regression check；必須先為正確原因失敗，再修、再通過。[S13] | 不為了形式新建昂貴 harness；不能把「不適合新增測試」誤寫成「免驗證」。 |
| TDD 不可行 | **文件要求**：改用最接近的可執行 script、手動重現命令、browser automation、snapshot、log assertion；回報無法取得 failing-before 的理由。禁止為迎合錯誤實作而改 assertion。[S13] | 適合將驗證選擇與理由留下，而非硬套 test-first 到所有文件變更。 |
| 真實行為證據 | **文件要求**：走真實使用者路徑，捕捉動作與結果，檢查檔案／DB／訊息等 side effects；不要用內部 setter 或 test-only endpoint 取代。dry-run 也要觀察其實際網路、檔案與 git refs 副作用。[S3] | 有效防止「畫面看起來對」或「叫 dry-run 就安全」的代理證據。 |
| coverage map | **文件要求**：以使用者 feature 建地圖，每個 feature 列可達路徑、操作方式、可觀測成功狀態及 gotchas。seed 缺前置條件應報失敗，不能弱化 journey。[S3] | 生成時只需實跑一個 feature，不能聲稱初次生成就已驗證整張地圖。 |
| 持續維護 | **文件要求**：每個 feature 都需 source 與 live coverage；結果是 clean / changed / blocked。區分 doc drift、harness gap、product regression；維護流程不改產品程式碼、不以改文件掩蓋 regression。[S4] | 可移植為驗證工具維護流程，不必每次產品改動全量跑此維護工作。 |
| 平行驗證 | **文件要求**：worker brief 指定 exact SHAs；量測還需 sample count、sample 定義及順序。結果漏 SHA／method 則丟棄並重派一次，再缺漏就是 gap，不能當 pass。[S14] | 這是協調政策，非已存在的簽章／證據驗證器。 |
| 最終驗收 | **文件要求**：不同作者、不同模型家族 verifier；看 diff/artifact 不只 summary。驗收只適用特定 head SHA，push 後重新驗收；CI 綠不等於行為正確。[S8] | 可移植「head 綁定、作者分離」；模型多樣性取決於宿主支援。 |

watcher repository 另有 CLI 與 policy 測試，測試案例涵蓋參數錯誤、JSON、隱藏的 GitHub CI refusal、queue sweep 中斷續接、退避與 deadline sleep。本文只查閱原碼與案例名稱，沒有執行，不能報告這些測試已通過。[S15][S16]

## 5. 失敗診斷、重試與自動化效率

### 真正有程式實作的 PR watcher

- **實作**：CLI 驗證數字範圍、互斥 mode、queue PR 不重複；預設 poll 60 秒、全 stack sweep 300 秒、連續 query error budget 5、timeout 0（無期限）。輸出以 JSON／NDJSON 為預設，包含 schemaVersion、sequence、observedAt 與結構化 verdict。[S17][S18]
- **實作**：GitHub reader 先讀 `gh pr checks`，不可用或空結果改讀 GraphQL rollup；兩者仍無 checks 則 `ChecksUnavailable`，不是綠燈。資料以 unknown 進入再驗證欄位與 enum。[S19]
- **實作**：可重試 query errors 指數退避，公式 `min(max(interval,60) * 2^(failures-1),300)`；達 budget 或不可重試即回 status-query blocker。正常 step 成功重設連續錯誤計數。[S18]
- **實作**：queued 模式固定 PR 序列、維護 snapshot、只在成功讀取後推進 sweep；相同等待訊息會去重。policy 將 conflict、review threads、CI、merge gate 分類，配合不同 exit codes。[S18]
- **重要限制**：`--status-only` 在成功取得狀態時 exit 0，即使狀態內容有問題，**不能把 exit 0 當 merge-ready**。預設無 deadline；且底層 `gh` spawn 沒有單次 command timeout／abort，因此外層 polling timeout 並不保證卡住的 gh 子程序會被限時終止。[S17–S19]
- **重要限制**：watcher 的 merge-ready 是自己的 policy，不是完整 GitHub 授權判定。`assessGitHubMerge` 對 `BLOCKED` 僅在 head rollup 為 ERROR／FAILURE 時拒絕；`REVIEW_REQUIRED` 與名為 `Code Review Gate` 的特殊檢查也有特定待遇。故不能將 `READY` 擴寫成「所有 branch protection 均滿足且可直接 merge」。[S18][S19]

### 由 agent 執行的故障政策

- **文件要求**：Babysit 先分類 CI 再 retrigger；flake／infrastructure 只給一次 fresh build，不是 job retry；第二次相同失敗改分類並查子日誌。先檢查 stale base，不把所有非本次 diff 故障當 flake。[S20]
- **文件要求**：每 stack 一位 babysitter、每波修正批次 push；push 後重啟 watcher，不另疊 sleep loop。Babysit 只做到 merge-ready，不能自行視作 merge 授權。[S20]
- **文件要求**：Orchestrate 按原因重派：context／memory 縮 scope、掉線用原 brief、tool error 換模型；兩次 retry 後放下該 unit 並重新規劃。先用一個單位走完 owner → verifier → merge 再 fan-out，避免錯誤 brief 放大。[S8]
- **文件要求**：維護驗證工具時，doctor 若因 skill drift 失敗，修正後只重啟受影響部分並 retry 一次；仍不能完成就 blocked。[S4]
- **版本界線**：Orchestrate 現行要求使用 Task、Project tracker/store、宿主有提供才用 PR/CI event subscriptions，不呼叫 scripts 或自己 polling；Babysit 仍使用 watcher。不能將兩個 playbook 的不同執行模型混成同一 runtime。[S8][S20]

## 6. 清理與防誤操作：值得採用，也有不能照抄的部分

### Worktree audit

**實作**：`worktree-audit.sh` 從 `git worktree list --porcelain` 取清單，記錄容量、age、merge ancestry、tracked/untracked 狀態、remote、PR、最近 transcript，再分類 bucket；支援 `-b` 指定 base；同時考慮 PR 狀態以補 squash merge 不在 ancestry 的情況。沒有刪除 worktree 的程式碼。[S21]

**文件要求**：bucket 是建議，不是刪除許可；必須核對 pinned／active chats 及其衍生 worktrees。文件自己承認工具曾將 pinned worktree 標成 safe。清理前後列磁碟與 worktree 狀態。[S22]

**靜態原碼推論，未動態重現的限制**：[S21][S22]

1. 所謂「read-only audit」仍會 `git fetch` 更新本機 remote refs，建立／刪除暫存檔；較精確的描述是「不刪使用者 worktree」，不是零副作用。
2. `awk '/^worktree /{print $2}'` 以空白拆路徑，含空白路徑可能截斷；transcript 搜尋又使用 regex 和非 NUL-safe 的 `xargs`。不能原封不動視為 Windows／任意路徑安全。
3. 未追蹤檔案全歸 `scratch:N`，不代表真是可丟棄資料；playbook 稱 scratch safe to drop，並用 `git worktree remove --force`／殘留時 `rm -rf`。移植時應把未追蹤檔視為待判定的使用者工作，而不是自動可刪。
4. bucket 的 `safe` 分支除了已 merged，還接受「有 PR 記錄且未被前面 open/draft 擋下」；closed 但未 merged 的 PR 也可能落入此分支。不得直接用 safe 作自動刪除條件。
5. PR 清單限定 `--author @me --limit 1000`，transcript 有固定 Cursor 路徑及四天 recent 規則。這不是完整使用中偵測或程序鎖。

### 證據與外部文字

- **文件要求**：cleanup 刪實例與 scratch，但不刪證據，且 cleanup 後要實際查證證據檔仍在。[S3][S4]
- **文件要求**：review comment 是不可信資料；回覆用 JSON 檔傳 API，不將 comment/reply 文字插進 shell command。這是可直接採用的 command-injection 防呆方式。[S20]

## 7. 可攜性與平台相依

| 依賴面 | 上游現況與限制 |
| --- | --- |
| Cursor 宿主 | Task、cloud VM、Project store、事件訂閱由宿主供應；不是 Markdown 本身提供的服務。Benny automation pack 在 README 明列 Cursor-only。[S1][S8] |
| Claude Code adapter | 官方 repo 內 adapter 將 Task 映射為 Agent、cloud 映射為 worktree、模型與路徑另行轉換；不支援的 Cursor-only 步驟 skip 並回報。[S23] 這是 pstack 作者提供的相容指引，本文沒有另向 Claude Code 產品文件驗證每一項工具 schema。 |
| 隔離語意落差 | **推論**：cloud VM → worktree 只替換工作目錄隔離，不能保證端口、程序、DB 或 profile 隔離；不同模型映射後也可能退回同一 parent model，不能再宣稱跨模型獨立驗證。[S23] |
| watcher | Bun、Git、`gh`、GitHub API/auth；reader URL parser 限 `github.com`。Babysit 明說公共 watcher 是 GitHub-specific，Origin 使用獨立 forge commands。[S10][S19][S20] |
| cleanup | Bash、Git、jq、rg、awk、sed、du、stat、date、xargs 等；有 GNU/BSD stat/date 分支，但沒有 PowerShell 實作。simulator 清理命令依賴 macOS Xcode `xcrun simctl`。[S21][S22] |
| 真實介面控制 | README 說明 `control-cli`、`control-ui`、`deslop` 在另一個 `cursor-team-kit` plugin。pstack 文件引用它們不表示安裝 pstack 已取得所有控制能力。[S1] |

## 8. 可移植至本 repo skills 的精簡優先清單

以下是**建議**，不表示本 repo 尚未實作。主 agent 應再與本地規則比對。

1. **環境契約五欄**：Launch、Doctor、Drive、Evidence、Cleanup；另外記錄 empty-state 初始化與 readiness。驗收至少實跑一輪，失敗也清理。[依 S3、S4]
2. **資源所有權與證據分離**：每 run 記錄自己建立的程序／端口／資料目錄；只清自己資源，保留 evidence。具體 registry 是移植設計，不是上游既有實作。[依 S3、S9]
3. **環境異常先 doctor，再有限重試**：分清環境失效、harness drift、產品 bug；只重啟失效部分，超限明確 blocked。[依 S4、S20]
4. **驗證綁定 SHA 與方法**：報告包含 commit、命令、預期／實際結果、證據位置；新 push 使舊 verdict 失效，gap 不算 pass。[依 S8、S14]
5. **先一個完整單位，再擴大並行**：先驗證 kickoff、環境、證據鏈可用，然後 fan-out；共享 UI 由單一 driver，寫入資源預先分配。[依 S4、S8、S9]
6. **有界且分類的重試**：借用 watcher 的結構化 verdict、error budget、退避與時間戳；採用時再補單次子程序 timeout，不能只靠外層 deadline。[依 S17–S19]
7. **依賴重用以 lockfile 指紋為起點**：沿用目標 repo 的 package manager；依環境加入 runtime／平台識別與共享安裝鎖，不另強迫導入 Bun。[依 S5–S7]
8. **清理分成 inventory 與 authorization**：保留上游「bucket 不等於許可」；修正空白路徑、untracked 誤判與 closed PR safe 分類後才考慮工具化。[依 S21、S22]

不建議照抄：Cursor tool/model 名稱、cloud→worktree 的等價假設、十條固定 live lanes、以 untracked=scratch 的刪除邏輯，以及將 watcher `READY`／status-only exit 0 當成完整合併授權。[S12][S17–S19][S21–S23]

## 來源索引

**以下每個 permalink 均固定 commit C = `c742dd61706fbacc1b95f1a20b7b988cf096ce6c`，查證日期均為 2026-11-01。** 文內每項結論以 S 編號對應原始碼／文件；相鄰編號範圍表示同時引用該範圍來源。沒有用其他同名專案代替。

- [S0 提交與刪除 orch 的版本證據](https://github.com/cursor/plugins/commit/c742dd61706fbacc1b95f1a20b7b988cf096ce6c)
- [S1 README](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/README.md)
- [S2 setup-pstack](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/setup-pstack/SKILL.md)
- [S3 create-verification-skill](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/create-verification-skill/SKILL.md)
- [S4 maintain-verification-skill](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/maintain-verification-skill/SKILL.md)
- [S5 bootstrap.ts](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/bootstrap.ts)
- [S6 tools package.json](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/package.json)
- [S7 bun.lock](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/bun.lock)
- [S8 Orchestrate](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/playbooks/orchestrate.md)
- [S9 separate-before-serializing-shared-state](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md)
- [S10 watcher 入口](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/watch-pr/watch-pr)
- [S11 poteto-mode](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/SKILL.md)
- [S12 check-plan.mjs](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/check-plan.mjs)
- [S13 tdd](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/tdd/SKILL.md)
- [S14 swarm](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/swarm/SKILL.md)
- [S15 watcher policy tests](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/watch-pr/policy.test.ts)
- [S16 watcher CLI tests](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/watch-pr/cli.test.ts)
- [S17 watcher CLI](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/watch-pr/cli.ts)
- [S18 watcher policy](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/watch-pr/policy.ts)
- [S19 GitHub reader](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/watch-pr/github.ts)
- [S20 Babysit](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/playbooks/babysit.md)
- [S21 worktree-audit.sh](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/scripts/worktree-audit.sh)
- [S22 worktree-cleanup](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md)
- [S23 Claude Code adapter](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/docs/harness/claude-code.md)
