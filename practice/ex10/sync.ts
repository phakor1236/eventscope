// ex10 — 階梯三 L5:API 分頁補抓(換域決賽)。⚠️ 核心 20%。
// 你只准動一個 TODO:syncOrders。電影和對照表在 SPEC.md。
// 規矩:不准開 ex1–ex9 抄。

import { FakeShopApi, OrderStore } from "./shop";

/// 不變量:cursor 永遠=最後成功 commit 那批的最後一筆 id;
/// 空批=收工(不 commit、cursor 不動);回傳這次新入庫的筆數。
export function syncOrders(
  api: FakeShopApi,
  store: OrderStore,
  opts: { batchSize: number },
): number {
  // TODO
  let data = store.getCursor();
  let count = 0;
  while(true){
    const pace = api.fetchAfter(data,opts.batchSize)
    if(pace.length === 0){
      break;
    }
    const lastId = pace[pace.length - 1].id;
    store.commit(
      pace,
      lastId
    );

    data = lastId;

    count += pace.length;

  }

  return count;
}
