import { Route, Variable, VariableArray, VariableRef } from "mentine";
import * as utils from "mentine/dist/Route/validators";
import * as helpers from "../../helpers";
import * as converters from "../converter";

const refVariable: VariableRef = {
  type: "ref",
  description: "",
  required: true,
  ref: "User",
};

const numberVariable: Variable = {
  type: "number",
  description: "",
  example: 3,
  required: false,
};

const stringVariable: Variable = {
  type: "string",
  description: "",
  example: "true",
  required: false,
};

const booleanVariable: Variable = {
  type: "boolean",
  description: "",
  example: true,
  required: false,
};

const arrayVariable: VariableArray = {
  type: "array",
  description: "",
  items: booleanVariable,
  required: false,
};

const nestedObjectVariable: Variable = {
  type: "object",
  description: "",
  properties: {
    bool: {
      type: "object",
      description: "",
      properties: {
        bool: {
          type: "boolean",
          description: "",
          example: true,
          required: false,
        },
      },
      required: true,
    },
  },
  required: true,
};

const doc: Route = {
  simplified: true,
  path: "/api/user/:id/blacklist",
  method: "put",
  tag: "User",
  summary: "lalalla",
  description: "lelelel",
  pathVariables: {
    id: {
      type: "string",
      description: "Id of user",
      example: "3",
      required: true,
    },
  },
  queryVariables: {
    start: {
      type: "integer",
      description: "Paging start",
      required: true,
      example: 20,
    },
  },
  body: {
    blacklist: {
      type: "boolean",
      description: "blacklisted",
      example: true,
      required: true,
    },
  },
  responses: {
    200: {
      description: "Salut",
      response: {
        blacklist: {
          type: "boolean",
          description: "blacklisted",
          example: true,
          required: true,
        },
      },
    },
    204: {
      description: "Salut",
    },
  },
};

describe("getTypescriptInterfaces", () => {
  test("Should call validateRoute", () => {
    const spy = jest.spyOn(utils, "validateRoute");
    converters.getTypescriptInterfaces(doc, "GetUser");
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should contains the interfaces", () => {
    const result = converters.getTypescriptInterfaces(doc, "GetUser");
    expect(result).toEqual([
      {
        interfaceName: "GetUserPath",
        interfaceContent: `{id: string}`,
      },
      {
        interfaceName: "GetUserQuery",
        interfaceContent: `{start: number}`,
      },
      {
        interfaceName: "GetUserBody",
        interfaceContent: `{blacklist: boolean}`,
      },
      {
        interfaceName: "GetUserResponse200",
        interfaceContent: `{blacklist: boolean}`,
      },
    ]);
  });
  test("Should put the name in pascalCase", () => {
    const result = converters.getTypescriptInterfaces(doc, "get_user");
    expect(result).toEqual([
      {
        interfaceName: "GetUserPath",
        interfaceContent: `{id: string}`,
      },
      {
        interfaceName: "GetUserQuery",
        interfaceContent: `{start: number}`,
      },
      {
        interfaceName: "GetUserBody",
        interfaceContent: `{blacklist: boolean}`,
      },
      {
        interfaceName: "GetUserResponse200",
        interfaceContent: `{blacklist: boolean}`,
      },
    ]);
  });
});

