<template>
  <q-card flat bordered class="shadow-2 rounded-borders q-ma-lg">
    <q-card-section>
      <div class="text-h6">Our Changing Planet</div>
    </q-card-section>
    <virtual-list v-bind:page-visit-items="pageVisitItems"/>
  </q-card>
</template>

<script>
import VirtualList from './VirtualList';

export default {
  name: 'HistoryPanel',
  components:{VirtualList},
  props: ['pageVisitItems'],
  created() {
    this.$emit('search', {text: ''});
    console.log('index created')
  },
  mounted() {
    console.log('index mounted')
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
</style>
