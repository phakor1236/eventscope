// ex3 — 多鏈時代:身分證三零件 (chain_id, tx_hash, log_index)。
// 周邊(型別、count、all)已寫好。你只准動兩個 TODO:insert / has。
// 規矩:不准開 ex1/ex2 抄。卡語法才准看 ex1 檔底的武器速查。

export type EventRow = {
  chain_id: number; // 新零件:這筆事件住在哪條鏈
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

export class MemoryEventStore {
  // 庫本體。鑰匙現在要裝得下三個零件——黏法、分隔符,全是你的設計。
  private rows = new Map<string, EventRow>();

  /// 職責:收一批(可能來自多條鏈的)事件,冪等存入,回傳兩本帳。
  /// 不變量:
  ///  - 身分證=三零件:同 (tx_hash, log_index) 不同 chain_id 是兩筆,不准互擋
  ///  - added + skipped === batch.length
  ///  - first-write-wins(以三零件身分證為準)
  insert(batch: EventRow[]): InsertReport {
    // TODO
    let added = 0;
    let skipped = 0;
    for (const i of batch){
      if(!this.has(i.chain_id,i.tx_hash,i.log_index)){
        const key = `${i.chain_id}-${i.tx_hash}-${i.log_index}`;
        this.rows.set(key,i);
        added++;
      }else{
        skipped++;
      }

    
    }

    return {added,skipped};
  }

  /// 職責:這張三零件身分證收過沒?
  has(chainId: number, txHash: string, logIndex: number): boolean {
    // TODO
    return this.rows.has(`${chainId}-${txHash}-${logIndex}`);
  }

  // ---- 周邊:已寫好,不要動 ----

  count(): number {
    return this.rows.size;
  }

  all(): EventRow[] {
    return [...this.rows.values()];
  }
}
