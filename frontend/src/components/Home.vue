<template>
  <div class="container-fluid">
  </div>
</template>

<script>
export default {
  name: 'home',
  created: function () {
    this.$store.dispatch('SET_CURRENT_FEED', { id: null })
  }
}
</script>
