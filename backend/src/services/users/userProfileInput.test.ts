import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeProfileTicketCursor,
  encodeProfileTicketCursor,
  parseProfileUserId,
  UserProfileError,
} from './userProfileInput.js'

test('profile IDs accept positive database integers only', () => {
  assert.equal(parseProfileUserId('00123'), 123)
  assert.equal(parseProfileUserId(2147483647), 2147483647)
  for (const id of [undefined, null, '', '12abc', '1e3', '1.5', ' 12 ', ['12'], 0, -1, 1.5, NaN, Infinity, 2147483648]) {
    assert.throws(() => parseProfileUserId(id), UserProfileError)
  }
})

test('profile cursors round-trip and are bound to user and relationship', () => {
  const cursor = { userId: 123, relationship: 'assigned' as const, createdAt: '2026-11-08T12:00:00.000Z', id: 456 }
  const encoded = encodeProfileTicketCursor(cursor)
  assert.deepEqual(decodeProfileTicketCursor(encoded, 123, 'assigned'), cursor)
  assert.equal(decodeProfileTicketCursor(undefined, 123, 'assigned'), null)
  assert.throws(() => decodeProfileTicketCursor(encoded, 124, 'assigned'), UserProfileError)
  assert.throws(() => decodeProfileTicketCursor(encoded, 123, 'requested'), UserProfileError)
})

test('malformed cursor encodings and fields are rejected', () => {
  for (const raw of ['', null, ['abc'], '*', 'e30', 'bnVsbA', 'bm90LWpzb24', 'a'.repeat(1025)]) {
    assert.throws(() => decodeProfileTicketCursor(raw, 123, 'assigned'), UserProfileError)
  }

  const cursor = { userId: 123, relationship: 'assigned' as const, createdAt: '2026-11-08T12:00:00.000Z', id: 456 }
  for (const fields of [{ id: 0 }, { id: 1.5 }, { id: 2147483648 }, { createdAt: 'invalid' }, { createdAt: '2026-11-08' }]) {
    assert.throws(
      () => decodeProfileTicketCursor(encodeProfileTicketCursor({ ...cursor, ...fields }), 123, 'assigned'),
      UserProfileError,
    )
  }
})