<template>
  <div class="panel panel-default">
    <div class="panel-heading">
      <a :href="report.url" target="_blank">{{ report.title }}</a>
    </div>
    <div class="panel-body">
      <div class="row">
        <div class="col-md-2">
          <div class="report-score text-primary text-center">
            {{ report.scores.overall | score }}
          </div>
        </div>
        <div class="col-md-10">
          <div class="stats row">
            <div class="stat col-md-6" :class="stat.slug" v-for="stat in stats">
              <p class="stat-title">{{ stat.name }}</p>
              <div class="row">
                <div class="col-xs-8 stat-chart">
                  <svg :width="dimensions.width" :height="dimensions.height">
                    <rect x="0" y="0" :width="dimensions.width" :height="dimensions.height" />
                    <g :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}">
                      <path class="line" :d="stat.path" />
                      <line :x1="stat.line" y1="0" :x2="stat.line" :y2="dimensions.height - (margin.top * 2)" />
                    </g>
                  </svg>
                </div>
                <div class="col-xs-4 stat-total text-center">
                  <div class="stat-score">
                    <span class="label label-primary">
                      <span class="stat-value">
                        {{ report.scores.cumulative[stat.slug] | score }}
                      </span>
                    </span>
                  </div>
                  <div class="components">
                    <div class="stat-total">
                      <span class="label label-default">
                        <span class="stat-value">
                          {{ report.actuals[stat.slug].reduce((p,v) => p + v,0) }}
                        </span>
                        <span class="stat-label">
                          Tot
                        </span>
                      </span>
                    </div>
                    <div class="stat-average">
                      <span class="label label-default">
                        <span class="stat-value">
                          {{ Math.round(report.averages.cumulative[stat.slug] * 100) / 100 }}
                        </span>
                        <span class="stat-label">
                          Avg
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="report-dates">Performance based on traffic from {{ report.startDate.toLocaleDateString() }} to {{ report.endDate.toLocaleDateString() }}</p>
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
  filters: {
    score: function (value) {
      if (value !== null) {
        const rounded = Math.round(value * 100)
        return (rounded > 0 ? '+' : '') + rounded + '%'
      } else {
        return 'N/A'
      }
    }
  },
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
          path: '',
          line: ''
        },
        {
          name: 'Time on Page',
          slug: 'timeOnPage',
          scale: {
            x: null,
            y: null
          },
          path: '',
          line: ''
        },
        {
          name: 'Facebook Pageviews',
          slug: 'facebook_pageviews',
          scale: {
            x: null,
            y: null
          },
          path: '',
          line: ''
        },
        {
          name: 'Twitter Pageviews',
          slug: 'twitter_pageviews',
          scale: {
            x: null,
            y: null
          },
          path: '',
          line: ''
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
      this.dimensions.height = this.dimensions.width * 0.25
      const today = new Date().getTime()
      this.stats.forEach((stat) => {
        const data = this.mode === 'scores' ? this.report.scores.daily[stat.slug] : this.report.actuals[stat.slug]
        stat.scale.x = this.$d3.scaleLinear().range([0, this.dimensions.width - (this.margin.left * 2)])
        stat.scale.y = this.$d3.scaleLinear().range([this.dimensions.height - (this.margin.top * 2), 0])
        const xDomain = this.$d3.extent(data, (d, i) => i)
        stat.scale.x.domain(xDomain)
        // const yDomain = [0, this.maxScore]
        const yDomain = this.$d3.extent(data, (d, i) => d)
        stat.scale.y.domain(yDomain)
        stat.path = this.$d3
          .line()
          .x((d, i) => stat.scale.x(i))
          .y(d => stat.scale.y(d))(data)
        const linePos = (today - this.report.startDate.getTime()) / (24 * 60 * 60 * 1000)
        if (linePos >= xDomain[0] && linePos <= xDomain[1]) {
          stat.line = stat.scale.x(linePos)
        } else {
          stat.line = -100
        }
      })
    }
  }
}
</script>

<style scoped>
  .stat {
    padding-bottom: 10px;
  }
  .stat-title {
    font-size: 1em;
    margin-bottom: 0.25em;
    font-weight: bold;
    width: 100%;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0;
  }
  svg rect {
    fill: #ddd;
  }
  svg path {
    stroke: black;
    fill: none;
    stroke-width: 2;
  }
  svg line {
    stroke: red;
  }
  .report-dates {
    font-size: 0.75em;
    margin: 0;
  }
  .report-score {
    font-size: 2.5em;
    font-weight: bold;
  }
</style>
