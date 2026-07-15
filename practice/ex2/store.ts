// ex2 — 帳目明細化:insert 回傳兩本帳 { added, skipped }。
// 周邊(型別、count、all)已寫好。你只准動兩個 TODO:insert / has。
// 規矩:不准打開 ex1 抄。卡語法才准看 ex1 檔底的武器速查。

export type EventRow = {
  contract_addr: string;
  event_name: string;
  args: Record<string, unknown>;
  block_number: string;
  tx_hash: string;
  log_index: number;
};

export type InsertReport = {
  added: number; // 這次真正存進庫的筆數
  skipped: number; // 這次被冪等機制擋下的筆數(跨批+同批內重複都算)
};

export class MemoryEventStore {
  // 庫本體。鍵的形狀由你決定(ex1 的鐵律照舊:存和問要同一套造法)。
  private rows = new Map<string, EventRow>();

  /// 職責:收一批事件,冪等存入,回傳兩本帳。
  /// 不變量:
  ///  - 每筆進來的事件恰好記進其中一本帳:added + skipped === batch.length
  ///  - first-write-wins:被 skip 的筆整筆丟棄,不存、不改
  ///  - 歷次 added 加總 === count()
  insert(batch: EventRow[]): InsertReport {
    // TODO
    let added = 0;
    let skipped = 0;
    for (const i of batch){
      if(!this.has(i.tx_hash,i.log_index)){
        const key = `${i.tx_hash}-${i.log_index}`;
        this.rows.set(key,i);
        added++;
      }else{
        skipped++;
      }

    } 

    return {added,skipped};
  }

  /// 職責:這張身分證 (txHash, logIndex) 收過沒?
  has(txHash: string, logIndex: number): boolean {
    // TODO
    return this.rows.has(`${txHash}-${logIndex}`);
  }

  // ---- 周邊:已寫好,不要動 ----

  count(): number {
    return this.rows.size;
  }

  all(): EventRow[] {
    return [...this.rows.values()];
  }
}
