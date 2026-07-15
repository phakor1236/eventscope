import { describe, expect, it } from "vitest";
import { ApiError, FakeShopApi, OrderStore, type Order } from "./shop";
import { syncOrders } from "./sync";

function o(id: string): Order {
  return { id, item: `item-${id}` };
}

function ids(orders: Order[]): string[] {
  return orders.map((x) => x.id);
}

describe("基本補抓", () => {
  it("空 API:回 0,cursor 不動、庫空", () => {
    const api = new FakeShopApi([]);
    const store = new OrderStore();
    expect(syncOrders(api, store, { batchSize: 3 })).toBe(0);
    expect(store.getCursor()).toBeNull();
    expect(store.count()).toBe(0);
  });

  it("5 筆、batchSize 3:全入庫、cursor=最後一筆、回傳 5", () => {
    const api = new FakeShopApi([o("o1"), o("o2"), o("o3"), o("o4"), o("o5")]);
    const store = new OrderStore();
    expect(syncOrders(api, store, { batchSize: 3 })).toBe(5);
    expect(ids(store.all())).toEqual(["o1", "o2", "o3", "o4", "o5"]);
    expect(store.getCursor()).toBe("o5");
  });

  it("第一批從頭開始(sinceId=null)、每次 limit=batchSize", () => {
    const api = new FakeShopApi([o("o1"), o("o2")]);
    const store = new OrderStore();
    syncOrders(api, store, { batchSize: 2 });
    expect(api.calls[0]).toEqual({ sinceId: null, limit: 2 });
    for (const c of api.calls) expect(c.limit).toBe(2);
  });
});

describe("接關(靈魂:不漏不重)", () => {
  it("第二次 sync 從庫的 cursor 接關,只入新單", () => {
    const api = new FakeShopApi([o("o1"), o("o2")]);
    const store = new OrderStore();
    syncOrders(api, store, { batchSize: 3 });
    api.addOrders([o("o3"), o("o4")]);
    api.calls.length = 0;
    expect(syncOrders(api, store, { batchSize: 3 })).toBe(2);
    expect(api.calls[0]!.sinceId).toBe("o2"); // 從上次的 cursor 之後拉,不是從頭
    expect(ids(store.all())).toEqual(["o1", "o2", "o3", "o4"]); // 一筆不重
  });

  it("沒有新單:回 0、cursor 不動", () => {
    const api = new FakeShopApi([o("o1")]);
    const store = new OrderStore();
    syncOrders(api, store, { batchSize: 3 });
    expect(syncOrders(api, store, { batchSize: 3 })).toBe(0);
    expect(store.getCursor()).toBe("o1");
  });

  it("半途爆:已 commit 的批保留、cursor=該批尾;修好重跑補齊,不漏不重", () => {
    const api = new FakeShopApi([o("o1"), o("o2"), o("o3"), o("o4"), o("o5")]);
    const store = new OrderStore();
    api.armFailure(1); // 第 1 批成功,第 2 批爆
    expect(() => syncOrders(api, store, { batchSize: 2 })).toThrow(ApiError);
    expect(ids(store.all())).toEqual(["o1", "o2"]);
    expect(store.getCursor()).toBe("o2");

    api.disarmFailure();
    expect(syncOrders(api, store, { batchSize: 2 })).toBe(3);
    expect(ids(store.all())).toEqual(["o1", "o2", "o3", "o4", "o5"]);
    expect(store.getCursor()).toBe("o5");
  });
});

describe("commit 同進退", () => {
  it("每次 commit 的 cursor=該批最後一筆的 id", () => {
    const api = new FakeShopApi([o("o1"), o("o2"), o("o3"), o("o4"), o("o5")]);
    const store = new OrderStore();
    const committed: Array<{ batch: string[]; cursor: string }> = [];
    const original = store.commit.bind(store);
    store.commit = (orders, cursor) => {
      original(orders, cursor);
      committed.push({ batch: ids(orders), cursor });
    };
    syncOrders(api, store, { batchSize: 2 });
    expect(committed).toEqual([
      { batch: ["o1", "o2"], cursor: "o2" },
      { batch: ["o3", "o4"], cursor: "o4" },
      { batch: ["o5"], cursor: "o5" },
    ]);
  });
});
