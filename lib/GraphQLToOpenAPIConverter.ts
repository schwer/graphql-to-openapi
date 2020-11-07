import { visit, BREAK } from 'graphql/language';
import { visitWithTypeInfo } from 'graphql/utilities/TypeInfo';
import { validate } from 'graphql/validation';
import { parse } from 'graphql/language/parser';
import {
  GraphQLEnumType,
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLSchema,
  IntrospectionQuery,
  TypeInfo,
  buildClientSchema,
  buildSchema,
} from 'graphql';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLUnionType,
} from 'graphql/type/definition';

export class NoOperationNameError extends Error {
  constructor(message) {
    super(message) /* istanbul ignore next */;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = NoOperationNameError.name;
  }
}

export class MissingSchemaError extends Error {
  constructor(message) {
    super(message) /* istanbul ignore next */;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = MissingSchemaError.name;
  }
}

export class UnknownScalarError extends Error {
  constructor(message) {
    super(message) /* istanbul ignore next */;
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    this.name = UnknownScalarError.name;
  }
}

export interface GraphQLToOpenAPIResult {
  readonly queryErrors?: readonly GraphQLError[];
  readonly error?: NoOperationNameError;
  readonly schemaError?: GraphQLError;
  openApiSchema?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const typeMap = {
  ID: {
    type: 'string',
  },
  '[ID]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: true,
    },
  },
  '[ID!]': {
    type: 'array',
    items: {
      type: 'string',
      nullable: false,
    },
  },
  String: {
    type: 'string',
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
    },
  },
  '[Int]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: true,
    },
  },
  '[Int!]': {
    type: 'array',
    items: {
      type: 'integer',
      nullable: false,
    },
  },
  '[Float]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: true,
    },
  },
  '[Float!]': {
    type: 'array',
    items: {
      type: 'number',
      nullable: false,
    },
  },
  '[Boolean]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: true,
    },
  },
  '[Boolean!]': {
    type: 'array',
    items: {
      type: 'boolean',
      nullable: false,
    },
  },
  Int: { type: 'integer' },
  Float: { type: 'number' },
  Boolean: { type: 'boolean' },
};

function getScalarType(
  typeName: string,
  scalarConfig: { [key: string]: object },
  onUnknownScalar: (s: string) => object
): object {
  if (scalarConfig[typeName]) {
    return scalarConfig[typeName];
  }
  const r = onUnknownScalar(typeName);
  if (r) {
    scalarConfig[typeName] = r;
    return r;
  }
  throw new UnknownScalarError('Unknown scalar: ' + typeName);
}

function fieldDefToOpenApiField(
  typeInfo: TypeInfo,
  scalarConfig: { [key: string]: object },
  onUnknownScalar: (s: string) => object
) {
  const fieldDef = typeInfo.getFieldDef();
  const typeName = fieldDef.type.toString();
  const description = fieldDef.description || undefined;
  let nullable;
  let type = fieldDef.type;
  if (type instanceof GraphQLNonNull) {
    nullable = false;
    type = type.ofType;
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
  }
  if (type instanceof GraphQLList) {
    openApiType.type = 'array';
    let itemType = type.ofType;
    let nullableItems = true;
    if (itemType instanceof GraphQLNonNull) {
      nullableItems = false;
      itemType = itemType.ofType;
    }
    if (itemType instanceof GraphQLObjectType) {
      openApiType.items = {
        type: 'object',
        properties: {},
      };
    }
    if (itemType instanceof GraphQLUnionType) {
      openApiType.items = {
        anyOf: [],
        nullable: nullableItems,
      };
    }
    if (itemType instanceof GraphQLScalarType) {
      openApiType.items = getScalarType(
        itemType.name,
        scalarConfig,
        onUnknownScalar
      );
      openApiType.items.nullable = nullableItems;
    }
    return openApiType;
  }
  if (type instanceof GraphQLObjectType) {
    openApiType.type = 'object';
    openApiType.properties = {};
    return openApiType;
  }
  const scalarType = type as GraphQLScalarType;
  const t = getScalarType(scalarType.name, scalarConfig, onUnknownScalar);
  return {
    ...t,
    description,
    nullable,
  };
}

type InputType =
  | GraphQLInputObjectType
  | GraphQLScalarType
  | GraphQLEnumType
  | GraphQLList<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  | GraphQLNonNull<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function recurseInputType(
  obj: InputType,
  depth: number,
  scalarConfig: { [key: string]: object },
  onUnknownScalar: (s: string) => object
) {
  // istanbul ignore next
  if (depth > 50) {
    // istanbul ignore next
    throw new Error('depth limit exceeded: ' + depth);
  }
  if (obj instanceof GraphQLInputObjectType) {
    const inputObjectType = obj as GraphQLInputObjectType;
    const properties = Object.entries(inputObjectType.getFields()).reduce(
      (properties, [name, f]) => {
        properties[name] = recurseInputType(
          f.type,
          depth + 1,
          scalarConfig,
          onUnknownScalar
        );
        properties[name].description = f.description;
        return properties;
      },
      {}
    );
    return {
      type: 'object',
      nullable: true,
      description: inputObjectType.description || undefined,
      properties,
    };
  }
  if (obj instanceof GraphQLList) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = obj as GraphQLList<any>;
    return {
      type: 'array',
      nullable: true,
      items: recurseInputType(
        list.ofType,
        depth + 1,
        scalarConfig,
        onUnknownScalar
      ),
    };
  }
  if (obj instanceof GraphQLScalarType) {
    const { name } = obj;
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
    // istanbul ignore else
    if (name === 'ID') {
      return {
        type: 'string',
        nullable: true,
      };
    }
    return getScalarType(name, scalarConfig, onUnknownScalar);
  }
  if (obj instanceof GraphQLEnumType) {
    const enumValues = obj.getValues();
    return {
      type: 'string',
      description: obj.description || undefined,
      nullable: true,
      enum: enumValues.map(({ name }) => name),
    };
  }
  // istanbul ignore else
  if (obj instanceof GraphQLNonNull) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonNull = obj as GraphQLNonNull<any>;
    return {
      ...recurseInputType(
        nonNull.ofType,
        depth + 1,
        scalarConfig,
        onUnknownScalar
      ),
      nullable: false,
    };
  }
  // istanbul ignore next
  throw new Error(`Unexpected InputType: ${obj}`);
}

