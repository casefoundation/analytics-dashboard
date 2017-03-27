<template>
  <div class="panel panel-primary panel-feed-tile">
    <div class="panel-heading">
      <a :href="report.url" target="_blank">{{ report.title }}</a>
      <span class="badge">{{ report.scores.overall | score }}</span>
    </div>
    <div class="panel-body">
      <div class="stats row">
        <div class="stat col-md-6" :class="stat.slug" v-for="stat in stats">
          <p class="stat-title">
            {{ stat.name }}
            <span class="badge">
              {{ report.scores.cumulative[stat.slug] | score }}
            </span>
          </p>
          <p class="stat-chart">
            <svg :width="dimensions.width" :height="dimensions.height">
              <rect x="0" y="0" :width="dimensions.width" :height="dimensions.height" />
              <g :style="{transform: `translate(${margin.left}px, ${margin.top}px)`}">
                <path class="average" :d="stat.average" />
                <path class="actual" :d="stat.actual" />
                <line :x1="stat.line" y1="0" :x2="stat.line" :y2="dimensions.height - (margin.top * 2)" />
              </g>
            </svg>
          </p>
          <p class="stat-numbers">
            <span class="stat-numbers-total">
              {{ Math.round(report.overalls[stat.slug] * 100) / 100 }}
            </span>
            <span class="stat-numbers-slash">
              /
            </span>
            <span class="stat-numbers-average">
              {{ Math.round(report.averages.cumulative[stat.slug] * 100) / 100 }} Avg
            </span>
          </p>
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
          average: '',
          actual: '',
          line: ''
        },
        {
          name: 'Avg Time on Page',
          slug: 'avgTimeOnPage',
          scale: {
            x: null,
            y: null
          },
          average: '',
          actual: '',
          line: ''
        },
        {
          name: 'Facebook Pageviews',
          slug: 'facebook_pageviews',
          scale: {
            x: null,
            y: null
          },
          average: '',
          actual: '',
          line: ''
        },
        {
          name: 'Twitter Pageviews',
          slug: 'twitter_pageviews',
          scale: {
            x: null,
            y: null
          },
          average: '',
          actual: '',
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
        const actual = this.report.actuals[stat.slug]
        const average = this.report.averages.daily[stat.slug]
        stat.scale.x = this.$d3.scaleLinear().range([0, this.dimensions.width - (this.margin.left * 2)])
        stat.scale.y = this.$d3.scaleLinear().range([this.dimensions.height - (this.margin.top * 2), 0])
        const xDomain = this.$d3.extent(actual, (d, i) => i)
        stat.scale.x.domain(xDomain)
        stat.scale.y.domain([
          Math.min(this.$d3.min(actual, (d, i) => d), this.$d3.min(average, (d, i) => d)),
          Math.max(this.$d3.max(actual, (d, i) => d), this.$d3.max(average, (d, i) => d))
        ])
        stat.actual = this.$d3
          .line()
          .x((d, i) => stat.scale.x(i))
          .y(d => stat.scale.y(d))(actual)
        stat.average = this.$d3
          .line()
          .x((d, i) => stat.scale.x(i))
          .y(d => stat.scale.y(d))(average)
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
  .panel-feed-tile {
    color: white;
  }
  .stat-title {
    font-size: 0.9em;
    margin-bottom: 0.25em;
    width: 100%;
    display: block;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0;
  }
  .stat-title .badge {
    font-size: 0.75em;
  }
  .stat-chart {
    margin: 0;
  }
  .stat-numbers {
    font-size: 0.8em;
    margin: 0;
  }
  svg rect {
    fill: none;
    stroke: none;
    stroke-width: 1px;
  }
  svg .average,
  svg .actual {
    fill: none;
    stroke-width: 2;
  }
  svg .average {
    stroke: #268fdc;
  }
  svg .actual {
    stroke: white;
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
