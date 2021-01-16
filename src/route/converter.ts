import { pascalCase } from "change-case";
import {
  allOf,
  anyOf,
  ObjectType,
  oneOf,
  Route,
  validateRoute,
  Variable,
  VariableArray,
  VariableBoolean,
  VariableDate,
  VariableInteger,
  VariableNumber,
  VariableRef,
  VariableString,
} from "mentine";
import {
  convertObjectTypeToInterfaceContent,
  convertOneOfAllOfAnyOfOrObjectTypeToInterface,
} from "../helpers";

export const getTypescriptInterfaces = (
  route: Route,
  name: string
): Array<{ interfaceName: string; interfaceContent: string }> => {
  validateRoute(route);
  const interfaces = [];
  if (route.pathVariables) {
    const interfaceContent = convertObjectTypeToInterfaceContent(
      route.pathVariables
    );
    interfaces.push({
      interfaceName: `${pascalCase(name)}Path`,
      interfaceContent,
    });
  }
  if (route.queryVariables) {
    const interfaceContent = convertObjectTypeToInterfaceContent(
      route.queryVariables
    );
    interfaces.push({
      interfaceName: `${pascalCase(name)}Query`,
      interfaceContent,
    });
  }
  if ((route.method === "post" || route.method === "put") && route.body) {
    const interfaceContent = convertOneOfAllOfAnyOfOrObjectTypeToInterface(
      route.body
    );
    interfaces.push({
      interfaceName: `${pascalCase(name)}Body`,
      interfaceContent,
    });
  }
  if (route.responses) {
    Object.entries(route.responses).forEach(([code, value]) => {
      if (!value.response) return;
      const interfaceContent = convertOneOfAllOfAnyOfOrObjectTypeToInterface(
        value.response
      );
      interfaces.push({
        interfaceName: `${pascalCase(name)}Response${code}`,
        interfaceContent,
      });
    });
  }
  return interfaces;
};

export const getSanitizers = (variable: ObjectType<Variable>): string => {
  const hasNestedObject = Object.values(variable).some(
    (variable) => variable.type === "object"
  );

  if (hasNestedObject) {
    const destructureObject = (variable: ObjectType<Variable>) => {
      return (
        "{" +
        Object.entries(variable)
          .map(([key, value]) => {
            return value.type === "object"
              ? `${key}: ${destructureObject(value.properties)}`
              : key;
          })
          .join(",") +
        "}"
      );
    };
    const destructuredObject = destructureObject(variable);
    return `
      (${destructuredObject}) => {
        return ${destructuredObject}
      }
    `;
  }
  return (
    "[" +
    Object.keys(variable)
      .map((key) => `"${key}"`)
      .join(",") +
    "]"
  );
};

export const buildDateValidator = (variable: VariableDate): string => {
  return buildStringValidator(variable as any) + `.isDate()`;
};

export const buildArrayValidator = ({
  required,
  items,
}: VariableArray): string[] => {
  const base = !required ? ".optional()" : "";
  return [
    `${base}.isArray()`,
    `${base}${buildValidators({ ...items, required: true })}`,
  ];
};

export const buildBooleanValidator = ({
  required,
}: VariableBoolean): string => {
  let chain = "";
  if (!required) {
    chain += ".optional()";
  }
  chain += ".isBoolean()";
  return chain;
};

export const buildStringValidator = ({
  required,
  enum: enumeration,
  pattern,
  minLength,
  maxLength,
}: VariableString): string => {
  let chain = "";
  if (!required) {
    chain += ".optional()";
  }
  chain += ".isString().trim().not().isEmpty()";
  if (enumeration) {
    chain += `.isIn(${JSON.stringify(enumeration)})`;
  }
  if (pattern) {
    chain += `.matches(${JSON.stringify(pattern)})`;
  }
  if (typeof minLength === "number" || typeof maxLength === "number") {
    chain += `.isLength({ ${
      typeof minLength === "number" ? `min: ${minLength},` : ""
    }  ${typeof maxLength === "number" ? `max: ${maxLength}` : ""}})`;
  }
  return chain;
};

export const buildNumberValidator = ({
  required,
  exclusiveMinimum,
  exclusiveMaximum,
  minimum,
  maximum,
  multipleOf,
}: VariableNumber | VariableInteger): string => {
  let chain = "";
  if (!required) {
    chain += ".optional()";
  }
  chain += ".isNumeric()";
  if (
    typeof exclusiveMinimum === "number" ||
    typeof exclusiveMaximum === "number" ||
    typeof minimum === "number" ||
    typeof maximum === "number" ||
    typeof multipleOf === "number"
  ) {
    const conditions = [];
    if (typeof exclusiveMinimum === "number") {
      conditions.push(`value > ${exclusiveMinimum}`);
    }
    if (typeof exclusiveMaximum === "number") {
      conditions.push(`value < ${exclusiveMaximum}`);
    }
    if (typeof minimum === "number") {
      conditions.push(`value >= ${minimum}`);
    }
    if (typeof maximum === "number") {
      conditions.push(`value <= ${maximum}`);
    }
    if (typeof multipleOf === "number") {
      conditions.push(`value % ${multipleOf} === 0`);
    }
    chain += `.custom((value: number) => ${conditions.join("&&")})`;
  }
  return chain;
};

