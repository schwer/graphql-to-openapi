# graphql-to-openapi

[![NPM](https://img.shields.io/npm/v/graphql-to-openapi.svg)](https://npmjs.com/graphql-to-openapi) 
[![Known Vulnerabilities](https://snyk.io/test/github/schwer/graphql-to-openapi/badge.svg)](https://snyk.io/test/github/schwer/graphql-to-openapi)

<img alt="GraphQL → OpenAPI" src="https://raw.github.com/schwer/graphql-to-openapi/master/docs/src/logo.svg?sanitize=true">

Convert a graphql query + graphql schema into an openapi spec.

## Usage via CLI

```
npx graphql-to-openapi --schema <schemaFilename> --query <queryFilename>
```

<img alt="GraphQL → OpenAPI" src="https://raw.github.com/schwer/graphql-to-openapi/master/static/usage.gif">

## Usage as a module

```typescript

import { graphqlToOpenApi } from 'graphql-to-openapi';

const {
  error,
  openApiSchema,
  queryErrors,
  schemaError,
} = graphqlToOpenApi({
  schemaString,
  inputQuery,
});

// error will contain any graphql-to-openapi errors if they exist.

// schemaError are errors in the parsing of the input schema.

// queryErrors are errors associated with parsing and validating the input
query.

// openApiSchema will contain the deserialized openapi schema for the
// specified query.

```
