useful commands

both frontend and backend use
npm dev run
as startup

migrations:
docker compose up -d

npx prisma migrate dev --name initial_migration
npx prisma generate
npx prisma studio --config ./prisma.config.ts