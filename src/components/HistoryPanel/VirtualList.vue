<template>
  <div class="wrapper" ref="parentEl">
<!--    <div class="list-wrapper q-list q-list&#45;&#45;separator q-list&#45;&#45;bordered">-->
<!--    </div>-->

    <div class="list-wrapper q-list q-list--separator">
      <div class="inner"></div>
    </div>
  </div>
</template>

<script>
import DelBtn from './DelBtn.vue';

let list = [];

function createHistoryItemDom(item) {
  let historyItemDomStr = `
      <div tabindex="0"
           class="q-item q-item-type row no-wrap history-item q-item--clickable q-link cursor-pointer q-focusable q-hoverable">
        <div tabindex="-1" class="q-focus-helper"></div>
        <div class="q-item__section column q-item__section--main justify-center">
          <div class="row items-center no-wrap" style="width: 100%;">
            <div class="col-4 url-col col-grow">
              ${item.url}
            </div>
            <hr class="q-separator q-mr-sm q-ml-sm q-separator--vertical self-stretch">
            <div class="col-4 col-grow">${item.title}</div>
            <hr class="q-separator q-mr-sm q-ml-sm q-separator--vertical self-stretch">
            <div class="col-auto">${item.lastVisitTimeText}</div>
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

export default {
  name: 'VirtualList',
  // components: {DelBtn},
  props: ['pageVisitItems'],
  mounted() {
    console.log('mounted virtuallist');
    this.historyItemEl = this.$refs.parentEl.querySelector('.bubble');
    this.innerEl = this.$refs.parentEl.querySelector('.inner');
    this.listWrapperEl = this.$refs.parentEl.querySelector('.list-wrapper');

    setTimeout(() => {
      let innerHeight = 0;

      for (let item of this.pageVisitItems) {
        let el = createHistoryItemDom(this.historyItemEl);
        item.el = el;
        this.listWrapperEl.appendChild(el);
      }

      for (let item of this.pageVisitItems) {
        item.el.style.transform = `translateY(${innerHeight}px)`;
        let offsetHeight = item.el.offsetHeight;
        item.offsetHeight = offsetHeight;
        innerHeight += offsetHeight;
      }


    }, 2000)
  },
  created() {
    console.log('created virtuallist')
  },
  watch: {
    pageVisitItems(newVal, oldVal) {
      let innerHeight = 0;

      for (let item of newVal) {
        let el = createHistoryItemDom(item);
        item.el = el;

        this.listWrapperEl.appendChild(el);
      }

      for (let item of newVal) {
        item.offsetHeight = item.el.offsetHeight;
      }

      for (let item of newVal) {

        item.el.style.transform = `translateY(${innerHeight}px)`;
        innerHeight += item.offsetHeight;
      }


      this.innerEl.style.height = `${innerHeight}px`;
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

  .bubble {
    contain: layout;
    will-change: transform;
    position: absolute;
  }

  .wrapper {
    /*min-height: 100vh;*/
    /*position: absolute;*/
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: scroll;
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
