import {
  GraphQLToOpenAPIResult,
  GraphQLToOpenAPIConverter,
} from './lib/GraphQLToOpenAPIConverter';

export function graphqlToOpenApi({
  schemaString,
  inputQuery,
}: {
  schemaString: string;
  inputQuery: string;
}): GraphQLToOpenAPIResult {
  const c = new GraphQLToOpenAPIConverter(schemaString);
  return c.toOpenAPI(inputQuery);
}
