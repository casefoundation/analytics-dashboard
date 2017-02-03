<template>
  <div>
    <h2><a :href="report.url" target="_blank">{{ report.title }}</a></h2>
    <div class="stats">
      <div class="stat" :class="stat.slug" v-for="stat in stats">
        <h3>{{ stat.name }}</h3>
        <div class="row">
          <div class="col-xs-8 stat-chart">
            <svg :width="dimensions.width" :height="dimensions.height">
              <g :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}">
                <path class="line" :d="stat.path" />
              </g>
            </svg>
          </div>
          <div class="col-xs-4 stat-total text-center">
            <div class="stat-score">
              <span class="label label-primary">
                <span class="stat-value">
                  {{ Math.round(report.scores.cumulative[stat.slug] * 100) / 100 }}
                </span>
                <span class="stat-label">
                  Score
                </span>
              </span>
            </div>
            <div class="components">
              <span class="stat-total">
                <span class="label label-success">
                  <span class="stat-value">
                    {{ report.actuals[stat.slug].reduce((p,v) => p + v,0) }}
                  </span>
                  <span class="stat-label">
                    Total
                  </span>
                </span>
              </span>
              <span class="stat-average">
                <span class="label label-info">
                  <span class="stat-value">
                    {{ Math.round(report.averages.cumulative[stat.slug] * 100) / 100 }}
                  </span>
                  <span class="stat-label">
                    Average
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import VueD3 from 'vue-d3'

Vue.use(VueD3)

export default {
  name: 'feedTile',
  props: ['report', 'maxScore', 'mode'],
  data () {
    return {
      dimensions: {
        width: 0,
        height: 0
      },
      margin: {
        left: 5,
        top: 5
      },
      stats: [
        {
          name: 'Pageviews',
          slug: 'pageviews',
          scale: {
            x: null,
            y: null
          },
          path: ''
        },
        {
          name: 'Facebook Pageviews',
          slug: 'facebook_pageviews',
          scale: {
            x: null,
            y: null
          },
          path: ''
        },
        {
          name: 'Twitter Pageviews',
          slug: 'twitter_pageviews',
          scale: {
            x: null,
            y: null
          },
          path: ''
        }
      ]
    }
  },
  computed: {

  },
  mounted () {
    window.addEventListener('resize', this.initialize)
    this.initialize()
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.initialize)
  },
  methods: {
    initialize () {
      this.dimensions.width = this.$el.querySelector('.stat-chart').offsetWidth
      this.dimensions.height = this.dimensions.width * 0.1
      this.stats.forEach((stat) => {
        const data = this.mode === 'scores' ? this.report.scores.daily[stat.slug] : this.report.actuals[stat.slug]
        stat.scale.x = this.$d3.scaleLinear().range([0, this.dimensions.width - (this.margin.left * 2)])
        stat.scale.y = this.$d3.scaleLinear().range([this.dimensions.height - (this.margin.top * 2), 0])
        stat.scale.x.domain(this.$d3.extent(data, (d, i) => i))
        stat.scale.y.domain([0, this.maxScore])
        stat.path = this.$d3
          .line()
          .x((d, i) => stat.scale.x(i))
          .y(d => stat.scale.y(d))(data)
      })
    }
  }
}
</script>

<style scoped>
  .stat-score {
    font-size: 1.5em;
  }
  svg path {
    stroke: black;
    fill: none;
    stroke-width: 2;
  }
</style>
