import { Class, Filter } from '@ptc-org/nestjs-query-core'

export enum OperationGroup {
  READ = 'read',
  EXPORT = 'export',
  AGGREGATE = 'aggregate',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface AuthorizationContext {
  /** The name of the method that uses the @AuthorizeFilter decorator */
  readonly operationName: string

  /** The group this operation belongs to */
  readonly operationGroup: OperationGroup

  /** If the operation does not modify any entities */
  readonly readonly: boolean

  /** If the operation can affect multiple entities */
  readonly many: boolean

  /**
   * The DTO of the resolver that uses the filter. For a relation it is the DTO that declares the relation.
   * Set by the generated resolvers, optional for custom ones.
   */
  readonly dto?: Class<unknown>

  /** For a relation: the DTO the relation points to. Set by the generated relation resolvers. */
  readonly relationDTO?: Class<unknown>
}

export interface CustomAuthorizer<DTO> {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  authorize(context: any, authorizerContext: AuthorizationContext): Promise<Filter<DTO>>

  authorizeRelation?(
    relationName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
    authorizerContext: AuthorizationContext
  ): Promise<Filter<unknown> | undefined>
}

export interface Authorizer<DTO> extends CustomAuthorizer<DTO> {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
  authorize(context: any, authorizerContext: AuthorizationContext): Promise<Filter<DTO>>

  authorizeRelation(
    relationName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any,
    authorizerContext: AuthorizationContext
  ): Promise<Filter<unknown> | undefined>
}
