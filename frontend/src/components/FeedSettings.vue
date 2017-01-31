<template>
  <div class="container">
    <h1>Feed {{ feed.name }}</h1>
    <div class="panel panel-default">
      <div class="panel-body">
        <form>
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" v-model="feedName" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="url">Feed URL</label>
            <input type="text" id="url" name="url" v-model="feedURL" class="form-control" required />
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="nPosts">Number of Posts</label>
                <select id="nPosts" name="nPosts" v-model="feedNPosts" class="form-control">
                  <option v-for="n in nPostsArray" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="nDays">Number of Days</label>
                <select id="nDays" name="nDays" v-model="feedNDays" class="form-control">
                  <option v-for="n in nDaysArray" :value="n">{{ n }}</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'feed',
  data: {
    nPostsArray: Array.from(new Array(5), (x, i) => i + 1),
    nDaysArray: Array.from(new Array(30), (x, i) => i + 1)
  },
  computed: {
    feed () {
      return this.$store.getters.currentFeed || {}
    },
    feedName: {
      get () {
        return this.$store.getters.currentFeed ? this.$store.getters.currentFeed.name : null
      },
      set (value) {
        this.$store.commit('UPDATE_CURRENT_FEED_DETAILS', { name: value })
      }
    },
    feedURL: {
      get () {
        return this.$store.getters.currentFeed ? this.$store.getters.currentFeed.url : null
      },
      set (value) {
        this.$store.commit('UPDATE_CURRENT_FEED_DETAILS', { url: value })
      }
    },
    feedNPosts: {
      get () {
        return this.$store.getters.currentFeed ? this.$store.getters.currentFeed.nPosts : null
      },
      set (value) {
        this.$store.commit('UPDATE_CURRENT_FEED_DETAILS', { nPosts: parseInt(value) })
      }
    },
    feedNDays: {
      get () {
        return this.$store.getters.currentFeed ? this.$store.getters.currentFeed.nDays : null
      },
      set (value) {
        this.$store.commit('UPDATE_CURRENT_FEED_DETAILS', { nDays: parseInt(value) })
      }
    }
  },
  created: function () {
    this.$store.dispatch('SET_CURRENT_FEED', { id: this.$route.params.id })
  }
}
</script>
