// ---- 周邊:已寫好,不要動 ----

import type { Log } from "./chain";

// 假庫:events + 書籤。
// commit 一次呼叫 = 模擬「logs 落庫與書籤推進在同一筆交易」。
// 注意:commit 不做防呆——你叫它把書籤寫成多少它就寫多少,倒退=呼叫端的 bug。
export class Store {
  private events: Log[] = [];
  private checkpoint: number;

  constructor(deployBlock: number) {
    this.checkpoint = deployBlock - 1;
  }

  getCheckpoint(): number {
    return this.checkpoint;
  }

  commit(logs: Log[], scannedTo: number): void {
    this.events.push(...logs);
    this.checkpoint = scannedTo;
  }

  count(): number {
    return this.events.length;
  }

  all(): Log[] {
    return [...this.events];
  }
}
