// ---- 周邊:已寫好,不要動 ----

export type Log = {
  blockNumber: number;
  payload: string; // 事件內容,測試用字串代替
};

// 假鏈。head = 鏈頭高度。
// 每次 getLogs 的範圍會記進 calls,測試靠它驗你的分段與邊界。
export class FakeChain {
  calls: Array<{ from: number; to: number }> = [];

  constructor(
    public head: number,
    private logs: Log[] = [],
  ) {}

  getBlockNumber(): number {
    return this.head;
  }

  getLogs(from: number, to: number): Log[] {
    if (from > to) throw new Error(`bad range: from ${from} > to ${to}`);
    if (to > this.head) throw new Error(`RPC error: toBlock ${to} beyond head ${this.head}`);
    this.calls.push({ from, to });
    return this.logs.filter((l) => l.blockNumber >= from && l.blockNumber <= to);
  }

  // 測試用:鏈往前長,順便長出新 logs
  advance(newHead: number, newLogs: Log[] = []): void {
    this.head = newHead;
    this.logs.push(...newLogs);
  }
}
