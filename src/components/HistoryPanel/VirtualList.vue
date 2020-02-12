<template>
  <div class="wrapper" ref="parentEl">
    <div class="inner"></div>
    <div class="list-wrapper q-list q-list--separator">
    </div>
  </div>
</template>

<script>
import { BehaviorSubject, Subject } from 'rxjs';
import { throttleTime, scan, tap,mapTo, map } from 'rxjs/operators';
import DelBtn from './DelBtn.vue';

const UP = 1;
const DOWN = 0;
const UNSET = -1;

function createHistoryItemDom(item) {
  let historyItemDomStr = `
      <div tabindex="0"
           class="q-item q-item-type row no-wrap history-item q-item--clickable q-link cursor-pointer q-focusable q-hoverable">
        <div tabindex="-1" class="q-focus-helper"></div>
        <div class="q-item__section column q-item__section--main justify-center">
          <div class="row items-center no-wrap" style="width: 100%;">
            <div class="col-4 url-col col-grow col-url">
              ${item.url}
            </div>
            <hr class="q-separator q-mr-sm q-ml-sm q-separator--vertical self-stretch">
            <div class="col-4 col-grow col-title">${item.title}</div>
            <hr class="q-separator q-mr-sm q-ml-sm q-separator--vertical self-stretch">
            <div class="col-auto col-last-visit-time-text">${item.lastVisitTimeText}</div>
            <hr class="q-separator q-mr-sm q-ml-sm q-separator--vertical self-stretch">
            <div class="col-auto col-transition">${item.transition}</div>
            <hr class="q-separator q-mr-sm q-ml-sm q-separator--vertical self-stretch">
            <div class="col-auto">
              <button data-v-93b17ce0="" tabindex="0" type="button"
                      class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--round bg-grey text-white q-btn--actionable q-focusable q-hoverable q-btn--wrap"
                      style="font-size: 10px;">
                <div tabindex="-1" class="q-focus-helper"></div>
                <div class="q-btn__wrapper col row q-anchor--skip">
                  <div class="q-btn__content text-center col items-center q-anchor--skip justify-center row"><i
                    aria-hidden="true" role="presentation" class="material-icons q-icon notranslate">delete</i></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
`;

  return (new DOMParser()).parseFromString(historyItemDomStr, 'text/html').body.firstChild;
}

class Scroller {
  constructor() {
    this.viewportHeight = 0;
    this.listWrapperEl= null;
    this.listWrapperElInitTop= 0;
    this.innerEl= null;
    this.innerElHeight= 0;
    this.scrollEvent$= new Subject();
    this.direction = -1;
    this.scrollTop = 0;
    this.reservedItems = 4;
    this.needMoreItems = this.reservedItems * 2;
    this.unusedDom = [];
    this.itemList = [];
    this.anchorTopItemIdx = UNSET;
    this.anchorBottomItemIdx = UNSET;
  }

  init(listWrapperEl) {
    if ('scrollRestoration' in history) {
      // Back off, browser, I got this...
      history.scrollRestoration = 'manual';
    }

    this.listWrapperEl = listWrapperEl;
    this.innerEl = this.listWrapperEl.querySelector('.inner');

    this.listWrapperElInitTop = listWrapperEl.getBoundingClientRect().top;
    this.viewportHeight = document.documentElement.clientHeight;

    this.onScroll();
  }

  setData(itemList) {
    this.itemList = itemList.map(function (item,idx) {
      return {
        ...item,
        title: `${item.title}---${idx}`,
        style: {
          offsetTop: -1,
          offsetHeight: -1,
          translateY: -1,
        },
        dom: null,
      }
    });
  }

  _onScroll() {
    this.scrollEvent$.next('scroll');
    // console.log('scroll me', Date.now())
  }

