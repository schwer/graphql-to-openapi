import { visit, Kind, TypeNode, visitWithTypeInfo, NamedTypeNode } from 'graphql/language';
import { parse } from 'graphql/language/parser';
import { buildSchema, TypeInfo, buildClientSchema, printIntrospectionSchema, GraphQLSchema, GraphQLInputObjectType, GraphQLScalarType, GraphQLAbstractType, GraphQLEnumType, GraphQLNamedType, GraphQLNonNull, GraphQLNullableType } from 'graphql';
import { CLIEngine } from 'eslint';
import { _GraphQLList, GraphQLList } from 'graphql/type/definition';

interface GraphqlToOpenApiErrorReport {
  inputQuery?: string;
  schemaString?: string;
}

interface GraphqlToOpenApiResult {
  errorReport?: GraphqlToOpenApiErrorReport;
  openApiSchema?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const typeMap = {
  'ID': {
    type: 'string'
  },
  '[ID]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: true,
    }
  },
  '[ID!]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: false,
    },
  },
  'String': {
     type: 'string'
  },
  '[String!]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: false,
    },
  },
  '[String]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: true,
    }
  },
  '[Int]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: true,
    }
  },
  '[Int!]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: false,
    }
  },
  '[Float]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: true,
    }
  },
  '[Float!]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: false,
    }
  },
  '[Boolean]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: true,
    }
  },
  '[Boolean!]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: false,
    }
  },
  'Int': { type: 'integer' },
  'Float': { type: 'number' },
  'Boolean': { type: 'boolean' },
};

