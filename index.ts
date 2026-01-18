import {
  GraphQLToOpenAPIResult,
  GraphQLToOpenAPIConverter,
} from './lib/GraphQLToOpenAPIConverter.js';
import { Source, IntrospectionQuery } from 'graphql';

export function graphqlToOpenApi({
  query,
  introspectionSchema,
  onUnknownScalar,
  scalarConfig,
  schema,
}: {
  query: string | Source;
  introspectionSchema?: IntrospectionQuery;
  onUnknownScalar?: (s: string) => object;
  scalarConfig?: { [key: string]: object };
  schema?: string | Source;
}): GraphQLToOpenAPIResult {
  const c = new GraphQLToOpenAPIConverter(
    schema,
    introspectionSchema,
    onUnknownScalar,
    scalarConfig
  );
  return c.toOpenAPI(query);
}
