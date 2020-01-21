<template>
  <q-card flat bordered class="shadow-2 rounded-borders q-ma-lg">
    <q-card-section>
      <div class="text-h6">Our Changing Planet</div>
    </q-card-section>

<!--    <q-separator inset />-->

    <q-list bordered separator>
<!--      <q-separator spaced />-->
      <q-item-label header>Files</q-item-label>
      <q-item clickable v-ripple v-for="item in pageVisitItems" v-bind:key="item.lastVisitTime">
        <q-item-section>
          <div class="row items-center no-wrap" style="width: 100%;">
            <div class="col-4 url-col col-grow">{{item.url}}</div>
            <q-separator vertical class="q-mr-sm q-ml-sm"/>
            <div class="col-4 col-grow">{{item.title}}</div>
            <q-separator vertical class="q-mr-sm q-ml-sm"/>
            <div class="col-auto">{{item.lastVisitTimeText}}</div>
            <q-separator vertical class="q-mr-sm q-ml-sm"/>
            <div class="col-auto col-transition">{{item.transition}}</div>
            <q-separator vertical class="q-mr-sm q-ml-sm"/>
            <div class="col-auto">
              <del-btn :last-visit-time="item.lastVisitTime" v-on:delete-history-item="handleDeleteHistoryItem"/>
            </div>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script>
import DelBtn from './DelBtn.vue';

export default {
  name: 'HistoryPanel',
  components:{DelBtn},
  props: ['pageVisitItems'],
  created() {
    this.$emit('search', {text: ''});
  },
  methods: {
    handleDeleteHistoryItem(lastVisitTime) {
      return this.$services.history.deleteVisits([lastVisitTime]).then((results)=>{
        this.$emit('remove-history-item', lastVisitTime)
      })
    }
  }
}
</script>

<style scoped lang="scss">
  .col-transition {
    min-width: 48px;
  }

  .url-col {
    overflow: hidden;
    text-overflow: ellipsis;
  }

</style>
