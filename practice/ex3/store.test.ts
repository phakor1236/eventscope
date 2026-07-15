import { beforeEach, describe, expect, it } from "vitest";
import { MemoryEventStore, type EventRow } from "./store";

function row(
  chainId: number,
  txHash: string,
  logIndex: number,
  extra: Partial<EventRow> = {},
): EventRow {
  return {
    chain_id: chainId,
    contract_addr: "0xDUEL",
    event_name: "DuelCreated",
    args: { id: "1" },
    block_number: "100",
    tx_hash: txHash,
    log_index: logIndex,
    ...extra,
  };
}

const SEPOLIA = 11155111;
const MAINNET = 1;

let store: MemoryEventStore;
beforeEach(() => {
  store = new MemoryEventStore();
});

describe("insert — 基本(繼承 L1 兩本帳)", () => {
  it("全新一批:added=批量,skipped=0", () => {
    const report = store.insert([
      row(SEPOLIA, "0xa", 0),
      row(SEPOLIA, "0xb", 0),
    ]);
    expect(report).toEqual({ added: 2, skipped: 0 });
    expect(store.count()).toBe(2);
  });

  it("空批:{0,0},庫不動", () => {
    expect(store.insert([])).toEqual({ added: 0, skipped: 0 });
    expect(store.count()).toBe(0);
  });
});

describe("跨鏈不相撞(靈魂)", () => {
  it("同 (tx_hash, log_index) 不同鏈:是兩筆,都 added", () => {
    const report = store.insert([
      row(SEPOLIA, "0xa", 0),
      row(MAINNET, "0xa", 0),
    ]);
    expect(report).toEqual({ added: 2, skipped: 0 });
    expect(store.count()).toBe(2);
  });

  it("同批三條鏈同 tx:三筆全進", () => {
    const report = store.insert([
      row(1, "0xa", 7),
      row(10, "0xa", 7),
      row(42161, "0xa", 7),
    ]);
    expect(report.added).toBe(3);
  });

  it("同鏈才算重複:三零件全同才 skip", () => {
    store.insert([row(SEPOLIA, "0xa", 0)]);
    const report = store.insert([
      row(SEPOLIA, "0xa", 0), // 三零件全同 → skip
      row(MAINNET, "0xa", 0), // 鏈不同 → added
      row(SEPOLIA, "0xa", 1), // log_index 不同 → added
      row(SEPOLIA, "0xb", 0), // tx 不同 → added
    ]);
    expect(report).toEqual({ added: 3, skipped: 1 });
  });
});

describe("鑰匙三零件的邊界", () => {
  it("chain 10 + tx 'xa' vs chain 1 + tx '0xa':黏錯分隔符會相撞", () => {
    const report = store.insert([row(10, "xa", 2), row(1, "0xa", 2)]);
    expect(report).toEqual({ added: 2, skipped: 0 });
    expect(store.count()).toBe(2);
  });

  it("tx 尾巴 vs log_index 開頭:chain 1 + tx '0xa' idx 12 vs chain 1 + tx '0xa1' idx 2", () => {
    const report = store.insert([row(1, "0xa", 12), row(1, "0xa1", 2)]);
    expect(report).toEqual({ added: 2, skipped: 0 });
  });
});

describe("first-write-wins(以三零件為準)", () => {
  it("同鏈重複鍵帶不同內容:保留最早,新的 skip", () => {
    store.insert([row(SEPOLIA, "0xa", 0, { args: { id: "first" } })]);
    const report = store.insert([
      row(SEPOLIA, "0xa", 0, { args: { id: "second" } }),
    ]);
    expect(report).toEqual({ added: 0, skipped: 1 });
    expect(store.all()[0].args).toEqual({ id: "first" });
  });

  it("跨鏈同 tx 各自為政:兩邊內容互不干擾", () => {
    store.insert([row(SEPOLIA, "0xa", 0, { args: { chain: "sep" } })]);
    store.insert([row(MAINNET, "0xa", 0, { args: { chain: "main" } })]);
    const bySepolia = store.all().find((r) => r.chain_id === SEPOLIA);
    const byMainnet = store.all().find((r) => r.chain_id === MAINNET);
    expect(bySepolia?.args).toEqual({ chain: "sep" });
    expect(byMainnet?.args).toEqual({ chain: "main" });
  });
});

describe("has — 三個參數", () => {
  it("三零件全對才 true", () => {
    store.insert([row(SEPOLIA, "0xa", 7)]);
    expect(store.has(SEPOLIA, "0xa", 7)).toBe(true);
    expect(store.has(MAINNET, "0xa", 7)).toBe(false);
    expect(store.has(SEPOLIA, "0xb", 7)).toBe(false);
    expect(store.has(SEPOLIA, "0xa", 8)).toBe(false);
  });
});

describe("不變量", () => {
  it("每次呼叫:added + skipped === batch.length", () => {
    const batches = [
      [row(1, "0xa", 0), row(1, "0xa", 0), row(2, "0xa", 0)],
      [row(1, "0xa", 0), row(3, "0xc", 5)],
      [],
    ];
    for (const batch of batches) {
      const report = store.insert(batch);
      expect(report.added + report.skipped).toBe(batch.length);
    }
  });

  it("歷次 added 加總 === count()", () => {
    let total = 0;
    total += store.insert([row(1, "0xa", 0), row(2, "0xa", 0)]).added;
    total += store.insert([row(1, "0xa", 0), row(1, "0xb", 1)]).added;
    total += store.insert([row(2, "0xb", 1), row(2, "0xb", 1)]).added;
    expect(total).toBe(store.count());
    expect(store.count()).toBe(4); // (1,0xa,0)(2,0xa,0)(1,0xb,1)(2,0xb,1)
  });
});
