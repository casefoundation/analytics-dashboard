<template>
  <nav class="navbar navbar-inverse navbar-fixed-top">
    <div class="container-fluid">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="#">
          <img src="http://case.bootstrap.theme.s3-website-us-west-2.amazonaws.com/logo.svg" width="178" height="48" />
        </a>
      </div>
      <div id="navbar" class="navbar-collapse collapse">
        <ul class="nav navbar-nav">
          <li v-for="feed in feeds">
            <router-link :to="'/feed/'+feed.id">{{feed.name}}</router-link>
          </li>
        </ul>
      </div><!--/.nav-collapse -->
    </div>
  </nav>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'navigation',
  computed: mapState([
    'feeds'
  ])
}
</script>
