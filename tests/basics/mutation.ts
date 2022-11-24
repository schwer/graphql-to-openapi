import { readFileSync } from 'fs';
import * as path from 'path';
import { graphqlToOpenApi } from '../../index';
import * as assert from 'assert';
import * as stringify from 'json-stable-stringify';

describe('mutation', function () {
  it('should produce a valid openapi spec', function () {
    const schema = readFileSync(
      path.join(__dirname, 'mutationSchema.graphql')
    ).toString();
    const inputQueryFilename = path.join(__dirname, 'mutation.graphql');
    const query = readFileSync(inputQueryFilename).toString();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expectedOutput = require('./mutation.json');
    const actualOutput = graphqlToOpenApi({
      schema,
      query,
    }).openApiSchema;
    const normalizedActualOutput = stringify(actualOutput, { space: '  ' });
    const normalizedExpectedOutput = stringify(expectedOutput, { space: '  ' });
    assert.ok(!!actualOutput);
    assert.equal(normalizedActualOutput, normalizedExpectedOutput);
  });
});
