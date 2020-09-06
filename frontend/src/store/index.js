import currentUserGql from '@/gql/currentUser.graphql'
import recentPlanetsGql from '@/gql/recentPlanets.graphql'
import galaxiesGql from '@/gql/galaxies.graphql'
import joinedPlanetsGql from '@/gql/joinedPlanets.graphql'
import allPlanetsGql from '@/gql/allPlanets.graphql'
import popularPlanetsGql from '@/gql/popularPlanets.graphql'

export const state = () => ({
  currentUser: null,
  snackbarEnabled: false,
  snackbarMessage: '',
  snackbarSuccess: false,
  expandedCommentId: '',
  recentPlanets: [],
  galaxies: []
})

export const mutations = {
  setCurrentUser (state, currentUser) {
    state.currentUser = currentUser
  },
  setExpandedCommentId (state, commentId) {
    state.expandedCommentId = commentId
  },
  setSnackbarEnabled (state, enabled) {
    state.snackbarEnabled = enabled
  },
  setSnackbarMessage (state, message) {
    state.snackbarMessage = message
  },
  setSnackbarSuccess (state, success) {
    state.snackbarSuccess = success
  },
  setAppearOffline (state, appearOffline) {
    state.currentUser.appearOffline = appearOffline
  },
  setRecentPlanets (state, recentPlanets) {
    state.recentPlanets = recentPlanets
  },
  setGalaxies (state, galaxies) {
    state.galaxies = galaxies
  }
}

export const actions = {
  async nuxtServerInit ({ commit }, context) {
    const client = context.app.apolloProvider.defaultClient

    const galaxiesQuery = await client.query({
      query: galaxiesGql
    })
    commit('setGalaxies', galaxiesQuery.data.galaxies)

    await client.query({
      query: allPlanetsGql
    })

    await client.query({
      query: joinedPlanetsGql
    })

    await client.query({
      query: popularPlanetsGql
    })

    if (!context.app.$apolloHelpers.getToken()) { return }
    const { data } = await client.query({ query: currentUserGql })
    commit('setCurrentUser', data.currentUser)
    if (!data.currentUser) {
      await context.app.$apolloHelpers.onLogout()
    }
  },
  async fetchCurrentUser ({ commit }) {
    if (!this.app.$apolloHelpers.getToken()) {
      commit('setCurrentUser', null)
      return
    }
    const client = this.app.apolloProvider.defaultClient
    const { data } = await client.query({
      query: currentUserGql,
      fetchPolicy: 'network-only'
    })
    commit('setCurrentUser', data.currentUser)
  },
  displaySnackbar ({ commit }, { message, success = false }) {
    commit('setSnackbarMessage', message)
    commit('setSnackbarEnabled', true)
    commit('setSnackbarSuccess', success)
    setTimeout(() => {
      commit('setSnackbarEnabled', false)
    }, 2500)
  },
  async updateRecentPlanets ({ commit }, planetNames) {
    const client = this.app.apolloProvider.defaultClient
    const { data } = await client.query({
      query: recentPlanetsGql,
      variables: {
        planetNames
      }
    })
    commit('setRecentPlanets', data.recentPlanets)
  }
}

export const getters = {
  isAdmin (state) {
    return state.currentUser && state.currentUser.admin
  }
}
