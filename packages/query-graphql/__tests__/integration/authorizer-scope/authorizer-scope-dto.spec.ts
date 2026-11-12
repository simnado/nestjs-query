import { createScopeApp, NESTED_QUERY, ScopeApp, titles } from './__fixtures__/scope-app'

describe('authorizerScope: dto', () => {
  let scope: ScopeApp

  beforeAll(async () => {
    scope = await createScopeApp('dto')
  })

  afterAll(async () => {
    await scope.app.close()
  })

  it('authorizes every relation with the authorizer of the DTO that declares it, at any depth', async () => {
    const data = (await scope.query(NESTED_QUERY)) as any
    const [list] = data.scopeLists
    const [item] = list.items

    expect(titles(list.items)).toEqual(['milk'])
    // the sub-task authorizer, through the authorizer of the item
    expect(titles(item.subTasks)).toEqual(['buy', 'pack'])
    // the `auth` option of the relation, which replaces the sub-task authorizer
    expect(titles(item.openSubTasks)).toEqual(['buy', 'pay'])
  })

  it.each([['{ scopeLists { title } scopeItems { title } }'], ['{ scopeItems { title } scopeLists { title } }']])(
    'authorizes sibling root fields each with the authorizer of its own DTO: %s',
    async (query) => {
      const data = (await scope.query(query)) as any

      expect(titles(data.scopeLists)).toEqual(['groceries'])
      expect(titles(data.scopeItems)).toEqual(['milk'])
    }
  )
})
