<template>
  <div>
    <history-panel v-on:search="handleSearch" v-bind:pageVisitItems="pageVisitItems"></history-panel>
  </div>
</template>

<script lang="ts">
import init from '../services/index';
import HistoryPanel from '../components/HistoryPanel/Index.vue';
import {HistoryItemType, PageVisitItemType, QueryType} from "../services/history";

export default {
  name: 'HistoryManagement',
  components: {HistoryPanel},
  created() {
    init();
  },
  data() {
    return {
      pageVisitItems: [] as PageVisitItemType[],
    }
  },
  methods: {
    handleSearch(query: QueryType){
      return this.$services.history.getPageVisits(query).then((results) => {
        console.log('===>>>>', results);
        this.pageVisitItems = results;
      })
    }
  }
}
</script>
