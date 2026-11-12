/* eslint-disable import/no-extraneous-dependencies */
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { INestApplication } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm'
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm'
import request from 'supertest'
import { DataSource } from 'typeorm'

import { AuthorizerScope, NestjsQueryGraphQLModule, PagingStrategies } from '../../../../src'
import { ScopeContext, ScopeItemDto, ScopeListDto, ScopeSubTaskDto } from './scope.dtos'
import { ScopeItem } from './scope-item.entity'
import { ScopeList } from './scope-list.entity'
import { ScopeSubTask } from './scope-sub-task.entity'

export interface ScopeApp {
  app: INestApplication
  query: (query: string) => Promise<Record<string, unknown>>
}

export async function createScopeApp(authorizerScope?: AuthorizerScope): Promise<ScopeApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        entities: [ScopeList, ScopeItem, ScopeSubTask],
        synchronize: true
      }),
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        context: (): ScopeContext => ({ user: 'alice' })
      }),
      NestjsQueryGraphQLModule.forRoot(authorizerScope ? { authorizerScope } : {}),
      NestjsQueryGraphQLModule.forFeature({
        imports: [NestjsQueryTypeOrmModule.forFeature([ScopeList, ScopeItem, ScopeSubTask])],
        resolvers: [
          { EntityClass: ScopeList, DTOClass: ScopeListDto, pagingStrategy: PagingStrategies.NONE },
          { EntityClass: ScopeItem, DTOClass: ScopeItemDto, pagingStrategy: PagingStrategies.NONE },
          { EntityClass: ScopeSubTask, DTOClass: ScopeSubTaskDto, pagingStrategy: PagingStrategies.NONE }
        ]
      })
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()

  const dataSource = app.get<DataSource>(getDataSourceToken())
  const list = await dataSource.getRepository(ScopeList).save({ title: 'groceries' })
  const [milk] = await dataSource.getRepository(ScopeItem).save([
    { title: 'milk', owner: 'alice', listId: list.id },
    { title: 'bread', owner: 'bob', listId: list.id }
  ])
  await dataSource.getRepository(ScopeSubTask).save([
    { title: 'buy', owner: 'alice', done: false, itemId: milk.id },
    { title: 'pay', owner: 'bob', done: false, itemId: milk.id },
    { title: 'pack', owner: 'alice', done: true, itemId: milk.id }
  ])

  return {
    app,
    query: async (query: string) => {
      const res = await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/graphql')
        .send({ query })
      const body = res.body as { data: Record<string, unknown>; errors?: unknown }
      expect(body.errors).toBeUndefined()
      return body.data
    }
  }
}

export const NESTED_QUERY = '{ scopeLists { title items { title subTasks { title } openSubTasks { title } } } }'

/** Sort the titles of every list in a result, the order of relations is not part of what the specs check. */
export function titles(rows: { title: string }[]): string[] {
  return rows.map((row) => row.title).sort()
}
