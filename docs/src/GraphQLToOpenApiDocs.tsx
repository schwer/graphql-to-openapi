import React, { useState, useEffect } from 'react';
import { GraphQLError, Source } from 'graphql';
import {
  Button,
  InputGroup,
  Form,
  ToggleButtonGroup,
  ToggleButton,
} from 'react-bootstrap';
import { graphqlToOpenApi } from 'graphql-to-openapi';
import { CheckIcon } from '@primer/octicons-react';
import { stringify } from 'yaml';
import logo from './logo.svg';
import { GraphQLEditor } from './GraphQLEditor';
import './GraphQLToOpenApiDocs.scss';
import { textAreaStyles } from './textAreaStyles';

export const GraphQLToOpenApiDocs: React.FC = () => {
  const defaultSchema = `type Query {
  query: Query

  """
  An array of strings
  """
  arrayOfStrings(
    input: String!,
    otherInput: String!
  ): [String!]!
}`;
  const defaultQuery = `query scalarQuery (
  $input: String!,
  $otherInput: String!
) {
  arrayOfStrings(input: $input, otherInput: $otherInput)
}`;

  const savedSchemaString = localStorage.getItem(
    'graphql-to-openapi:schemaString'
  );
  const savedInputQuery = localStorage.getItem('graphql-to-openapi:inputQuery');

  const [schemaString, setSchemaString] = useState(
    savedSchemaString ?? defaultSchema
  );
  const [inputQuery, setInputQuery] = useState(savedInputQuery ?? defaultQuery);
  const [outputType, setOutputType] = useState('YAML');

  useEffect(() => {
    localStorage.setItem('graphql-to-openapi:schemaString', schemaString);
  }, [schemaString]);

  useEffect(() => {
    localStorage.setItem('graphql-to-openapi:inputQuery', inputQuery);
  }, [inputQuery]);

  let openApiSchema;
  let schemaError: GraphQLError | undefined;
  let queryErrors;
  try {
    const result = graphqlToOpenApi({
      schema: new Source(schemaString, 'Schema'),
      query: inputQuery,
      onUnknownScalar() {
        return { type: 'string' };
      },
    });
    openApiSchema = result.openApiSchema;
    schemaError = result.schemaError;
    queryErrors = result.queryErrors;
  } catch (err) {
    schemaError = err as GraphQLError;
  }
  const success = !schemaError && !queryErrors;
  let value = '';
  if (openApiSchema && outputType === 'YAML') {
    value = stringify(JSON.parse(JSON.stringify(openApiSchema)));
  } else if (openApiSchema) {
    value = JSON.stringify(openApiSchema, null, 2);
  }
  return (
    <div className="GraphQLToOpenApiDocs">
      <div className="container-fluid">
        <header className="GraphQLToOpenApiDocs-header">
          <img
            height={50}
            src={logo}
            className="GraphQLToOpenApiDocs-logo"
            alt="logo"
          />
          <a
            className="float-right"
            href="https://npmjs.com/graphql-to-openapi"
          >
            <img
              alt="npm link"
              src="https://img.shields.io/npm/v/graphql-to-openapi.svg"
            />
          </a>
        </header>
        <div style={{ height: 'calc(50vh - 100px)' }} className="row">
          <div className="col">
            <Form.Group style={{ height: '100%' }}>
              <Form.Label>GraphQL Schema</Form.Label>
              <GraphQLEditor
                errors={schemaError ? [schemaError] : undefined}
                onChange={setSchemaString}
                value={schemaString}
              />
            </Form.Group>
          </div>
          <div className="col">
            <Form.Group style={{ height: '100%' }}>
              <Form.Label>GraphQL Query</Form.Label>
              <GraphQLEditor
                errors={queryErrors}
                onChange={setInputQuery}
                value={inputQuery}
              />
            </Form.Group>
          </div>
        </div>
        <p>&nbsp;</p>
        <div className="row" style={{ height: 'calc(50vh - 50px)' }}>
          <div className="col">
            <div className="row" style={{ marginBottom: 5 }}>
              <InputGroup size="sm" className="col">
                <InputGroup.Prepend>
                  <Button disabled variant="link">
                    OpenAPI Schema
                  </Button>
                </InputGroup.Prepend>
                <ToggleButtonGroup
                  name="outputType"
                  type="radio"
                  size="sm"
                  value={outputType}
                  onChange={setOutputType}
                >
                  <ToggleButton value="YAML">YAML</ToggleButton>
                  <ToggleButton value="JSON">JSON</ToggleButton>
                </ToggleButtonGroup>
              </InputGroup>
              {!success ? (
                <span className="col" style={{ textAlign: 'right' }}>
                  <span
                    className="spinner-grow"
                    style={{ width: '1em', height: '1em' }}
                  >
                    <span className="sr-only">Loading...</span>
                  </span>{' '}
                  Waiting for valid schema and query...
                </span>
              ) : (
                <span className="col" style={{ textAlign: 'right' }}>
                  <CheckIcon />
                </span>
              )}
            </div>
            {openApiSchema ? (
              <textarea
                className="form-control"
                readOnly
                style={textAreaStyles}
                value={value}
              />
            ) : (
              <textarea
                readOnly
                disabled
                style={textAreaStyles}
                className="form-control"
                placeholder="Please supply a schema and query above"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphQLToOpenApiDocs;
