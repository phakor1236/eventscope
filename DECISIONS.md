# DECISIONS

> 家規:每個 director 拍板的決策記一筆 —— 日期、選項、選擇、理由。

## 2026-07-09 — F2 schema:通用單表

- 選項:通用單表(events+checkpoints,args 存 JSONB,tx_hash+log_index 唯一鍵)/
  每事件一表(六張型別化)/ 混合(通用表+熱欄位索引)
- 選擇:**通用單表**
- 理由:Phase 2 接新合約零遷移;冪等鍵天然;JSONB 查詢夠撐 MVP dashboard;
  混合式=提前優化,遇到查詢痛點再升級

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
  觸發);新 kata 面試題每題 5 問當場清,不准攢大考

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