  updateAnchorBottomItem() {
    for (let i = this.anchorTopItemIdx + 1; i < this.itemList.length; i++) {
      let delta = this.calculateDelta(this.itemList[i]);

      if (delta > 0 && delta <= this.viewportHeight) {
        this.anchorBottomItemIdx = UNSET;
      } else {
        this.anchorBottomItemIdx = i;
        break;
      }
    }
  }

  updateAnchorTopItemFromTop (delta, i) {
    if (delta < 0) {
      this.anchorTopItemIdx = UNSET;
      return false;
    } else {
      if (this.anchorTopItemIdx === UNSET) {
        this.anchorTopItemIdx = i;
        return true;
      } else {
        // anchorItem is still the old one.
        return true;
      }
    }
  }

  updateAnchorTopItemFromBottom(delta, i) {
    if (i === 0) {
      this.anchorTopItemIdx = 0;
      return true;
    }

    if (delta < 0) {
      if (this.anchorTopItemIdx === UNSET) {
        this.anchorTopItemIdx = i + 1;
        return true;
      } else {
        // anchorItem is still the old one.
        return true;
      }
    } else {
      this.anchorTopItemIdx = UNSET;
      return false;
    }
  }

  calculateDelta(item) {
    return item.style.offsetHeight + item.style.offsetTop
      + this.listWrapperElInitTop
      - this.scrollTop;
  }

