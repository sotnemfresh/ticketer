import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test, { after } from 'node:test'
import { prisma } from '../../lib/prisma.js'
import { parseTicketSearchInput } from './searchInput.js'
import { searchTickets } from './ticketSearchService.js'

after(async () => { await prisma.$disconnect() })

test('database ticket search', { skip: process.env.RUN_SEARCH_DB_TESTS !== '1' }, async (context) => {
  const rollback = new Error('Rollback search fixtures')
  const prefix = `searchfixture${randomUUID().replaceAll('-', '')}`

  try {
    await prisma.$transaction(async (database) => {
      const user = await database.user.create({
        data: { name: prefix, email: `${prefix}@example.invalid` },
      })
      const sharedDate = new Date('2026-11-07T12:00:00.000Z')
      const paginated = await database.ticket.createManyAndReturn({
        data: Array.from({ length: 34 }, () => ({
          subject: `${prefix} page`, requesterId: user.id, status: 'CLOSED', createdAt: sharedDate,
        })),
      })
      const contentTicket = await database.ticket.create({
        data: {
          subject: `${prefix} NASA`, description: 'office', requesterId: user.id,
          messages: { create: [{ bodyText: 'printer' }, { bodyText: 'broken printer' }] },
        },
      })
      await database.ticket.create({ data: { subject: `${prefix} planasas`, requesterId: user.id } })
      const languageTicket = await database.ticket.create({
        data: {
          subject: `${prefix} \u041f\u0440\u0438\u043d\u0442\u0435\u0440`,
          description: '\u00f5pilane', requesterId: user.id,
        },
      })
      const search = (query: string, cursor?: string) => searchTickets(parseTicketSearchInput(query, cursor), database)

      await context.test('whole words ignore case and do not match inside other words', async () => {
        const result = await search(`${prefix} nasa`)
        assert.deepEqual(result.tickets.map((ticket) => ticket.id), [contentTicket.id])
      })

      await context.test('all words can span subject, description and multiple messages without duplicates', async () => {
        const result = await search(`${prefix} NASA office printer broken`)
        assert.deepEqual(result.tickets.map((ticket) => ticket.id), [contentTicket.id])
        assert.equal((await search(`${prefix} NASA missingword`)).tickets.length, 0)
      })

      await context.test('Russian and Estonian words are case insensitive', async () => {
        const result = await search(`${prefix} \u043f\u0440\u0438\u043d\u0442\u0435\u0440 \u00d5PILANE`)
        assert.deepEqual(result.tickets.map((ticket) => ticket.id), [languageTicket.id])
      })

      await context.test('closed tickets paginate by creation date and ID without gaps', async () => {
        const first = await search(`${prefix} page`)
        assert.equal(first.tickets.length, 30)
        assert.ok(first.nextCursor)
        const second = await search(`${prefix} page`, first.nextCursor)
        assert.equal(second.tickets.length, 4)
        assert.equal(second.nextCursor, null)
        assert.ok(first.tickets.every((ticket) => ticket.status === 'CLOSED'))
        assert.deepEqual(
          [...first.tickets, ...second.tickets].map((ticket) => ticket.id),
          paginated.map((ticket) => ticket.id).sort((left, right) => right - left),
        )
        assert.ok(!('messages' in first.tickets[0]!))
      })

      await context.test('new messages are searchable immediately', async () => {
        await database.ticketMessage.create({ data: { ticketId: contentTicket.id, bodyText: 'newmessageword' } })
        assert.deepEqual((await search(`${prefix} newmessageword`)).tickets.map((ticket) => ticket.id), [contentTicket.id])
      })

      await context.test('numeric IDs match and punctuation-only queries return no results', async () => {
        assert.ok((await search(String(contentTicket.id))).tickets.some((ticket) => ticket.id === contentTicket.id))
        assert.equal((await search('!!!')).tickets.length, 0)
        assert.equal((await search(`${prefix} '); DROP TABLE "Ticket"; --`)).tickets.length, 0)
      })

      await context.test('requester and assignee names match whole words without duplicate tickets', async () => {
        const person = await database.user.create({
          data: { name: `${prefix} Alexandra Example`, email: `${prefix}-person@example.invalid` },
        })
        const similarlyNamed = await database.user.create({
          data: { name: `${prefix} Alexandras Example`, email: `${prefix}-other@example.invalid` },
        })
        const requested = await database.ticket.create({
          data: {
            subject: 'requesternamefixture', requesterId: person.id, status: 'CLOSED', createdAt: sharedDate,
          },
        })
        const assigned = await database.ticket.create({
          data: {
            subject: 'assigneenamefixture printer', requesterId: user.id, assigneeId: person.id, createdAt: sharedDate,
          },
        })
        const both = await database.ticket.create({
          data: {
            subject: 'bothnamefixture', requesterId: person.id, assigneeId: person.id, createdAt: sharedDate,
          },
        })
        await database.ticket.create({
          data: { subject: 'unrelatednamefixture', requesterId: similarlyNamed.id },
        })

        const result = await search(`${prefix} ALEXANDRA example`)
        assert.deepEqual(result.tickets.map((ticket) => ticket.id), [both.id, assigned.id, requested.id])
        assert.equal(result.nextCursor, null)
        assert.equal((await search(`${prefix} alex`)).tickets.length, 0)
        assert.deepEqual(
          (await search(`${prefix} Alexandra printer`)).tickets.map((ticket) => ticket.id),
          [assigned.id],
        )

        await database.user.update({ where: { id: person.id }, data: { name: `${prefix} Renamed Example` } })
        assert.equal((await search(`${prefix} Alexandra`)).tickets.length, 0)
        assert.deepEqual(
          (await search(`${prefix} renamed`)).tickets.map((ticket) => ticket.id),
          [both.id, assigned.id, requested.id],
        )
      })

      throw rollback
    }, { timeout: 30000 })
  } catch (error) {
    if (error !== rollback) throw error
  }
})