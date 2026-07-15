// ex8 — 階梯三 L3:一掃多約+故障隔離。
// ⚠️ 核心 20%:狀態機 × N。周邊(FakeChain、MultiStore)已寫好。
// 你只准動一個 TODO:catchUpAll。規矩:不准開 src/ 或 ex1–ex7 抄。

import { RpcError, type FakeChain } from "./chain";
import type { MultiStore } from "./store";

export type ContractConfig = {
  address: string; // 合約地址,如 "0xaaa"
  deployBlock: number; // 這家從哪個區塊開始存在
};

export type ScanReport = {
  ok: string[]; // 這輪全程順利的合約地址(照 contracts 清單順序)
  failed: string[]; // 這輪中途爆 RpcError 的合約地址
};

/// 你有的工具(比 ex6 多了「合約」這個維度):
///   chain.getBlockNumber()            → 鏈頭(所有合約共用一條鏈)
///   chain.getLogs(合約, from, to)     → 這一家在 from~to 的事件(⚠️ 可能 throw RpcError)
///   store.getCheckpoint(合約)         → 這一家的書籤;從沒掃過 → null
///   store.commit(合約, logs, n)       → 這一家的事件落庫+書籤移到 n
///
/// 純語法範本(接住某段程式的爆炸,且只認特定型的錯):
///   try {
///     dangerousThing();
///   } catch (err) {
///     if (!(err instanceof BoomError)) throw err; // 不認識的錯照樣往上丟
///     // ...認識的錯,在這裡善後
///   }
///
/// 職責(做完後世界要長這樣):
///   例1  head=10;A(deploy=1)、B(deploy=5) → 做完:A 掃 1~10、B 掃 5~10,
///        各自書籤=10,report = { ok:["A地址","B地址"], failed:[] }
///   例2  B 被裝了故障 → A 照常書籤=10;B 書籤不動;report.failed=["B地址"];
///        排在 B 後面的 C 也照常——函數本身不准爆
///   例3  B(deploy=1)、head=25、chunkSize=10,故障設定「成功 1 次後開始爆」
///        → B 第 1 段 (1,10) 已 commit 保留,書籤=10;第 2 段爆,後面不掃;
///          failed 含 B。下輪故障排除後從 11 續掃,一筆不漏
///
/// 鐵律:每家書籤各自獨立;書籤只反映成功 commit 的段;一家倒下,全隊不停。
export function catchUpAll(
  chain: FakeChain,
  store: MultiStore,
  contracts: ContractConfig[],
  opts: { chunkSize: number },
): ScanReport {
  // TODO
  const head = chain.getBlockNumber();
  const ok : string[] = [];
  const failed : string[] = [];
  for (const contract of contracts){
    try{
      const checkpoint  = store.getCheckpoint(contract.address);
      let cursor = checkpoint ?? contract.deployBlock - 1;
      while(cursor < head){
        const from = cursor +1;
        const to = Math.min(
          from + opts.chunkSize - 1,
          head
        );
        const logs = chain.getLogs(
          contract.address,
          from,
          to
        );
        store.commit(
          contract.address,
          logs,
          to
        );
        cursor = to;
      }
      ok.push(contract.address);

    }catch(err) {
      if(!(err instanceof RpcError))
        {throw err;}
      failed.push(contract.address);
    }
  }
  return {ok,failed};
}