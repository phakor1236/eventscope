// ex9 — 階梯三 L4:書籤單調+回捲令。⚠️ 核心 20%。
// 你只准動兩個 TODO:commit / rewind。說明和例子在 SPEC.md。

export type Log = { blockNumber: number; payload: string };

export class RewindableStore {
  private events: Log[] = [];
  private checkpoint: number;

  constructor(deployBlock: number) {
    this.checkpoint = deployBlock - 1;
  }

  getCheckpoint(): number {
    return this.checkpoint;
  }

  count(): number {
    return this.events.length;
  }

  all(): Log[] {
    return [...this.events];
  }

  /// 不變量:scannedTo 必須 > 現書籤,否則 throw 且庫、書籤零變動。
  commit(logs: Log[], scannedTo: number): void {
    // TODO
    if(scannedTo <= this.checkpoint){
      throw new Error("checkpoint can't move backward");
    }
    
    this.events.push(...logs);
    this.checkpoint = scannedTo;
    
  }

  /// 唯一合法的倒退。不變量:toBlock 必須 < 現書籤,否則 throw;
  /// 成功=書籤到 toBlock,blockNumber > toBlock 的 events 全刪(=== toBlock 的保留)。
  rewind(toBlock: number): void {
    // TODO
    if (toBlock >= this.checkpoint){
      throw new Error("checkpoint can't move backward");
    }
    this.events = this.events.filter(
      e => e.blockNumber <= toBlock
    );
    this.checkpoint = toBlock;
  }
}
