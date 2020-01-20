<template>
  <q-card flat bordered class="shadow-2 rounded-borders q-ma-lg">
    <q-card-section>
      <div class="text-h6">Our Changing Planet</div>
    </q-card-section>

    <q-separator inset />

    <q-list bordered separator>
      <q-item clickable v-ripple v-for="item in pageVisitItems" v-bind:key="item.lastVisitTime">
        <q-item-section>
          <div class="row items-center">
            <div class="col-4">{{item.url}}</div>
            <q-separator vertical class="vertical"/>
            <div class="col-4">{{item.title}}</div>
            <q-separator vertical class="vertical"/>
            <div class="col-1 col-grow">{{item.lastVisitTime}}</div>
            <q-separator vertical class="vertical"/>
            <div class="col-1 col-grow">{{item.transition}}</div>
            <q-separator vertical class="vertical"/>
            <div class="col-auto">action</div>
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script lang="ts">
export default {
  name: 'HistoryPanel',
  props: ['pageVisitItems'],
  data() {
    return {
    }
  },
  created(): void {
    this.$emit('search', {text: ''});
  }
}
</script>

<style scoped>
  .vertical {
    margin-right: 8px;
  }
</style>