describe("convertOneOfAllOfAnyOfOrObjectTypeToInterface", () => {
  test("Should convert objectType", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      blacklist: {
        type: "boolean",
        description: "blacklisted",
        example: true,
        required: true,
      },
    });
    expect(helpers.normalize(result)).toEqual(`{blacklist:boolean}`);
  });
  test("Should convert anyOf", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      type: "anyOf",
      subSchemas: [
        {
          blacklist: {
            type: "boolean",
            description: "blacklisted",
            example: true,
            required: true,
          },
        },
        {
          like: {
            type: "boolean",
            description: "like",
            example: true,
            required: true,
          },
        },
      ],
    });
    expect(helpers.normalize(result)).toEqual(
      `{blacklist:boolean}|{like:boolean}`
    );
  });
  test("Should convert anyOf with ref", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      type: "anyOf",
      subSchemas: [
        {
          blacklist: {
            type: "boolean",
            description: "blacklisted",
            example: true,
            required: true,
          },
        },
        {
          type: "ref",
          description: "like",
          ref: "User",
          required: true,
        },
      ],
    });
    expect(helpers.normalize(result)).toEqual(`{blacklist:boolean}|User`);
  });
  test("Should convert allOf", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      type: "allOf",
      subSchemas: [
        {
          blacklist: {
            type: "boolean",
            description: "blacklisted",
            example: true,
            required: true,
          },
        },
        {
          like: {
            type: "boolean",
            description: "like",
            example: true,
            required: true,
          },
        },
        { id: nestedObjectVariable },
      ],
    });
    expect(helpers.normalize(result)).toEqual(
      helpers.normalize(
        `{
        blacklist:boolean
        like:boolean
        id:{
          bool: {
            bool?: boolean
          }
        }
      }`
      )
    );
  });
  test("Should convert allOf with ref", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      type: "allOf",
      subSchemas: [
        {
          blacklist: {
            type: "boolean",
            description: "blacklisted",
            example: true,
            required: true,
          },
        },
        {
          like: {
            type: "boolean",
            description: "like",
            example: true,
            required: true,
          },
        },
        { id: nestedObjectVariable },
        { type: "ref", description: "", ref: "User", required: true },
      ],
    });
    expect(helpers.normalize(result)).toEqual(
      helpers.normalize(
        `{
        blacklist:boolean
        like:boolean
        id:{
          bool: {
            bool?: boolean
          }
        }
      }`
      )
    );
  });
  test("Should convert oneOf", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      type: "oneOf",
      subSchemas: [
        {
          blacklist: {
            type: "boolean",
            description: "blacklisted",
            example: true,
            required: true,
          },
        },
        {
          like: {
            type: "boolean",
            description: "like",
            example: true,
            required: true,
          },
        },
        { id: nestedObjectVariable },
      ],
    });
    expect(helpers.normalize(result)).toEqual(
      helpers.normalize(
        `{
        blacklist:boolean } |
        { like:boolean } |
        { 
          id:{
          bool: {
            bool?: boolean
          }
        }
      }`
      )
    );
  });
  test("Should convert oneOf with ref", () => {
    const result = helpers.convertOneOfAllOfAnyOfOrObjectTypeToInterface({
      type: "oneOf",
      subSchemas: [
        {
          blacklist: {
            type: "boolean",
            description: "blacklisted",
            example: true,
            required: true,
          },
        },
        {
          like: {
            type: "boolean",
            description: "like",
            example: true,
            required: true,
          },
        },
        { id: nestedObjectVariable },
        { type: "ref", description: "", ref: "User", required: true },
      ],
    });
    expect(helpers.normalize(result)).toEqual(
      helpers.normalize(
        `{
        blacklist:boolean } | 
        { like:boolean } |
        { 
          id:{
          bool: {
            bool?: boolean
          }
        } 
      } | User`
      )
    );
  });
});

describe("getSanitizers", () => {
  test("Return an array of keys when it's not a nested object", () => {
    expect(
      helpers.normalize(
        converters.getSanitizers({
          id: stringVariable,
          bool: booleanVariable,
        })
      )
    ).toEqual(helpers.normalize('["id", "bool"]'));
  });
  test("Return a function it contains a nested object", () => {
    expect(
      helpers.normalize(
        converters.getSanitizers({
          id: stringVariable,
          boolean: booleanVariable,
          nested: nestedObjectVariable,
        })
      )
    ).toEqual(
      helpers.normalize(`({id, boolean, nested: { bool : { bool } } }) => {
      return {
        id,
        boolean,
        nested: {
          bool: {
            bool  
          }
        }
      }
    }`)
    );
  });
});

describe("buildStringValidator", () => {
  test("Should handle required field", () => {
    expect(
      helpers.normalize(
        converters.buildStringValidator({ ...stringVariable, required: false })
      )
    ).toEqual(
      helpers.normalize(".optional().isString().trim().not().isEmpty()")
    );
    expect(
      helpers.normalize(
        converters.buildStringValidator({ ...stringVariable, required: true })
      )
    ).toEqual(helpers.normalize(".isString().trim().not().isEmpty()"));
  });
  test("Should handle enum field", () => {
    const enumeration = ["lol", "mdr"];
    expect(
      helpers.normalize(
        converters.buildStringValidator({
          ...stringVariable,
          enum: enumeration,
        })
      )
    ).toEqual(
      helpers.normalize(
        `.optional().isString().trim().not().isEmpty().isIn(["lol","mdr"])`
      )
    );
  });
  test("Should handle pattern field", () => {
    const pattern = ".*";
    expect(
      helpers.normalize(
        converters.buildStringValidator({
          ...stringVariable,
          pattern,
        })
      )
    ).toEqual(
      helpers.normalize(
        `.optional().isString().trim().not().isEmpty().matches(".*")`
      )
    );
  });
  test("Should handle min max length field", () => {
    expect(
      helpers.normalize(
        converters.buildStringValidator({
          ...stringVariable,
          minLength: 0,
          maxLength: 5,
        })
      )
    ).toEqual(
      helpers.normalize(
        `.optional().isString().trim().not().isEmpty().isLength({min: 0, max: 5})`
      )
    );
    expect(
      helpers.normalize(
        converters.buildStringValidator({
          ...stringVariable,
          minLength: 3,
        })
      )
    ).toEqual(
      helpers.normalize(
        `.optional().isString().trim().not().isEmpty().isLength({min: 3,})`
      )
    );
    expect(
      helpers.normalize(
        converters.buildStringValidator({
          ...stringVariable,
          maxLength: 0,
        })
      )
    ).toEqual(
      helpers.normalize(
        `.optional().isString().trim().not().isEmpty().isLength({max: 0})`
      )
    );
  });
});

