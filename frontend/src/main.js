// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import store from './assets/store'
import VueRouter from 'vue-router'
import Home from './components/Home'
import Feed from './components/feed/Feed'
import FeedSettings from './components/feed/FeedSettings'
import DashboardSettings from './components/DashboardSettings'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: Home
    },
    {
      path: '/feed/:id/settings',
      component: FeedSettings
    },
    {
      path: '/feed/:id',
      component: Feed
    },
    {
      path: '/settings',
      component: DashboardSettings
    }
  ]
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  store,
  router,
  components: { App }
})
