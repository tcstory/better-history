import Vue from 'vue';
import HistoryStore from "./history";

let isInited = false;

export default function init() {

  if (!isInited) {
    isInited = true;

    Vue.prototype.$services = {
      history: new HistoryStore()
    };
  }
}