describe("buildNumberValidator", () => {
  test("Should handle required field", () => {
    expect(
      helpers.normalize(
        converters.buildNumberValidator({ ...numberVariable, required: false })
      )
    ).toEqual(helpers.normalize(".optional().isNumeric()"));
    expect(
      helpers.normalize(
        converters.buildNumberValidator({ ...numberVariable, required: true })
      )
    ).toEqual(helpers.normalize(".isNumeric()"));
  });
  test("Should handle exclusiveMaximum exclusiveMinimum field", () => {
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          exclusiveMaximum: 3,
          exclusiveMinimum: 0,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value > 0 && value < 3 )"
      )
    );
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          exclusiveMaximum: 3,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value < 3 )"
      )
    );
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          exclusiveMinimum: 0,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value > 0 )"
      )
    );
  });
  test("Should handle maximum minimum field", () => {
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          maximum: 3,
          minimum: 0,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value >= 0 && value <= 3 )"
      )
    );
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          maximum: 3,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value <= 3 )"
      )
    );
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          minimum: 0,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value >= 0 )"
      )
    );
  });

  test("Should handle multipleOf field", () => {
    expect(
      helpers.normalize(
        converters.buildNumberValidator({
          ...numberVariable,
          multipleOf: 2,
        })
      )
    ).toEqual(
      helpers.normalize(
        ".optional().isNumeric().custom((value: number) => value % 2 === 0 )"
      )
    );
  });
});

describe("buildBooleanValidator", () => {
  test("Should handle required field", () => {
    expect(
      helpers.normalize(
        converters.buildBooleanValidator({
          ...booleanVariable,
          required: false,
        })
      )
    ).toEqual(helpers.normalize(".optional().isBoolean()"));
    expect(
      helpers.normalize(
        converters.buildBooleanValidator({ ...booleanVariable, required: true })
      )
    ).toEqual(helpers.normalize(".isBoolean()"));
  });
});

describe("buildBooleanValidator", () => {
  test("Should add isDate to string validator", () => {
    const spy = jest.spyOn(converters, "buildStringValidator");
    const result = helpers.normalize(
      converters.buildDateValidator(stringVariable as any)
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      helpers.normalize(
        ".optional().isString().trim().not().isEmpty().isDate()"
      )
    );
  });
});

describe("buildArrayValidator", () => {
  test("Should handle required field", () => {
    expect(
      converters.buildArrayValidator({
        ...arrayVariable,
        required: true,
        items: booleanVariable,
      })
    ).toEqual([`.isArray()`, `.isBoolean()`]);
    expect(
      converters.buildArrayValidator({
        ...arrayVariable,
        required: false,
        items: booleanVariable,
      })
    ).toEqual([`.optional().isArray()`, `.optional().isBoolean()`]);
  });
});

