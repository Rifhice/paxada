import {
  FilterQuery,
  QueryFindOneAndRemoveOptions,
  QueryFindOneAndUpdateOptions,
  QueryFindOptions,
  UpdateQuery,
} from "mongoose";

type CreatedListener<T> = (created: T | T[]) => any;
type UpdatedListener<T> = (updated: T | T[], old?: T | T[]) => any;
type DeletedListener<T> = (deleted: T | T[]) => any;

interface DAOEvents<T> {
  created: CreatedListener<T>;
  deleted: UpdatedListener<T>;
  updated: DeletedListener<T>;
}

interface IDAO<T> {
  count: (conditions: FilterQuery<T>) => Promise<number>;

  create: (
    data: Array<T & { _id?: any }> | (T & { _id?: any })
  ) => Promise<T | T[]>;

  findOne: (
    param:
      | string
      | {
          conditions: FilterQuery<T>;
          options: QueryFindOptions;
        }
  ) => Promise<T>;

  findMany: (param: {
    conditions: FilterQuery<T>;
    options: QueryFindOptions;
  }) => Promise<T[]>;

  findAndCountMany: (param: {
    conditions: FilterQuery<T>;
    options: QueryFindOptions;
  }) => Promise<{ elements: T[]; count: number }>;

  deleteOne: (
    param:
      | string
      | {
          conditions: FilterQuery<T>;
          options: QueryFindOneAndRemoveOptions;
        }
  ) => Promise<T>;

  deleteMany: (param: {
    conditions: FilterQuery<T>;
    options: QueryFindOptions;
  }) => Promise<T[]>;

  updateOne: (param: {
    conditions: FilterQuery<T>;
    update: UpdateQuery<T>;
    options: QueryFindOneAndUpdateOptions;
  }) => Promise<T>;

  updateMany: (param: {
    conditions: FilterQuery<T>;
    update: UpdateQuery<T>;
    options: QueryFindOneAndUpdateOptions;
  }) => Promise<T[]>;
}
