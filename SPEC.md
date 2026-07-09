# EventScope — 鏈上事件索引器 + Dashboard(spec v0.1,待拍板)

> 目的:GitHub 作品集項目。展示「全端 dApp 工程師」的後端拼圖:
> 自寫 TS 索引服務把鏈上事件搬進 Postgres,API 供應,前端圖表呈現。
> 每一行碼都要能在面試中辯護。

## 一句話

監聽 FlipSide(PriceDuel @ Sepolia)的鏈上事件,持續寫入 Postgres,
用一頁 dashboard 回答:「我的產品上發生了什麼?」

## MVP(Phase 1)— 只有這五件事

1. **Indexer(TS + viem)**:輪詢迴圈 —— 從斷點區塊 `getLogs` → 解碼 →
   寫 DB → 推進斷點 → 睡 → 重複。重啟能從斷點續掃;同一筆事件寫兩次
   要被擋掉(以 `txHash + logIndex` 唯一鍵去重)。
   【這是核心 20%:斷點狀態機 + 冪等寫入。徒手 kata 候選。】
2. **Postgres schema**:事件表 + 斷點表。(schema 設計 = 資料模型決策,
   動工前另開提案拍板。)
3. **API**:唯讀端點 —— 事件列表(分頁)+ 統計聚合(給圖表用)。
4. **Dashboard**:一頁。對局數量走勢、押注量、事件流水。
5. **部署上線**(家規完成定義):dashboard(Vercel)+ indexer(Railway/
   Render 長駐)+ 雲端 Postgres。真實可訪問 URL。

## 索引目標(Phase 1 只有這一個合約)

PriceDuel @ Sepolia `0x769D...B7AF`,六個事件:

| 事件 | 欄位 |
|---|---|
| DuelCreated | id, creator, dir, stake, duration |
| DuelJoined | id, opponent, startPrice, endTime |
| DuelResolved | id, winner, startPrice, endPrice |
| DuelCancelled | id, creator, stake |
| PotClaimed | id, winner, amount |
| RefundClaimed | id, party, amount |

## Phase 2(加菜,MVP 五件事全部上線前不准碰)

- 接第二個(公開)合約 —— 架構要為此留縫,但不提前抽象。
- 同 repo 補迷你 subgraph(`subgraph/`),README 寫「自寫 vs The Graph 取捨」。

## 明確不做(Non-goals)

多鏈、WebSocket 即時推播、登入/auth、主網歷史全量回填、告警通知。

## Done 定義(家規)

- [ ] 真實可訪問 URL(dashboard 讀的是線上 indexer 餵的真資料)
- [ ] README:架構圖 + 設計決策表(從 DECISIONS.md 整理)
- [ ] 對外貼文草稿一篇(發文由 director)

## Feature 切法(一次一個,每個過三關)

| # | Feature | 驗收 |
|---|---|---|
| F1 | 骨架:repo + TS 環境 + 讀到鏈上第一筆 log(print 出來) | terminal 看到真事件 |
| F2 | DB schema(先提案拍板)+ 寫入與去重 | 重跑不重複 |
| F3 | 斷點續掃迴圈(核心 20%) | 殺掉重啟,不漏不重 |
| F4 | API 端點 | curl 拿到 JSON |
| F5 | Dashboard 一頁 | 本地看到真數據圖表 |
| F6 | 部署三件套 | 線上 URL 全通 |

## 待拍板(spec 生效前要答的)

1. **這份 spec 本身**:範圍、切法、Done 定義,OK 嗎?
2. **專案名**:`eventscope` / `chainpulse` / 你取 —— 定了就是 GitHub repo 名。
3. **Postgres 跑哪**:
   - **Neon 免費層(建議)**:雲端 serverless PG,零安裝,部署時直接沿用同一顆,少一次搬家。
   - 本機安裝:離線可用,但 Windows 裝 PG 有環境坑,部署時還要再搬雲端。
