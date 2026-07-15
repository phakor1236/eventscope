# DECISIONS

> 家規:每個 director 拍板的決策記一筆 —— 日期、選項、選擇、理由。

## 2026-07-09 — Go 學習:B(延後,錨定 EventScope 部署後)

- 選項:A) 7/16 口說驗收後再議 B) 排進未來+具體錨點(EventScope 部署完成後,
  用 Go 重寫 indexer 核心當 kata L5 換域題)C) 現在就並行
- 選擇:**B**
- 理由:Go 對海外遠端(尤其 web3 infra:geth/Cosmos/indexer)有實質需求,但 TS
  還在還債期、在途工作滿到 7/16;錨在已懂的 indexer 領域上起步,不從 tutorial 開始
- 學習方式(director 指定):比照 ts-drills 題庫式——先背語法肌肉,vitest 型
  紅變綠小題,不從大專案硬啃

## 2026-07-09 — F2 schema:通用單表

- 選項:通用單表(events+checkpoints,args 存 JSONB,tx_hash+log_index 唯一鍵)/
  每事件一表(六張型別化)/ 混合(通用表+熱欄位索引)
- 選擇:**通用單表**
- 理由:Phase 2 接新合約零遷移;冪等鍵天然;JSONB 查詢夠撐 MVP dashboard;
  混合式=提前優化,遇到查詢痛點再升級

## 2026-07-09 — F6 部署:GitHub public + Vercel(web)+ Railway(indexer)

- 選項:repo 先 private 再轉 / 直接 public;indexer 上 Railway / GitHub Actions 排程 / Render
- 選擇:**直接 public;Railway**
- 理由:履歷用途終究公開,commit 歷史本身是資產;Railway 給真長駐 daemon 的履歷敘事,
  試用額度內免費(Actions 排程留作免費備案)

## 2026-07-09 — F4/F5 組裝:Next.js 一體式

- 選項:Next.js 一體式(API routes+dashboard 同 app,Vercel 一次部署)/
  獨立 API 服務(Hono/Express 隨 indexer 住 Railway)
- 選擇:**Next.js 一體式**
- 理由:水管沿用 FlipSide 的 Next 經驗、少一個部署面、免 CORS;
  indexer 仍獨立跑 Railway(Vercel 跑不了長駐)

## 2026-07-09 — 節奏改方案 C:教練連續蓋產品,學習主通道改 kata

- 選項:A) 照舊逐 feature 三關 B) 教練直衝蓋完再總驗收 C) 連續蓋+每 feature
  10 分鐘微解釋站+部署後 kata 徒手重寫核心+口說濃縮一場排死日期
- 選擇:**C**。director 原話「主要我是想先寫 code 練習,後續再看 code 練習口說」
- 理由:實證他用手學得快(Day1 一晚 12 題、ex5 徒手通關)、口試連逃五次;把學習
  主力放進強通道,口說減量但排死(部署日或 2026-07-16 先到者)
- 同時拍板:kata 教練提示詞寫進 D:\web3-projects\CLAUDE.md(practice/ 或「開 kata」
  觸發);新 kata 面試題每題 5 最後清攢大考，以livecode能力為優先

## 2026-07-11 — kata 改深度優先:一座階梯 L1–L5 全清才換下一座

- 選項:A) 每核心挑一級,三核心全覆蓋(教練原設計,廣度)B) 整座階梯練完再換(深度)
- 選擇:**B**。director 拍板
- 盤點:階梯一=FlipSide 託管 ex1–ex5 ✅(程式碼關全過;口試凍結另計);
  **階梯二=EventScope 冪等寫入,L2 ✅(Map store),餘 L1/L3/L4/L5**;
  階梯三=斷點續掃(階梯已出,擱置);階梯四=聚合 SQL(未出)
- 代價(教練聲明,director 知悉):7/16 前斷點/SQL 兩核心可能碰不到,
  口試堆疊條款照舊

## 2026-07-11 — kata 口試改制:live coding 優先,口試併入 7/16

- 選項:A) 維持「每題 5 問當場清帳」 B) 口試延後、live coding 連打 C) 廢除口試
- 選擇:**B**。director 原話「我想以 live coding 為優先 口試後面再補」(同日三次
  重申,並親手修改 7/9 條款文字)
