import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import { SchemaTextArea } from './SchemaTextArea';
import { QueryTextArea } from './QueryTextArea';
import { graphqlToOpenApi } from 'graphql-to-openapi';
import './GraphQLToOpenApiDocs.scss';

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

  let openApiSchema;
  try {
    if (schemaString && inputQuery) {
      openApiSchema = graphqlToOpenApi({
        schemaString,
        inputQuery,
        inputQueryFilename: 'supplied query',
      }).openApiSchema;
    }
  } catch (err) {
    console.error(err);
  }
  return (
    <div className="GraphQLToOpenApiDocs">
      <div className="container-fluid">
        <header className="GraphQLToOpenApiDocs-header">
          <img height={50} src={logo} className="GraphQLToOpenApiDocs-logo" alt="logo" />
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
            <SchemaTextArea onChange={setSchemaString}
              value={schemaString} />
          </div>
          <div className="col">
            <QueryTextArea onChange={setInputQuery}
              value={inputQuery}
            />
          </div>
        </div>
        <p>&nbsp;</p>
        <div className="row" style={{ height: `calc(50vh - 100px)`}}>
          <div className="col">
            <h5>OpenAPI Schema:</h5>
            { openApiSchema
              ? (<textarea
                className="form-control"
                style={{ width: '100%', height: '100%', resize: 'none' }}
                value={JSON.stringify(openApiSchema, null, 2)} />)
              : <textarea readOnly disabled
                style={{ width: '100%', height: '100%', resize: 'none' }}
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