describe("buildValidators", () => {
  test("Should call buildStringValidator for string variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildStringValidator");
    converters.buildValidators(stringVariable);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call buildArrayValidator for array variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildArrayValidator");
    converters.buildValidators(arrayVariable);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call buildDateValidator for date variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildDateValidator");
    converters.buildValidators({ ...stringVariable, type: "date" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call buildStringValidator for password variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildStringValidator");
    converters.buildValidators({ ...stringVariable, type: "password" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call buildBooleanValidator for boolean variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildBooleanValidator");
    converters.buildValidators(booleanVariable);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call buildNumberValidator for number variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildNumberValidator");
    converters.buildValidators(numberVariable);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call buildNumberValidator for integer variable", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "buildNumberValidator");
    converters.buildValidators({ ...numberVariable, type: "integer" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("getValidators", () => {
  describe("ObjectType<Variable>", () => {
    test("Should return appropriate result", () => {
      expect(
        converters.getValidators({
          id: stringVariable,
          boolean: booleanVariable,
          number: numberVariable,
        })
      ).toEqual([
        `('id').optional().isString().trim().not().isEmpty()`,
        `('boolean').optional().isBoolean()`,
        `('number').optional().isNumeric()`,
      ]);
    });
    test("Should return appropriate result with array", () => {
      expect(
        converters.getValidators({
          id: stringVariable,
          boolean: booleanVariable,
          array: arrayVariable,
        })
      ).toEqual([
        `('id').optional().isString().trim().not().isEmpty()`,
        `('boolean').optional().isBoolean()`,
        `('array').optional().isArray()`,
        `('array.*').optional().isBoolean()`,
      ]);
    });
    test("Should return appropriate result with nested array", () => {
      expect(
        converters.getValidators({
          id: stringVariable,
          boolean: booleanVariable,
          array: {
            ...arrayVariable,
            items: arrayVariable,
          },
        })
      ).toEqual([
        `('id').optional().isString().trim().not().isEmpty()`,
        `('boolean').optional().isBoolean()`,
        `('array').optional().isArray()`,
        `('array.*').optional().isArray()`,
        `('array.*.*').optional().isBoolean()`,
      ]);
    });
    test("Should return appropriate result with object", () => {
      expect(
        converters.getValidators({
          object: {
            type: "object",
            description: "",
            properties: {
              id: numberVariable,
              bool: {
                type: "object",
                description: "",
                properties: {
                  bool: {
                    type: "boolean",
                    description: "",
                    example: true,
                    required: false,
                  },
                },
                required: true,
              },
            },
            required: true,
          },
          array: arrayVariable,
        })
      ).toEqual([
        `('object.id').optional().isNumeric()`,
        `('object.bool.bool').optional().isBoolean()`,
        `('array').optional().isArray()`,
        `('array.*').optional().isBoolean()`,
      ]);
    });
    test("Should return appropriate result with nested array and nested object", () => {
      expect(
        converters.getValidators({
          array: {
            ...arrayVariable,
            items: {
              ...arrayVariable,
              items: {
                type: "object",
                description: "",
                properties: {
                  id: numberVariable,
                  bool: {
                    type: "object",
                    description: "",
                    properties: {
                      bool: {
                        type: "boolean",
                        description: "",
                        example: true,
                        required: false,
                      },
                    },
                    required: true,
                  },
                },
                required: true,
              },
            },
          },
        })
      ).toEqual([
        `('array').optional().isArray()`,
        `('array.*').optional().isArray()`,
        `('array.*.*.id').optional().isNumeric()`,
        `('array.*.*.bool.bool').optional().isBoolean()`,
      ]);
    });
  });
  describe("oneOf", () => {
    test("Should return appropriate result", () => {
      expect(
        helpers.normalize(
          converters.getValidators({
            type: "oneOf",
            subSchemas: [
              { id: numberVariable },
              { object: nestedObjectVariable },
              refVariable,
            ],
          })[0]
        )
      ).toEqual(
        helpers.normalize(
          `().custom((value, { req }) => {
          return new Promise(async (resolve, reject) => {
            [
              await Promise.all([
                ('id').optional().isNumeric().run(req, { dryRun: true }),
              ]),
              await Promise.all([
                ('object.bool.bool').optional().isBoolean().run(req, { dryRun: true }),
              ])
            ].some((result) => result.every((test) => test.isEmpty()))
              ? resolve()
              : reject();
          });
        }),`
        )
      );
    });
  });

  describe("anyOf", () => {
    test("Should return appropriate result", () => {
      expect(
        helpers.normalize(
          converters.getValidators({
            type: "anyOf",
            subSchemas: [
              { id: numberVariable },
              { object: nestedObjectVariable },
              refVariable,
            ],
          })[0]
        )
      ).toEqual(
        helpers.normalize(
          `().custom((value, { req }) => {
          return new Promise(async (resolve, reject) => {
            [
              await Promise.all([
                ('id').optional().isNumeric().run(req, { dryRun: true }),
              ]),
              await Promise.all([
                ('object.bool.bool').optional().isBoolean().run(req, { dryRun: true }),
              ])
            ].some((result) => result.every((test) => test.isEmpty()))
              ? resolve()
              : reject();
          });
        }),`
        )
      );
    });
  });

  describe("allOf", () => {
    test("Should return appropriate result", () => {
      expect(
        converters.getValidators({
          type: "allOf",
          subSchemas: [
            { id: numberVariable },
            { object: nestedObjectVariable },
            refVariable,
          ],
        })
      ).toEqual([
        `('id').optional().isNumeric()`,
        `('object.bool.bool').optional().isBoolean()`,
      ]);
    });
  });
});
