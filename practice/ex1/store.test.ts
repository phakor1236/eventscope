import { describe, expect, it } from "vitest";
import { MemoryEventStore, type EventRow } from "./store";

function row(overrides: Partial<EventRow> = {}): EventRow {
  return {
    contract_addr: "0x769d821592cd0991ff243e3e4741413cb39db7af",
    event_name: "DuelCreated",
    args: { id: "0", stake: "1000000000000000" },
    block_number: "11234758",
    tx_hash: "0xaaa",
    log_index: 1,
    ...overrides,
  };
}

describe("insert — 基本", () => {
  it("全新一批:回傳批量,庫裡就是這幾筆", () => {
    const s = new MemoryEventStore();
    const n = s.insert([row({ tx_hash: "0xaaa" }), row({ tx_hash: "0xbbb" })]);
    expect(n).toBe(2);
    expect(s.count()).toBe(2);
  });

  it("空批:回傳 0,庫不動", () => {
    const s = new MemoryEventStore();
    expect(s.insert([])).toBe(0);
    expect(s.count()).toBe(0);
  });
});

describe("insert — 冪等(靈魂)", () => {
  it("同一批重跑第二次:回傳 0,筆數不變", () => {
    const s = new MemoryEventStore();
    const batch = [row({ tx_hash: "0xaaa" }), row({ tx_hash: "0xbbb" })];
    s.insert(batch);
    expect(s.insert(batch)).toBe(0);
    expect(s.count()).toBe(2);
  });

  it("同批內夾帶重複:只存一筆、只數一次", () => {
    const s = new MemoryEventStore();
    const n = s.insert([row(), row(), row({ tx_hash: "0xccc" })]);
    expect(n).toBe(2);
    expect(s.count()).toBe(2);
  });

  it("混合批(部分新、部分舊):只數新的", () => {
    const s = new MemoryEventStore();
    s.insert([row({ tx_hash: "0xaaa" })]);
    const n = s.insert([row({ tx_hash: "0xaaa" }), row({ tx_hash: "0xddd" })]);
    expect(n).toBe(1);
    expect(s.count()).toBe(2);
  });
});

describe("insert — 鍵是兩個零件", () => {
  it("同 tx_hash 不同 log_index:是兩筆", () => {
    const s = new MemoryEventStore();
    const n = s.insert([
      row({ tx_hash: "0xaaa", log_index: 1 }),
      row({ tx_hash: "0xaaa", log_index: 2 }),
    ]);
    expect(n).toBe(2);
  });

  it("同 log_index 不同 tx_hash:是兩筆", () => {
    const s = new MemoryEventStore();
    const n = s.insert([
      row({ tx_hash: "0xaaa", log_index: 7 }),
      row({ tx_hash: "0xbbb", log_index: 7 }),
    ]);
    expect(n).toBe(2);
  });

  it("鍵零件的邊界:黏字串不當心會相撞(tx '0xa'+idx 12 vs tx '0xa1'+idx 2)", () => {
    const s = new MemoryEventStore();
    const n = s.insert([
      row({ tx_hash: "0xa", log_index: 12 }),
      row({ tx_hash: "0xa1", log_index: 2 }),
    ]);
    expect(n).toBe(2);
    expect(s.count()).toBe(2);
  });
});

describe("insert — first-write-wins(DO NOTHING 的語義)", () => {
  it("重複鍵帶不同內容:保留最早那筆,新的丟掉", () => {
    const s = new MemoryEventStore();
    s.insert([row({ args: { id: "0", stake: "111" } })]);
    s.insert([row({ args: { id: "0", stake: "999" } })]);
    expect(s.count()).toBe(1);
    expect(s.all()[0].args).toEqual({ id: "0", stake: "111" });
  });
});

describe("has", () => {
  it("存過的 true,沒存過的 false", () => {
    const s = new MemoryEventStore();
    s.insert([row({ tx_hash: "0xaaa", log_index: 3 })]);
    expect(s.has("0xaaa", 3)).toBe(true);
    expect(s.has("0xaaa", 4)).toBe(false);
    expect(s.has("0xbbb", 3)).toBe(false);
  });
});

describe("不變量:回傳值加總 = 庫裡筆數", () => {
  it("亂序狂插一輪之後,帳要對", () => {
    const s = new MemoryEventStore();
    let credited = 0;
    credited += s.insert([row({ tx_hash: "0x1" }), row({ tx_hash: "0x2" })]);
    credited += s.insert([row({ tx_hash: "0x2" }), row({ tx_hash: "0x3" })]);
    credited += s.insert([]);
    credited += s.insert([row({ tx_hash: "0x1" }), row({ tx_hash: "0x1" })]);
    expect(credited).toBe(s.count());
    expect(s.count()).toBe(3);
  });
});
