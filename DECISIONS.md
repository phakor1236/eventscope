# DECISIONS

> 家規:每個 director 拍板的決策記一筆 —— 日期、選項、選擇、理由。

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
