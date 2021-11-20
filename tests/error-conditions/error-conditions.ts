import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import {
  NoOperationNameError,
  MissingSchemaError,
} from '../../lib/GraphQLToOpenAPIConverter';
import { GraphQLError, IntrospectionQuery, Source } from 'graphql';

describe('error-conditions', function () {
  it('should fail on a bad input query', function () {
    const schema = readFileSync(
      path.join(__dirname, '..', 'graphql-pokemon', 'schema.graphql')
    ).toString();
    const query = `
      query {
        unknown
      }
    `;
    const output = graphqlToOpenApi({
      schema,
      query,
    });
    assert.ok(output.queryErrors.length > 0);
  });

  it('should fail on an invalid schema with a string', function () {
    const schema = `
      type Query {
        badSyntax() : moreBadSyntax
      }
    `;
    const query = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      }`;
    const output = graphqlToOpenApi({
      schema,
      query,
    });
    assert.ok(output.schemaError);
    assert.equal(output.schemaError.name, 'GraphQLError');
  });

  it('should fail on an invalid schema with a Source', function () {
    const schema = new Source(
      `
      type Query {
        badSyntax() : moreBadSyntax
      }
    `,
      'Test Query'
    );
    const query = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      }`;
    const output = graphqlToOpenApi({
      schema,
      query,
    });
    assert.ok(output.schemaError);
    assert.equal(output.schemaError.name, 'GraphQLError');
    assert.deepEqual(output.schemaError.locations, [{ column: 19, line: 3 }]);
  });

  it('should fail on an invalid introspection schema', function () {
    const introspectionSchema = {
      invalid: 'schema',
    };
    const query = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      }`;
    const output = graphqlToOpenApi({
      introspectionSchema: introspectionSchema as unknown as IntrospectionQuery,
      query,
    });
    assert.ok(output.schemaError);
    assert.equal(output.schemaError.name, 'Error');
  });

  it('should fail on a unnamed, valid input query', function () {
    const schema = readFileSync(
      path.join(__dirname, '..', 'graphql-pokemon', 'schema.graphql')
    ).toString();
    const query = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      }
    `;
    const output = graphqlToOpenApi({
      schema,
      query,
    });
    assert.ok(output.error);
    assert.ok(output.error instanceof NoOperationNameError);
    assert.equal(output.error.name, 'NoOperationNameError');
  });

  it('should fail on a syntax error in the input query', function () {
    const schema = readFileSync(
      path.join(__dirname, '..', 'graphql-pokemon', 'schema.graphql')
    ).toString();
    const query = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      } a
    `;
    const output = graphqlToOpenApi({
      schema,
      query,
    });
    assert.ok(output.queryErrors);
    assert.ok(output.queryErrors[0] instanceof GraphQLError);
  });

  it('should fail if neither schema nor introspection schema are supplied', function () {
    const query = `
      query {
        someQuery(token: "Te") {
          someResult
        }
      }
    `;
    try {
      graphqlToOpenApi({
        query,
      });
    } catch (err) {
      assert.ok(err instanceof MissingSchemaError);
      return;
    }
    assert.fail('exception not produced');
  });
});
