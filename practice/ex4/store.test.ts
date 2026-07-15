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

let store: MemoryEventStore;
beforeEach(() => {
  store = new MemoryEventStore();
});

describe("upsert — 基本", () => {
  it("全新一批:全 added,updated=0", () => {
    const report = store.upsert([row(1, "0xa", 0), row(1, "0xb", 0)]);
    expect(report).toEqual({ added: 2, updated: 0 });
    expect(store.count()).toBe(2);
  });

  it("空批:{0,0},庫不動", () => {
    expect(store.upsert([])).toEqual({ added: 0, updated: 0 });
    expect(store.count()).toBe(0);
  });
});

describe("upsert — 更新語義(靈魂)", () => {
  it("重複鍵:args 換成新的,記 updated,筆數不變", () => {
    store.upsert([row(1, "0xa", 0, { args: { odds: "1.5" } })]);
    const report = store.upsert([row(1, "0xa", 0, { args: { odds: "2.0" } })]);
    expect(report).toEqual({ added: 0, updated: 1 });
    expect(store.count()).toBe(1);
    expect(store.all()[0].args).toEqual({ odds: "2.0" });
  });

  it("出生欄位保護:block_number 不管來什麼都保留第一筆", () => {
    store.upsert([row(1, "0xa", 0, { block_number: "100" })]);
    store.upsert([
      row(1, "0xa", 0, { block_number: "999", args: { odds: "9.9" } }),
    ]);
    const stored = store.all()[0];
    expect(stored.block_number).toBe("100"); // 出生事實不可變
    expect(stored.args).toEqual({ odds: "9.9" }); // 內容照樣更新
  });

  it("event_name 也受保護", () => {
    store.upsert([row(1, "0xa", 0, { event_name: "DuelCreated" })]);
    store.upsert([row(1, "0xa", 0, { event_name: "Hacked" })]);
    expect(store.all()[0].event_name).toBe("DuelCreated");
  });

  it("同批內同鍵兩次:第一次 added,第二次 updated,留最後的 args", () => {
    const report = store.upsert([
      row(1, "0xa", 0, { args: { v: "1" } }),
      row(1, "0xa", 0, { args: { v: "2" } }),
    ]);
    expect(report).toEqual({ added: 1, updated: 1 });
    expect(store.count()).toBe(1);
    expect(store.all()[0].args).toEqual({ v: "2" });
  });

  it("跨鏈不相撞(繼承 L3):同 tx 不同鏈是兩筆", () => {
    const report = store.upsert([row(1, "0xa", 0), row(10, "0xa", 0)]);
    expect(report).toEqual({ added: 2, updated: 0 });
  });
});

describe("insert 和 upsert 同住,語義不互相污染", () => {
  it("insert 遇重複照樣整筆丟:args 不更新", () => {
    store.upsert([row(1, "0xa", 0, { args: { v: "first" } })]);
    const report = store.insert([
      row(1, "0xa", 0, { args: { v: "second" } }),
      row(1, "0xz", 8),
    ]);
    expect(report).toEqual({ added: 1, skipped: 1 });
    expect(store.all().find((r) => r.tx_hash === "0xa")?.args).toEqual({
      v: "first",
    });
  });

  it("insert 先存,upsert 能更新它", () => {
    store.insert([row(1, "0xb", 3, { args: { v: "old" } })]);
    const report = store.upsert([row(1, "0xb", 3, { args: { v: "new" } })]);
    expect(report).toEqual({ added: 0, updated: 1 });
    expect(store.all()[0].args).toEqual({ v: "new" });
  });
});

describe("不變量", () => {
  it("upsert 永不改變筆數:count === 不同鍵數", () => {
    store.upsert([row(1, "0xa", 0)]);
    store.upsert([row(1, "0xa", 0, { args: { n: "2" } })]);
    store.upsert([row(1, "0xa", 0, { args: { n: "3" } })]);
    expect(store.count()).toBe(1);
  });

  it("每次呼叫:added + updated === batch.length", () => {
    const batches = [
      [row(1, "0xa", 0), row(1, "0xa", 0), row(2, "0xc", 5)],
      [row(1, "0xa", 0)],
      [],
    ];
    for (const batch of batches) {
      const report = store.upsert(batch);
      expect(report.added + report.updated).toBe(batch.length);
    }
  });

  it("歷次 added(insert+upsert)加總 === count()", () => {
    let total = 0;
    total += store.insert([row(1, "0xa", 0), row(1, "0xb", 1)]).added;
    total += store.upsert([row(1, "0xa", 0), row(2, "0xa", 0)]).added;
    total += store.upsert([row(1, "0xc", 9)]).added;
    expect(total).toBe(store.count());
    expect(store.count()).toBe(4);
  });
});
