import { ModuleRef } from '@nestjs/core'

import { AuthorizationContext, Authorizer, authorizerScopeToken, getAuthorizerToken, OperationGroup } from '../../src/auth'
import { AuthorizerFilterPipe, AuthorizerFilterRequest } from '../../src/pipes/authorizer-filter.pipe'

class ItemDto {}
class SubTaskDto {}

function authorizer(name: string): Authorizer<unknown> {
  return {
    authorize: jest.fn().mockResolvedValue({ by: name }),
    authorizeRelation: jest.fn().mockResolvedValue({ relationBy: name })
  }
}

function moduleRef(scope: string | undefined, authorizers: Record<string, Authorizer<unknown>>): ModuleRef {
  return {
    get: (token: string) => {
      if (token === authorizerScopeToken) {
        if (scope === undefined) throw new Error('no scope')
        return scope
      }
      return authorizers[token]
    }
  } as unknown as ModuleRef
}

const authorizationContext: AuthorizationContext = {
  operationName: 'findSubTasks',
  operationGroup: OperationGroup.READ,
  readonly: true,
  many: true,
  dto: ItemDto,
  relationDTO: SubTaskDto
}

describe('AuthorizerFilterPipe', () => {
  const rootAuthorizer = authorizer('root')
  const itemAuthorizer = authorizer('item')
  const context = { authorizer: rootAuthorizer }
  const authorizers = { [getAuthorizerToken(ItemDto)]: itemAuthorizer }

  it('passes on anything that is no request of a filter decorator', async () => {
    const pipe = new AuthorizerFilterPipe(moduleRef('dto', authorizers))

    await expect(pipe.transform({ id: { eq: 1 } })).resolves.toEqual({ id: { eq: 1 } })
  })

  it.each([[undefined], ['context']])('asks the authorizer on the context with the scope %s', async (scope) => {
    const pipe = new AuthorizerFilterPipe(moduleRef(scope, authorizers))

    const filter = await pipe.transform(new AuthorizerFilterRequest('relation', context, authorizationContext, 'subTasks'))

    expect(filter).toEqual({ relationBy: 'root' })
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(rootAuthorizer.authorizeRelation).toHaveBeenCalledWith('subTasks', context, authorizationContext)
  })

  it('asks the authorizer of the DTO with the scope dto', async () => {
    const pipe = new AuthorizerFilterPipe(moduleRef('dto', authorizers))

    await expect(pipe.transform(new AuthorizerFilterRequest('filter', context, authorizationContext))).resolves.toEqual({
      by: 'item'
    })
    await expect(
      pipe.transform(new AuthorizerFilterRequest('relation', context, authorizationContext, 'subTasks'))
    ).resolves.toEqual({ relationBy: 'item' })
    await expect(
      pipe.transform(new AuthorizerFilterRequest('modifyRelation', context, authorizationContext, 'subTasks'))
    ).resolves.toEqual({ filter: { by: 'item' }, relationFilter: { relationBy: 'item' } })
  })

  it('answers without a filter when the context has no authorizer, as the decorators did before', async () => {
    const pipe = new AuthorizerFilterPipe(moduleRef('context', authorizers))

    await expect(
      pipe.transform(new AuthorizerFilterRequest('filter', {} as never, authorizationContext))
    ).resolves.toBeUndefined()
  })
})
