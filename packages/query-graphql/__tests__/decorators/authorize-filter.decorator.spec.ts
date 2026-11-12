import { ExecutionContext } from '@nestjs/common'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { instance, mock, when } from 'ts-mockito'

import { OperationGroup } from '../../src/auth'
import { AuthorizerFilter, RelationAuthorizerFilter } from '../../src/decorators'
import { AuthorizerFilterPipe, AuthorizerFilterRequest } from '../../src/pipes/authorizer-filter.pipe'

describe('AuthorizerFilter', () => {
  it.each([undefined, false, true])('infers readonly for EXPORT and respects override %s', async (readonly) => {
    class Resolver {
      exportMany(
        @AuthorizerFilter({ operationGroup: OperationGroup.EXPORT, many: true, ...(readonly === undefined ? {} : { readonly }) })
        filter: unknown
      ): unknown {
        return filter
      }
    }

    const authorize = jest.fn().mockResolvedValue({ id: { eq: 'allowed' } })
    const context = { authorizer: { authorize } }
    const executionContext = mock<ExecutionContext>()
    when(executionContext.getArgs()).thenReturn([undefined, {}, context, undefined])
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Resolver, 'exportMany') as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => unknown }
    >

    await expect(Object.values(metadata)[0].factory(undefined, instance(executionContext))).resolves.toEqual({
      id: { eq: 'allowed' }
    })
    expect(authorize).toHaveBeenCalledWith(context, {
      operationName: 'exportMany',
      operationGroup: OperationGroup.EXPORT,
      many: true,
      readonly: readonly ?? true
    })
  })

  it('leaves the choice of the authorizer to the AuthorizerFilterPipe when it knows the DTO', () => {
    class ItemDto {}
    class SubTaskDto {}
    class Resolver {
      findSubTasks(
        @RelationAuthorizerFilter('subTasks', {
          operationGroup: OperationGroup.READ,
          many: true,
          dto: ItemDto,
          relationDTO: SubTaskDto
        })
        filter: unknown
      ): unknown {
        return filter
      }
    }

    const context = { authorizer: { authorize: jest.fn(), authorizeRelation: jest.fn() } }
    const executionContext = mock<ExecutionContext>()
    when(executionContext.getArgs()).thenReturn([undefined, {}, context, undefined])
    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, Resolver, 'findSubTasks') as Record<
      string,
      { factory: (data: unknown, ctx: ExecutionContext) => unknown; pipes: unknown[] }
    >
    const [param] = Object.values(metadata)

    expect(param.pipes).toEqual([AuthorizerFilterPipe])
    expect(param.factory(undefined, instance(executionContext))).toEqual(
      new AuthorizerFilterRequest(
        'relation',
        context,
        {
          operationName: 'findSubTasks',
          operationGroup: OperationGroup.READ,
          many: true,
          readonly: true,
          dto: ItemDto,
          relationDTO: SubTaskDto
        },
        'subTasks'
      )
    )
  })
})
