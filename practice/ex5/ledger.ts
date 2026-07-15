// ex5 — Webhook 收單器:at-least-once 重送環境下的冪等入帳。
// ⚠️ 核心 20%:碰錢。totalCents 的數字對到真實帳務,重複入帳=事故。
// 周邊(型別、totalCents、count、all)已寫好。你只准動兩個 TODO:record / has。
// 規矩:不准開 ex1–ex4 抄。

export type PaymentNotice = {
  provider: string; // 金流商,可能含 '-'(如 "pay-pal")
  event_id: string; // 該金流商的通知流水號,可能含 '-'(如 "evt-2024-001")
  type: string; // 如 "payment.succeeded"
  amount_cents: number; // 金額(分)
  currency: string;
};

export type RecordReport = {
  accepted: number; // 這次真正入帳的單數
  duplicates: number; // 這次被擋下的重送單數
};

export class PaymentLedger {
  // 帳本本體。身分證=(provider, event_id) 兩零件。
  // 分隔符警告:兩個零件都可能含 '-',黏法是你的設計責任(SPEC 規則 7)。
  private entries = new Map<string, PaymentNotice>();
  private makeKey(provider: string, eventId: string):string{
    return `${provider}|${eventId}`;
  }
  /// 職責:收一批(可能重送的)付款通知,冪等入帳,回兩本帳。
  /// 不變量:
  ///  - accepted + duplicates === batch.length
  ///  - first-write-wins:重送單就算金額不同,帳本以第一次為準
  ///  - totalCents() 永遠等於「不同通知」的金額加總——重送零影響
  record(batch: PaymentNotice[]): RecordReport {
    // TODO
    let accepted = 0;
    let duplicates = 0;
    for (const i of batch){
      if(!this.has(i.provider,i.event_id)){
        const key = this.makeKey(i.provider, i.event_id);       
        this.entries.set(key,i);
        accepted++;
      }else{
        duplicates++;
      }

    }
    return {accepted,duplicates};
  }

  /// 職責:這張單 (provider, eventId) 收過沒?
  has(provider: string, eventId: string): boolean {
    // TODO
    return this.entries.has(this.makeKey(provider, eventId)); 
 }

  // ---- 周邊:已寫好,不要動 ----

  totalCents(): number {
    let sum = 0;
    for (const n of this.entries.values()) sum += n.amount_cents;
    return sum;
  }

  count(): number {
    return this.entries.size;
  }

  all(): PaymentNotice[] {
    return [...this.entries.values()];
  }
}
