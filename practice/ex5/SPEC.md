# ex5 — 階梯二 L5:Webhook 收單器(換域決賽)

**練習核心**:鏈、區塊、tx_hash 全部消失。場景:你的後端收金流 webhook
(Stripe/PayPal 式)。這類服務的送達保證是 **at-least-once**——同一筆付款
通知可能重送你兩三次(網路重試、對方超時重發)。**重複入帳=多記客戶的錢=事故。**
同一套冪等設計,全新的衣服——這題過了,才算模式真的長在你身上,
而不是背熟了「區塊鏈題」。

## ⚠️ 這是核心 20%:碰錢的邏輯

`totalCents()` 出來的數字會對到真實帳務。所有不變量圍著錢轉。

## 領域對照(自己完成翻譯,這就是 L5 的考點)

| 原本(indexer) | 這題(收單器) |
|---|---|
| 事件 EventRow | 付款通知 PaymentNotice |
| 鏈+交易+順位 三零件 | **provider + event_id 兩零件** |
| insert 兩本帳 | `record` 回 `{ accepted, duplicates }` |
| 庫 | 帳本(ledger) |

## 行為規則(測試都會打)

1. `record(batch)`:收一批通知,冪等入帳,回 `{ accepted, duplicates }`。
2. 身分證=兩零件 `(provider, event_id)`:同 id 不同 provider 是兩筆
   (Stripe 和 PayPal 的流水號空間各自獨立)。
3. first-write-wins:重送的通知就算金額不同,**帳本以第一次為準**。
4. `has(provider, eventId)`:這張單收過沒。
5. `totalCents()`:帳本裡所有 `amount_cents` 加總——**重送不得讓它變多**。
6. 空批 → `{ 0, 0 }`。
7. **分隔符深水區**:兩個零件都可能含 `-`——`event_id` 如 `"evt-2024-001"`、
   provider 如 `"pay-pal"`。保證只有:小寫字母、數字、`-` 三種字元。
   `("pay", "pal-9")` 和 `("pay-pal", "9")` 必須是兩筆——
   想想:分隔符的資格是什麼?哪些字元有資格、哪些已經失格?

## 必須維持的不變量

1. `accepted + duplicates === batch.length`。
2. 歷次 `accepted` 加總 === `count()`。
3. **`totalCents()` === 帳本裡每筆 `amount_cents` 的加總,重送零影響**。
4. 已入帳的單永不被改寫。

## 怎麼跑

```
cd D:\web3-projects\eventscope\practice\ex5
npm install   (第一次)
npx vitest    (看守模式)
```

規矩照舊:不准開 ex1–ex4 抄。

---

## 練習紀錄(教練驗收後填)

- 日期:
- 卡住的位置:
- 口試狀態:
