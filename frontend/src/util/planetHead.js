export const planetHead = (planet) => {
  if (!planet) { return { title: 'planet' } } else {
    return {
      title: planet.customName ? planet.customName : planet.name,
      meta: [
        {
          hid: 'og:description',
          property: 'og:description',
          content: planet.description
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: planet.customName ? planet.customName : planet.name
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: planet.profile.banner
            ? planet.profile.banner
            : 'https://www.cometx.io/og_image.png'
        },
        {
          hid: 'og:url',
          property: 'og:url',
          content: `https://www.cometx.io/+${planet.name}`
        },
        {
          hid: 'og:site_name',
          property: 'og:site_name',
          content: `cometx.io/+${planet.name}`
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          hid: 'twitter:site',
          name: 'twitter:site',
          content: '@CometWebsite'
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: planet.customName ? planet.customName : planet.name
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: planet.description
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content: planet.profile.banner
            ? planet.profile.banner
            : 'https://www.cometx.io/og_image.png'
        },
        {
          hid: 'twitter:url',
          name: 'twitter:url',
          content: `https://www.cometx.io/+${planet.name}`
        }
      ]
    }
  }
}
