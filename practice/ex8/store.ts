// ---- 周邊:已寫好,不要動 ----

import type { Log } from "./chain";

// 假庫(多合約版):每家合約一張書籤。
// 注意:這裡不認識 deployBlock——「沒掃過該從哪開始」是呼叫端(你)的事。
export class MultiStore {
  private events: Log[] = [];
  private checkpoints = new Map<string, number>();

  // 這家的書籤;從來沒 commit 過 → null
  getCheckpoint(contract: string): number | null {
    return this.checkpoints.get(contract) ?? null;
  }

  // 這家的事件落庫+書籤移到 scannedTo(一次呼叫=同一筆交易;不做防呆)
  commit(contract: string, logs: Log[], scannedTo: number): void {
    this.events.push(...logs);
    this.checkpoints.set(contract, scannedTo);
  }

  eventsOf(contract: string): Log[] {
    return this.events.filter((l) => l.contract === contract);
  }

  count(): number {
    return this.events.length;
  }
}
