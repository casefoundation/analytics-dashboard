<template>
  <div id="app">
    <navigation></navigation>
    <div class="router-view">
      <router-view></router-view>
    </div>
    <modal :show.sync="showModal">
      <div slot="modal-header" class="modal-header" small="true">
        <h4 class="modal-title">Google Account Not Connected</h4>
      </div>
      <div slot="modal-body" class="modal-body">
        The dashboard is not connected to your Google Analytics account. Please authorize the connection by selecting the "Connect" button below.
      </div>
      <div slot="modal-footer" class="modal-footer">
        <a href="/api/auth/googleanalytics/start" class="btn btn-success">Connect</a>
      </div>
    </modal>
  </div>
</template>

<script>
import Navigation from './components/Navigation'
import { modal } from 'vue-strap'
import axios from 'axios'

export default {
  name: 'app',
  components: {
    Navigation,
    modal
  },
  data () {
    return {
      showModal: false
    }
  },
  mounted: function () {
    this.$store.dispatch('LOAD_FEED_LIST')
    this.$store.dispatch('LOAD_DASHBOARD_LIST')
    axios.get('/api/auth/googleanalytics/check').then((response) => {
      if (!response.data.loggedIn) {
        this.showModal = true
      }
    }, () => {
      this.showModal = true
    })
  }
}
</script>

<style src="./assets/bootstrap.scss" lang="scss"></style>
