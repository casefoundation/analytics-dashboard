<template>
  <div class="container-fluid page-wrapper">
    <nav class="navbar navbar-default">
      <div class="container-fluid">
        <div class="navbar-header">
          <span class="navbar-brand">{{ feed.name }}</span>
        </div>
        <div class="collapse navbar-collapse">
          <div class="navbar-form navbar-right">
            <router-link :to="'/feed/'+feed.id+'/settings'" class="btn btn-primary">Settings</router-link>
          </div>
        </div>
      </div>
    </nav>
    <div v-if="reports.length > 0">
      <div v-for="row in reports" class="row">
        <div class="col-md-4" v-for="report in row">
          <feed-tile :report="report" :max-score="maxScore" :mode="mode"></feed-tile>
        </div>
      </div>
    </div>
    <div v-else class="lead text-center">
      Loading ...
    </div>
  </div>
</template>

<script>
import FeedTile from './FeedTile'

function chunk (array, size) {
  let length = array ? array.length : 0
  if (length === 0) {
    return []
  }
  let index = 0
  let resIndex = 0
  let result = Array(Math.ceil(length / size))
  while (index < length) {
    result[resIndex++] = baseSlice(array, index, (index += size))
  }
  return result
}

function baseSlice (array, start, end) {
  let index = -1
  let length = array.length

  if (start < 0) {
    start = -start > length ? 0 : (length + start)
  }
  end = end > length ? length : end
  if (end < 0) {
    end += length
  }
  length = start > end ? 0 : ((end - start) >>> 0)
  start >>>= 0

  var result = Array(length)
  while (++index < length) {
    result[index] = array[index + start]
  }
  return result
}

export default {
  name: 'feed',
  components: {
    FeedTile
  },
  filters: {
    chunk (value, size) {
      return chunk(value, size)
    }
  },
  data () {
    return {
      'mode': 'actuals'
    }
  },
  computed: {
    feed () {
      return this.$store.getters.currentFeed() || {}
    },
    reports () {
      return chunk(this.$store.state.currentFeedReport, 3)
    },
    maxScore () {
      let max = 0
      this.$store.state.currentFeedReport.forEach((report) => {
        ['pageviews', 'timeOnPage', 'facebook_pageviews', 'twitter_pageviews'].forEach((stat) => {
          if (this.mode === 'scores' && report.scores.daily[stat]) {
            report.scores.daily[stat].forEach((value) => {
              if (value > max) {
                max = value
              }
            })
          } else if (this.mode === 'actuals' && report.actuals[stat]) {
            report.actuals[stat].forEach((value) => {
              if (value > max) {
                max = value
              }
            })
          }
        })
      })
      return max
    }
  },
  watch: {
    '$route' (to, from) {
      this.loadFeed()
    }
  },
  mounted () {
    this.loadFeed()
  },
  methods: {
    loadFeed () {
      this.$store.dispatch('SET_CURRENT_FEED', { id: this.$route.params.id })
      this.$store.dispatch('LOAD_FEED_REPORT')
    }
  }
}
</script>

<style scoped>
  .page-wrapper {
    padding-top: 20px;
  }
</style>
