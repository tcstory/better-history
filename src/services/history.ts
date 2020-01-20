declare const browser;

export interface QueryType {
  text: string;
  startTime?: number | string | Date;
  endTime?: number | string | Date;
  maxResults?: number;
}

export interface VisitItemType {
  id: string;
  visitId: string;
  visitTime?: number;
  referringVisitId: string;
  transition: string;
}

export interface HistoryItemType {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
  typedCount?: number;

  visitItems?: VisitItemType[];
}

export interface PageVisitItemType {
  lastVisitTime: number;
  transition: string;
  url: string;
  title: string;
}

export interface RemoveInfoType {
  allHistory: boolean;
  urls: string[];
}

class HistoryStore {
  search(query: QueryType): Promise<HistoryItemType[]> {
    return browser.history.search(query);
  }

  getPageVisits(query: QueryType): Promise<HistoryItemType[]> {
    return browser.history.search(query).then(function (results) {
      const p = [] as Promise<any>[];

      for (const historyItem of results) {
        p.push(
          browser.history.getVisits({ url: historyItem.url }).then(function (visitItems: VisitItemType[]): PageVisitItemType[] {
            const temp = [] as any[];

            for (const visitItem of visitItems) {
              let meetCriterion = false;

              if (query.startTime && query.endTime) {
                // @ts-ignore
                meetCriterion = visitItem.visitTime >= query.startTime && visitItem.visitTime <= query.endTime;
              } else if (query.startTime) {
                // @ts-ignore
                meetCriterion = visitItem.visitTime >= query.startTime;
              } else if (query.endTime) {
                // @ts-ignore
                meetCriterion = visitItem.visitTime <= query.endTime;
              } else {
                meetCriterion = true;
              }

              if (meetCriterion) {
                temp.push({
                  lastVisitTime: visitItem.visitTime,
                  transition: visitItem.transition,
                  url: historyItem.url,
                  // I can't get the title of the time of that visit, because VisitItem doesn't have that field,
                  // so I can only use the title of the latest visit which historyItem supply
                  title: historyItem.title
                });
              }
            }

            return temp;
          })
        );
      }

      return Promise.all(p);
    }).then(function (results: (PageVisitItemType[])[]) {
      let ret = [] as PageVisitItemType[];

      for (const item of results) {
        ret = ret.concat(item);
      }

      return ret.sort(function (a, b) {
        return b.lastVisitTime - a.lastVisitTime;
      });
    });
  }

  getVisits(query: { url: string }) {
    return browser.history.getVisits(query);
  }

  deleteUrl(query: { url: string }) {
    return browser.history.deleteUrl(query);
  }

  deleteUrls(query: { urls: string[] }) {
    return Promise.all(query.urls.map(function (url) {
      return browser.history.deleteUrl({ url });
    }));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  deleteVisits(query: number[]) {
    return Promise.all(query.map(function (timestamp) {
      return browser.history.deleteRange({
        startTime: timestamp,
        endTime: timestamp + 1
      });
    }));
  }
}

export const historyStore = new HistoryStore();
