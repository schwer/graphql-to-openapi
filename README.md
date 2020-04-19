# graphql-to-openapi

[![NPM](https://img.shields.io/npm/v/graphql-to-openapi.svg)](https://npmjs.com/graphql-to-openapi) 
[![Known Vulnerabilities](https://snyk.io/test/github/schwer/graphql-to-openapi/badge.svg)](https://snyk.io/test/github/schwer/graphql-to-openapi)

<img alt="GraphQL → OpenAPI" src="https://raw.github.com/schwer/graphql-to-openapi/master/docs/src/logo.svg?sanitize=true">

Convert a graphql query + graphql schema into an openapi spec.

[Demo](https://schwer.github.io/graphql-to-openapi)

Not to be confused with the obviously more useful
[openapi-to-graphql](https://github.com/ibm/openapi-to-graphql).

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
// graphql-to-openapi only throws an error if you've failed to name
// the input query. The name of the input query is used to define the
// openapi route name.

// schemaError is an error in the parsing of the input schema.

// queryErrors are errors associated with parsing and validating the input query.
// This includes any validation issues when matching the query with the schema.

// openApiSchema will contain the deserialized openapi schema for the
// specified query.

```
