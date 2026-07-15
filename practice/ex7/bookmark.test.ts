import { beforeEach, describe, expect, it } from "vitest";
import { CrashError, FakeDisk } from "./disk";
import { CHECKPOINT_FILE, loadCheckpoint, saveCheckpoint } from "./bookmark";

let disk: FakeDisk;
beforeEach(() => {
  disk = new FakeDisk();
});

// 不變量 1:正式檔若存在,內容必是合法 JSON
function expectFileHealthy() {
  const raw = disk.readFile(CHECKPOINT_FILE);
  if (raw !== null) expect(() => JSON.parse(raw)).not.toThrow();
}

describe("基本", () => {
  it("全新磁碟:load 回 null", () => {
    expect(loadCheckpoint(disk)).toBeNull();
  });

  it("save 後 load 回原數字,正式檔是合法 JSON", () => {
    saveCheckpoint(disk, 42);
    expect(loadCheckpoint(disk)).toBe(42);
    expectFileHealthy();
  });

  it("save 兩次:load 回最新", () => {
    saveCheckpoint(disk, 7);
    saveCheckpoint(disk, 8);
    expect(loadCheckpoint(disk)).toBe(8);
  });
});

describe("斷電防線(靈魂:半截檔=事故)", () => {
  it("寫檔途中斷電:save 爆 CrashError,舊值完好", () => {
    saveCheckpoint(disk, 7);
    disk.armCrash("write");
    expect(() => saveCheckpoint(disk, 8)).toThrow(CrashError);
    expect(loadCheckpoint(disk)).toBe(7);
    expectFileHealthy();
  });

  it("rename 途中斷電:save 爆 CrashError,舊值完好", () => {
    saveCheckpoint(disk, 7);
    disk.armCrash("rename");
    expect(() => saveCheckpoint(disk, 9)).toThrow(CrashError);
    expect(loadCheckpoint(disk)).toBe(7);
    expectFileHealthy();
  });

  it("第一次 save 就斷電:load 仍回 null(不是半截垃圾)", () => {
    disk.armCrash("write");
    expect(() => saveCheckpoint(disk, 5)).toThrow(CrashError);
    expect(loadCheckpoint(disk)).toBeNull();
    expectFileHealthy();
  });

  it("斷電後復活:殘留暫存檔不擋路,下一次 save 正常", () => {
    saveCheckpoint(disk, 7);
    disk.armCrash("write");
    expect(() => saveCheckpoint(disk, 8)).toThrow(CrashError);
    saveCheckpoint(disk, 10);
    expect(loadCheckpoint(disk)).toBe(10);
    expectFileHealthy();
  });

  it("陷阱:炸彈裝在「直接寫正式檔」上——走對路的人根本碰不到它", () => {
    disk.armCrash(`write:${CHECKPOINT_FILE}`);
    saveCheckpoint(disk, 5); // 不准爆:正式檔不該被 writeFile 直接寫
    expect(loadCheckpoint(disk)).toBe(5);
    expectFileHealthy();
  });
});