  onScroll()  {
    window.addEventListener('scroll',  this._onScroll.bind(this), {passive: true});

    this.scrollEvent$.pipe(
      throttleTime(20),
      map(function () {
        return document.documentElement.scrollTop;
      }),
      scan(function (acc, curr) {
        acc.direction = curr > acc.prev ? UP : DOWN;
        acc.prev = curr;

        return acc;
      }, {
        prev: 0,
        direction: -1,
      })
    ).subscribe( (val) => {
      this.direction = val.direction;
      this.scrollTop = val.prev;

      if (this.direction === UP) {
        for (let i = this.anchorTopItemIdx; i < this.itemList.length; i++) {
          let item = this.itemList[i];
          let delta = this.calculateDelta(item);

          let hasUpdated = this.updateAnchorTopItemFromTop(delta, i);

          if (hasUpdated) {
            break;
          }
        }
      } else {
        for (let i = this.anchorTopItemIdx; i >= 0; i--) {
          let item = this.itemList[i];
          let delta = this.calculateDelta(item);

          let hasUpdated = this.updateAnchorTopItemFromBottom(delta, i);

          if (hasUpdated) {
            break;
          }
        }
      }

      this.updateAnchorBottomItem();
      this.insertIfNeeded();
    });
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll);
    this.scrollEvent$.complete();
  }

  firstRender() {
    if (!this.itemList.length) {
      return null;
    }

    this.anchorTopItemIdx = 0;
    let needMoreItems = this.needMoreItems; // add more items to make browser has scroll bar

    for (let i = 0; i < this.itemList.length; i++) {
      let item = this.itemList[i];

      if (this.viewportHeight > (this.innerElHeight + this.listWrapperElInitTop)) {
        this.createDomAndInsert(item);
      } else if (needMoreItems > 0) {
        needMoreItems--;
        this.createDomAndInsert(item);
      } else {
        break;
      }
    }
  }

  createDomAndInsert(item) {
    let dom = createHistoryItemDom(item);
    item.dom = dom;
    this.listWrapperEl.appendChild(dom);
    this.adjustStyle(dom, item);
  }

  insertIfNeeded() {
    // console.log('insertIfNeeded', this.anchorTopItemIdx, this.anchorBottomItemIdx);

    this.recycleDom();

    let startIdx = this.anchorTopItemIdx - this.reservedItems;

    if (startIdx < 0) {
      startIdx = 0;
    }

    let endIdx = this.anchorBottomItemIdx + this.reservedItems;

    if (endIdx > (this.itemList.length - 1)) {
      endIdx = this.itemList.length - 1;
    }

    // console.log('startIdx, endIdx', startIdx, endIdx);
    while(startIdx <= endIdx) {
      let item = this.itemList[startIdx];

      if (item.dom === null) {
        let dom = this.getUnusedDom();

        if (dom === null) {
          // console.log('=============>>>> need more dom', startIdx)
          let dom = createHistoryItemDom(item);
          item.dom = dom;
          this.listWrapperEl.appendChild(dom);
          this.adjustStyle(dom, item);
        } else {
          item.dom = dom;
          this.renderItem(dom, item);
          this.adjustStyle(dom, item);
        }
      } else {
        // nothing
      }

      startIdx++;
    }

  }

  getUnusedDom() {
    if (this.unusedDom.length > 0) {
      let idx = this.unusedDom.shift();
      let item = this.itemList[idx];
      let dom = item.dom;
      item.dom = null;

      return dom;
    } else {
      return null;
    }
  }

  recycleDom() {
    let topIdx = this.anchorTopItemIdx - this.reservedItems - 1;
    let bottomIdx = this.anchorBottomItemIdx + this.reservedItems + 1;

    if (this.direction === UP) {
      let unusedDom = [];

      while (topIdx >= 0) {
        if (this.itemList[topIdx].dom === null) {
          if (this.itemList[this.anchorTopItemIdx].dom !== null) {
            break;
          }
        } else {
          unusedDom.push(topIdx);
        }
        topIdx--;
      }

      this.unusedDom = [...new Set(this.unusedDom.concat(unusedDom))];
    }

    if (this.direction === DOWN) {
      let unusedDom = [];

      while (bottomIdx < this.itemList.length) {
        if (this.itemList[bottomIdx].dom === null) {
          if (this.itemList[this.anchorTopItemIdx].dom !== null) {
            break;
          }
        } else {
          unusedDom.push(bottomIdx);
        }
        bottomIdx++;
      }

      this.unusedDom = [...new Set(this.unusedDom.concat(unusedDom))];
    }

    // console.log(this.anchorTopItemIdx, this.anchorBottomItemIdx);
    // console.log('recycleDom', this.direction, this.unusedDom);
  }

  renderItem(historyDom, item) {
    historyDom.querySelector('.col-url').textContent = item.url;
    historyDom.querySelector('.col-title').textContent = item.title;
    historyDom.querySelector('.col-last-visit-time-text').textContent = item.lastVisitTimeText;
    historyDom.querySelector('.col-transition').textContent = item.transition;
  }

  adjustStyle(historyDom, item) {
    // we dont need to check both offsetHeight and translateY equal null
    if (item.style.offsetHeight === -1) {
      item.style.offsetHeight = historyDom.offsetHeight;
      item.style.offsetTop = this.innerElHeight;
      item.style.translateY = `translateY(${this.innerElHeight}px)`;

      this.innerElHeight += item.style.offsetHeight;
      this.innerEl.style.height = `${this.innerElHeight}px`;
    }

    historyDom.style.transform = item.style.translateY;
  }
}

export default {
  name: 'VirtualList',
  // components: {DelBtn},
  props: ['pageVisitItems'],
  mounted() {
    this.scroller = new Scroller();

    this.scroller.init(this.$refs.parentEl);

    this.subject$.subscribe( (itemList) => {
      this.scroller.setData(itemList);
      this.scroller.firstRender();
    });
  },
  beforeDestroy() {
    this.scroller.destroy();
    this.subject$.complete();
  },
  created() {
    this.subject$ = new BehaviorSubject([]);
  },
  watch: {
    pageVisitItems(newVal, oldVal) {
      this.subject$.next(newVal);
    }
  },
  methods: {
    handleDeleteHistoryItem() {
      console.log('handleDeleteHistoryItem')
    }
  },
}
</script>

<style>
  .col-transition {
    min-width: 48px!important;
  }

  .url-col {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wrapper {
    position: relative;
    width: 100%;
    contain: layout style;
  }

  .list-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    width: 100%;
  }

  .inner {
  }

  .history-item {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;

    contain: layout paint;
    will-change: transform;
  }

</style>
