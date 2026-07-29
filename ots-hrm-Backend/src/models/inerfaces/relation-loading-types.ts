export type FindOptionsRelationsProperty<Property> = Property extends Promise<infer I>
  ? FindOptionsRelationsProperty<NonNullable<I>> | boolean
  : Property extends Array<infer I>
  ? FindOptionsRelationsProperty<NonNullable<I>> | boolean
  : Property extends string
  ? never
  : Property extends number
  ? never
  : Property extends boolean
  ? never
  : Property extends Function
  ? never
  : Property extends Buffer
  ? never
  : Property extends Date
  ? never
  : Property extends object
  ? RelationLoad<Property> | boolean
  : boolean;
/**
 * Relations find options.
 */
export type RelationLoad<Entity> = {
  [P in keyof Entity]?: P extends "toString"
    ? unknown
    : FindOptionsRelationsProperty<NonNullable<Entity[P]>>;
};