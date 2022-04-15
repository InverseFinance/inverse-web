const POST_GRAPHQL_FIELDS = `
slug
title
coverImage {
  url
}
date
author {
  name
  title
  picture {
    url
  }
}
excerpt
readtime
category {
  name
  label
}
tagsCollection {
  items {
    name
    label
  }
}
metaDescription
opengraphDescription
pageTitle
content {
  json
  links {
    assets {
      block {
        sys {
          id
        }
        url
        title
        width
        height
        description
        contentType
      }
    }
  }
}
`

async function fetchGraphQL(query, preview = false) {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          preview
            ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
            : process.env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query }),
    }
  ).then((response) => response.json())
}

function extractPost(fetchResponse) {
  return fetchResponse?.data?.postCollection?.items?.[0]
}

function extractPostEntries(fetchResponse) {
  return fetchResponse?.data?.postCollection?.items
}

export async function getPreviewPostBySlug(slug) {
  const entry = await fetchGraphQL(
    `query {
      postCollection(where: { slug: "${slug}" }, preview: true, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    true
  )
  return extractPost(entry)
}

export async function getAllPostsWithSlug() {
  const entries = await fetchGraphQL(
    `query {
      postCollection(where: { slug_exists: true }, order: date_DESC) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`
  )
  return extractPostEntries(entries)
}

export async function getAllPostsForHome(preview, locale = 'en-US', category = '', byAuthor = '', fulltext = '') {
  const categoryFilter = category && category !== 'home' ? `, where: { category: { name: "${category}" } }` : '';
  const authorFilter = byAuthor ? `, where: { author: { name: "${decodeURIComponent(byAuthor)}" } }` : '';
  const fullTextFilter = fulltext ? `, where: { OR: [{content_contains: "${fulltext}"},{excerpt_contains: "${fulltext}"},{title_contains: "${fulltext}"}] }` : '';
  const entries = await fetchGraphQL(
    `query {
      postCollection(
        order: date_DESC,
         locale: "${locale}",
          preview: ${preview ? 'true' : 'false'}
          ${categoryFilter}${authorFilter}${fullTextFilter},
          limit: 20,
        ) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview
  )
  return extractPostEntries(entries)
}

export async function getPostAndMorePosts(slug, preview, locale = 'en-US') {
  const entry = await fetchGraphQL(
    `query {
      postCollection(locale: "${locale}", where: { slug: "${slug[1]}" }, preview: ${
      preview ? 'true' : 'false'
    }, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview
  )
  const entries = await fetchGraphQL(
    `query {
      postCollection(locale: "${locale}", where: { slug_not_in: "${slug[1]}" }, order: date_DESC, preview: ${
      preview ? 'true' : 'false'
    }, limit: 10) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview
  )
  return {
    post: extractPost(entry),
    morePosts: extractPostEntries(entries),
  }
}

export async function getCategories(preview, locale = 'en-US') {
  const categories = await fetchGraphQL(
    `query {
      categoryCollection(order: order_ASC, locale: "${locale}", preview: ${preview ? 'true' : 'false'}) {
        items {
          name
          label
          order
          isCustomPage
        }
      }
    }`,
    preview
  )
  return categories.data?.categoryCollection?.items;
}

export async function getAuthors(preview, locale = 'en-US') {
  const authors = await fetchGraphQL(
    `query {
      authorCollection(locale: "${locale}") {
        items {
          name
          title
          picture {
            url
          }
          twitterHandle
        }
      }
    }`,
    preview
  )

  return authors.data?.authorCollection?.items;
}