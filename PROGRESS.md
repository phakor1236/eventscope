# EventScope — PROGRESS

## Features(每個過三關才算完)

| # | Feature | 程式碼 | 三關 |
|---|---|---|---|
| F1 | 骨架+終端印出鏈上真事件 | ✅ 2026-07-09(撈到 DuelCreated #0) | 🔄 解釋關進行中 |
| F2 | Postgres schema+寫入去重 | ⬜ | |
| F3 | 斷點續掃迴圈(核心 20%) | ⬜ | |
| F4 | API | ⬜ | |
| F5 | Dashboard | ⬜ | |
| F6 | 部署(Vercel+Railway/Render+Neon) | ⬜ | |

## 欠債清單

1. 2026-07-09:F1 解釋關只過 Q1、Q2(Q3 client/wagmi 關係、Q4 分段掃、Q5 getLogs
   參數未答),他要求直接進徒手關。辯護關撿回來考。(1/3)

## 備註

- 2026-07-09:發現 Sepolia 上 PriceDuel 從未有互動(nextId=0),director 用
  cast send 開了鏈上第一局(#0,0.001 ETH)當索引原料;順帶溫習 W6 keystore。
- 免費 RPC 限制:publicnode 拒歷史 getLogs;drpc 單次 ≤10,000 區塊 → probe 已分段掃。
