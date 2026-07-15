# ex3 — 階梯二 L3:多鏈時代(身分證從兩零件變三零件)

**練習核心**:indexer 升級成同時吃多條鏈(Sepolia + mainnet + L2...)。
`tx_hash` 只在**單一條鏈上**保證唯一——兩條鏈完全可能出現同一組
`(tx_hash, log_index)`,它們是**兩筆不同的事件**,誰都不准擋誰。
資料形狀、鑰匙設計、`has` 的簽名全部跟著改。

## 與 ex2 的差異

| | ex2 | 這題 |
|---|---|---|
| 事件欄位 | 六欄 | **多一欄 `chain_id: number`** |
| 身分證 | `(tx_hash, log_index)` | **`(chain_id, tx_hash, log_index)` 三零件** |
| `has` 簽名 | 兩個參數 | **三個參數** `has(chainId, txHash, logIndex)` |
| 回傳兩本帳 | `{ added, skipped }` | 照舊(L1 的成果繼承) |

## 行為規則(測試都會打)

1. `insert(batch)` 回傳 `{ added, skipped }`,規則同 ex2。
2. **跨鏈不相撞(靈魂)**:同 `(tx_hash, log_index)` 但 `chain_id` 不同
   → 兩筆各自入庫,都算 added。
3. **同鏈才算重複**:三個零件全相同才會被 skip。
4. first-write-wins 照舊(以三零件身分證為準)。
5. 鑰匙黏三個零件,**分隔符陷阱升級**:zoneId 10 + tx "xa" 和
   zoneId 1 + tx "0xa" 這種邊界,黏錯就相撞。
6. 空批 → `{ 0, 0 }`,庫不動。

## 必須維持的不變量

1. `added + skipped === batch.length`(繼承 L1)。
2. 歷次 `added` 加總 === `count()`。
3. 庫裡筆數 = 出現過的不同 `(chain_id, tx_hash, log_index)` 數。
4. 已存資料永不被改寫。

## 怎麼跑

```
cd D:\web3-projects\eventscope\practice\ex3
npm install   (第一次)
npx vitest    (看守模式)
```

規矩照舊:不准開 ex1/ex2 抄,徒手重寫;語法可看 ex1 武器速查。

---

## 練習紀錄(教練驗收後填)

- 日期:2026-07-11,**程式碼關 12/12 全綠**(骨架全程自建,零求救;拆解起手式生效)
- 卡住的位置:
  - 想找「判斷 chain_id 的 if」——概念修正:辨識零件寫進鑰匙,不寫成判斷
  - 鐵律進階坑:has 問三零件、insert 存兩零件(存/問鑰匙零件數不齊),6 紅自己修
- 口試狀態:**5 問未出,併入 7/16。清完前不進履歷。**
