import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import qs from 'qs'
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    feeds: [],
    currentFeedId: {},
    googleAccounts: {
      accounts: [],
      properties: [],
      profiles: []
    }
  },
  actions: {
    LOAD_GOOGLE_ACCOUNTS: function ({ commit }, { account, property }) {
      const params = {}
      if (account) {
        params.account = account
      }
      if (property) {
        params.property = property
      }
      axios.get('/api/googleaprofiles?' + qs.stringify(params)).then((response) => {
        commit('SET_GOOGLE_ACCOUNTS', response.data.data)
      }, (err) => {
        console.error(err)
      })
    },
    LOAD_FEED_LIST: function ({ commit }) {
      axios.get('/api/feed').then((response) => {
        commit('SET_FEED_LIST', { list: response.data })
      }, (err) => {
        console.error(err)
      })
    },
    UPDATE_FEED: function ({ commit }, { feed }) {
      axios.put('/api/feed/' + feed.id, feed).then((response) => {
        commit('UPDATE_FEED', { feed: response.data })
      }, (err) => {
        console.error(err)
      })
    },
    DELETE_FEED: function ({ commit }, { feed }) {
      axios.delete('/api/feed/' + feed.id).then((response) => {
        commit('DELETE_FEED', { feed: feed })
      }, (err) => {
        console.error(err)
      })
    },
    ADD_NEW_FEED: function ({ commit }, { feed }) {
      axios.post('/api/feed', feed).then((response) => {
        commit('ADD_NEW_FEED', { feed: response.data })
      }, (err) => {
        console.error(err)
      })
    },
    SET_CURRENT_FEED: function ({ commit }, { id }) {
      commit('SET_CURRENT_FEED', { id })
    },
    UPDATE_CURRENT_FEED_DETAILS: function ({ commit }, details) {
      commit('UPDATE_CURRENT_FEED_DETAILS', details)
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
    DELETE_FEED: function (state, { feed }) {
      const index = state.feeds.findIndex((_feed) => _feed.id === feed.id)
      if (index >= 0) {
        state.feeds.splice(index, 1)
      }
    },
    ADD_NEW_FEED: (state, { feed }) => {
      state.feeds.push(feed)
    },
    SET_CURRENT_FEED: (state, { id }) => {
      state.currentFeedId = id
    },
    UPDATE_CURRENT_FEED_DETAILS: (state, details) => {
      const feed = state.feeds.find((feed) => feed.id === state.currentFeedId)
      const props = ['name', 'nPosts', 'nDays', 'url', 'profile', 'googleAccount']
      props.forEach((prop) => {
        if (typeof details[prop] !== 'undefined') {
          feed[prop] = details[prop]
        }
      })
    },
    SET_GOOGLE_ACCOUNTS: function (state, { accounts, properties, profiles }) {
      state.googleAccounts.accounts = accounts
      state.googleAccounts.properties = properties
      state.googleAccounts.profiles = profiles
    }
  },
  getters: {
    currentFeed: (state) => state.feeds.find((feed) => feed.id === state.currentFeedId),
    googleAccounts: (state) => state.googleAccounts
  }
})
export default store
