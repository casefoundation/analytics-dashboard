<template>
  <div id="app">
    <navigation></navigation>
    <div class="router-view">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Navigation from './components/Navigation'

export default {
  name: 'app',
  components: {
    Navigation
  },
  mounted: function () {
    this.$store.dispatch('LOAD_FEED_LIST')
  }
}
</script>

<style scoped>
  .router-view {
    padding-top: 70px;
  }
</style>
