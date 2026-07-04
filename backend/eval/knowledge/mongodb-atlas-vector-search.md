# MongoDB Atlas Vector Search

MongoDB Atlas Vector Search lets you run semantic similarity queries over vector
embeddings stored in your collections. It is only available on Atlas; a local
MongoDB deployment does not support Vector Search.

## Indexes

To query vectors you must define a vector search index. The index specifies the
path to the embedding field, the number of dimensions, and the similarity
function, which can be cosine, euclidean, or dotProduct.

## Filtering

You can add filter fields to a vector index to restrict results to a subset of
documents. For example, filtering by a userId field ensures a query only returns
chunks that belong to the current user, which keeps each user's data private.

## Embeddings

Embeddings are numeric vector representations of text. The OpenAI
text-embedding-3-small model produces vectors with 1536 dimensions, which must
match the numDimensions configured in the Atlas vector index.
