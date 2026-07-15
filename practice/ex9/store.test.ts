import { beforeEach, describe, expect, it } from "vitest";
import { RewindableStore, type Log } from "./store";

function log(blockNumber: number, payload: string): Log {
  return { blockNumber, payload };
}

let store: RewindableStore;
beforeEach(() => {
  store = new RewindableStore(1); // 書籤起始 = 0
});

describe("commit — 只准往前", () => {
  it("正常推進:落庫+書籤前進", () => {
    store.commit([log(3, "a"), log(7, "b")], 10);
    expect(store.getCheckpoint()).toBe(10);
    expect(store.count()).toBe(2);
    store.commit([log(12, "c")], 20);
    expect(store.getCheckpoint()).toBe(20);
    expect(store.count()).toBe(3);
  });

  it("倒退的 commit:throw,且庫和書籤原封不動", () => {
    store.commit([log(3, "a")], 10);
    expect(() => store.commit([log(5, "ghost")], 8)).toThrow();
    expect(store.getCheckpoint()).toBe(10);
    expect(store.count()).toBe(1); // ghost 不准進庫(先動手後檢查的人爆這顆)
  });

  it("原地踏步(scannedTo === 書籤)也算不往前:throw、零痕跡", () => {
    store.commit([], 10);
    expect(() => store.commit([log(9, "ghost")], 10)).toThrow();
    expect(store.count()).toBe(0);
  });

  it("被拒絕之後,正常的 commit 要照常能用", () => {
    store.commit([], 10);
    expect(() => store.commit([], 5)).toThrow();
    store.commit([log(15, "ok")], 20);
    expect(store.getCheckpoint()).toBe(20);
    expect(store.count()).toBe(1);
  });
});

describe("rewind — 唯一合法的倒退", () => {
  it("書籤回到 toBlock,> toBlock 的 events 全刪、≤ 的保留", () => {
    store.commit([log(88, "keep"), log(90, "edge"), log(92, "drop"), log(96, "drop2")], 100);
    store.rewind(90);
    expect(store.getCheckpoint()).toBe(90);
    expect(store.all().map((l) => l.payload)).toEqual(["keep", "edge"]); // 90 在安全線上,活著
  });

  it("rewind 往前(toBlock ≥ 書籤)不是回捲:throw、零痕跡", () => {
    store.commit([log(5, "a")], 10);
    expect(() => store.rewind(10)).toThrow();
    expect(() => store.rewind(15)).toThrow();
    expect(store.getCheckpoint()).toBe(10);
    expect(store.count()).toBe(1);
  });

  it("幽靈帳防線:rewind 後重掃,同一格只有新版本", () => {
    store.commit([log(96, "old-version")], 100);
    store.rewind(90);
    store.commit([log(96, "new-version")], 100); // 重掃 91~100
    expect(store.getCheckpoint()).toBe(100);
    expect(store.all().map((l) => l.payload)).toEqual(["new-version"]); // 舊版必須已銷毀
  });

  it("rewind 之後任何時刻:庫裡不存在 blockNumber > 書籤的 event", () => {
    store.commit([log(50, "a"), log(70, "b"), log(99, "c")], 100);
    store.rewind(60);
    for (const l of store.all()) {
      expect(l.blockNumber).toBeLessThanOrEqual(store.getCheckpoint());
    }
    expect(store.count()).toBe(1);
  });

  it("連環劇:commit → rewind → commit → rewind,書籤軌跡全對", () => {
    store.commit([log(10, "a")], 20);
    store.rewind(15);
    store.commit([log(18, "b")], 30);
    store.rewind(5);
    expect(store.getCheckpoint()).toBe(5);
    expect(store.count()).toBe(0); // 10 和 18 都 > 5,全滅
  });
});
