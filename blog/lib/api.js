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
        Authorization: `Bearer ${preview
          ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
          : process.env.CONTENTFUL_ACCESS_TOKEN
          }`,
      },
      body: JSON.stringify({ query }),
    }
  ).then((response) => response.json())
}

function extractPost(fetchResponse) {
  return fetchResponse?.data?.postCollection?.items?.filter(item => !!item)?.[0]
}

function extractPostEntries(fetchResponse) {
  return fetchResponse?.data?.postCollection?.items?.filter(item => !!item)
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
          slug
        }
      }
    }`
  )
  return extractPostEntries(entries)
}

export async function getAllPostsForHome({
  preview,
  locale = 'en-US',
  category = '',
  byAuthor = '',
  byTag = '',
  fulltext = '',
  limit = 50,
  fieldsGraph = POST_GRAPHQL_FIELDS,
  customWhere,
  skip,
  isCount = false,
}) {
  const categoryFilter = category && category !== 'home' ? `, where: { category: { name: "${category}" } }` : '';
  const authorFilter = byAuthor ? `, where: { author: { name: "${decodeURIComponent(byAuthor)}" } }` : '';
  const fullTextFilter = fulltext ? `, where: { OR: [{content_contains: "${fulltext}"},{excerpt_contains: "${fulltext}"},{title_contains: "${fulltext}"}] }` : '';
  const q = `query {
    postCollection(
        ${isCount ? '' : 'order: date_DESC,'}
        ${isCount ? `locale: "${locale}",` : ''}
        preview: ${preview ? 'true' : 'false'},
        ${categoryFilter}${authorFilter}${fullTextFilter}${customWhere ? ', where: ' + customWhere + ',' : ''}
        limit: ${limit},
        ${skip ? `skip: ${skip},` : ''}
      ) {
      items {
        ${!isCount ? fieldsGraph : ''}
        ${isCount ?
      `tagsCollection {
            items {
              name
            }
          }
          ` : ''
    }
      }
    }
  }`
  const entries = await fetchGraphQL(
    q,
    preview
  )

  const posts = extractPostEntries(entries);
  return byTag ? posts.filter(p => !!p.tagsCollection.items.find(tag => tag.name === byTag)) : posts
}

export async function getPostAndMorePosts(slug, preview, locale = 'en-US') {
  const entry = await fetchGraphQL(
    `query {
      postCollection(locale: "${locale}", where: { slug: "${slug[1]}" }, preview: ${preview ? 'true' : 'false'
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
      postCollection(locale: "${locale}", where: { slug_not_in: "${slug[1]}" }, order: date_DESC, preview: ${preview ? 'true' : 'false'
    }, limit: 6) {
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
  return categories.data?.categoryCollection?.items?.filter(item => !!item && !!item.name);
}

export async function getCategoryById(id, locale = 'en-US') {
  const categories = await fetchGraphQL(
    `query {
      categoryCollection(locale: "${locale}", where: { sys: { id: "${id}" }}, limit: 1) {
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
  return categories.data?.categoryCollection?.items?.[0];
}

export async function getTag(preview, locale = 'en-US', byTag) {
  const tags = await fetchGraphQL(
    `query {
      tagCollection(
        locale: "${locale}", preview: ${preview ? 'true' : 'false'},
        where: { name: "${byTag}" },
        limit: 1
        ) {
        items {
          name
          label
        }
      }
    }`,
    preview
  )
  return tags.data?.tagCollection?.items?.[0];
}

export async function getTags(preview, locale = 'en-US', ids) {
  const filterByIds = ids ? `, where: { sys: { id_in: ${JSON.stringify(ids)}] } }` : '';
  const tags = await fetchGraphQL(
    `query {
      tagCollection(
        locale: "${locale}", preview: ${preview ? 'true' : 'false'},
        limit: ${ids ? ids.length : 50}
        ${filterByIds}
        ) {
        items {
          name
          label
        }
      }
    }`,
    preview
  )
  return tags.data?.tagCollection?.items?.filter(item => !!item && !!item.name);
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
  return authors.data?.authorCollection?.items?.filter(item => !!item && !!item.name && !!item.picture?.url);
}

export async function getAuthorById(preview, locale = 'en-US', id) {
  const authors = await fetchGraphQL(
    `query {
      authorCollection(locale: "${locale}", where: { sys: { id: "${id}"} }, limit: 1) {
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

  return authors.data?.authorCollection?.items?.[0];
}