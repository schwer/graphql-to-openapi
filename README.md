# graphql-to-openapi

[![NPM](https://img.shields.io/npm/v/graphql-to-openapi.svg)](https://npmjs.com/graphql-to-openapi)
[![Known Vulnerabilities](https://snyk.io/test/github/schwer/graphql-to-openapi/badge.svg)](https://snyk.io/test/github/schwer/graphql-to-openapi)
[![codecov](https://codecov.io/gh/schwer/graphql-to-openapi/branch/master/graph/badge.svg?token=XTRQ95F57X)](https://codecov.io/gh/schwer/graphql-to-openapi)

<img alt="GraphQL → OpenAPI" src="https://raw.github.com/schwer/graphql-to-openapi/master/docs/src/logo.svg?sanitize=true">

Convert a graphql query + graphql schema into an openapi spec.

[Demo](https://schwer.github.io/graphql-to-openapi)

Not to be confused with the obviously more useful
[openapi-to-graphql](https://github.com/ibm/openapi-to-graphql).

# Usage via CLI

```
npx graphql-to-openapi --yaml --schema <schemaFilename> --query <queryFilename>
```

<img alt="GraphQL → OpenAPI" src="https://raw.github.com/schwer/graphql-to-openapi/master/static/usage.gif">

## Unknown Scalar Configuration via the CLI

Unknown scalars are scalar types in the graphql schema that do not obviously map to an openapi type.

The default behavior for unknown scalars is to treat them as `string` types in the output openapi schema.
If you desire to override that behavior, supply a scalar config file to the graphq-to-openapi tool:

```
Example CLI usage:

npx graphql-to-openapi --scalarConfigFile myScalarConfig.json --yaml --schema <schemaFilename> --query <queryFilename>

---

myScalarConfig.json:
{
  "DateTimeScalar": {
    "type": "string",
    "description": "YYYY-MM-DD date",
    "example": "2017-01-01",
    "format": "date",
    "pattern": "YYYY-MM-DD",
    "minLength": 0,
    "maxLength": 10
  }
}
```

# Usage as a module

```typescript
import { graphqlToOpenApi } from 'graphql-to-openapi';

const { error, openApiSchema, queryErrors, schemaError } = graphqlToOpenApi({
  schema,
  query,
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

## For Developers contributing to this project

### To get started:

1. Clone the github repo `git clone git@github.com/schwer/graphql-to-openapi`
1. `npm install // install dependencies`
1. `npm run test:watch`

### Updating the documentation:

1. The `docs` subdirectory contains a `create-react-app`.
1. `cd docs && npm run start`

