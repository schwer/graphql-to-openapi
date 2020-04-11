import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import { NoOperationNameError } from '../../lib/GraphQLToOpenAPIConverter';

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
      inputQueryFilename: 'error-conditions.graphql'
    });
    assert.ok(output.graphqlErrors.length > 0);
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
      inputQueryFilename: 'error-conditions.graphql'
    });
    assert.ok(output.error);
    assert.ok(output.error instanceof NoOperationNameError);
    assert.equal(output.error.name, 'NoOperationNameError');
  });

});
