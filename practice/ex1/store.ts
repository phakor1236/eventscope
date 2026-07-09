// ex1 — MemoryEventStore:用 Map 親手實作冪等寫入。
// 周邊(型別、count、all)已寫好。你只准動兩個 TODO:insert / has。

export type EventRow = {
  contract_addr: string;
  event_name: string;
  args: Record<string, unknown>;
  block_number: string;
  tx_hash: string;
  log_index: number;
};

export class MemoryEventStore {
  // 庫本體:一個 Map。鍵的形狀由你決定(這是本題的核心設計)。
  private rows = new Map<string, EventRow>();

  /// 職責:收一批事件,冪等地存入,回傳「這次真正新增的筆數」。
  /// 不變量:
  ///  - 同一個 (tx_hash, log_index) 永遠只存第一次來的那筆(first-write-wins),
  ///    之後的來訪不存、不改、不計數。
  ///  - 同一批裡的重複也一樣要擋。
  insert(batch: EventRow[]): number {
    // TODO
    throw new Error("TODO");
  }

  /// 職責:這張身分證 (txHash, logIndex) 收過沒?
  has(txHash: string, logIndex: number): boolean {
    // TODO
    throw new Error("TODO");
  }

  // ---- 周邊:已寫好,不要動 ----

  count(): number {
    return this.rows.size;
  }

  all(): EventRow[] {
    return [...this.rows.values()];
  }
}

// ============================================================
// 武器速查(純語法;變數名跟本題無關,組裝是你的事)
//
//   const phone = new Map<string, number>();
//   phone.set("amy", 123);     // 存一筆(同鍵會覆蓋——所以什麼時候「不該 set」要想)
//   phone.has("amy")           // true / false
//   phone.get("amy")           // 123,沒有則 undefined
//   phone.size                 // 目前幾筆
//
//   `${a}-${b}`                // 把兩個值黏成一個字串
//
// HINTS(卡超過 15 分鐘才看):
//   章由兩個零件組成時,鑰匙怎麼辦?想想 ex4 的 stakeOf[id][player][side]——
//   Solidity 用巢狀 mapping,JS 的 Map 鑰匙可以是「黏起來的字串」。
//   黏的時候中間要放分隔符,想想 "ab"+"c" 和 "a"+"bc" 的慘案。
// ============================================================
