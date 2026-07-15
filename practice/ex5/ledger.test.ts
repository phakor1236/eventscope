import { beforeEach, describe, expect, it } from "vitest";
import { PaymentLedger, type PaymentNotice } from "./ledger";

function notice(
  provider: string,
  eventId: string,
  amountCents: number,
  extra: Partial<PaymentNotice> = {},
): PaymentNotice {
  return {
    provider,
    event_id: eventId,
    type: "payment.succeeded",
    amount_cents: amountCents,
    currency: "TWD",
    ...extra,
  };
}

let ledger: PaymentLedger;
beforeEach(() => {
  ledger = new PaymentLedger();
});

describe("record — 基本", () => {
  it("全新一批:全 accepted", () => {
    const report = ledger.record([
      notice("stripe", "evt-1", 500),
      notice("stripe", "evt-2", 300),
    ]);
    expect(report).toEqual({ accepted: 2, duplicates: 0 });
    expect(ledger.count()).toBe(2);
  });

  it("空批:{0,0},帳本不動", () => {
    expect(ledger.record([])).toEqual({ accepted: 0, duplicates: 0 });
    expect(ledger.count()).toBe(0);
    expect(ledger.totalCents()).toBe(0);
  });
});

describe("重送防線(靈魂:錢不准多記)", () => {
  it("同單重送:duplicates,totalCents 不變", () => {
    ledger.record([notice("stripe", "evt-1", 500)]);
    const report = ledger.record([notice("stripe", "evt-1", 500)]);
    expect(report).toEqual({ accepted: 0, duplicates: 1 });
    expect(ledger.count()).toBe(1);
    expect(ledger.totalCents()).toBe(500);
  });

  it("重送帶不同金額:以第一次為準(first-write-wins)", () => {
    ledger.record([notice("stripe", "evt-1", 500)]);
    ledger.record([notice("stripe", "evt-1", 999_00)]);
    expect(ledger.totalCents()).toBe(500);
    expect(ledger.all()[0].amount_cents).toBe(500);
  });

  it("同批內重送:只入帳一次", () => {
    const report = ledger.record([
      notice("stripe", "evt-1", 500),
      notice("stripe", "evt-1", 500),
      notice("stripe", "evt-1", 500),
    ]);
    expect(report).toEqual({ accepted: 1, duplicates: 2 });
    expect(ledger.totalCents()).toBe(500);
  });
});

describe("兩零件身分證", () => {
  it("同 event_id 不同 provider:兩筆各自入帳", () => {
    const report = ledger.record([
      notice("stripe", "evt-1", 500),
      notice("paypal", "evt-1", 300),
    ]);
    expect(report).toEqual({ accepted: 2, duplicates: 0 });
    expect(ledger.totalCents()).toBe(800);
  });

  it("分隔符深水區:('pay','pal-9') vs ('pay-pal','9') 是兩筆", () => {
    const report = ledger.record([
      notice("pay", "pal-9", 100),
      notice("pay-pal", "9", 200),
    ]);
    expect(report).toEqual({ accepted: 2, duplicates: 0 });
    expect(ledger.count()).toBe(2);
    expect(ledger.totalCents()).toBe(300);
  });

  it("event_id 自己帶 '-':('stripe','evt-2024-001') 正常收", () => {
    ledger.record([notice("stripe", "evt-2024-001", 100)]);
    expect(ledger.has("stripe", "evt-2024-001")).toBe(true);
    expect(ledger.has("stripe", "evt-2024")).toBe(false);
  });
});

describe("has", () => {
  it("兩零件全對才 true", () => {
    ledger.record([notice("stripe", "evt-1", 500)]);
    expect(ledger.has("stripe", "evt-1")).toBe(true);
    expect(ledger.has("paypal", "evt-1")).toBe(false);
    expect(ledger.has("stripe", "evt-2")).toBe(false);
  });
});

describe("不變量", () => {
  it("每次呼叫:accepted + duplicates === batch.length", () => {
    const batches = [
      [notice("stripe", "a", 1), notice("stripe", "a", 1)],
      [notice("stripe", "a", 1), notice("paypal", "a", 2), notice("stripe", "b", 3)],
      [],
    ];
    for (const batch of batches) {
      const report = ledger.record(batch);
      expect(report.accepted + report.duplicates).toBe(batch.length);
    }
  });

  it("亂序重送轟炸後:accepted 加總===count,totalCents 帳對", () => {
    let accepted = 0;
    accepted += ledger.record([notice("stripe", "a", 100), notice("stripe", "b", 200)]).accepted;
    accepted += ledger.record([notice("stripe", "a", 100), notice("paypal", "a", 400)]).accepted;
    accepted += ledger.record([notice("paypal", "a", 999), notice("stripe", "c", 50)]).accepted;
    expect(accepted).toBe(ledger.count());
    expect(ledger.count()).toBe(4);
    expect(ledger.totalCents()).toBe(100 + 200 + 400 + 50);
  });
});
