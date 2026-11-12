import { Inject, Injectable, PipeTransform } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Class } from '@ptc-org/nestjs-query-core'

import { AuthorizationContext, Authorizer, AuthorizerScope, authorizerScopeToken, getAuthorizerToken } from '../auth'
import { AuthorizerContext } from '../interceptors'

type AuthorizerFilterKind = 'filter' | 'relation' | 'modifyRelation'

/**
 * What a filter decorator of a generated resolver asks for. `AuthorizerFilterPipe` answers it with the authorizer of
 * the configured `AuthorizerScope`.
 */
export class AuthorizerFilterRequest {
  constructor(
    readonly kind: AuthorizerFilterKind,
    readonly context: AuthorizerContext<unknown>,
    readonly authorizationContext: AuthorizationContext,
    readonly relationName?: string
  ) {}
}

@Injectable()
export class AuthorizerFilterPipe implements PipeTransform {
  private readonly scope: AuthorizerScope = 'context'

  private readonly authorizers = new Map<Class<unknown>, Authorizer<unknown>>()

  constructor(
    @Inject(ModuleRef)
    private moduleRef: ModuleRef
  ) {
    try {
      this.scope = this.moduleRef.get(authorizerScopeToken, { strict: false })
    } catch (error) {
      // `NestjsQueryGraphQLModule.forRoot` was not called or did not set a scope
    }
  }

  async transform(value: unknown) {
    if (!(value instanceof AuthorizerFilterRequest)) {
      return value
    }
    const { kind, context, authorizationContext, relationName = '' } = value
    const authorizer = this.getAuthorizer(value)
    if (!authorizer) {
      return undefined
    }
    switch (kind) {
      case 'filter':
        return authorizer.authorize(context, authorizationContext)
      case 'relation':
        return authorizer.authorizeRelation(relationName, context, authorizationContext)
      case 'modifyRelation':
        return {
          filter: await authorizer.authorize(context, authorizationContext),
          relationFilter: await authorizer.authorizeRelation(relationName, context, authorizationContext)
        }
    }
  }

  private getAuthorizer({ context, authorizationContext }: AuthorizerFilterRequest): Authorizer<unknown> | undefined {
    const { dto } = authorizationContext
    if (this.scope !== 'dto' || !dto) {
      return context.authorizer
    }
    let authorizer = this.authorizers.get(dto)
    if (!authorizer) {
      authorizer = this.moduleRef.get<Authorizer<unknown>>(getAuthorizerToken(dto), { strict: false })
      this.authorizers.set(dto, authorizer)
    }
    return authorizer
  }
}
