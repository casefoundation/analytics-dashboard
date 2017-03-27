import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import qs from 'qs'
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    feeds: [],
    currentFeedId: null,
    currentFeedReport: null,
    dashboardSettings: null,
    googleAccounts: {
      accounts: [],
      properties: [],
      profiles: []
    }
  },
  actions: {
    LOAD_GOOGLE_ACCOUNTS: function ({ commit }, { account, property }) {
      return new Promise((resolve, reject) => {
        const params = {}
        if (account) {
          params.account = account
        }
        if (property) {
          params.property = property
        }
        axios.get('/api/googleaprofiles?' + qs.stringify(params)).then((response) => {
          commit('SET_GOOGLE_ACCOUNTS', response.data.data)
          resolve()
        }, reject)
      })
    },
    LOAD_DASHBOARD_SETTINGS: function ({ commit }) {
      return new Promise((resolve, reject) => {
        axios.get('/api/dashboard/settings').then((response) => {
          commit('SET_DASHBOARD_SETTINGS', { settings: response.data })
          resolve()
        }, reject)
      })
    },
    LOAD_FEED_LIST: function ({ commit }) {
      return new Promise((resolve, reject) => {
        axios.get('/api/feed').then((response) => {
          commit('SET_FEED_LIST', { list: response.data })
          resolve()
        }, reject)
      })
    },
    UPDATE_CURRENT_FEED: function ({ commit, state }) {
      if (state.currentFeedId) {
        const feed = state.feeds.find((feed) => feed.id === state.currentFeedId)
        return new Promise((resolve, reject) => {
          axios.put('/api/feed/' + feed.id, feed).then((response) => {
            commit('UPDATE_FEED', { feed: response.data })
            resolve()
          }, reject)
        })
      }
    },
    DELETE_CURRENT_FEED: function ({ commit, state }) {
      if (state.currentFeedId) {
        return new Promise((resolve, reject) => {
          axios.delete('/api/feed/' + state.currentFeedId).then((response) => {
            commit('DELETE_CURRENT_FEED')
            resolve()
          }, reject)
        })
      }
    },
    ADD_NEW_FEED: function ({ commit }, { feed }) {
      return new Promise((resolve, reject) => {
        axios.post('/api/feed', feed).then((response) => {
          commit('ADD_NEW_FEED', { feed: response.data })
          resolve()
        }, reject)
      })
    },
    SET_CURRENT_FEED: function ({ commit }, { id }) {
      commit('SET_CURRENT_FEED', { id })
    },
    UPDATE_CURRENT_FEED_DETAILS: function ({ commit }, details) {
      commit('UPDATE_CURRENT_FEED_DETAILS', details)
    },
    LOAD_FEED_REPORT: function ({ commit, state }) {
      if (state.currentFeedId) {
        return new Promise((resolve, reject) => {
          axios.get('/api/feed/' + state.currentFeedId + '/report').then((response) => {
            commit('SET_FEED_REPORT', { report: response.data })
            resolve()
          }, reject)
        })
      }
    },
    UPDATE_DASHBOARD_DETAILS: function ({ commit }, details) {
      commit('UPDATE_DASHBOARD_DETAILS', details)
    }
  },
  mutations: {
    SET_FEED_LIST: (state, { list }) => {
      state.feeds = list
    },
    UPDATE_FEED: (state, { feed }) => {
      const index = state.feeds.findIndex((_feed) => _feed.id === feed.id)
      if (index >= 0) {
        state.feeds[index] = feed
      }
    },
    DELETE_CURRENT_FEED: function (state) {
      if (state.currentFeedId) {
        const index = state.feeds.findIndex((feed) => feed.id === state.currentFeedId)
        if (index >= 0) {
          state.currentFeedId = null
          state.currentFeedReport = null
          state.feeds.splice(index, 1)
        }
      }
    },
    ADD_NEW_FEED: (state, { feed }) => {
      state.feeds.push(feed)
      state.currentFeedId = feed.id
    },
    SET_CURRENT_FEED: (state, { id }) => {
      state.currentFeedId = id
      state.currentFeedReport = null
    },
    UPDATE_CURRENT_FEED_DETAILS: (state, details) => {
      if (state.currentFeedId) {
        const feed = state.feeds.find((feed) => feed.id === state.currentFeedId)
        const props = ['name', 'nPosts', 'nDays', 'url', 'profile', 'googleAccount']
        props.forEach((prop) => {
          if (typeof details[prop] !== 'undefined') {
            feed[prop] = details[prop]
          }
        })
      }
    },
    SET_GOOGLE_ACCOUNTS: function (state, { accounts, properties, profiles }) {
      state.googleAccounts.accounts = accounts
      state.googleAccounts.properties = properties
      state.googleAccounts.profiles = profiles
    },
    SET_FEED_REPORT: function (state, { report }) {
      report.forEach((row) => {
        row.startDate = new Date(Date.parse(row.startDate))
        row.endDate = new Date(Date.parse(row.endDate))
      })
      state.currentFeedReport = report
    },
    SET_DASHBOARD_SETTINGS: function (state, { settings }) {
      state.dashboardSettings = settings
    },
    UPDATE_DASHBOARD_DETAILS: function (state, details) {
      const props = ['name', 'range', 'elements', 'googleAccount']
      props.forEach((prop) => {
        if (typeof details[prop] !== 'undefined') {
          if (prop === 'elements') {
            const subProps = ['overallMetrics', 'topPages', 'referrals']
            subProps.forEach((subProp) => {
              if (typeof details[prop][subProp] !== 'undefined') {
                state.dashboardSettings[prop][subProp] = details[prop][subProp]
              }
            })
          } else {
            state.dashboardSettings[prop] = details[prop]
          }
        }
      })
    }
  },
  getters: {
    currentFeed: (state) => () => state.feeds.find((feed) => feed.id === state.currentFeedId),
    googleAccounts: (state) => state.googleAccounts,
    dashboardSettings: (state) => state.dashboardSettings
  }
})
export default store
