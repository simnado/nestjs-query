import { ObjectType } from '@nestjs/graphql'

import { Authorize, FilterableField, UnPagedRelation } from '../../../../src'

/*
 * A list everybody may read, its items and their sub-tasks, which only their owner may read. `openSubTasks` points to
 * the same sub-tasks with an `auth` option of its own.
 */

export type ScopeContext = { user: string }

const ownedByCaller = (context: ScopeContext) => ({ owner: { eq: context.user } })

@ObjectType('ScopeSubTask')
@Authorize<ScopeSubTaskDto>({ authorize: ownedByCaller })
export class ScopeSubTaskDto {
  @FilterableField()
  id: number

  @FilterableField()
  title: string

  @FilterableField()
  owner: string

  @FilterableField()
  done: boolean
}

@ObjectType('ScopeItem')
@Authorize<ScopeItemDto>({ authorize: ownedByCaller })
@UnPagedRelation('subTasks', () => ScopeSubTaskDto)
@UnPagedRelation('openSubTasks', () => ScopeSubTaskDto, {
  relationName: 'subTasks',
  auth: { authorize: () => ({ done: { is: false } }) }
})
export class ScopeItemDto {
  @FilterableField()
  id: number

  @FilterableField()
  title: string

  @FilterableField()
  owner: string
}

@ObjectType('ScopeList')
@Authorize<ScopeListDto>({ authorize: () => ({}) })
@UnPagedRelation('items', () => ScopeItemDto)
export class ScopeListDto {
  @FilterableField()
  id: number

  @FilterableField()
  title: string
}
