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

function createHistoryItemDom(item) {
  let historyItemDomStr = `
      <div tabindex="0"
           style="opacity: 0;"
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

class HistoryDOM {
  constructor(el, idx) {
    this.el = el;
    this.idx = idx;
    this.isInViewport = false;
  }

  show() {
    this.el.style.opacity = 1;
  }

  hide() {
    this.el.style.opacity = 0;
  }
}

class Scroller {
  constructor() {
    this.viewportHeight= 0;
    this.listWrapperEl= null;
    this.listWrapperElInitTop= 0;
    this.innerEl= null;
    this.innerElHeight= 0;
    this.domList= [];
    this.scrollEvent$= new Subject();
    this.direction = -1;
    this.scrollTop = 0;
    this.itemList = [];
    this.reservedItems = 4;
    this.needMoreItems = this.reservedItems * 2;
  }

  init(listWrapperEl) {
    if ('scrollRestoration' in history) {
      // Back off, browser, I got this...
      history.scrollRestoration = 'manual';
    }

    this.listWrapperEl = listWrapperEl;
    this.listWrapperElInitTop = listWrapperEl.getBoundingClientRect().top;
    this.viewportHeight = document.documentElement.clientHeight;
    this.innerEl = this.listWrapperEl.querySelector('.inner');

    this.onScroll();
    this.listenToScroll();
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
        }
      }
    });
  }

  listenToScroll() {
    this.scrollEvent$.pipe(
      throttleTime(30),
      map(function () {
        return document.documentElement.scrollTop;
      }),
      scan(function (acc, curr) {
        acc.direction = curr > acc.prev ? DOWN : UP;
        acc.prev = curr;

        return acc;
      }, {
        prev: 0,
        direction: -1,
      })
    ).subscribe( (val) => {
      this.direction = val.direction;
      this.scrollTop = val.prev;

      for (let i = 0; i < this.domList.length; i++) {
        let dom = this.domList[i];
        let item = this.itemList[dom.idx];

        let delta = (item.style.offsetHeight + item.style.offsetTop)
          + this.listWrapperElInitTop
          - val.prev;

        if (delta < 0) {
          dom.isInViewport = false;
        } else if(delta >= this.viewportHeight) {
          dom.isInViewport = false;
        } else {
          dom.isInViewport = true;
        }
      }

      this.insertIfNeeded();
    });
  }

  _onScroll() {
    this.scrollEvent$.next('scroll');
  }

  onScroll()  {
    window.addEventListener('scroll',  this._onScroll.bind(this));
  }

  destroy() {
    window.removeEventListener('scroll', this._onScroll);
    this.scrollEvent$.complete();
  }

  getItem() {
    if (this.itemList.length === 0) {
      return null;
    }

    if (this.direction === UP) {
      let headDom = this.domList[0];

      if (headDom.idx > 0) {
        return [this.itemList[headDom.idx - 1], headDom.idx - 1];
      } else {
        return null;
      }
    } else {
      let tailDom = this.domList[this.domList.length - 1];
      if (tailDom.idx + 1 < this.itemList.length) {
        return [this.itemList[tailDom.idx + 1], tailDom.idx + 1];
      } else {
        return null;
      }
    }
  }

  firstRender() {
    if (!this.itemList.length) {
      return null;
    }

    let needMoreItems = this.needMoreItems; // add more items to make browser has scroll bar

    let i;
    for (i = 0; i < this.itemList.length; i++) {
      let item = this.itemList[i];

      if (this.viewportHeight > (this.innerElHeight + this.listWrapperElInitTop)) {
        this.createDomAndInsert(item, i);
      } else if (needMoreItems > 0) {
        needMoreItems--;
        this.createDomAndInsert(item, i);
      } else {
        break;
      }
    }

    console.log('fist render', this.domList)
  }

  getUnusedDom() {
    let unusedDomInAbove = 0;
    let unusedDomInBottom = 0;
    let which = 0;

    for (let idx = 0; idx < this.domList.length; idx++) {
      let dom = this.domList[idx];

      if (which === 0 && dom.isInViewport === false) {
        unusedDomInAbove++;
      }

      if (which === 0 && dom.isInViewport === true) {
        which = 1;
      }

      if (which === 1 && dom.isInViewport === false) {
        unusedDomInBottom++;
      }
    }
    console.log(this.domList.length, this.direction, unusedDomInAbove, unusedDomInBottom)
    let reservedItems = this.reservedItems;

    if (this.direction === UP) {
      if (unusedDomInAbove < reservedItems) {
        if (unusedDomInBottom > reservedItems) {
          let dom =  this.domList.pop();
          this.domList.unshift(dom);
          return dom;
        } else {
          let el = createHistoryItemDom({});
          let dom = new HistoryDOM(el, -1);
          this.domList.unshift(dom);
          this.listWrapperEl.appendChild(el);
          return dom;
        }
      } else {
        return null;
      }
    } else if (this.direction === DOWN) {
      if (unusedDomInBottom < reservedItems) {
        if (unusedDomInAbove > reservedItems) {
          let dom =  this.domList.shift();
          this.domList.push(dom);
          return dom;
        } else {
          let el = createHistoryItemDom({});
          let dom = new HistoryDOM(el, -1);
          this.domList.push(dom);
          this.listWrapperEl.appendChild(el);
          return dom;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  createDomAndInsert(item, idx) {
    // creat dom and insert it to list wrapper
    let el = createHistoryItemDom(item);
    let dom = new HistoryDOM(el, idx);
    this.domList.push(dom);
    this.listWrapperEl.appendChild(el);
    this.adjustStyle(dom, item);
    dom.show();
  }

  insertIfNeeded() {
    let data = this.getItem();

    if (data) {
      let dom = this.getUnusedDom();

      if (dom) {
        let [item, idx] = data;
        dom.idx = idx;
        this.renderItem(dom, item);
        this.adjustStyle(dom, item);
        dom.show();
      }
    }
  }

  renderItem(historyDom, item) {
    historyDom.hide();
    historyDom.el.querySelector('.col-url').textContent = item.url;
    historyDom.el.querySelector('.col-title').textContent = item.title;
    historyDom.el.querySelector('.col-last-visit-time-text').textContent = item.lastVisitTimeText;
    historyDom.el.querySelector('.col-transition').textContent = item.transition;
  }

  adjustStyle(historyDom, item) {
    // we dont need to check both offsetHeight and translateY equal null
    if (item.style.offsetHeight === -1) {
      item.style.offsetHeight = historyDom.el.offsetHeight;
      item.style.offsetTop = this.innerElHeight;
      item.style.translateY = `translateY(${this.innerElHeight}px)`;

      this.innerElHeight += item.style.offsetHeight;

      if ((this.innerElHeight + this.scrollTop) > this.viewportHeight) {
        historyDom.isInViewport = false;
      } else {
        historyDom.isInViewport = true;
      }

      this.innerEl.style.height = `${this.innerElHeight}px`;
    }

    historyDom.el.style.transform = item.style.translateY;
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

    contain: layout;
    will-change: transform;
  }

</style>
