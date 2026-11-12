export const authorizerScopeToken = 'NESTJS_QUERY_AUTHORIZER_SCOPE'

/**
 * Which authorizer the generated resolvers ask for their filters.
 *
 * - `context` (default): the authorizer that the `AuthorizerInterceptor` of the root field put on the GraphQL context.
 *   All fields of an operation share that context, so every relation below a root field, at any depth, is authorized
 *   by the root field's authorizer, and sibling root fields can overwrite each other's authorizer.
 * - `dto`: the authorizer of the DTO the resolver belongs to. A relation is authorized by the authorizer of the DTO
 *   that declares it, at any depth, and root fields never share an authorizer. Custom resolvers that use
 *   `@AuthorizerFilter` without a `dto` keep using the authorizer on the context.
 */
export type AuthorizerScope = 'context' | 'dto'
