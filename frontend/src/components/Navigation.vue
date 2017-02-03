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
        <div class="navbar-form navbar-right">
          <button class="btn btn-success" @click="showModal = true">New Feed</button>
        </div>
      </div><!--/.nav-collapse -->
    </div>
    <modal :show.sync="showModal">
      <div slot="modal-header" class="modal-header">
        <h4 class="modal-title">New Feed</h4>
      </div>
      <div slot="modal-body" class="modal-body">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" v-model="feedName" class="form-control" required />
          <span class="help-block">Indentifier for the main navigation.</span>
        </div>
        <div class="form-group">
          <label for="url">Feed URL</label>
          <input type="text" id="url" name="url" v-model="feedURL" class="form-control" required />
          <span class="help-block">The RSS feed URL used to determine post URLs.</span>
        </div>
      </div>
    </modal>
  </nav>
</template>

<script>
import { mapState } from 'vuex'
import { modal } from 'vue-strap'

export default {
  name: 'navigation',
  computed: mapState([
    'feeds'
  ]),
  components: {
    modal
  },
  data () {
    return {
      showModal: false
    }
  }
}
</script>
