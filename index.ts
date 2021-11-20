import {
  GraphQLToOpenAPIResult,
  GraphQLToOpenAPIConverter,
} from './lib/GraphQLToOpenAPIConverter';
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
  onUnknownScalar?: (s: string) => object; // eslint-disable-line @typescript-eslint/ban-types
  scalarConfig?: { [key: string]: object }; // eslint-disable-line @typescript-eslint/ban-types
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
