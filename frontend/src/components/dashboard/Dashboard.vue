<template>
  <div class="container-fluid page-wrapper">
    <nav class="navbar navbar-default">
      <div class="container-fluid">
        <div class="navbar-header">
          <span class="navbar-brand">{{ dashboard.name }}</span>
        </div>
        <div class="collapse navbar-collapse">
          <div class="navbar-form navbar-right">
            <router-link :to="'/dashboard/'+dashboard.id+'/settings'" class="btn btn-primary">Settings</router-link>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'dashboard',
  computed: {
    dashboard () {
      return this.$store.getters.currentDashboard() || {}
    }
  },
  watch: {
    '$route' (to, from) {
      this.loadDashboard()
    }
  },
  mounted () {
    this.loadDashboard()
  },
  methods: {
    loadDashboard () {
      this.$store.dispatch('SET_CURRENT_DASHBOARD', { id: this.$route.params.id })
      this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().googleAccount : {})
    }
  }
}
</script>

<style scoped>
  .page-wrapper {
    padding-top: 20px;
  }
</style>