export class GraphQLToOpenAPIConverter {
  private schema: GraphQLSchema;
  private schemaError: GraphQLError;
  constructor(
    private schemaString?: string,
    private introspectionSchema?: IntrospectionQuery,
    private onUnknownScalar?: (s: string) => object,
    private scalarConfig?: { [key: string]: object }
  ) {
    if (!onUnknownScalar) {
      this.onUnknownScalar = () => {
        return null;
      };
    }
    if (!scalarConfig) {
      this.scalarConfig = {};
    }
    if (schemaString) {
      try {
        this.schema = buildSchema(this.schemaString);
      } catch (err) {
        this.schemaError = err;
      }
    } else if (introspectionSchema) {
      try {
        this.schema = buildClientSchema(this.introspectionSchema);
      } catch (err) {
        this.schemaError = err;
      }
    } else {
      throw new MissingSchemaError(
        'neither schema nor introspection schema supplied'
      );
    }
  }

  public toOpenAPI(inputQuery: string): GraphQLToOpenAPIResult {
    const { schemaError, onUnknownScalar, scalarConfig } = this;
    if (schemaError) {
      return {
        schemaError,
      };
    }
    const { schema } = this;
    let parsedQuery;
    try {
      parsedQuery = parse(inputQuery);
    } catch (err) {
      return { queryErrors: [err] };
    }
    const queryErrors = validate(schema, parsedQuery);
    if (queryErrors.length > 0) {
      return {
        queryErrors,
      };
    }
    let openApiSchema = {
      openapi: '3.0.3',
      info: {
        title: 'Not specified',
        license: {
          name: 'Not specified',
        },
        version: 'Not specified',
      },
      servers: [
        {
          url: '/',
        },
      ],
      paths: {},
    };

    let error;
    let operationDef;
    const currentSelection = [];
    const typeInfo = new TypeInfo(schema);
    openApiSchema = visit(
      parsedQuery,
      visitWithTypeInfo(typeInfo, {
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
            if (!node.name) {
              error = new NoOperationNameError(
                'GraphQLToOpenAPIConverter requires a named ' +
                  `operation on line ${node.loc.source.locationOffset.line} ` +
                  'of input query'
              );
              return BREAK;
            }
            openApiSchema.paths['/' + node.name.value] = operationDef = {
              get: {
                parameters: [],
                responses: {
                  '200': {
                    description: 'response',
                    content: {
                      'application/json': {
                        schema: openApiType,
                      },
                    },
                  },
                },
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
        VariableDefinition({ variable }) {
          const t = recurseInputType(
            typeInfo.getInputType(),
            0,
            scalarConfig,
            onUnknownScalar
          );
          if (t.type === 'object' || t.type === 'array') {
            operationDef.get.parameters.push({
              name: variable.name.value,
              in: 'query',
              required: !t.nullable,
              schema: {
                type: t.type,
                items: t.items,
                properties: t.properties,
              },
              description: t.description || undefined,
            });
          } else {
            operationDef.get.parameters.push({
              name: variable.name.value,
              in: 'query',
              required: !t.nullable,
              schema: {
                type: t.type,
              },
              description: t.description || undefined,
            });
          }
        },
        Field: {
          enter(node) {
            let name;
            if (node.alias) {
              name = node.alias.value;
            } else {
              name = node.name.value;
            }
            const openApiType = fieldDefToOpenApiField(
              typeInfo,
              scalarConfig,
              onUnknownScalar
            );
            const parentObj = currentSelection[0].openApiType;
            if (parentObj.type === 'object') {
              parentObj.properties[name] = openApiType;
            } else {
              // array
              parentObj.items.properties[name] = openApiType;
            }
            if (
              openApiType.type === 'array' &&
              openApiType.items.type === 'object'
            ) {
              currentSelection.unshift({
                node,
                openApiType,
              });
            } else if (
              openApiType.type === 'array' &&
              openApiType.items.anyOf
            ) {
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
          },
        },
        InlineFragment: {
          enter(node) {
            const openApiType = { type: 'object', properties: {} };
            currentSelection[0].openApiType.items.anyOf.push(openApiType);
            currentSelection.unshift({
              node,
              openApiType,
            });
          },
          leave(node) {
            // raw reference comparison doesn't work here. Using
            // loc as a proxy instead.
            if (currentSelection[0].node.loc === node.loc) {
              const result = currentSelection.shift().openApiType;
              return result;
            }
          },
        },
      })
    );
    if (error) {
      return {
        error,
      };
    }
    return {
      openApiSchema,
    };
  }
}
