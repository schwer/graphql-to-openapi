import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import * as stringify from 'json-stable-stringify';

describe('customScalars', function() {
  it('should produce a valid openapi spec', function() {
    const schemaString = readFileSync(
      path.join(
        __dirname,
        'customScalarsSchema.graphql'
      )
    ).toString();
    const inputQueryFilename = path.join(
      __dirname,
      'customScalars.graphql'
    );
    const scalarConfig = {
      CustomScalar: {
        type: 'string',
      },
    };
    const inputQuery = readFileSync(inputQueryFilename).toString();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expectedOutput = require('./customScalars.json');
    const actualOutput = graphqlToOpenApi({
      schemaString,
      inputQuery,
      scalarConfig,
    }).openApiSchema;
    const normalizedActualOutput = stringify(actualOutput, { space: '  '});
    const normalizedExpectedOutput = stringify(expectedOutput, { space: '  '});
    assert.ok(!!actualOutput);
    assert.equal(normalizedActualOutput, normalizedExpectedOutput);
  });
});
