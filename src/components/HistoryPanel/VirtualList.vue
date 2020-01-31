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
  constructor(el, id) {
    this.el = el;
    this.id = id;
    this.style = {
      offsetTop: -1,
      offsetHeight: -1,
      translateY: -1,
    };
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
    this.unusedDomList= [];
    this.scrollEvent$= new Subject();
    this.headDomIdx = -1;
    this.tailDomIdx = -1;
    this.direction = -1;
    this.scrollTop = 0;
  }

  init(listWrapperEl) {
    this.listWrapperEl = listWrapperEl;
    this.listWrapperElInitTop = listWrapperEl.getBoundingClientRect().top;
    // this.viewportHeight =
    //   document.documentElement.clientHeight -
    //   this.listWrapperElTop -
    //   parseFloat(window.getComputedStyle(this.listWrapperEl).marginBottom);
    this.viewportHeight = document.documentElement.clientHeight;
    this.innerEl = this.listWrapperEl.querySelector('.inner');
  }

  getUnusedDom() {
    let unusedDomInAbove = -1;
    let unusedDomInBottom = -1;
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
    if (this.direction === UP) {
      if (unusedDomInBottom < 3) {
        if (unusedDomInAbove > 3) {
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
    } else if (this.direction === DOWN) {
      if (unusedDomInAbove < 3) {
        if (unusedDomInBottom > 3) {
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
      }
    } else {
      return null;
    }
  }

  insert(data) {
    // creat dom and insert it to list wrapper
    let el = createHistoryItemDom(data);
    let dom = new HistoryDOM(el, data.lastVisitTime);
    this.domList.push(dom);
    this.listWrapperEl.appendChild(el);
    this.adjustStyle(dom, data);
    dom.show();
  }

  insertIfNeeded(data) {
    let nani = {
      id: "17",
      lastVisitTime: 1580456049269.886,
      lastVisitTimeText: 'secret time',
      title: "better history -- nani",
      typedCount: 2,
      url: "chrome-extension://abcd/index.html#/history-management",
      visitCount: 224,
    };

    let dom = this.getUnusedDom();

    if (dom) {
      dom.id = data.lastVisitTime;
      this.render(dom, nani);
      this.adjustStyle(dom, nani);
      dom.show();
    }
  }

  render(historyDom, data) {
    historyDom.hide();
    historyDom.el.querySelector('.col-url').textContent = data.url;
    historyDom.el.querySelector('.col-title').textContent = data.title;
    historyDom.el.querySelector('.col-last-visit-time-text').textContent = data.lastVisitTimeText;
    historyDom.el.querySelector('.col-transition').textContent = data.transition;
  }

  adjustStyle(historyDom, data) {
    // we dont need to check both offsetHeight and translateY equal null
    if (historyDom.style.offsetHeight === -1) {
      historyDom.style.offsetHeight = historyDom.el.offsetHeight;
      historyDom.style.offsetTop = this.innerElHeight;
      historyDom.style.translateY = `translateY(${this.innerElHeight}px)`;

      this.innerElHeight += historyDom.style.offsetHeight;

      if ((this.innerElHeight + this.scrollTop) > this.viewportHeight) {
        historyDom.isInViewport = false;
      } else {
        historyDom.isInViewport = true;
      }

      this.innerEl.style.height = `${this.innerElHeight}px`;
    }

    historyDom.el.style.transform = historyDom.style.translateY;
  }
}

export default {
  name: 'VirtualList',
  // components: {DelBtn},
  props: ['pageVisitItems'],
  mounted() {
    if ('scrollRestoration' in history) {
      // Back off, browser, I got this...
      history.scrollRestoration = 'manual';
    }

    this.scroller = new Scroller();

    this.scroller.init(this.$refs.parentEl);

    this.subject$.subscribe( (itemList) => {
      let needMoreItems = 4; // add more items to make browser has scroll bar

      for (let i = 0; i < itemList.length; i++) {
        let item = itemList[i];
        // item.style = {
        //   offsetTop: null,
        //   offsetHeight: null,
        //   translateY: null,
        // };

        if (this.scroller.viewportHeight > (this.scroller.innerElHeight + this.scroller.listWrapperElInitTop)) {
          this.scroller.insert(item);
        } else if (needMoreItems > 0) {
          needMoreItems--;
          this.scroller.insert(item);
        }
      }

      console.log('init dom', this.scroller.domList)
    });

    this.scroller.scrollEvent$.pipe(
      throttleTime(30),
      map(function () {
        return document.documentElement.scrollTop;
      }),
      scan(function (acc, curr) {
        acc.direction = curr > acc.prev ? UP: DOWN;
        acc.prev = curr;

        return acc;
      }, {
        prev: 0,
        direction: -1,
      })
    ).subscribe( (val) => {
      this.scroller.direction = val.direction;
      this.scroller.scrollTop = val.prev;

      for (let i = 0; i< this.scroller.domList.length; i++) {
        let dom = this.scroller.domList[i];
        let delta = (dom.style.offsetHeight + dom.style.offsetTop)
          + this.scroller.listWrapperElInitTop
          - val.prev - 50;

        if (delta < 0) {
          dom.isInViewport = false;
        } else if(delta >= this.scroller.viewportHeight) {
          dom.isInViewport = false;
        } else {
          dom.isInViewport = true;
        }
      }

      this.scroller.insertIfNeeded({});
    });

    this.onScroll = () => {
      this.scroller.scrollEvent$.next('scroll');
    };

    window.addEventListener('scroll',  this.onScroll);
  },
  beforeDestroy() {
    this.subject$.complete();
    window.removeEventListener('scroll', this.onScroll);
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
