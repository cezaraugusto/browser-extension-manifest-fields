import {describe, it, expect} from 'vitest'
import * as path from 'path'
import {jsonFields} from '../../manifest-fields/json-fields'
import {declarativeNetRequest} from '../../manifest-fields/json-fields/declarative_net_request'
import {storage} from '../../manifest-fields/json-fields/storage'

describe('json field resolvers', () => {
  const ctx = '/tmp/project'

  it('declarative_net_request maps ids to absolute paths', () => {
    const m: any = {
      declarative_net_request: {
        rule_resources: [
          {id: 'rules1', path: 'public/rules1.json'},
          {id: 'rules2', path: '/public/rules2.json'}
        ]
      }
    }
    const res = declarativeNetRequest(ctx, m)
    expect(res['declarative_net_request/rules1']).toBe(
      path.join(ctx, 'public/rules1.json')
    )
    expect(res['declarative_net_request/rules2']).toBe(
      path.join(ctx, 'public/rules2.json')
    )
  })

  it('storage resolves managed_schema', () => {
    const m: any = {storage: {managed_schema: 'public/schema.json'}}
    expect(storage(ctx, m)).toBe(path.join(ctx, 'public/schema.json'))
  })

  it('jsonFields aggregator merges maps', () => {
    const m: any = {
      declarative_net_request: {
        rule_resources: [{id: 'rules', path: 'rules.json'}]
      },
      storage: {managed_schema: 'schema.json'}
    }
    const res = jsonFields(ctx, m)
    expect(res['declarative_net_request/rules']).toBe(
      path.join(ctx, 'rules.json')
    )
    expect(res['storage/managed_schema']).toBe(path.join(ctx, 'schema.json'))
  })
})
