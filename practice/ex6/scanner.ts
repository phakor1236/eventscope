// ex6 — 階梯三 L1:確認深度(reorg 緩衝帶)。
// ⚠️ 核心 20%:書籤=斷點狀態機。周邊(FakeChain、Store)已寫好。
// 你只准動一個 TODO:catchUp。規矩:不准開 src/indexer.ts 或 ex1–ex5 抄。

import type { FakeChain } from "./chain";
import type { Store } from "./store";

export type ScanOptions = {
  chunkSize: number; // 單次 getLogs 最多涵蓋幾個區塊(含頭尾)
  confirmations: number; // 確認深度:離鏈頭最近的 N 個區塊視為未定,不掃
};

/// 你有的工具只有 4 句:
///   chain.getBlockNumber()      → 問鏈:最新是幾號區塊(回一個數字)
///   chain.getLogs(from, to)     → 問鏈:from~to 之間的事件(回陣列;from>to 或 to 超過鏈頭會直接爆)
///   store.getCheckpoint()       → 問庫:書籤現在夾在幾號(回一個數字)
///   store.commit(logs, n)       → 叫庫:存這批事件,並把書籤移到 n
///
/// 職責(做完後世界要長這樣):
///   「已經確認不會再變」的區塊 = 1 號到 (鏈頭 - confirmations) 號。
///   catchUp 跑完後,書籤到「已確認區的最後一格」,中間每個區塊的事件都進了庫,
///   一個不漏、一個不重。最新那 confirmations 個區塊不碰(它們還可能變,下次再說)。
///
/// 具體例子(就是測試在驗的):
///   例1  書籤=0,鏈頭=10,confirmations=3,chunkSize=100
///        → 做完:getLogs 被叫一次 (1,7);庫裡有 1~7 號的事件;書籤=7
///   例2  書籤=0,鏈頭=25,confirmations=0,chunkSize=10
///        → 一次最多只能要 10 個區塊,所以 getLogs 被叫三次:(1,10)(11,20)(21,25)
///          每次拿回來就立刻 commit 一次(共三次),書籤最後=25
///   例3  書籤=95,鏈頭=100,confirmations=10 → 已確認區只到 90,可是 90 之前
///        早就抄完了 → 什麼都不做:不准叫 getLogs,書籤留在 95 不准動
///
/// 鐵律:書籤只准往前或不動,永遠不准變小。
export function catchUp(chain: FakeChain, store: Store, opts: ScanOptions): void {
  // TODO
  const head = chain.getBlockNumber();
  const confirmedEnd = head - opts.confirmations;

  let cursor = store.getCheckpoint();
  if(cursor >= confirmedEnd){
    return;
  }
  while (cursor < confirmedEnd){
    const from = cursor +1;
    const to = Math.min(
      from + opts.chunkSize -1,
      confirmedEnd
    );
    const logs = chain.getLogs(from, to);

    store.commit(logs, to);

    cursor = to;
  }
}
