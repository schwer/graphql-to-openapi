import { GraphQLToOpenAPIResult, GraphQLToOpenAPIConverter } from './lib/GraphQLToOpenAPIConverter';

export function graphqlToOpenApi({
  schemaString,
  inputQuery,
  inputQueryFilename,
}: {
  schemaString: string;
  inputQuery: string;
  inputQueryFilename: string;
}): GraphQLToOpenAPIResult {
  const c = new GraphQLToOpenAPIConverter(schemaString);
  return c.toOpenAPI(inputQuery, inputQueryFilename);
}
