<template>
  <div>
    <history-panel v-on:search="handleSearch" v-bind:pageVisitItems="pageVisitItems"
      v-on:remove-history-item="handleRemoveHistoryItem"></history-panel>
  </div>
</template>

<script>
import {endOfDay, getTime, format} from 'date-fns';

import init from '../services/index';
import HistoryPanel from '../components/HistoryPanel/Index.vue';

function convertHistoryItems(historyItems) {
  let menuItems = [];
  let curValue = -1;
  let newHistoryItems = [];

  historyItems.forEach(function (item) {
    let newItem = {
      ...item,
      lastVisitTimeText: format(item.lastVisitTime, 'yyyy-MM-dd HH:mm:ss'),
      isChecked: false,
      endOfDay: getTime(endOfDay(item.lastVisitTime)),
    };


    if (curValue !== newItem.endOfDay) {
      menuItems.push({
        label: format(newItem.lastVisitTime, 'yyyy-MM-dd'),
        value: curValue = newItem.endOfDay,
      });
    }

    newHistoryItems.push(newItem);
  });

  return {menuItems, historyItems: newHistoryItems};

}

export default {
  name: 'HistoryManagement',
  components: {HistoryPanel},
  created() {
    init();
  },
  data() {
    return {
      pageVisitItems: [],
    }
  },
  methods: {
    handleSearch(query){
      return this.$services.history.getPageVisits(query).then((results) => {
        let {historyItems} = convertHistoryItems(results);
        this.pageVisitItems = historyItems;
      })
    },
    handleRemoveHistoryItem(lastVisitTime) {
      let idx = this.pageVisitItems.findIndex(function (item) {
        return item.lastVisitTime === lastVisitTime;
      });

      if (idx > -1) {
        this.pageVisitItems.splice(idx,1);
      }
    }
  }
}
</script>
