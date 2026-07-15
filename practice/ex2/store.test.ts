import { beforeEach, describe, expect, it } from "vitest";
import { MemoryEventStore, type EventRow } from "./store";

function row(txHash: string, logIndex: number, extra: Partial<EventRow> = {}): EventRow {
  return {
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

describe("insert — 兩本帳基本", () => {
  it("全新一批:added=批量,skipped=0", () => {
    const report = store.insert([row("0xa", 0), row("0xb", 0), row("0xc", 1)]);
    expect(report).toEqual({ added: 3, skipped: 0 });
    expect(store.count()).toBe(3);
  });

  it("空批:{0,0},庫不動", () => {
    expect(store.insert([])).toEqual({ added: 0, skipped: 0 });
    expect(store.count()).toBe(0);
  });
});

describe("insert — skipped 帳(靈魂)", () => {
  it("同一批重跑第二次:added=0,skipped=全額", () => {
    const batch = [row("0xa", 0), row("0xb", 0)];
    store.insert(batch);
    expect(store.insert(batch)).toEqual({ added: 0, skipped: 2 });
    expect(store.count()).toBe(2);
  });

  it("同批內夾帶重複:重複的記進 skipped", () => {
    const report = store.insert([row("0xa", 0), row("0xa", 0), row("0xa", 0)]);
    expect(report).toEqual({ added: 1, skipped: 2 });
    expect(store.count()).toBe(1);
  });

  it("混合批(2 新 1 舊):兩本帳各記各的", () => {
    store.insert([row("0xa", 0)]);
    const report = store.insert([row("0xa", 0), row("0xb", 0), row("0xc", 0)]);
    expect(report).toEqual({ added: 2, skipped: 1 });
    expect(store.count()).toBe(3);
  });
});

describe("繼承 ex1 的行為", () => {
  it("同 tx_hash 不同 log_index:是兩筆,都 added", () => {
    expect(store.insert([row("0xa", 0), row("0xa", 1)])).toEqual({
      added: 2,
      skipped: 0,
    });
  });

  it("同 log_index 不同 tx_hash:是兩筆", () => {
    expect(store.insert([row("0xa", 5), row("0xb", 5)]).added).toBe(2);
  });

  it("鍵零件邊界:tx '0xa'+idx 12 vs tx '0xa1'+idx 2 不准相撞", () => {
    const report = store.insert([row("0xa", 12), row("0xa1", 2)]);
    expect(report).toEqual({ added: 2, skipped: 0 });
    expect(store.count()).toBe(2);
  });

  it("first-write-wins:重複鍵帶不同內容,保留最早,新的進 skipped", () => {
    store.insert([row("0xa", 0, { args: { id: "first" } })]);
    const report = store.insert([row("0xa", 0, { args: { id: "second" } })]);
    expect(report).toEqual({ added: 0, skipped: 1 });
    expect(store.all()[0].args).toEqual({ id: "first" });
  });

  it("has:存過的 true,沒存過的 false", () => {
    store.insert([row("0xa", 7)]);
    expect(store.has("0xa", 7)).toBe(true);
    expect(store.has("0xa", 8)).toBe(false);
    expect(store.has("0xb", 7)).toBe(false);
  });
});

describe("不變量", () => {
  it("每次呼叫:added + skipped === batch.length", () => {
    const batches = [
      [row("0xa", 0), row("0xa", 0)],
      [row("0xa", 0), row("0xb", 0), row("0xc", 0)],
      [],
      [row("0xb", 0), row("0xd", 9)],
    ];
    for (const batch of batches) {
      const report = store.insert(batch);
      expect(report.added + report.skipped).toBe(batch.length);
    }
  });

  it("亂序狂插一輪:歷次 added 加總 === count()", () => {
    let totalAdded = 0;
    totalAdded += store.insert([row("0xa", 0), row("0xb", 0)]).added;
    totalAdded += store.insert([row("0xa", 0), row("0xc", 3)]).added;
    totalAdded += store.insert([row("0xc", 3), row("0xc", 4), row("0xc", 4)]).added;
    totalAdded += store.insert([]).added;
    expect(totalAdded).toBe(store.count());
    expect(store.count()).toBe(4); // 不同鍵:(0xa,0)(0xb,0)(0xc,3)(0xc,4)
  });
});