- 實施:kata 口試不再擋下一題;**全部併入 7/16 口說總驗收那一場**,不逐筆記欠債
- 教練聲明的代價(director 知悉):7/16 變大考(F1 Q3-5+辯護+微解釋站+ex1 5 問
  +後續每題 kata 口試堆疊);口試未清前 kata 各題=程式碼關過但**未完成、不進履歷**
  (比照 FlipSide kata 線條款);**「7/16 不得再延、再延=第 3 筆全面停工」條款不動**

## 2026-07-09 — 專案選題:C(索引器+Dashboard)

- 選項:A) ex5 託管長成 dApp B) 純全端 SaaS C) 鏈上事件索引器+Dashboard
- 選擇:**C**,並套家規(教練模式、三關驗收)練習
- 理由:補全端後端拼圖(DB/API),整條 TS 練語法肌肉,「全端 dApp 工程師」履歷敘事最完整

## 2026-07-09 — 數據源:FlipSide 優先,第二合約鎖 Phase 2

- 選項:只接 FlipSide / 只接公開大合約 / 兩個都接
- 選擇:**兩個都接**,但教練加紀律:Phase 1 只接 FlipSide,MVP 上線前不碰第二個
- 理由:自己的合約故事完整;第二合約逼架構通用化,但範圍風險要用 phase 鎖住

## 2026-07-09 — 索引器:自寫 TS 服務

- 選項:自寫 TS(viem getLogs)/ Ponder / The Graph subgraph
- 選擇:**自寫**;subgraph 降級為 Phase 2 加菜(同 repo 對照)
- 理由:GitHub 履歷要的是能逐行辯護的碼;The Graph 會讓 Postgres 決策作廢、
  mapping 是 AssemblyScript 練不到 TS;「兩種都做過」的對照寫進 README 更值錢

## 2026-07-09 — spec v0.1 生效 / 專案名 / PG hosting(director 授權教練代決)

- director 原話「你決定啊」,教練代拍:**spec v0.1 照走、名=eventscope、Postgres=Neon 免費層**
- 理由:名字描述性夠當 repo 名;Neon 零安裝且部署沿用同一顆
- 附帶約定:dashboard 頁面設計 director **不必提供**,F5 動工時教練出 2-3 個
  線框圖選項給 director 挑(他想自己畫也歡迎,不擋路)

## 2026-07-09 — 資料庫:Postgres

- 選項:SQLite / Postgres
- 選擇:**Postgres**
- 理由:業界標準、面試分量;代價是環境設置成本(hosting 待拍板:Neon vs 本機)

## 2026-07-14 — 階梯三降速 + ts-drills D3 改「階梯零件包」(director 拍板)

- 背景:階梯三每階=全新工程概念(邊界算術/crash 原子性/故障隔離),
  落差比階梯二大;ex6 過(11/11)、ex7 過(8/8,三輪修正),ex8 開頭即卡,
  director 反映「每題都想很久還是不會」
- 選項:A 切去 drills D3 換腦 / B 停在 ex8 慢啃 / C 照原計畫硬上 /
  D(director 自提)把 D3 出成「階梯三零件拆解包」
- 選擇:**D**——D3 十題 = async 官方主題 × ex6/7/8 卡點各拆一顆獨立小題,
  練完回頭組裝 ex8;L4/L5 順延,「今日清完階梯三」目標作廢
- 理由:ex8 的 try/catch 對他是全新語法,先練零件再組裝;且真實 indexer
  本來就是 async,kata 同步版是教學降噪,D3 補回真貨

## 2026-07-14 — kata 鷹架格式 v2(director 拍板,檢討會產物)

- 背景:階梯三全綠但過程卡爆。檢討結論:ex1-5 的 TODO=一個動作,ex6-10 的
  TODO=一條流水線,顆粒度差五倍;且劇本三次都是「卡死後救場」而非開場配備
- 選項:A 組裝題內建中文劇本格線 / B 一律拆小 TODO 函數 / C 原樣但救援提前
- 選擇:**A+**(director 三答定調:①題量以 ex9 為天花板,超過就拆(融合 B)
  ②每行劇本標「要調用的工具」與「新語法」③劇本印進函數裡,翻譯本身=思考)
- 代價補償:組裝題口試必考「為什麼是這個順序/兩行對調會死在哪」,把被鷹架
  代勞的排程能力考回來
