export type CreatedListener<T> = (created: T | T[]) => any;
export type UpdatedListener<T> = (updated: T | T[], old?: T | T[]) => any;
export type DeletedListener<T> = (deleted: T | T[]) => any;

export interface DAOEvents<T> {
    created: CreatedListener<T>;
    deleted: DeletedListener<T>;
    updated: UpdatedListener<T>;
}
