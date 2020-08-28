import {
  Entity,
  ObjectType,
  Variable,
  VariableArray,
  VariableBoolean,
  VariableDate,
  VariableInteger,
  VariableNumber,
  VariableObject,
  VariablePassword,
  VariableString,
} from "mentine";
import { convertOneOfAllOfAnyOfOrObjectTypeToInterface } from "../helpers";

export const countRefs = (object: ObjectType<Variable>) => {
  return Object.values(object).reduce((acc, variable) => {
    if (variable.type === "array") {
      return acc + (variable.items.type === "ref" ? 1 : 0);
    } else if (variable.type === "object") {
      return acc + countRefs(variable.properties);
    }
    return acc + (variable.type === "ref" ? 1 : 0);
  }, 0);
};

export const buildRefsArray = (object: ObjectType<Variable>) => {
  const refMap = {
    3: ["M", "D", "R"],
    4: ["P", "T", "D", "R"],
  };
  const refCount = countRefs(object);
  return (
    refMap[refCount] ||
    Array(refCount)
      .fill(0)
      .map((_, i) => String.fromCharCode(65 + i))
  );
};

export const buildGenericWithDefault = (
  object: ObjectType<Variable>,
  defaultGeneric: string
) => {
  const refArray = buildRefsArray(object);
  return refArray.length > 0
    ? "<" + refArray.map((generic) => `${generic} = ${defaultGeneric}`) + ">"
    : "";
};

export const convertEntityToInterface = (entity: Entity) => {
  if (
    entity.schema.type === "allOf" ||
    entity.schema.type === "oneOf" ||
    entity.schema.type === "anyOf"
  ) {
    console.warn("allOf, anyOf, oneOf is not yet implemented");
    return;
  }
  const refsMap = buildRefsArray(entity.schema);
  return convertOneOfAllOfAnyOfOrObjectTypeToInterface(entity.schema, refsMap);
};

export const convertStringVariableToMongooseSchemaContent = (
  variable: VariableString | VariablePassword
) => {
  return `{ type: String ${
    (variable as any).enum
      ? `, enum: ${JSON.stringify((variable as any).enum)}`
      : ""
  } ${variable.required ? `, required: true` : ""}${
    variable.readOnly ? `, immutable: true` : ""
  } ${variable.minLength ? `, minlength: ${variable.minLength}` : ""} ${
    variable.maxLength ? `, maxlength: ${variable.maxLength}` : ""
  }
  ${variable.pattern ? `, match: "${variable.pattern}"` : ""} }`;
};

export const convertNumberVariableToMongooseSchemaContent = (
  variable: VariableNumber | VariableInteger
) => {
  return `{ type: Number ${variable.required ? `, required: true` : ""}${
    variable.readOnly ? `, immutable: true` : ""
  }
  ${variable.maximum ? `, max: ${variable.maximum}` : ""}${
    variable.minimum ? `, min: ${variable.minimum}` : ""
  }${
    variable.exclusiveMaximum ? `, max: ${variable.exclusiveMaximum - 1}` : ""
  }${
    variable.exclusiveMinimum ? `, min: ${variable.exclusiveMinimum + 1}` : ""
  } }`;
};

export const convertBooleanVariableToMongooseSchemaContent = (
  variable: VariableBoolean
) => {
  return `{ type: Boolean ${variable.required ? `, required: true` : ""}${
    variable.readOnly ? `, immutable: true` : ""
  } }`;
};

export const convertDateVariableToMongooseSchemaContent = (
  variable: VariableDate
) => {
  return `{ type: Date ${variable.required ? `, required: true` : ""}${
    variable.readOnly ? `, immutable: true` : ""
  } }`;
};

export const convertArrayVariableToMongooseSchemaContent = (
  variable: VariableArray
) => {
  return `{ type: [${convertVariableToMongooseSchemaContent(variable.items)}]${
    variable.required ? `, required: true` : ""
  }${variable.readOnly ? `, immutable: true` : ""} }`;
};

export const convertObjectVariableToMongooseSchemaContent = (
  variable: VariableObject
) => {
  return `{ 
    ${Object.entries(variable.properties)
      .map(
        ([key, variable]) =>
          `${key}: ${convertVariableToMongooseSchemaContent(variable)}`
      )
      .join(",")}
      }`;
};

export const convertVariableToMongooseSchemaContent = (variable: Variable) => {
  if (variable.type === "string" || variable.type === "password") {
    return convertStringVariableToMongooseSchemaContent(variable);
  }
  if (variable.type === "number" || variable.type === "integer") {
    return convertNumberVariableToMongooseSchemaContent(variable);
  }
  if (variable.type === "date") {
    return convertDateVariableToMongooseSchemaContent(variable);
  }
  if (variable.type === "boolean") {
    return convertBooleanVariableToMongooseSchemaContent(variable);
  }
  if (variable.type === "array") {
    return convertArrayVariableToMongooseSchemaContent(variable);
  }
  if (variable.type === "object") {
    return convertObjectVariableToMongooseSchemaContent(variable);
  }
};

export const convertEntityToMongooseData = (entity: Entity) => {
  if (
    entity.schema.type === "allOf" ||
    entity.schema.type === "oneOf" ||
    entity.schema.type === "anyOf"
  ) {
    console.warn("allOf, anyOf, oneOf is not yet implemented");
    return;
  }
  return `{${Object.entries(entity.schema)
    .map(
      ([key, value]) =>
        `${key}: ${convertVariableToMongooseSchemaContent(value)}`
    )
    .join(",")}}`;
};
