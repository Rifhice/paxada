import {
  Entity,
  Variable,
  VariableArray,
  VariableObject,
  VariableRef,
} from "mentine";
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

const entity: Entity = {
  simplified: true,
  name: "Post",
  schema: {
    content: stringVariable,
    author: {
      type: "ref",
      ref: "User",
      description: "s",
      required: true,
    },
    comments: numberVariable,
    attachments: nestedObjectVariable,
  },
};

describe("convertEntityToInterface", () => {
  test("allOf, oneOf, anyOf not implemented", () => {
    const spy = jest.spyOn(console, "warn");
    converters.convertEntityToInterface({
      simplified: true,
      name: "Post",
      schema: {
        type: "allOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    converters.convertEntityToInterface({
      simplified: true,
      name: "Post",
      schema: {
        type: "anyOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(2);
    converters.convertEntityToInterface({
      simplified: true,
      name: "Post",
      schema: {
        type: "oneOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(3);
  });
  test("Should call convertOneOfAllOfAnyOfOrObjectTypeToInterface and return it's result", () => {
    const spy = jest
      .spyOn(helpers, "convertOneOfAllOfAnyOfOrObjectTypeToInterface")
      .mockReturnValueOnce("salut");
    expect(
      helpers.normalize(converters.convertEntityToInterface(entity))
    ).toEqual("salut");
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should return valid result", () => {
    expect(
      helpers.normalize(converters.convertEntityToInterface(entity))
    ).toEqual(
      helpers.normalize(`{
        content?: string
        author: A
        comments?: number
        attachments: {
            bool: {
                bool?: boolean
            }
        }
    }`)
    );
  });
  test("Should return valid result 2", () => {
    expect(
      helpers.normalize(
        converters.convertEntityToInterface({
          ...entity,
          schema: {
            ...entity.schema,
            //@ts-ignore
            attachments: {
              //@ts-ignore
              ...entity.schema.attachments,
              properties: {
                //@ts-ignore
                ...entity.schema.attachments.properties,
                test: refVariable,
              },
            },
          },
        })
      )
    ).toEqual(
      helpers.normalize(`{
        content?: string
        author: A
        comments?: number
        attachments: {
            bool: {
                bool?: boolean
            }
            test: B
        }
    }`)
    );
  });
});

describe("convertEntityToMongooseData", () => {
  test("allOf, oneOf, anyOf not implemented", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(console, "warn");
    converters.convertEntityToMongooseData({
      simplified: true,
      name: "Post",
      schema: {
        type: "allOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    converters.convertEntityToMongooseData({
      simplified: true,
      name: "Post",
      schema: {
        type: "anyOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(2);
    converters.convertEntityToMongooseData({
      simplified: true,
      name: "Post",
      schema: {
        type: "oneOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  const testCases: Array<{ body: Entity; expectedResult: string }> = [
    {
      body: {
        ...entity,
        schema: {
          id: stringVariable,
        },
      },
      expectedResult: `{id: {type:String}}`,
    },
    {
      body: {
        ...entity,
        schema: {
          id: stringVariable,
          number: numberVariable,
        },
      },
      expectedResult: `{
        id: { type: String },
        number: { type: Number}
      }`,
    },
    {
      body: {
        ...entity,
        schema: {
          id: stringVariable,
          number: numberVariable,
          bool: booleanVariable,
        },
      },
      expectedResult: `{
        id: { type: String },
        number: { type: Number },
        bool: { type: Boolean }
      }`,
    },
    {
      body: {
        ...entity,
        schema: {
          id: stringVariable,
          number: numberVariable,
          bool: booleanVariable,
          array: arrayVariable,
        },
      },
      expectedResult: `{
        id: { type: String },
        number: { type: Number },
        bool: { type: Boolean },
        array: { type: [{ type: Boolean }] }
      }`,
    },
    {
      body: {
        ...entity,
        schema: {
          id: stringVariable,
          number: numberVariable,
          bool: booleanVariable,
          array: arrayVariable,
          object: nestedObjectVariable,
        },
      },
      expectedResult: `{
        id: { type: String },
        number: { type: Number },
        bool: { type: Boolean },
        array: { type: [{ type: Boolean }] },
        object: {
          bool: {
            bool: { type: Boolean }
          }
        }
      }`,
    },
  ];
  for (const { body, expectedResult } of testCases) {
    test("Should return valid value for simple variable", () => {
      expect(
        helpers.normalize(converters.convertEntityToMongooseData(body))
      ).toEqual(helpers.normalize(expectedResult));
    });
  }
});

describe("countRefs", () => {
  test("If no ref returns 0", () => {
    expect(
      converters.countRefs({
        id: stringVariable,
      })
    ).toEqual(0);
    expect(
      converters.countRefs({
        id: numberVariable,
        array: arrayVariable,
      })
    ).toEqual(0);
    expect(
      converters.countRefs({
        id: numberVariable,
        array: arrayVariable,
        obejct: nestedObjectVariable,
      })
    ).toEqual(0);
    expect(
      converters.countRefs({
        id: numberVariable,
        array: arrayVariable,
        object: nestedObjectVariable,
        boolean: booleanVariable,
      })
    ).toEqual(0);
  });
  test("Should return as many ref as there is", () => {
    expect(
      converters.countRefs({
        id: refVariable,
      })
    ).toEqual(1);
    expect(
      converters.countRefs({
        id: refVariable,
        lala: refVariable,
      })
    ).toEqual(2);
    expect(
      converters.countRefs({
        id: refVariable,
        lala: refVariable,
        mdr: refVariable,
      })
    ).toEqual(3);
  });
  test("Should return as many ref as there is even in arrays or objects", () => {
    expect(
      converters.countRefs({
        id: { ...arrayVariable, items: refVariable },
      })
    ).toEqual(1);
    expect(
      converters.countRefs({
        id: { ...arrayVariable, items: refVariable },
        lala: {
          ...nestedObjectVariable,
          properties: {
            ...nestedObjectVariable.properties,
            salut: refVariable,
          },
        },
      })
    ).toEqual(2);
  });
});

describe("buildRefsArray", () => {
  test("If no ref returns empty array", () => {
    expect(
      converters.buildRefsArray({
        id: stringVariable,
      })
    ).toEqual([]);
    expect(
      converters.buildRefsArray({
        id: numberVariable,
        array: arrayVariable,
      })
    ).toEqual([]);
    expect(
      converters.buildRefsArray({
        id: numberVariable,
        array: arrayVariable,
        obejct: nestedObjectVariable,
      })
    ).toEqual([]);
    expect(
      converters.buildRefsArray({
        id: numberVariable,
        array: arrayVariable,
        object: nestedObjectVariable,
        boolean: booleanVariable,
      })
    ).toEqual([]);
  });
  test("Should return as many ref as there is", () => {
    expect(
      converters.buildRefsArray({
        id: refVariable,
      })
    ).toEqual(["A"]);
    expect(
      converters.buildRefsArray({
        id: refVariable,
        lala: refVariable,
      })
    ).toEqual(["A", "B"]);
    expect(
      converters.buildRefsArray({
        id: refVariable,
        lala: refVariable,
        mdr: refVariable,
      })
    ).toEqual(["M", "D", "R"]);
  });
  test("Should return as many ref as there is even in arrays or objects", () => {
    expect(
      converters.buildRefsArray({
        id: { ...arrayVariable, items: refVariable },
      })
    ).toEqual(["A"]);
    expect(
      converters.buildRefsArray({
        id: { ...arrayVariable, items: refVariable },
        lala: {
          ...nestedObjectVariable,
          properties: {
            ...nestedObjectVariable.properties,
            salut: refVariable,
          },
        },
      })
    ).toEqual(["A", "B"]);
  });
});

describe("buildGenericWithDefault", () => {
  test("If no ref returns empty string", () => {
    expect(
      converters.buildGenericWithDefault(
        {
          id: stringVariable,
        },
        "haha"
      )
    ).toEqual("");
    expect(
      converters.buildGenericWithDefault(
        {
          id: numberVariable,
          array: arrayVariable,
        },
        "haha"
      )
    ).toEqual("");
    expect(
      converters.buildGenericWithDefault(
        {
          id: numberVariable,
          array: arrayVariable,
          obejct: nestedObjectVariable,
        },
        "haha"
      )
    ).toEqual("");
    expect(
      converters.buildGenericWithDefault(
        {
          id: numberVariable,
          array: arrayVariable,
          object: nestedObjectVariable,
          boolean: booleanVariable,
        },
        "haha"
      )
    ).toEqual("");
  });
  test("Should return a correct generic string", () => {
    expect(
      helpers.normalize(
        converters.buildGenericWithDefault(
          {
            id: refVariable,
          },
          "haha"
        )
      )
    ).toEqual("<A=haha>");
    expect(
      helpers.normalize(
        converters.buildGenericWithDefault(
          {
            id: refVariable,
            lala: refVariable,
          },
          "haha"
        )
      )
    ).toEqual("<A=haha,B=haha>");
    expect(
      helpers.normalize(
        converters.buildGenericWithDefault(
          {
            id: refVariable,
            lala: refVariable,
            mdr: refVariable,
          },
          "haha"
        )
      )
    ).toEqual("<M=haha,D=haha,R=haha>");
  });
  test("Should return as many ref as there is even in arrays or objects", () => {
    expect(
      helpers.normalize(
        converters.buildGenericWithDefault(
          {
            id: { ...arrayVariable, items: refVariable },
          },
          "haha"
        )
      )
    ).toEqual("<A=haha>");
    expect(
      helpers.normalize(
        converters.buildGenericWithDefault(
          {
            id: { ...arrayVariable, items: refVariable },
            lala: {
              ...nestedObjectVariable,
              properties: {
                ...nestedObjectVariable.properties,
                salut: refVariable,
              },
            },
          },
          "haha"
        )
      )
    ).toEqual("<A=haha,B=haha>");
  });
});

describe("convertStringVariableToMongooseSchemaContent", () => {
  test("Should return result with no enum", () => {
    expect(
      helpers.normalize(
        converters.convertStringVariableToMongooseSchemaContent({
          type: "string",
          description: "",
          example: "",
          required: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: String, required: true }`));
  });
  test("Should return result with enum", () => {
    expect(
      helpers.normalize(
        converters.convertStringVariableToMongooseSchemaContent({
          type: "string",
          description: "",
          example: "",
          required: false,
          enum: ["lol", "mdr"],
        })
      )
    ).toEqual(helpers.normalize(`{ type: String, enum: ["lol", "mdr"] }`));
  });
  test("Should return result with readOnly", () => {
    expect(
      helpers.normalize(
        converters.convertStringVariableToMongooseSchemaContent({
          type: "string",
          description: "",
          example: "",
          required: false,
          readOnly: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: String, immutable: true }`));
  });
  test("Should return result with minlength", () => {
    expect(
      helpers.normalize(
        converters.convertStringVariableToMongooseSchemaContent({
          type: "string",
          description: "",
          example: "",
          required: true,
          enum: ["lol", "mdr"],
          minLength: 3,
        })
      )
    ).toEqual(
      helpers.normalize(
        `{ type: String, enum: ["lol", "mdr"], required: true, minlength: 3 }`
      )
    );
  });
  test("Should return result with maxLength", () => {
    expect(
      helpers.normalize(
        converters.convertStringVariableToMongooseSchemaContent({
          type: "string",
          description: "",
          example: "",
          required: true,
          enum: ["lol", "mdr"],
          minLength: 3,
          maxLength: 10,
        })
      )
    ).toEqual(
      helpers.normalize(
        `{ type: String, enum: ["lol", "mdr"], required: true, minlength: 3, maxlength: 10 }`
      )
    );
  });
  test("Should return result with pattern", () => {
    expect(
      helpers.normalize(
        converters.convertStringVariableToMongooseSchemaContent({
          type: "string",
          description: "",
          example: "",
          required: true,
          enum: ["lol", "mdr"],
          minLength: 3,
          maxLength: 10,
          pattern: "lol",
        })
      )
    ).toEqual(
      helpers.normalize(
        `{ type: String, enum: ["lol", "mdr"], required: true, minlength: 3, maxlength: 10, match: "lol" }`
      )
    );
  });
});

describe("convertNumberVariableToMongooseSchemaContent", () => {
  test("Should return result valid number", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number, required: true }`));
  });
  test("Should return result valid number not required", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: false,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number }`));
  });
  test("Should return result valid number with readOnly", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: false,
          readOnly: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number, immutable: true }`));
  });
  test("Should return result valid number with max", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: false,
          maximum: 15,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number, max: 15 }`));
  });
  test("Should return result valid number with min", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: false,
          maximum: 15,
          minimum: 3,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number, max: 15, min: 3 }`));
  });
  test("Should return result valid number with exclusiveMaximum", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: false,
          minimum: 3,
          exclusiveMaximum: 15,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number, min: 3, max: 14 }`));
  });
  test("Should return result valid number with exclusiveMinimum", () => {
    expect(
      helpers.normalize(
        converters.convertNumberVariableToMongooseSchemaContent({
          type: "number",
          description: "",
          example: 3,
          required: false,
          maximum: 3,
          exclusiveMinimum: 15,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Number, max: 3, min: 16 }`));
  });
});

describe("convertBooleanVariableToMongooseSchemaContent", () => {
  test("Should return result valid boolean", () => {
    expect(
      helpers.normalize(
        converters.convertBooleanVariableToMongooseSchemaContent({
          type: "boolean",
          description: "",
          example: true,
          required: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Boolean, required: true }`));
  });
  test("Should return result valid boolean not required", () => {
    expect(
      helpers.normalize(
        converters.convertBooleanVariableToMongooseSchemaContent({
          type: "boolean",
          description: "",
          example: true,
          required: false,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Boolean }`));
  });
  test("Should return result valid boolean with readOnly", () => {
    expect(
      helpers.normalize(
        converters.convertBooleanVariableToMongooseSchemaContent({
          type: "boolean",
          description: "",
          example: true,
          required: false,
          readOnly: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Boolean, immutable: true }`));
  });
});

describe("convertDateVariableToMongooseSchemaContent", () => {
  test("Should return result valid date", () => {
    expect(
      helpers.normalize(
        converters.convertDateVariableToMongooseSchemaContent({
          type: "date",
          description: "",
          required: true,
          example: "",
        })
      )
    ).toEqual(helpers.normalize(`{ type: Date, required: true }`));
  });
  test("Should return result valid date not required", () => {
    expect(
      helpers.normalize(
        converters.convertDateVariableToMongooseSchemaContent({
          type: "date",
          description: "",
          example: "",
          required: false,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Date }`));
  });
  test("Should return result valid date with readOnly", () => {
    expect(
      helpers.normalize(
        converters.convertDateVariableToMongooseSchemaContent({
          type: "date",
          description: "",
          example: "",
          required: false,
          readOnly: true,
        })
      )
    ).toEqual(helpers.normalize(`{ type: Date, immutable: true }`));
  });
});

describe("convertArrayVariableToMongooseSchemaContent", () => {
  test("Should return result valid array", () => {
    const spy = jest
      .spyOn(converters, "convertVariableToMongooseSchemaContent")
      //@ts-ignore
      .mockReturnValueOnce("salut");
    const arrayVariable: VariableArray = {
      type: "array",
      description: "",
      required: true,
      items: {
        type: "string",
        description: "s",
        example: "s",
        required: true,
      },
    };
    expect(
      helpers.normalize(
        converters.convertArrayVariableToMongooseSchemaContent(arrayVariable)
      )
    ).toEqual(helpers.normalize(`{ type: [salut], required: true }`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(arrayVariable.items);
  });
  test("Should return result valid array", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertVariableToMongooseSchemaContent")
      //@ts-ignore
      .mockReturnValueOnce("salut");
    const variable: VariableArray = {
      type: "array",
      description: "",
      required: false,
      items: {
        type: "string",
        description: "",
        example: "",
        required: true,
      },
    };
    expect(
      helpers.normalize(
        converters.convertArrayVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`{ type: [salut] }`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable.items);
  });
  test("Should return result valid array", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertVariableToMongooseSchemaContent")
      //@ts-ignore
      .mockReturnValueOnce("salut");
    const variable: VariableArray = {
      type: "array",
      description: "",
      required: false,
      readOnly: true,
      items: {
        type: "string",
        description: "",
        example: "",
        required: true,
      },
    };
    expect(
      helpers.normalize(
        converters.convertArrayVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`{ type: [salut], immutable: true }`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable.items);
  });
});

describe("convertObjectVariableToMongooseSchemaContent", () => {
  test("Should return result valid object", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertVariableToMongooseSchemaContent")
      //@ts-ignore
      .mockReturnValueOnce("salut")
      //@ts-ignore
      .mockReturnValueOnce("salut");
    const objectVariable: VariableObject = {
      type: "object",
      description: "",
      required: true,
      properties: {
        id: { type: "string", description: "s", example: "s", required: true },
        number: {
          type: "number",
          description: "s",
          example: 3,
          required: true,
        },
      },
    };
    expect(
      helpers.normalize(
        converters.convertObjectVariableToMongooseSchemaContent(objectVariable)
      )
    ).toEqual(
      helpers.normalize(`{ 
      id: salut,
      number: salut
     }`)
    );
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toBeCalledWith(objectVariable.properties.id);
    expect(spy).toBeCalledWith(objectVariable.properties.number);
  });
});

describe("convertVariableToMongooseSchemaContent", () => {
  test("String variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertStringVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "string",
      description: "",
      required: true,
      example: "l",
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Password variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertStringVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "password",
      description: "",
      required: true,
      example: "",
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Number variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertNumberVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "number",
      description: "",
      required: true,
      example: 3,
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Integer variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertNumberVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "integer",
      description: "",
      required: true,
      example: 3,
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Boolean variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertBooleanVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "boolean",
      description: "",
      required: true,
      example: true,
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Date variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertDateVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "date",
      description: "",
      required: true,
      example: "true",
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Array variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertArrayVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "array",
      description: "",
      required: true,
      items: {
        type: "string",
        description: "d",
        example: "d",
        required: true,
      },
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
  test("Object variable", () => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(converters, "convertObjectVariableToMongooseSchemaContent")
      .mockReturnValueOnce("salut");
    const variable: Variable = {
      type: "object",
      description: "",
      required: true,
      properties: {
        id: {
          type: "string",
          description: "d",
          example: "d",
          required: true,
        },
      },
    };
    expect(
      helpers.normalize(
        converters.convertVariableToMongooseSchemaContent(variable)
      )
    ).toEqual(helpers.normalize(`salut`));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toBeCalledWith(variable);
  });
});
