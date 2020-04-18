import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import { SchemaTextArea } from './SchemaTextArea';
import { QueryTextArea } from './QueryTextArea';
import { graphqlToOpenApi } from 'graphql-to-openapi';
import Octicon, { Check, MarkGithub } from '@primer/octicons-react';
import './GraphQLToOpenApiDocs.scss';
import { textAreaStyles } from './textAreaStyles';

export const GraphQLToOpenApiDocs: React.FC = () => {
  const defaultSchema =
`type Query {
  query: Query

  """
  An array of strings
  """
  arrayOfStrings(
    input: String!,
    otherInput: String!
  ): [String!]!
}`;
  const defaultQuery =
`query scalarQuery (
  $input: String!,
  $otherInput: String!
) {
  arrayOfStrings(input: $input, otherInput: $otherInput)
}`;

  const savedSchemaString = localStorage.getItem('graphql-to-openapi:schemaString');
  const savedInputQuery = localStorage.getItem('graphql-to-openapi:inputQuery');

  const [ schemaString, setSchemaString ] = useState(savedSchemaString ?? defaultSchema);
  const [ inputQuery, setInputQuery ] = useState(savedInputQuery ?? defaultQuery);

  useEffect(() => {
    localStorage.setItem('graphql-to-openapi:schemaString', schemaString);
  }, [schemaString]);

  useEffect(() => {
    localStorage.setItem('graphql-to-openapi:inputQuery', inputQuery);
  }, [inputQuery]);

  const {
    openApiSchema,
    schemaError,
    queryErrors,
  } = graphqlToOpenApi({
    schemaString,
    inputQuery,
    inputQueryFilename: 'supplied query',
  });
  const success = !schemaError && !queryErrors;
  return (
    <div className="GraphQLToOpenApiDocs">
      <div className="container-fluid">
        <header className="GraphQLToOpenApiDocs-header">
          <img height={50} src={logo} className="GraphQLToOpenApiDocs-logo" alt="logo" />
          <a className="float-right"
            href="https://npmjs.com/graphql-to-openapi">
            <img src="https://img.shields.io/npm/v/graphql-to-openapi.svg"/>
          </a>
        </header>
        <div className="row">
          <h5 className="col">
            Supply your GraphQL Schema below:
          </h5>
          <h5 className="col">
            Supply your GraphQL Query below:
          </h5>
        </div>
        <div style={{ height: `calc(50vh - 100px)` }} className="row">
          <div className="col">
            <SchemaTextArea isValid={!schemaError}
              onChange={setSchemaString}
              value={schemaString} />
          </div>
          <div className="col">
            <QueryTextArea isValid={!queryErrors}
              onChange={setInputQuery}
              value={inputQuery}
            />
          </div>
        </div>
        <p>&nbsp;</p>
        <div className="row" style={{ height: `calc(50vh - 100px)`}}>
          <div className="col">
            <h5>OpenAPI Schema:
              <span className="float-right">
                { !success
                  ? (
                    <span className="float-right">
                      <span className="spinner-grow"
                        style={{ width: '1em', height: '1em' }}>
                        <span className="sr-only">Loading...</span>
                      </span>
                      {' '}
                      Waiting for valid schema and query...
                    </span>
                  )
                  : (<Octicon icon={Check} />)
                }
              </span>
            </h5>
            { openApiSchema
              ? (<textarea
                className="form-control"
                readOnly
                style={textAreaStyles}
                value={JSON.stringify(openApiSchema, null, 2)} />)
              : <textarea readOnly disabled
                style={textAreaStyles}
                className="form-control"
                placeholder="Please supply a schema and query above" />
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphQLToOpenApiDocs;
