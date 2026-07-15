import { beforeEach, describe, expect, it } from "vitest";
import { FakeChain, type Log } from "./chain";
import { Store } from "./store";
import { catchUp } from "./scanner";

function log(blockNumber: number, payload: string): Log {
  return { blockNumber, payload };
}

describe("基本掃描(confirmations = 0 → 原版行為)", () => {
  it("從 deployBlock 掃到鏈頭,logs 落庫、書籤=鏈頭", () => {
    const chain = new FakeChain(10, [log(3, "a"), log(7, "b")]);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 100, confirmations: 0 });
    expect(store.getCheckpoint()).toBe(10);
    expect(store.count()).toBe(2);
    expect(store.all().map((l) => l.payload)).toEqual(["a", "b"]);
  });

  it("書籤已在鏈頭:no-op,不呼叫 getLogs", () => {
    const chain = new FakeChain(10);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 100, confirmations: 0 });
    chain.calls.length = 0;
    catchUp(chain, store, { chunkSize: 100, confirmations: 0 });
    expect(chain.calls).toEqual([]);
    expect(store.getCheckpoint()).toBe(10);
  });

  it("鏈頭還沒到 deployBlock:no-op,書籤不動", () => {
    const chain = new FakeChain(3);
    const store = new Store(5);
    catchUp(chain, store, { chunkSize: 100, confirmations: 0 });
    expect(chain.calls).toEqual([]);
    expect(store.getCheckpoint()).toBe(4);
  });
});

describe("確認深度(靈魂:未定區不掃,但一筆不漏)", () => {
  it("掃到 head - confirmations 為止,未定區的 log 不落庫", () => {
    const chain = new FakeChain(10, [log(7, "safe"), log(9, "unsettled")]);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 100, confirmations: 3 });
    expect(store.getCheckpoint()).toBe(7);
    expect(store.all().map((l) => l.payload)).toEqual(["safe"]);
  });

  it("未定區不是丟掉是晚點掃:鏈長高後補進來,一筆不漏", () => {
    const chain = new FakeChain(10, [log(9, "late")]);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 100, confirmations: 3 }); // 掃到 7,block 9 還在未定區
    chain.advance(13, [log(12, "new")]);
    catchUp(chain, store, { chunkSize: 100, confirmations: 3 }); // 安全上限=10,補 8..10
    expect(store.getCheckpoint()).toBe(10);
    expect(store.all().map((l) => l.payload)).toEqual(["late"]);
    chain.advance(20);
    catchUp(chain, store, { chunkSize: 100, confirmations: 3 });
    expect(store.all().map((l) => l.payload)).toEqual(["late", "new"]);
  });

  it("深水區:安全上限落在書籤後面 → 整趟 no-op,書籤不准倒退", () => {
    const chain = new FakeChain(95);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 1000, confirmations: 0 }); // 書籤推到 95
    chain.advance(100);
    chain.calls.length = 0;
    catchUp(chain, store, { chunkSize: 1000, confirmations: 10 }); // 安全上限=90 < 書籤 95
    expect(chain.calls).toEqual([]);
    expect(store.getCheckpoint()).toBe(95); // 不准被拉回 90
  });

  it("邊界貼齊:安全上限恰好=書籤 → no-op", () => {
    const chain = new FakeChain(10);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 100, confirmations: 0 });
    chain.advance(14);
    chain.calls.length = 0;
    catchUp(chain, store, { chunkSize: 100, confirmations: 4 }); // 安全上限=10=書籤
    expect(chain.calls).toEqual([]);
    expect(store.getCheckpoint()).toBe(10);
  });
});

describe("分段(chunkSize = 單次呼叫最多涵蓋幾個區塊,含頭尾)", () => {
  it("首尾相接不留 gap 不重疊,尾段吃剩下的", () => {
    const chain = new FakeChain(25);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 10, confirmations: 0 });
    expect(chain.calls).toEqual([
      { from: 1, to: 10 },
      { from: 11, to: 20 },
      { from: 21, to: 25 },
    ]);
    expect(store.getCheckpoint()).toBe(25);
  });

  it("整除貼齊:不多打一次空範圍呼叫", () => {
    const chain = new FakeChain(20);
    const store = new Store(1);
    catchUp(chain, store, { chunkSize: 10, confirmations: 0 });
    expect(chain.calls).toEqual([
      { from: 1, to: 10 },
      { from: 11, to: 20 },
    ]);
  });

  it("每段涵蓋區塊數 ≤ chunkSize(亂數頭尾也一樣)", () => {
    const chain = new FakeChain(137);
    const store = new Store(4);
    catchUp(chain, store, { chunkSize: 7, confirmations: 2 });
    for (const c of chain.calls) {
      expect(c.to - c.from + 1).toBeLessThanOrEqual(7);
      expect(c.to).toBeLessThanOrEqual(135); // 永不超過安全上限
    }
    expect(store.getCheckpoint()).toBe(135);
  });
});

describe("每段一次 commit:落庫與書籤同進退", () => {
  it("三段=書籤推進三次,每次推到該段尾", () => {
    const chain = new FakeChain(25, [log(5, "a"), log(15, "b"), log(23, "c")]);
    const store = new Store(1);
    const checkpoints: number[] = [];
    const original = store.commit.bind(store);
    store.commit = (logs, scannedTo) => {
      original(logs, scannedTo);
      checkpoints.push(scannedTo);
    };
    catchUp(chain, store, { chunkSize: 10, confirmations: 0 });
    expect(checkpoints).toEqual([10, 20, 25]);
    expect(store.count()).toBe(3);
  });
});
