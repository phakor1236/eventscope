// ---- 周邊:已寫好,不要動 ----

// 斷電=丟這個錯。你的 save 不用接它,讓它往上爆。
export class CrashError extends Error {}

// 假磁碟。模擬兩個物理事實:
//   writeFile 不是原子的 → 炸彈引爆時,檔案裡留「前半截」內容
//   rename   是原子的   → 炸彈引爆時,什麼都沒發生(檔案原封不動)
export class FakeDisk {
  private files = new Map<string, string>();
  private armed: string | null = null;

  // 裝炸彈(一次性,炸完自動拆除)。op 可以是:
  //   "write"                 → 下一次 writeFile(不管寫哪個檔)
  //   "write:<檔名>"          → 下一次寫這個檔
  //   "rename"                → 下一次 rename
  armCrash(op: string): void {
    this.armed = op;
  }

  writeFile(name: string, content: string): void {
    if (this.armed === "write" || this.armed === `write:${name}`) {
      this.armed = null;
      this.files.set(name, content.slice(0, Math.floor(content.length / 2)));
      throw new CrashError(`power lost while writing ${name}`);
    }
    this.files.set(name, content);
  }

  rename(from: string, to: string): void {
    if (!this.files.has(from)) throw new Error(`rename: ${from} not found`);
    if (this.armed === "rename") {
      this.armed = null;
      throw new CrashError(`power lost before rename ${from} -> ${to}`);
    }
    this.files.set(to, this.files.get(from)!);
    this.files.delete(from);
  }

  // 檔案不存在回 null
  readFile(name: string): string | null {
    return this.files.get(name) ?? null;
  }
}
