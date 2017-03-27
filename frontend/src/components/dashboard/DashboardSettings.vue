<template>
  <div class="container">
    <h1 class="page-header">Dashboard Settings</h1>
    <h2>Settings</h2>
    <form v-on:submit.stop.prevent="save">
      <div class="row">
        <div class="col-md-6">
          <div class="panel panel-default">
            <div class="panel-heading">General Settings</div>
            <div class="panel-body">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" v-model="dashboardName" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="days">Days</label>
                <input type="number" id="days" name="days" v-model="dashboardDays" class="form-control" required />
                <span class="help-block">Number of previous days to include in numbers.</span>
              </div>

              <div class="checkbox">
                <label>
                  <input type="checkbox" name="overallMetrics" v-model="dashboardOverallMetrics" />
                  Show Overall Metrics
                </label>
              </div>

              <div class="checkbox">
                <label>
                  <input type="checkbox" name="topPages" v-model="dashboardTopPages" />
                  Show Top Pages
                </label>
              </div>

              <div class="checkbox">
                <label>
                  <input type="checkbox" name="referrals" v-model="dashboardReferrals" />
                  Show Top Referrals
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel panel-default">
            <div class="panel-heading">Google Settings</div>
            <div class="panel-body">
              <div class="form-group">
                <label for="account">Account</label>
                <select v-model="googleAccount" id="account" name="account" class="form-control">
                  <option v-for="account in googleAccounts.accounts" :value="account.id">{{ account.name }}</option>
                </select>
              </div>
              <div class="form-group" v-if="googleAccounts.properties.length > 0">
                <label for="property">Property</label>
                <select v-model="googleProperty" id="property" name="property" class="form-control">
                  <option v-for="property in googleAccounts.properties" :value="property.id">{{ property.name }}</option>
                </select>
              </div>
              <div class="form-group" v-if="googleAccounts.profiles.length > 0">
                <label for="profile">Profile</label>
                <select v-model="googleProfile" id="profile" name="profile" class="form-control">
                  <option v-for="profile in googleAccounts.profiles" :value="profile.id">{{ profile.name }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <div class="panel panel-default">
            <div class="panel-heading">
              Events
              <button class="btn btn-success btn-xs pull-right" v-on:click="addListItem('events')">Add</button>
            </div>
            <div class="panel-body">
              <fieldset v-for="(dashboardEvent, index) in dashboardEvents">
                <legend>
                  Event {{ index + 1 }}
                  <button class="btn btn-danger btn-xs pull-right" v-on:click="removeListItem('events',index)">Remove</button>
                </legend>
                <div class="form-group">
                  <label :for="`dashboard-event-${index}-name`">Name</label>
                  <input type="text" :id="`dashboard-event-${index}-name`" :name="`dashboard-event-${index}-name`" v-model="dashboardEvent.name" v-on:change="updateListProperty('events',index,'name',dashboardEvent.name)" class="form-control" required />
                  <span class="help-block"></span>
                </div>
                <div class="form-group">
                  <label :for="`dashboard-event-${index}-category`">Category</label>
                  <input type="text" :id="`dashboard-event-${index}-category`" :name="`dashboard-event-${index}-category`" v-model="dashboardEvent.category" v-on:change="updateListProperty('events',index,'category',dashboardEvent.category)" class="form-control" />
                  <span class="help-block"></span>
                </div>
                <div class="form-group">
                  <label :for="`dashboard-event-${index}-action`">Action</label>
                  <input type="text" :id="`dashboard-event-${index}-action`" :name="`dashboard-event-${index}-action`" v-model="dashboardEvent.action" v-on:change="updateListProperty('events',index,'action',dashboardEvent.action)" class="form-control" />
                  <span class="help-block"></span>
                </div>
                <div class="form-group">
                  <label :for="`dashboard-event-${index}-label`">Label</label>
                  <input type="text" :id="`dashboard-event-${index}-label`" :name="`dashboard-event-${index}-label`" v-model="dashboardEvent.label" v-on:change="updateListProperty('events',index,'label',dashboardEvent.label)" class="form-control" />
                  <span class="help-block"></span>
                </div>
              </fieldset>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="panel panel-default">
            <div class="panel-heading">
              Pages
              <button class="btn btn-success btn-xs pull-right" v-on:click="addListItem('pages')">Add</button>
            </div>
            <div class="panel-body">
              <fieldset v-for="(dashboardPage, index) in dashboardPages">
                <legend>
                  Page {{ index + 1 }}
                  <button class="btn btn-danger btn-xs pull-right" v-on:click="removeListItem('pages',index)">Remove</button>
                </legend>
                <div class="form-group">
                  <label :for="`dashboard-page-${index}-name`">Name</label>
                  <input type="text" :id="`dashboard-page-${index}-name`" :name="`dashboard-page-${index}-name`" v-model="dashboardPage.name" v-on:change="updateListProperty('pages',index,'name',dashboardPage.name)" class="form-control" required />
                  <span class="help-block"></span>
                </div>
                <div class="form-group">
                  <label :for="`dashboard-page-${index}-url`">URL</label>
                  <input type="text" :id="`dashboard-page-${index}-url`" :name="`dashboard-page-${index}-url`" v-model="dashboardPage.url" v-on:change="updateListProperty('pages',index,'url',dashboardPage.url)" class="form-control" />
                  <span class="help-block"></span>
                </div>
              </fieldset>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="panel panel-default">
            <div class="panel-heading">
              Goals
              <button class="btn btn-success btn-xs pull-right" v-on:click="addListItem('goals')">Add</button>
            </div>
            <div class="panel-body">
              <fieldset v-for="(dashboardGoal, index) in dashboardGoals">
                <legend>
                  Goal {{ index + 1 }}
                  <button class="btn btn-danger btn-xs pull-right" v-on:click="removeListItem('goals',index)">Remove</button>
                </legend>
                <div class="form-group">
                  <label :for="`dashboard-goal-${index}-name`">Name</label>
                  <input type="text" :id="`dashboard-goal-${index}-name`" :name="`dashboard-goal-${index}-name`" v-model="dashboardGoal.name" v-on:change="updateListProperty('goals',index,'name',dashboardGoal.name)" class="form-control" required />
                  <span class="help-block"></span>
                </div>
                <div class="form-group">
                  <label :for="`dashboard-goal-${index}-number`">Number</label>
                  <input type="number" :id="`dashboard-goal-${index}-number`" :name="`dashboard-goal-${index}-number`" v-model="dashboardGoal.number" v-on:change="updateListProperty('goals',index,'number',dashboardGoal.number)" class="form-control" />
                  <span class="help-block"></span>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-6 text-left">
          <button v-on:click.stop.prevent="deleteDashboard" class="btn btn-danger">Delete</button>
        </div>
        <div class="col-sm-6 text-right">
          <button v-on:click.stop.prevent="cancelSave" class="btn btn-default">Cancel</button>
          <button v-on:click.stop.prevent="save" class="btn btn-primary">Save</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'dashboardSettings',
  methods: {
    deleteDashboard () {
      if (window.confirm('Are you sure you want to delete this dashboard?')) {
        this.$store.dispatch('DELETE_CURRENT_DASHBOARD').then(() => {
          this.$router.push('/')
        }, (err) => {
          window.alert('A server-side error has occured. Please report this issue.')
          console.error(err)
        })
      }
    },
    save () {
      this.$store.dispatch('UPDATE_CURRENT_DASHBOARD').then(() => {
        this.$router.push('/dashboard/' + this.$store.state.currentDashboardId)
      }, (err) => {
        window.alert('A server-side error has occured. Please report this issue.')
        console.error(err)
      })
    },
    cancelSave () {
      this.$router.push('/dashboard/' + this.$store.state.currentDashboardId)
    },
    loadDashboard () {
      this.$store.dispatch('SET_CURRENT_DASHBOARD', { id: this.$route.params.id })
      this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().googleAccount : {})
    },
    updateListProperty (type, index, property, value) {
      if (value && value.trim().length === 0) {
        value = null
      }
      const list = this.$store.getters.currentDashboard().elements[type]
      list[index][property] = value
      const update = {}
      update[type] = list
      this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: update })
    },
    addListItem (type) {
      const list = this.$store.getters.currentDashboard().elements[type]
      switch (type) {
        case 'events':
          list.push({
            name: null,
            category: null,
            label: null,
            action: null
          })
          break
        case 'pages':
          list.push({
            name: null,
            url: null
          })
          break
        case 'goals':
          list.push({
            name: null,
            number: null
          })
          break
      }
      const update = {}
      update[type] = list
      this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: update })
    },
    removeListItem (type, index) {
      const list = this.$store.getters.currentDashboard().elements[type]
      list.splice(index, 1)
      const update = {}
      update[type] = list
      this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: update })
    }
  },
  computed: {
    googleAccounts () {
      return this.$store.getters.googleAccounts
    },
    dashboardName: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().name : null
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { name: value })
      }
    },
    dashboardDays: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().range / (1000 * 60 * 60 * 24) : null
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { range: value * (1000 * 60 * 60 * 24) })
      }
    },
    dashboardOverallMetrics: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().elements.overallMetrics : {}
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: { overallMetrics: value } })
      }
    },
    dashboardTopPages: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().elements.topPages : {}
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: { topPages: value } })
      }
    },
    dashboardReferrals: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().elements.referrals : {}
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: { referrals: value } })
      }
    },
    googleAccount: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().googleAccount.account : null
      },
      set (value) {
        if (this.$store.getters.currentDashboard) {
          if (value) {
            this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', {
              googleAccount: {
                account: value,
                property: null,
                profile: null
              }
            })
          }
          this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentDashboard().googleAccount)
        }
      }
    },
    googleProperty: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().googleAccount.property : null
      },
      set (value) {
        if (this.$store.getters.currentDashboard) {
          if (value) {
            this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', {
              googleAccount: {
                account: this.$store.getters.currentDashboard().googleAccount.account,
                property: value,
                profile: null
              }
            })
          }
          this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentDashboard().googleAccount)
        }
      }
    },
    googleProfile: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().googleAccount.profile : null
      },
      set (value) {
        if (this.$store.getters.currentDashboard) {
          if (value) {
            this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', {
              googleAccount: {
                account: this.$store.getters.currentDashboard().googleAccount.account,
                property: this.$store.getters.currentDashboard().googleAccount.property,
                profile: value
              }
            })
          }
        }
      }
    },
    dashboardEvents: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().elements.events : {}
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: { events: value } })
      }
    },
    dashboardPages: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().elements.pages : {}
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: { pages: value } })
      }
    },
    dashboardGoals: {
      get () {
        return this.$store.getters.currentDashboard() ? this.$store.getters.currentDashboard().elements.goals : {}
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_DASHBOARD_DETAILS', { elements: { goals: value } })
      }
    }
  },
  watch: {
    '$route' (to, from) {
      this.loadDashboard()
    }
  },
  mounted () {
    this.loadDashboard()
  }
}
</script>
