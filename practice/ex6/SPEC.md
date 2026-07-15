# ex6 — 階梯三 L1:確認深度(reorg 緩衝帶)

**練習核心**:`src/indexer.ts` 的 `catchUp` 迴圈——書籤在哪、掃到哪、怎麼分段。
L1 的變化:掃描上限不再是鏈頭,而是 **鏈頭 − confirmations**(最近 N 個區塊
視為未定,先不掃,等鏈長高了自然變安全再補)。邊界算錯一格=漏帳或掃到未定區。

## ⚠️ 這是核心 20%:狀態機+一致性

書籤(checkpoint)是整個 indexer 的斷點狀態。規則只有一條方向:
**書籤只准前進或不動,永不倒退。**

## 與原版的差異(背原始碼在這裡會死)

| 原版 indexer.ts | 這題 |
|---|---|
| `bigint` | `number`(簡化,考點不在這) |
| `CHUNK_SIZE = 9_999`,`to = from + CHUNK_SIZE`(跨度) | `chunkSize` = **單次呼叫最多涵蓋幾個區塊(含頭尾)**,語義不同,off-by-one 自己重推 |
| 掃到 `latest` | 掃到 `latest - confirmations` |
| async/await + 真 RPC | 同步呼叫 + FakeChain(它會記錄你每次 getLogs 的範圍,測試靠這個驗你的分段) |
| Postgres 交易 | `Store.commit(logs, scannedTo)` 一次呼叫=模擬「同一筆交易」 |

## 行為規則(測試都會打)

1. `catchUp(chain, store, { chunkSize, confirmations })`:從書籤下一格掃到
   安全上限,分段拉 logs,**每段一次 `commit`**(落庫+書籤推進同進退)。
2. 安全上限 = `chain.getBlockNumber() - confirmations`。
3. `confirmations = 0` → 行為退回原版:掃到鏈頭。
4. 確認深度內的區塊**不是丟掉,是晚點掃**:鏈長高後再跑一次 `catchUp`,
   之前跳過的區塊要補進來,一筆不漏。
5. 分段:段與段首尾相接,不留 gap、不重疊,每段涵蓋區塊數 ≤ `chunkSize`。
   FakeChain 對「from > to」和「to > 鏈頭」都會直接 throw——打到就是你的邊界錯。
6. **深水區**:安全上限落在書籤後面時(例:書籤 95、鏈頭 100、confirmations 10
   → 安全上限 90),整趟必須 no-op——不准呼叫 getLogs,**書籤更不准被拉回 90**。
   `Store.commit` 不做防呆,書籤倒退=你的 bug。

## 必須維持的不變量

1. 書籤永不倒退。
2. 永不掃超過安全上限(getLogs 的 to ≤ head − confirmations)。
3. 書籤之前的每個區塊都掃過(no gap)。
4. 每段的 logs 落庫與書籤推進在同一次 `commit` 完成。

## 怎麼跑

```
cd D:\web3-projects\eventscope\practice\ex6
npm install   (第一次)
npx vitest    (看守模式)
```

規矩照舊:不准開 src/indexer.ts 或 ex1–ex5 抄。

---

## 練習紀錄(教練驗收後填)

- 日期:2026-07-14,11/11 一次過
- 卡住的位置:起步卡在讀不懂抽象註解——重寫成「工具箱 4 句+做完後世界的樣子+
  三個帶數字例子」後自己推完 off-by-one 與守門邊界,核心迴圈零卡
- 口試狀態:堆 7/16(+1 題:early return 與 while 條件同尺,刪掉行為變嗎)
