# ex9 — 階梯三 L4:書籤單調+回捲令

**練習核心**:這次不寫掃描迴圈,寫**庫本身**。前三題的 store 都是我送你的、
它傻傻聽話——這題你來當庫的守門人,把不變量做進 API 裡:

> **書籤只准往前。唯一例外是 `rewind`(回捲令),而回捲必須連帶銷毀證據,
> 否則重掃會造出幽靈帳(同一筆事件兩個版本並存=雙重入帳)。**

## ⚠️ 這是核心 20%:reorg 應對

真實場景:鏈重組(reorg)後,你發現書籤 100 之前的第 91~100 塊被鏈改寫了——
庫裡那段的 events 是**作廢的歷史**。處理法=回捲書籤到 90、刪掉 >90 的 events、
讓掃描迴圈自然重掃 91~100 的新版本。

## 先看電影(具體數字走一遍)

```
new RewindableStore(1)                → 書籤 = 0,庫空
commit([log92, log96], 100)           → 書籤 = 100,庫 2 筆
commit([...], 80)   ← 倒退!          → 💥 throw;書籤仍 100、庫仍 2 筆(原封不動)
rewind(90)                            → 書籤 = 90;log92、log96 被刪(>90 作廢)
                                        ※ 若有 log90,它是 ≤90,活著
commit([log96v2], 100)                → 書籤 = 100,庫裡只有新版 log96v2
                                        ← 沒有幽靈:舊 log96 早在 rewind 時銷毀
rewind(150)  ← 往前不叫回捲           → 💥 throw(rewind 不是快轉鍵)
```

## 行為規則

1. `commit(logs, scannedTo)`:`scannedTo` 必須**大於**現書籤,否則 `throw new Error(...)`,
   且**庫和書籤一根毛都不准動**。合法時:logs 落庫、書籤=scannedTo。
2. `rewind(toBlock)`:`toBlock` 必須**小於**現書籤,否則 throw。合法時:
   書籤=toBlock,且 `blockNumber > toBlock` 的 events 全部刪除;
   **`blockNumber === toBlock` 的保留**(它在安全線上)。
3. 被拒絕的呼叫(commit 或 rewind)之後,store 要能繼續正常工作。

## 對應表(這步=你哪題寫過)

| 這題的哪步 | 你在哪裡寫過 |
|---|---|
| 「先檢查、再動手,拒絕時原封不動」 | ex7 的靈魂(先寫暫存檔才 rename);順序反了=這題的炸點 |
| 自己當丟錯的人 `throw new Error("...")` | D3 題 7 你接過別人丟的,這次換你丟 |
| 從陣列裡刪掉一批(留下想要的) | Day1 的 `filter`:留下 = 條件為 true 的 |
| 推進書籤、push logs | ex6/ex8 的 commit 你呼叫過幾十次,這次寫它的內臟 |

## 不變量(測試都會打)

1. 任何時刻書籤只會:往前(commit)、明令往回(rewind)、不動(被拒絕)。
2. 被拒絕的呼叫零痕跡——**先檢查再動手,順序就是生死**。
3. rewind 後,庫裡不存在 `blockNumber > 書籤` 的 event(幽靈帳=0)。

## 怎麼跑

```
cd D:\web3-projects\eventscope\practice\ex9
npm install   (第一次)
npx vitest    (看守模式)
```

規矩照舊:不准開 ex1–ex8 抄。

---

## 練習紀錄(教練驗收後填)

- 日期:2026-07-14,9/9(兩輪修正)
- 卡住的位置:概念層零卡(check-then-act、filter 邊界、守門方向全一次對);
  修的全是字元級:`logs.push(...logs)` 自我複製、`this.logs` 欄位名接錯
  (庫的貨架叫 events)、`==` 當 `=` 用、rewind 守門漏擋等號
- 口試狀態:堆 7/16(必考:為什麼被拒絕的 commit 連 events 都不准留?
  「先檢查再動手」和 ex7 的 write-temp-then-rename 是同一個思想的哪個面?)
