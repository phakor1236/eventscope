// ---- 周邊:已寫好,不要動 ----

export type Log = {
  contract: string; // 哪家合約發的
  blockNumber: number;
  payload: string;
};

// 某家合約 RPC 抽風時丟這個。你的 catchUpAll 要接住它。
export class RpcError extends Error {}

// 假鏈(多合約版)。
// 每次 getLogs 的(合約,範圍)記進 calls;from>to 或 to>鏈頭照樣直接爆(那不是 RpcError,是你的 bug)。
export class FakeChain {
  calls: Array<{ contract: string; from: number; to: number }> = [];
  private failAfter = new Map<string, number>(); // 合約 → 再成功幾次後開始爆

  constructor(
    public head: number,
    private logs: Log[] = [],
  ) {}

  // 裝故障:這家合約的 getLogs 再成功 afterCalls 次之後,之後每次都爆 RpcError
  armFailure(contract: string, afterCalls = 0): void {
    this.failAfter.set(contract, afterCalls);
  }

  disarmFailure(contract: string): void {
    this.failAfter.delete(contract);
  }

  getBlockNumber(): number {
    return this.head;
  }

  getLogs(contract: string, from: number, to: number): Log[] {
    if (from > to) throw new Error(`bad range: from ${from} > to ${to}`);
    if (to > this.head) throw new Error(`toBlock ${to} beyond head ${this.head}`);
    const remaining = this.failAfter.get(contract);
    if (remaining !== undefined) {
      if (remaining <= 0) throw new RpcError(`rpc flaky for ${contract}`);
      this.failAfter.set(contract, remaining - 1);
    }
    this.calls.push({ contract, from, to });
    return this.logs.filter(
      (l) => l.contract === contract && l.blockNumber >= from && l.blockNumber <= to,
    );
  }

  advance(newHead: number, newLogs: Log[] = []): void {
    this.head = newHead;
    this.logs.push(...newLogs);
  }
}
