<template>
  <div class="container-fluid">
    <h1>Feed {{ feed.name }}</h1>
    <router-link :to="'/feed/'+feed.id+'/settings'">Settings</router-link>
  </div>
</template>

<script>
export default {
  name: 'feed',
  computed: {
    feed () {
      return this.$store.getters.currentFeed || {}
    }
  },
  created: function () {
    this.$store.dispatch('SET_CURRENT_FEED', { id: this.$route.params.id })
  }
}
</script>
