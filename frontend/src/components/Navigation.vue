<template>
  <div>
    <navbar placement="top" type="inverse" container="fluid">
      <a slot="brand" href="/" title="Home" class="navbar-brand">
        <img src="http://case.bootstrap.theme.s3-website-us-west-2.amazonaws.com/logo.svg" width="178" height="48" />
      </a>
      <dropdown text="Dashboards">
        <li v-for="dashboard in dashboards">
          <router-link :to="'/dashboard/'+dashboard.id">{{dashboard.name}}</router-link>
        </li>
      </dropdown>
      <dropdown text="Feeds">
        <li v-for="feed in feeds">
          <router-link :to="'/feed/'+feed.id">{{feed.name}}</router-link>
        </li>
      </dropdown>
      <div class="navbar-form navbar-right" slot="right">
        <button class="btn btn-success" @click="showFeedModal = true">New Feed</button>
        <button class="btn btn-success" @click="showDashboardModal = true">New Dashboard</button>
      </div>
    </navbar>
    <modal v-model="showFeedModal" ok-text="Create" :callback="createNewFeed">
      <div slot="modal-header" class="modal-header">
        <h4 class="modal-title">New Feed</h4>
      </div>
      <div slot="modal-body" class="modal-body">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" v-model="feedName" class="form-control" required />
          <span class="help-block">Indentifier for the main navigation.</span>
        </div>
        <div class="form-group">
          <label for="url">Feed URL</label>
          <input type="text" id="url" name="url" v-model="feedURL" class="form-control" required />
          <span class="help-block">The RSS feed URL used to determine post URLs.</span>
        </div>
      </div>
    </modal>
    <modal v-model="showDashboardModal" ok-text="Create" :callback="createNewDashboard">
      <div slot="modal-header" class="modal-header">
        <h4 class="modal-title">New Dashboard</h4>
      </div>
      <div slot="modal-body" class="modal-body">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" v-model="dashboardName" class="form-control" required />
          <span class="help-block">Indentifier for the main navigation.</span>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { modal, navbar, dropdown } from 'vue-strap'

export default {
  name: 'navigation',
  computed: mapState([
    'feeds',
    'dashboards'
  ]),
  components: {
    modal,
    navbar,
    dropdown
  },
  data () {
    return {
      showFeedModal: false,
      showDashboardModal: false,
      feedName: null,
      feedURL: null,
      dashboardName: null
    }
  },
  methods: {
    createNewFeed () {
      this.showFeedModal = false
      const feed = {
        name: this.feedName,
        url: this.feedURL
      }
      this.$store.dispatch('ADD_NEW_FEED', {feed}).then(() => {
        this.$router.push('/feed/' + this.$store.state.currentFeedId + '/settings')
      }, (err) => {
        window.alert('A server-side error has occured. Please report this issue.')
        console.error(err)
      })
    },
    createNewDashboard () {
      this.showDashboardModal = false
      const dashboard = {
        name: this.dashboardName
      }
      this.$store.dispatch('ADD_NEW_DASHBOARD', {dashboard}).then(() => {
        this.$router.push('/dashboard/' + this.$store.state.currentDashboardId + '/settings')
      }, (err) => {
        window.alert('A server-side error has occured. Please report this issue.')
        console.error(err)
      })
    }
  }
}
</script>
