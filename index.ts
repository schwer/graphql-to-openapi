import {
  GraphQLToOpenAPIResult,
  GraphQLToOpenAPIConverter,
} from './lib/GraphQLToOpenAPIConverter';
import { IntrospectionQuery } from 'graphql';

export function graphqlToOpenApi({
  inputQuery,
  introspectionSchema,
  onUnknownScalar,
  scalarConfig,
  schemaString,
}: {
  inputQuery: string;
  introspectionSchema?: IntrospectionQuery;
  onUnknownScalar?: (s: string) => object; // eslint-disable-line @typescript-eslint/ban-types
  scalarConfig?: { [key: string]: object }; // eslint-disable-line @typescript-eslint/ban-types
  schemaString?: string;
}): GraphQLToOpenAPIResult {
  const c = new GraphQLToOpenAPIConverter(
    schemaString,
    introspectionSchema,
    onUnknownScalar,
    scalarConfig
  );
  return c.toOpenAPI(inputQuery);
}
