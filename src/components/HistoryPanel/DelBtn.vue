<template>
  <q-btn :color="delBtnColor" icon="delete" size="sm" round
         v-on:click="handleClick"
         v-on:mouseleave="handleMouseleave"
         v-on:mouseenter="handleMouseenter"/>
</template>

<script>
export default {
  name: 'DelBtn',
  props: ['lastVisitTime'],
  data() {
    return {
      delBtnColor: 'grey'
    }
  },
  methods: {
    handleClick() {
      this.$emit('delete-history-item', this.lastVisitTime);
    },
    handleMouseenter() {
      this.delBtnColor = 'red';
    },
    handleMouseleave() {
      this.delBtnColor = 'grey';
    }
  }
}
</script>

<style scoped>

</style>
