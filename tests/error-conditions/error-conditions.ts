import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import { NoOperationNameError } from '../../lib/GraphQLToOpenAPIConverter';
import { GraphQLError } from 'graphql';

describe('error-conditions', function() {
  it('should fail on a bad input query', function() {
    const schemaString = readFileSync(
      path.join(
        __dirname,
        '..',
        'graphql-pokemon',
        'schema.graphql'
      )
    ).toString();
    const inputQuery = `
      query {
        unknown
      }
    `;
    const output = graphqlToOpenApi({
      schemaString,
      inputQuery,
    });
    assert.ok(output.queryErrors.length > 0);
  });

  it('should fail on an invalid schema', function() {
    const schemaString = `
      type Query {
        badSyntax() : moreBadSyntax
      }
    `;
    const inputQuery = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      }`;
    const output = graphqlToOpenApi({
      schemaString,
      inputQuery,
    });
    assert.ok(output.schemaError);
    assert.equal(output.schemaError.name, 'GraphQLError');
  });
  
  it('should fail on a unnamed, valid input query', function() {
    const schemaString = readFileSync(
      path.join(
        __dirname,
        '..',
        'graphql-pokemon',
        'schema.graphql'
      )
    ).toString();
    const inputQuery = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      }
    `;
    const output = graphqlToOpenApi({
      schemaString,
      inputQuery,
    });
    assert.ok(output.error);
    assert.ok(output.error instanceof NoOperationNameError);
    assert.equal(output.error.name, 'NoOperationNameError');
  });

  it('should fail on a syntax error in the input query', function() {
    const schemaString = readFileSync(
      path.join(
        __dirname,
        '..',
        'graphql-pokemon',
        'schema.graphql'
      )
    ).toString();
    const inputQuery = `
      query {
        pokemon(id: "Test", name: "Test") {
          id
        }
      } a
    `;
    const output = graphqlToOpenApi({
      schemaString,
      inputQuery,
    });
    assert.ok(output.queryErrors);
    assert.ok(output.queryErrors[0] instanceof GraphQLError);
  });

});
