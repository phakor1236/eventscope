# EventScope — PROGRESS

## Features(每個過三關才算完)

| # | Feature | 程式碼 | 三關 |
|---|---|---|---|
| F1 | 骨架+終端印出鏈上真事件 | ✅ 2026-07-09(撈到 DuelCreated #0) | 解釋✅(Q1Q2;Q3-5欠) 徒手✅(事件統計表) **辯護⏰明天開工第一件事,考完才碰 F2** |
| F2 | Postgres schema+寫入去重 | ✅ 2026-07-09(Neon 上線;兩跑驗證冪等 1→0;修雙重編碼 bug) | 微解釋站⏭️跳過,併入 7/16 場 |
| F3 | 斷點續掃迴圈(核心 20%) | ✅ 2026-07-09(交易性書籤;強殺重啟驗證不漏不重;殭屍程序課) | 微解釋站⏳待補 |
| F4 | API | ⬜ | |
| F5 | Dashboard | ⬜ | |
| F6 | 部署(Vercel+Railway/Render+Neon) | ⬜ | |

## 欠債清單(2026-07-09 節奏改 C 後重整)

1. **口說總驗收一場,日期=部署上線當天或 2026-07-16 先到者,不得再延**。
   內容合併:F1 解釋關 Q3-5(client/wagmi、分段掃、getLogs 參數)+ F1 辯護關
   3 題(Q1 已答 60 分,欠「節點的痛」追問)+ 各 feature 微解釋站抽查。
   (原欠債 #1 #2 併入此場;此場若再延=第 3 筆,全面停工還債。)

## 節奏(方案 C,2026-07-09 起)

- 教練連續蓋 F2→F6;每 feature 落地停 10 分鐘微解釋站(非正式關)。
- 部署後對核心 20%(首選 F3 斷點狀態機、次選 F2 冪等寫入)開 kata,
  進 eventscope/practice/,走 CLAUDE.md kata 模式,每題 5 問當場清。

## 備註

- 2026-07-09:發現 Sepolia 上 PriceDuel 從未有互動(nextId=0),director 用
  cast send 開了鏈上第一局(#0,0.001 ETH)當索引原料;順帶溫習 W6 keystore。
- 免費 RPC 限制:publicnode 拒歷史 getLogs;drpc 單次 ≤10,000 區塊 → probe 已分段掃。
