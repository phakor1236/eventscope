// ---- 周邊:已寫好,不要動 ----

export type Order = {
  id: string; // 如 "o1"、"ord-2024-001"
  item: string;
};

export class ApiError extends Error {}

// 假訂單 API。每次 fetchAfter 的參數記進 calls,測試靠它驗你的接關與 limit。
export class FakeShopApi {
  calls: Array<{ sinceId: string | null; limit: number }> = [];
  private failAfter: number | null = null; // 再成功幾次後開始爆

  constructor(private orders: Order[]) {}

  // 回「sinceId 這筆之後」的訂單,最多 limit 筆;sinceId=null 從頭。
  fetchAfter(sinceId: string | null, limit: number): Order[] {
    if (this.failAfter !== null) {
      if (this.failAfter <= 0) throw new ApiError("shop api flaky");
      this.failAfter--;
    }
    this.calls.push({ sinceId, limit });
    const start =
      sinceId === null ? 0 : this.orders.findIndex((o) => o.id === sinceId) + 1;
    return this.orders.slice(start, start + limit);
  }

  armFailure(afterCalls = 0): void {
    this.failAfter = afterCalls;
  }

  disarmFailure(): void {
    this.failAfter = null;
  }

  // 測試用:之後又來了新訂單
  addOrders(newOrders: Order[]): void {
    this.orders.push(...newOrders);
  }
}

// 假庫:訂單+cursor 書籤。commit 一次呼叫=同一筆交易;不做防呆。
export class OrderStore {
  private orders: Order[] = [];
  private cursor: string | null = null;

  getCursor(): string | null {
    return this.cursor;
  }

  commit(orders: Order[], cursor: string): void {
    this.orders.push(...orders);
    this.cursor = cursor;
  }

  count(): number {
    return this.orders.length;
  }

  all(): Order[] {
    return [...this.orders];
  }
}