export const buildVariableWithKey = (
  variable: Variable,
  key: string,
  line = 0
) => {
  if (variable.type === "array") {
    const [arrayValidator, itemsValidator] = buildValidators(variable);
    if (variable.items.type === "array" || variable.items.type === "object") {
      return [
        `('${key}', { code: ${line}, message: 'Validation for ${key} failed, should be a ${variable.type}' })${arrayValidator}`,
        ...buildVariableWithKey(variable.items, `${key}.*`, line + 1).flat(),
      ];
    }
    return [
      `('${key}', { code: ${line}, message: 'Validation for ${key} failed, should be a ${variable.type}' })${arrayValidator}`,
      `('${key}.*', { code: ${
        line + 1
      }, message: 'Validation for ${key}.* failed, should be a ${
        variable.items.type
      }' })${itemsValidator}`,
    ].flat();
  }
  if (variable.type === "object") {
    return Object.entries(variable.properties)
      .map(([subKey, variable], i) => {
        if (variable.type === "object") {
          return buildVariableWithKey(variable, `${key}.${subKey}`, line + i);
        }
        return `('${key}.${subKey}', { code: ${line}, message: 'Validation for ${key}.${subKey} failed, should be a ${
          variable.type
        }' })${buildValidators(variable)}`;
      })
      .flat();
  }
  return `('${key}', { code: ${line}, message: 'Validation for ${key} failed, should be a ${
    variable.type
  }' })${buildValidators(variable)}`;
};

export const getValidators = (
  body:
    | ObjectType<Variable>
    | oneOf<ObjectType<Variable> | VariableRef>
    | allOf<ObjectType<Variable> | VariableRef>
    | anyOf<ObjectType<Variable> | VariableRef>,
  currentLine = 0
): string[] => {
  if (body.type === "allOf") {
    return body.subSchemas
      .map((subSchema) => {
        if (subSchema.type === "ref") {
          console.warn("Ref not implemented for validators");
          return;
        }
        const validators = getValidators(
          subSchema as ObjectType<Variable>,
          currentLine
        );
        currentLine += validators.length;
        return validators;
      })
      .filter(Boolean)
      .flat();
  } else if (body.type === "anyOf") {
    return [
      `().custom((value, { req }) => {
      return new Promise(async (resolve, reject) => {
        [
          ${body.subSchemas
            .map((subSchema, i) => {
              if (subSchema.type === "ref") {
                return console.warn("Ref not implemented for validators");
              }
              const validators = getValidators(
                subSchema as ObjectType<Variable>,
                currentLine
              );
              currentLine += validators.length;
              return `await Promise.all([${validators.map(
                (validator) => `${validator}.run(req,{dryRun:true}),`
              )}])`;
            })
            .filter(Boolean)}
        ].some((result) => result.every((test) => test.isEmpty()))
          ? resolve()
          : reject();
      });
    }),`,
    ];
  } else if (body.type === "oneOf") {
    return [
      `().custom((value, { req }) => {
        return new Promise(async (resolve, reject) => {
          [
            ${body.subSchemas
              .map((subSchema) => {
                if (subSchema.type === "ref") {
                  return console.warn("Ref not implemented for validators");
                }
                const validators = getValidators(
                  subSchema as ObjectType<Variable>,
                  currentLine
                );
                currentLine += validators.length;
                return `await Promise.all([${validators.map(
                  (validator) => `${validator}.run(req,{dryRun:true}),`
                )}])`;
              })
              .filter(Boolean)}
          ].some((result) => result.every((test) => test.isEmpty()))
            ? resolve()
            : reject();
        });
      }),`,
    ];
  }
  return Object.entries(body)
    .map(([key, variable]) => {
      const variables = buildVariableWithKey(variable, key, currentLine);
      currentLine += typeof variables === "string" ? 1 : variables.length;
      return variables;
    })
    .flat()
    .map((validator) => `${validator}`);
};

export const buildValidators = (variable: Variable): string | string[] => {
  if (variable.type === "string" || variable.type === "password") {
    return buildStringValidator(variable as any);
  }
  if (variable.type === "date") {
    return buildDateValidator(variable);
  }
  if (variable.type === "number" || variable.type === "integer") {
    return buildNumberValidator(variable);
  }
  if (variable.type === "array") {
    return buildArrayValidator(variable);
  }
  if (variable.type === "boolean") {
    return buildBooleanValidator(variable);
  }
};
