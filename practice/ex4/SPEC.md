# ex4 — 階梯二 L4:UPSERT 登場(新增不變量:更新不換人)

**練習核心**:store 要同時提供兩種語義——
原本的 `insert` = Postgres 的 `ON CONFLICT DO NOTHING`(first-write-wins),
新的 `upsert` = `ON CONFLICT DO UPDATE`(重複鍵→**更新內容**)。
真實動機:鏈上事件本身不可變(insert 夠用),但 indexer 常要存「衍生資料」
(如某局的最新賠率快照)——同一鍵反覆來,要的是**最新值**,不是第一版。

## 與 ex3 的差異

| | ex3 | 這題 |
|---|---|---|
| 方法 | `insert` / `has` | **多一個 `upsert`**(insert/has 已寫好送你) |
| 重複鍵 | 整筆丟棄 | `upsert`:**args 更新成新的**,其他欄位不動 |
| 回傳 | `{ added, skipped }` | `upsert` 回 **`{ added, updated }`** |

## `upsert` 的行為規則(測試都會打)

1. 鍵照舊三零件 `(chain_id, tx_hash, log_index)`。
2. 沒收過的鍵 → 整筆存入,記 `added`(跟 insert 一樣)。
3. 收過的鍵 → **只更新 `args` 欄位**,記 `updated`;
   **其他欄位(block_number、event_name...)保留第一筆的值**——
   出生事實不可變,這是新增的安全不變量。
4. 同批內同鍵出現兩次:第一次 added,第二次 updated(同批也算更新)。
5. `insert` 和 `upsert` 可以混用,各自的語義不互相污染:
   insert 遇到重複照樣整筆丟(args 也不更新)。
6. 空批 → `{ added: 0, updated: 0 }`。

## 必須維持的不變量

1. **upsert 永不改變「誰在庫裡」**:任何操作序列後,
   `count()` === 出現過的不同三零件鍵數(更新不新增、不刪除)。
2. `added + updated === batch.length`(每筆恰好記一本帳)。
3. 歷次(insert 的 added + upsert 的 added)加總 === `count()`。
4. **出生欄位保護**:一個鍵的 `block_number` 在第一次寫入後永不改變,
   不管後續 upsert 帶什麼值來。

## 怎麼跑

```
cd D:\web3-projects\eventscope\practice\ex4
npm install   (第一次)
npx vitest    (看守模式)
```

規矩照舊:不准開 ex1–ex3 抄。
本題新語法零件:`map.get(鑰匙)`(拿出庫裡那筆)和 spread 合併
(Day1 第 11 題 mergeRound 你自己寫過的那招)。

---

## 練習紀錄(教練驗收後填)

- 日期:2026-07-11,**程式碼關 12/12 全綠**
- 卡住的位置:
  - 鐵律第三種踩法:存用 keyOf、問用裸 tx_hash(一邊官方出口一邊手寫)
  - 「更新」路第一版只記帳沒做事(三步舞缺席)→ 中文劇本六句後自己翻譯完成
  - `map.get` 是 Map 原生第三招這件事是現學(找不到「get 函數」)
- 口試狀態:**5 問未出,併入 7/16。清完前不進履歷。**
