import { beforeEach, describe, expect, it } from "vitest";
import { FakeChain, type Log } from "./chain";
import { MultiStore } from "./store";
import { catchUpAll, type ContractConfig } from "./scanner";

const A = "0xaaa";
const B = "0xbbb";
const C = "0xccc";

function log(contract: string, blockNumber: number, payload: string): Log {
  return { contract, blockNumber, payload };
}

function cfg(address: string, deployBlock: number): ContractConfig {
  return { address, deployBlock };
}

let store: MultiStore;
beforeEach(() => {
  store = new MultiStore();
});

describe("多合約基本盤", () => {
  it("各家從自己的 deployBlock 掃到鏈頭,事件各歸各家", () => {
    const chain = new FakeChain(10, [
      log(A, 2, "a1"),
      log(B, 7, "b1"),
      log(A, 9, "a2"),
    ]);
    const report = catchUpAll(chain, store, [cfg(A, 1), cfg(B, 5)], { chunkSize: 100 });
    expect(report).toEqual({ ok: [A, B], failed: [] });
    expect(store.getCheckpoint(A)).toBe(10);
    expect(store.getCheckpoint(B)).toBe(10);
    expect(store.eventsOf(A).map((l) => l.payload)).toEqual(["a1", "a2"]);
    expect(store.eventsOf(B).map((l) => l.payload)).toEqual(["b1"]);
  });

  it("deployBlock 前面的區塊不准掃(B 從 5 開始,不是從 1)", () => {
    const chain = new FakeChain(10);
    catchUpAll(chain, store, [cfg(B, 5)], { chunkSize: 100 });
    for (const c of chain.calls) expect(c.from).toBeGreaterThanOrEqual(5);
  });

  it("第二輪各自續掃:from = 各家書籤+1,不重掃", () => {
    const chain = new FakeChain(10);
    catchUpAll(chain, store, [cfg(A, 1), cfg(B, 5)], { chunkSize: 100 });
    chain.advance(15);
    chain.calls.length = 0;
    catchUpAll(chain, store, [cfg(A, 1), cfg(B, 5)], { chunkSize: 100 });
    expect(chain.calls).toEqual([
      { contract: A, from: 11, to: 15 },
      { contract: B, from: 11, to: 15 },
    ]);
  });

  it("空合約清單:{ok:[],failed:[]},不碰鏈", () => {
    const chain = new FakeChain(10);
    expect(catchUpAll(chain, store, [], { chunkSize: 100 })).toEqual({ ok: [], failed: [] });
    expect(chain.calls).toEqual([]);
  });

  it("分段規則沒退步:每段 ≤ chunkSize、首尾相接", () => {
    const chain = new FakeChain(25);
    catchUpAll(chain, store, [cfg(A, 1)], { chunkSize: 10 });
    expect(chain.calls).toEqual([
      { contract: A, from: 1, to: 10 },
      { contract: A, from: 11, to: 20 },
      { contract: A, from: 21, to: 25 },
    ]);
  });
});

describe("故障隔離(靈魂:一家倒下,全隊不停)", () => {
  it("中間那家爆:前後兩家照常推進,函數不准爆", () => {
    const chain = new FakeChain(10, [log(A, 3, "a1"), log(C, 9, "c1")]);
    chain.armFailure(B);
    const report = catchUpAll(
      chain,
      store,
      [cfg(A, 1), cfg(B, 1), cfg(C, 1)],
      { chunkSize: 100 },
    );
    expect(report.ok).toEqual([A, C]);
    expect(report.failed).toEqual([B]);
    expect(store.getCheckpoint(A)).toBe(10);
    expect(store.getCheckpoint(C)).toBe(10);
    expect(store.getCheckpoint(B)).toBeNull(); // 一次都沒成功,書籤還是空
    expect(store.eventsOf(B)).toEqual([]);
  });

  it("半途爆:成功 commit 的段保留,書籤=最後成功段尾", () => {
    const chain = new FakeChain(25, [log(B, 4, "early"), log(B, 22, "late")]);
    chain.armFailure(B, 1); // 第 1 段讓你成功,之後爆
    const report = catchUpAll(chain, store, [cfg(B, 1)], { chunkSize: 10 });
    expect(report.failed).toEqual([B]);
    expect(store.getCheckpoint(B)).toBe(10); // 第 1 段 (1,10) 的成果保留
    expect(store.eventsOf(B).map((l) => l.payload)).toEqual(["early"]);
  });

  it("故障排除後下一輪續掃,一筆不漏", () => {
    const chain = new FakeChain(25, [log(B, 4, "early"), log(B, 22, "late")]);
    chain.armFailure(B, 1);
    catchUpAll(chain, store, [cfg(B, 1)], { chunkSize: 10 });
    chain.disarmFailure(B);
    const report = catchUpAll(chain, store, [cfg(B, 1)], { chunkSize: 10 });
    expect(report).toEqual({ ok: [B], failed: [] });
    expect(store.getCheckpoint(B)).toBe(25);
    expect(store.eventsOf(B).map((l) => l.payload)).toEqual(["early", "late"]);
  });

  it("爆掉那家的書籤,絕不被別家的進度污染", () => {
    const chain = new FakeChain(10);
    catchUpAll(chain, store, [cfg(A, 1), cfg(B, 1)], { chunkSize: 100 }); // 兩家都到 10
    chain.advance(20);
    chain.armFailure(B);
    catchUpAll(chain, store, [cfg(A, 1), cfg(B, 1)], { chunkSize: 100 });
    expect(store.getCheckpoint(A)).toBe(20);
    expect(store.getCheckpoint(B)).toBe(10); // 停在自己上次的位置,不是 20
  });
});
