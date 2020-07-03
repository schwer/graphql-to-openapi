import {
  GraphQLToOpenAPIResult,
  GraphQLToOpenAPIConverter,
} from './lib/GraphQLToOpenAPIConverter';

export function graphqlToOpenApi({
  inputQuery,
  onUnknownScalar,
  scalarConfig,
  schemaString,
}: {
  inputQuery: string;
  onUnknownScalar?: (s: string) => any;
  scalarConfig?: { [key: string]: any };
  schemaString: string;
}): GraphQLToOpenAPIResult {
  const c = new GraphQLToOpenAPIConverter(
    schemaString,
    onUnknownScalar,
    scalarConfig
  );
  return c.toOpenAPI(inputQuery);
}
