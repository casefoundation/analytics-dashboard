<template>
  <div class="container-fluid">
    <h1>Home</h1>
  </div>
</template>

<script>
export default {
  name: 'home',
  created: function () {
    this.$store.dispatch('SET_CURRENT_FEED_ID', { id: null })
  }
}
</script>
