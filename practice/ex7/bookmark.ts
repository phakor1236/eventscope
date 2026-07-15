// ex7 — 階梯三 L2:書籤搬進 JSON 檔,原子性自己造。
// ⚠️ 核心 20%:crash 一致性。周邊(FakeDisk)已寫好。
// 你只准動兩個 TODO:saveCheckpoint / loadCheckpoint。規矩:不准開 ex1–ex6 抄。

import type { FakeDisk } from "./disk";

// 正式檔名(固定)。暫存檔名自己取,不准跟這個一樣。
export const CHECKPOINT_FILE = "checkpoint.json";

/// 你有的工具只有 3 句:
///   disk.writeFile(name, content) → 寫檔(⚠️ 不是原子的:斷電會留半截)
///   disk.rename(from, to)         → 改名(✅ 原子的:要嘛全發生要嘛沒發生)
///   disk.readFile(name)           → 讀檔,回字串;檔案不存在回 null
///
/// 職責(做完後世界要長這樣):
///   例1  全新磁碟 → saveCheckpoint(disk, 42) → loadCheckpoint(disk) 回 42,
///        且 checkpoint.json 的內容是合法 JSON
///   例2  已存過 7 → save(8) 途中「寫檔」被斷電(CrashError 往上爆,不用接)
///        → load 回 7,一點沒壞
///   例3  已存過 7 → save(9) 途中「rename」被斷電 → load 回 7
///   例4  例2/例3 斷電之後再 save(10) → 成功,load 回 10(殘骸不擋路)
///
/// 鐵律:checkpoint.json 任何時刻都不准是半截檔。
export function saveCheckpoint(disk: FakeDisk, lastBlock: number): void {
  // TODO
  const text = JSON.stringify(lastBlock);
  const newfile = "checkpoint.tmp";
  disk.writeFile(newfile, text);
  disk.rename(newfile, CHECKPOINT_FILE);
}

/// 職責:回上次成功存的書籤數字;從來沒存過 → null。
export function loadCheckpoint(disk: FakeDisk): number | null {
  // TODO
  const value = disk.readFile(CHECKPOINT_FILE);
  if(!value){
    return null;
  }
    return JSON.parse(value);
}
