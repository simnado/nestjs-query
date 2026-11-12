import { createScopeApp, NESTED_QUERY, ScopeApp, titles } from './__fixtures__/scope-app'

describe('authorizerScope: context (default)', () => {
  let scope: ScopeApp

  beforeAll(async () => {
    scope = await createScopeApp()
  })

  afterAll(async () => {
    await scope.app.close()
  })

  it('keeps authorizing every relation with the authorizer of the root field', async () => {
    const data = (await scope.query(NESTED_QUERY)) as any
    const [list] = data.scopeLists
    const [item] = list.items

    // a relation of the root DTO: the root authorizer finds it and asks the item authorizer
    expect(titles(list.items)).toEqual(['milk'])
    // relations below it are no relations of the root DTO, so the root authorizer answers `{}` for them
    expect(titles(item.subTasks)).toEqual(['buy', 'pack', 'pay'])
    expect(titles(item.openSubTasks)).toEqual(['buy', 'pack', 'pay'])
  })
})
