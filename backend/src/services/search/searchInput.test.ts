import assert from 'node:assert/strict'
import test from 'node:test'
import { encodeSearchCursor, parseTicketSearchInput, SearchInputError } from './searchInput.js'

test('trims queries and recognizes valid numeric ticket IDs', () => {
  assert.deepEqual(parseTicketSearchInput('  NASA  '), { query: 'NASA', ticketId: null, cursor: null })
  assert.equal(parseTicketSearchInput('00123').ticketId, 123)
  assert.equal(parseTicketSearchInput('0').ticketId, null)
  assert.equal(parseTicketSearchInput('2147483648').ticketId, null)
})

test('rejects missing, empty, oversized and structured queries', () => {
  for (const query of [undefined, '', '  ', 'word'.repeat(51), ['NASA'], { q: 'NASA' }]) {
    assert.throws(() => parseTicketSearchInput(query), SearchInputError)
  }
})

test('round-trips a query-bound cursor', () => {
  const cursor = { query: 'NASA', createdAt: '2026-11-07T12:00:00.000Z', id: 123 }
  assert.deepEqual(parseTicketSearchInput(' NASA ', encodeSearchCursor(cursor)).cursor, cursor)
  assert.throws(() => parseTicketSearchInput('printer', encodeSearchCursor(cursor)), SearchInputError)
})

test('rejects malformed cursor encodings and invalid fields', () => {
  for (const cursor of ['', ['abc'], '*', 'e30', 'bnVsbA', 'bm90LWpzb24', 'a'.repeat(2049)]) {
    assert.throws(() => parseTicketSearchInput('NASA', cursor), SearchInputError)
  }

  const valid = { query: 'NASA', createdAt: '2026-11-07T12:00:00.000Z', id: 123 }
  for (const fields of [
    { id: 0 }, { id: 1.5 }, { id: 2147483648 },
    { createdAt: 'invalid' }, { createdAt: '2026-11-07' },
  ]) {
    assert.throws(
      () => parseTicketSearchInput('NASA', encodeSearchCursor({ ...valid, ...fields })),
      SearchInputError,
    )
  }
})