import {
  createClient,
  dedupExchange,
  errorExchange,
  subscriptionExchange
} from 'urql'
import { retryExchange } from '@urql/exchange-retry'
import { multipartFetchExchange } from '@urql/exchange-multipart-fetch'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { devtoolsExchange } from '@urql/devtools'
import toast from 'react-hot-toast'
import { cacheExchange } from '@/graphql/cacheExchange'
import i18n from '@/locales/i18n'

export const subscriptionClient = new SubscriptionClient(
  import.meta.env.PROD
    ? `wss://${import.meta.env.VITE_API_DOMAIN}/graphql`
    : 'ws://localhost:4000/graphql',
  {
    reconnect: true,
    connectionParams: () => {
      const token = localStorage.getItem('token')
      return {
        token
      }
    }
  }
)

export const urqlClient = createClient({
  url: import.meta.env.PROD
    ? `https://${import.meta.env.VITE_API_DOMAIN}/graphql`
    : 'http://localhost:4000/graphql',
  requestPolicy: 'cache-and-network',
  fetchOptions: () => {
    const token = localStorage.getItem('token')
    return {
      headers: {
        token
      }
    }
  },
  exchanges: [
    devtoolsExchange,
    dedupExchange,
    cacheExchange,
    errorExchange({
      onError(error, operation) {
        const message = error.message?.substring(10)
        if (import.meta.env.DEV) {
          console.error({
            operation: operation?.query?.definitions[0].name.value,
            message
          })
          console.error({ error, operation })
        }
        if (!error.networkError) {
          const replace = error.graphQLErrors[0]?.extensions?.exception?.replace
          if (replace) {
            toast.error(i18n.t(message, { replace }))
          } else {
            toast.error(i18n.t(message))
          }
        }
      }
    }),
    retryExchange({
      initialDelayMs: 1000,
      randomDelay: false,
      maxNumberAttempts: 10 ** 7
    }),
    multipartFetchExchange,
    subscriptionExchange({
      forwardSubscription: operation => subscriptionClient.request(operation)
    })
  ]
})