- 此條修訂 CLAUDE.md kata 模式「不給實作步驟」:組裝題的中文劇本格線不算
  實作步驟(程式碼仍全由 director 手寫);零件題維持零步驟

## 2026-07-14 — 修法:廢除口試釘死條款(director 拍板)

- 背景:7/16 口試袋兩日內暴增至 50+ 問;director 提出延期並專注 live coding,
  教練提「7/16 照考核心場精選版」對案
- 選項:A 照考核心場版 / B 延期(觸發第 3 筆停工還債) / C 修法廢除釘死條款
- 選擇:**C**——2026-07-09「口說總驗收 7/16 釘死不得再延」與「欠 3 筆全面停工」
  機制正式廢除
- 新制(教練擬,director 未反對即生效):口試改**分期自由制**——教練每天開場
  提議 3 題、director 可拒;無 deadline、無停工罰則
- **保留條款:「口試未清=該題不進履歷」不受此次修法影響**——這不是罰則,
  是品質定義:不能辯護的碼不算自己的
- 教練立場記錄在案:此機制 7/11 曾有效執行過一次;廢除後唯一計分板=履歷解鎖

## 2026-07-15 — 修法:廢除「口試未清=不進履歷」+ 資產全數上架(director 拍板)

- 背景:tsd Day4 全綠後 director 定調求職優先序:「web3 是目的地,TS/Go/合約
  是門票」;最快拿到全遠端工作(不限 web3)優先於等資產「口試解鎖」
- 選項:A 照舊(清完口試才上履歷) / B 廢除限制,資產全上架
- 選擇:**B**——FlipSide、EventScope、Watchlist 全數視為可展示資產,
  立即整理 GitHub 門面與履歷,不再受口試進度阻擋
- 教練異議在案:FlipSide Q1-b(重入攻擊徒手步驟)與口試袋屬面試必考題,
  帳不消失,改列「面試準備題庫」在投遞前清
- 連動:7/14 分期自由制(每日 3 題可拒)照舊,唯一計分板從「履歷解鎖」
  改為「面試答得出來」

## 2026-07-15 — 求職作戰計畫拍板(director)

- 選項:路線 A 黑客松 / B 一般 TS 遠端+AI 整合 / C 接案;Go=1 換觸發點 / 2 低劑量並行 / 3 全力
- 選擇:**AB 並行 + C 暫緩;director 加碼日投入 4hr→8hr,Go 因此收進日課表
  (每天 1hr 題庫式,原「部署後才開」觸發點提前);英文口說聽力高強度**
- 全計畫落檔:`D:\web3-projects\JOB-HUNT-PLAN.md`(日課表 8hr、週次里程碑、
  面試題庫優先序、KPI:第一封履歷 ≤7/27)
- 理由:web3 是目的地不是第一跳;黑客松兼收入可能(獎金按樂透紀律);
  8hr 使 Go 並行不再擠壓英文/AI 時段

## 2026-07-15(晚)— 三週期制修訂 + 目標階層釐清(director 拍板)

- 目標釐清:director 定調「最大目的=全遠端國外工程師,技術不拘」——web3
  非夢想本體,是已投資的載具/題材。教練先前「web3 是目的地」的理解作廢
- 選項:A 英文衝刺週期(限期+出口驗收) / B 課表照跑英文加倍
- 選擇:**A**——P1 英文衝刺 3 週(7/16–8/5,英文 5hr+tech 2hr)→ P2 求職
  課表 → P3 投遞期;出口驗收三項(無稿講 FlipSide 3 分/聽力複述/15 分英文
  mock 含 live coding,併 ts-drills Day7)
- tech 2hr 內容(director 提案「TS 全端+LLM harness agent 用 kata 做」,教練補結構):
  Day5/6 收尾 → LLM kata L1–L5(FakeLLM 測試,L2 tool-use 狀態機與 L4 權限
  gate=核心 20%,L5=EventScope NL→SQL 落地);**go-drills 衝刺期暫停**回 P2
- 開投改**雙漏斗**:web3 缺+一般 TS 缺同投(資產同一份,只差 job board)
- 練習題原則:技能=全端通用,題材=沿用自有專案(有感學得快),隨時可換
- KPI 順延:第一封履歷 7/27 → **8/10**
- 防死背方法入法:無稿骨架法(5 關鍵詞現場重組)、講自有內容、禁背答案稿
- 中繼站(外商在台/亞太)未開啟;P3 超時教練重提
