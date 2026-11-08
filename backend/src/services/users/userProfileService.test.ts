import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test, { after } from 'node:test'
import { prisma } from '../../lib/prisma.js'
import { getUserProfile, getUserProfileTickets } from './userProfileService.js'
import { UserProfileError } from './userProfileInput.js'

after(async () => { await prisma.$disconnect() })

test('database user profiles', { skip: process.env.RUN_USER_PROFILE_DB_TESTS !== '1' }, async (context) => {
  const rollback = new Error('Rollback profile fixtures')
  const prefix = `profilefixture${randomUUID().replaceAll('-', '')}`

  try {
    await prisma.$transaction(async (database) => {
      const spectator = await database.user.create({
        data: { name: prefix, email: `${prefix}@example.invalid`, role: 'CUSTOMER' },
      })

      for (const role of ['AGENT', 'ADMIN', 'CUSTOMER', 'VIEWER'] as const) {
        await context.test(`${role} profile fields and relationship-based pagination`, async () => {
          const user = await database.user.create({
            data: {
              name: `${prefix} ${role}`, email: `${prefix}-${role}@example.invalid`, role,
              phone: '+37255555555', avatarUrl: '/avatars/test.png',
              passwordHash: 'fixture-only-not-a-real-password-hash',
            },
          })
          const assigned = role === 'AGENT' || role === 'ADMIN'
          const tickets = await database.ticket.createManyAndReturn({
            data: Array.from({ length: 31 }, () => ({
              subject: prefix, status: 'CLOSED', createdAt: new Date('2026-11-08T12:00:00.000Z'),
              requesterId: assigned ? spectator.id : user.id,
              assigneeId: assigned ? user.id : null,
            })),
          })
          await database.ticket.create({
            data: {
              subject: 'Opposite relationship must not match',
              requesterId: assigned ? user.id : spectator.id,
              assigneeId: assigned ? null : user.id,
            },
          })

          const profile = await getUserProfile(String(user.id), database)
          assert.equal(profile.name, user.name)
          assert.equal(profile.role, role)
          assert.equal(profile.phone, '+37255555555')
          assert.equal(profile.avatarUrl, '/avatars/test.png')
          assert.ok(!('organisation' in profile))
          assert.ok(!('passwordHash' in profile))

          const first = await getUserProfileTickets(user.id, undefined, database)
          assert.equal(first.userId, user.id)
          assert.equal(first.relationship, assigned ? 'assigned' : 'requested')
          assert.equal(first.pageSize, 30)
          assert.equal(first.tickets.length, 30)
          assert.ok(first.nextCursor)
          const second = await getUserProfileTickets(user.id, first.nextCursor, database)
          assert.equal(second.tickets.length, 1)
          assert.equal(second.nextCursor, null)
          assert.ok(first.tickets.every((ticket) => ticket.status === 'CLOSED'))
          assert.ok(!('messages' in first.tickets[0]!))
          assert.deepEqual(
            [...first.tickets, ...second.tickets].map((ticket) => ticket.id),
            tickets.map((ticket) => ticket.id).sort((left, right) => right - left),
          )
          await assert.rejects(
            getUserProfileTickets(spectator.id, first.nextCursor, database),
            (error: unknown) => error instanceof UserProfileError && error.status === 400,
          )
          await database.user.update({ where: { id: user.id }, data: { role: assigned ? 'CUSTOMER' : 'AGENT' } })
          await assert.rejects(
            getUserProfileTickets(user.id, first.nextCursor, database),
            (error: unknown) => error instanceof UserProfileError && error.status === 400,
          )
        })
      }

      await context.test('empty and missing profiles', async () => {
        const emptyUser = await database.user.create({
          data: { name: prefix, email: `${prefix}-empty@example.invalid` },
        })
        const empty = await getUserProfileTickets(emptyUser.id, undefined, database)
        assert.equal(empty.tickets.length, 0)
        assert.equal(empty.nextCursor, null)
        await database.user.delete({ where: { id: emptyUser.id } })
        for (const request of [
          () => getUserProfile(emptyUser.id, database),
          () => getUserProfileTickets(emptyUser.id, undefined, database),
        ]) {
          await assert.rejects(request, (error: unknown) => error instanceof UserProfileError && error.status === 404)
        }
      })

      throw rollback
    }, { timeout: 30000 })
  } catch (error) {
    if (error !== rollback) throw error
  }
})