function fieldDefToOpenApiField(typeInfo: TypeInfo) {
  const fieldDef = typeInfo.getFieldDef();
  const typeName = fieldDef.type.toString();
  const description = fieldDef.description;
  let nullable;
  if (typeName.match(/[!]$/)) {
    nullable = false;
  } else {
    nullable = true;
  }
  const openApiType = {
    nullable,
    items: undefined,
    properties: undefined,
    type: undefined,
    description,
  };
  const typeNameWithoutBang = typeName.replace(/[!]$/, '');
  if (typeMap[typeNameWithoutBang]) {
    return {
      ...typeMap[typeNameWithoutBang],
      description,
      nullable,
    };
  } else if (typeNameWithoutBang.match(/^\[/)) {
    openApiType.type = 'array';
    openApiType.items = {
      type: 'object',
      properties: {
      }
    };
    return openApiType;
  } else {
    openApiType.type = 'object';
    openApiType.properties = {};
    return openApiType;
  }
}

type InputType = GraphQLInputObjectType |
  GraphQLScalarType |
  GraphQLEnumType |
  GraphQLList<any> |
  GraphQLNonNull<any>;

function createInputTypes(schema: GraphQLSchema): any {
  const typeMap = schema.getTypeMap();
  const inputObjects = Object.entries(typeMap)
    .filter(([name, obj]) => {
      return obj instanceof GraphQLInputObjectType ||
        obj instanceof GraphQLScalarType ||
        obj instanceof GraphQLEnumType;
    });
  const inputTypes = inputObjects.reduce((inputTypes, [name, obj]) => {
    inputTypes[name] = recurseInputType(obj as InputType, 0);
    return inputTypes;
  }, {});
}

function recurseInputType(
  obj: InputType,
  depth: number,
) {
  // istanbul ignore next
  if (depth > 50) {
    // istanbul ignore next
    throw new Error('depth limit exceeded: ' + depth);
  }
  if (obj instanceof GraphQLInputObjectType) {
    const inputObjectType = (obj as GraphQLInputObjectType);
    const properties = Object
      .entries(inputObjectType.getFields())
      .reduce((properties, [name, f]) => {
        properties[name] = recurseInputType(f.type, depth + 1);
        properties[name].description = f.description;
        return properties;
      }, {});
    return {
      type: 'object',
      nullable: true,
      description: inputObjectType.description,
      properties,
    };
  }
  if (obj instanceof GraphQLList) {
    const list = (obj as GraphQLList<any>);
    return {
      type: 'array',
      nullable: true,
      items: recurseInputType(list.ofType, depth + 1),
    };
  }
  if (obj instanceof GraphQLScalarType) {
    const { name, description } = obj;
    if (name === 'Float') {
      return {
        type: 'number',
        nullable: true,
       };
    }
    if (name === 'Int') {
      return {
        type: 'integer',
        nullable: true,
      };
    }
    if (name === 'String') {
      return {
        type: 'string',
        nullable: true,
      };
    }
    if (name === 'Boolean') {
      return {
        type: 'boolean',
        nullable: true,
      };
    }
    if (name === 'ID') {
      return {
        type: 'string',
        nullable: true,
      };
    }
    // istanbul ignore next
    throw new Error(`Unknown scalar: ${name}`);
  }
  if (obj instanceof GraphQLEnumType) {
    const enumValues = obj.getValues();
    return {
      type: 'string',
      description: obj.description,
      nullable: true,
      'enum': enumValues.map(({ name }) => name),
    };
  }
  if (obj instanceof GraphQLNonNull) {
    const nonNull = (obj as GraphQLNonNull<any>);
    return {
      ...recurseInputType(nonNull.ofType, depth + 1),
      nullable: false,
    };
  }
  // istanbul ignore next
  throw new Error(`Unexpected InputType: ${obj}`)
}

export function graphqlToOpenApi(
  schemaString: string,
  inputQuery: string
): GraphqlToOpenApiResult {
  const cli = new CLIEngine({
    extensions: ['.gql', '.graphql'],
    baseConfig: {
      rules: {
        'graphql/template-strings': ['error', {
          env: 'literal',
          schemaString,
        }],
        'graphql/named-operations' : ['error', {
          schemaString,
        }],
      },
    },
    ignore: false,
    useEslintrc: false,
    parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
    },
    plugins: [
      'graphql',
    ],
  });
  const report = cli.executeOnText(inputQuery, 'inputQuery.graphql');
  if (report.errorCount > 0) {
    const { results } = report;
    const formatter = cli.getFormatter();
    const resultsWithoutFilenames = results.map((r) => {
      return {
        ...r,
        filePath: '',
      };
    });
    return {
      errorReport: {
        inputQuery: formatter(resultsWithoutFilenames),
      }
    };
  }
  const parsedQuery = parse(inputQuery);
  let openApiSchema = {
    swagger: '2.0',
    schemes: [
      'http', 'https'
    ],
    consumes: [
      'application/json'
    ],
    produces: [
      'application/json'
    ],
    paths: {
    }
  };

  let operationDef;
  const currentSelection = [];
  const schema = buildSchema(schemaString);
  const typeInfo = new TypeInfo(schema);
  const inputTypes = createInputTypes(schema);
  openApiSchema = visit(parsedQuery, visitWithTypeInfo(typeInfo, {
    Document: {
      leave() {
        return openApiSchema;
      },
    },
    OperationDefinition: {
      enter(node) {
        const openApiType = {
          type: 'object',
          properties: {
            // To be filled by Field visitor
          },
        };
        openApiSchema.paths['/' + node.name.value] = operationDef = {
          get: {
            parameters: [],
            responses: {
              '200': {
                description: 'response',
                schema: openApiType,
              },
            },
            produces: [
              'application/json',
            ],
          },
        };
        currentSelection.unshift({
          node,
          openApiType,
        });
      },
      leave() {
        return openApiSchema;
      },
    },
    VariableDefinition({ variable, type }) {
      const t = recurseInputType(typeInfo.getInputType(), 0);
      if (t.type === 'object' || t.type === 'array') {
        operationDef.get.parameters.push({
          name: variable.name.value,
          in: 'query',
          required: !t.nullable,
          type: t.type,
          items: t.items,
          properties: t.properties,
          description: t.description,
        });
      } else {
        operationDef.get.parameters.push({
          name: variable.name.value,
          in: 'query',
          required: !t.nullable,
          type: t.type,
          description: t.description,
        });

      }
    },
    Field: {
      enter(node) {
        const openApiType = fieldDefToOpenApiField(typeInfo);
        const parentObj = currentSelection[0].openApiType;
        if (parentObj.type === 'object') {
          parentObj.properties[node.name.value] = openApiType;
        } else { // array
          parentObj.items.properties[node.name.value] = openApiType;
        }
        if (openApiType.type === 'array' && openApiType.items.type === 'object') {
          currentSelection.unshift({
            node,
            openApiType,
          });
        } else if (openApiType.type === 'object') {
          currentSelection.unshift({
            node,
            openApiType,
          });
        }
      },
      leave(node) {
        // raw reference comparison doesn't work here. Using
        // loc as a proxy instead.
        if (currentSelection[0].node.loc === node.loc) {
          const result = currentSelection.shift().openApiType;
          return result;
        }
      }
    },
  }));
  return {
    openApiSchema,
  };
}
