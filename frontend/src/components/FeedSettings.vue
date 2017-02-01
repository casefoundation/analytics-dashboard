<template>
  <div class="container">
    <h1 class="page-header">{{ feed.name }}</h1>
    <h2>Settings</h2>
    <form v-on:submit.stop.prevent="save">
      <div class="row">
        <div class="col-md-6">
          <div class="panel panel-default">
            <div class="panel-heading">General Settings</div>
            <div class="panel-body">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" v-model="feedName" class="form-control" required />
                <span class="help-block">Indentifier for the main navigation.</span>
              </div>
            </div>
          </div>
          <div class="panel panel-default">
            <div class="panel-heading">Reporting Settings</div>
            <div class="panel-body">
              <div class="form-group">
                <label for="url">Feed URL</label>
                <input type="text" id="url" name="url" v-model="feedURL" class="form-control" required />
                <span class="help-block">The RSS feed URL used to determine post URLs.</span>
              </div>
              <div class="form-group">
                <label for="nPosts">Number of Posts</label>
                <select id="nPosts" name="nPosts" v-model="feedNPosts" class="form-control">
                  <option v-for="n in nPostsArray" :value="n">{{ n }}</option>
                </select>
                <span class="help-block">The number of posts to pull from each feed.</span>
              </div>
              <div class="form-group">
                <label for="nDays">Number of Days</label>
                <select id="nDays" name="nDays" v-model="feedNDays" class="form-control">
                  <option v-for="n in nDaysArray" :value="n">{{ n }}</option>
                </select>
                <span class="help-block">The number days of data to pull following each post's publish date.</span>
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
      <p class="text-right">
        <button v-on:click.stop.prevent="cancelSave" class="btn btn-default">Cancel</button>
        <button v-on:click.stop.prevent="save" class="btn btn-primary">Save</button>
      </p>
    </form>
  </div>
</template>

<script>
export default {
  name: 'feed',
  data: function () {
    return {
      nPostsArray: Array.from(new Array(5), (x, i) => i + 1),
      nDaysArray: Array.from(new Array(30), (x, i) => i + 1)
    }
  },
  methods: {
    save () {
      this.$store.dispatch('UPDATE_FEED', { feed: this.$store.getters.currentFeed() }).then(() => {
        this.$router.push('/feed/' + this.$store.state.currentFeedId)
      }, (err) => {
        // TODO better handling
        console.error(err)
      })
    },
    cancelSave () {
      this.$router.push('/feed/' + this.$store.state.currentFeedId)
    }
  },
  computed: {
    feed () {
      return this.$store.getters.currentFeed() || {}
    },
    googleAccounts () {
      return this.$store.getters.googleAccounts
    },
    feedName: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().name : null
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', { name: value })
      }
    },
    feedURL: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().url : null
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', { url: value })
      }
    },
    feedNPosts: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().nPosts : null
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', { nPosts: parseInt(value) })
      }
    },
    feedNDays: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().nDays : null
      },
      set (value) {
        this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', { nDays: parseInt(value) })
      }
    },
    googleAccount: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().googleAccount.account : null
      },
      set (value) {
        if (value) {
          this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', {
            googleAccount: {
              account: value,
              property: null,
              profile: null
            }
          })
        }
        this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentFeed().googleAccount)
      }
    },
    googleProperty: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().googleAccount.property : null
      },
      set (value) {
        if (value) {
          this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', {
            googleAccount: {
              account: this.$store.getters.currentFeed().googleAccount.account,
              property: value,
              profile: null
            }
          })
        }
        this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentFeed().googleAccount)
      }
    },
    googleProfile: {
      get () {
        return this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().googleAccount.profile : null
      },
      set (value) {
        if (value) {
          this.$store.dispatch('UPDATE_CURRENT_FEED_DETAILS', {
            googleAccount: {
              account: this.$store.getters.currentFeed().googleAccount.account,
              property: this.$store.getters.currentFeed().googleAccount.property,
              profile: value
            }
          })
        }
      }
    }
  },
  created: function () {
    this.$store.dispatch('SET_CURRENT_FEED', { id: this.$route.params.id })
    this.$store.dispatch('LOAD_GOOGLE_ACCOUNTS', this.$store.getters.currentFeed() ? this.$store.getters.currentFeed().googleAccount : {})
  }
}
</script>
