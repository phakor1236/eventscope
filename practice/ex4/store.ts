// ex4 — UPSERT 登場:insert(DO NOTHING)與 upsert(DO UPDATE)同住。
// insert / has 送你(你已三度徒手通關)。你只准動一個 TODO:upsert。
// 規矩:不准開 ex1–ex3 抄。

export type EventRow = {
  chain_id: number;
  contract_addr: string;
  event_name: string;
  args: Record<string, unknown>;
  block_number: string;
  tx_hash: string;
  log_index: number;
};

export type InsertReport = {
  added: number;
  skipped: number;
};

export type UpsertReport = {
  added: number;
  updated: number;
};

export class MemoryEventStore {
  private rows = new Map<string, EventRow>();

  /// 職責:這是「核心 20%」——UPSERT 語義,碰到既有資料的改寫路徑。
  /// 不變量:
  ///  - 沒收過的鍵:整筆存入,記 added(與 insert 相同)
  ///  - 收過的鍵:**只更新 args**,其他欄位保留庫裡那筆的值
  ///    (出生事實不可變:block_number / event_name / ... 誰都不准動)
  ///  - added + updated === batch.length
  ///  - upsert 永不改變 count()裡「誰在庫裡」的名單
  upsert(batch: EventRow[]): UpsertReport {
    // TODO
    let added = 0;
    let updated = 0;
    for (const i of batch){
      const key = this.keyOf(i);
      const old = this.rows.get(key);
      if (!old){
        this.rows.set(key,i);
        added++;
      } else{
        const newRow: EventRow = {
          ...old,
          args: i.args,
        };
        this.rows.set(key, newRow);
        updated++;
      }
    }

    return {added, updated};
  }

  // ---- 周邊:已寫好,不要動 ----

  /// insert = ON CONFLICT DO NOTHING(你在 ex2/ex3 徒手寫過的版本)
  insert(batch: EventRow[]): InsertReport {
    let added = 0;
    let skipped = 0;
    for (const r of batch) {
      if (!this.has(r.chain_id, r.tx_hash, r.log_index)) {
        this.rows.set(this.keyOf(r), r);
        added++;
      } else {
        skipped++;
      }
    }
    return { added, skipped };
  }

  has(chainId: number, txHash: string, logIndex: number): boolean {
    return this.rows.has(`${chainId}-${txHash}-${logIndex}`);
  }

  /// 造鑰匙的唯一出口(存和問同一套規則的正式解法——你 ex1 問過的那個問題)
  private keyOf(r: EventRow): string {
    return `${r.chain_id}-${r.tx_hash}-${r.log_index}`;
  }

  count(): number {
    return this.rows.size;
  }

  all(): EventRow[] {
    return [...this.rows.values()];
  }
}

// ============================================================
// 武器速查(純語法;名字跟本題無關,組裝是你的事)
//
//   const pet = zoo.get("amy");        // 拿出庫裡那筆;沒有則 undefined
//   const fixed = { ...oldCat, tail: newCat.tail };
//     // ↑ Day1 mergeRound 那招:以 oldCat 為底,只換 tail 欄位
//
// HINTS(卡 15 分鐘才看):
//   「更新」那條路的三步:拿出舊的 → 造一筆「舊底新內容」→ set 回同一把鑰匙。
//   誰是底、誰是新?想想「出生欄位保護」是保護誰的。
// ============================================================
