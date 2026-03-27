import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { phone: '01700000000' },
    update: {},
    create: {
      phone: '01700000000',
      name: 'Super Admin',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
  })
  console.log('Super Admin created:', superAdmin.phone, '/ password: admin123')

  // Create a sample pump
  const pump = await prisma.pump.upsert({
    where: { id: 'sample-pump-1' },
    update: {},
    create: {
      id: 'sample-pump-1',
      name: 'Dhaka Central Pump',
      location: 'Motijheel',
      area: 'Dhaka',
      latitude: 23.7104,
      longitude: 90.4074,
    },
  })
  console.log('Sample pump created:', pump.name)

  // Create a pump admin
  const pumpAdminPassword = await bcrypt.hash('pump123', 10)
  const pumpAdmin = await prisma.user.upsert({
    where: { phone: '01800000000' },
    update: {},
    create: {
      phone: '01800000000',
      name: 'Pump Operator',
      password: pumpAdminPassword,
      role: 'PUMP_ADMIN',
    },
  })

  await prisma.pumpAdmin.upsert({
    where: { userId_pumpId: { userId: pumpAdmin.id, pumpId: pump.id } },
    update: {},
    create: { userId: pumpAdmin.id, pumpId: pump.id },
  })
  console.log('Pump Admin created:', pumpAdmin.phone, '/ password: pump123')

  // Create a sample user
  const userPassword = await bcrypt.hash('user123', 10)
  const sampleUser = await prisma.user.upsert({
    where: { phone: '01900000000' },
    update: {},
    create: {
      phone: '01900000000',
      name: 'Rahim Uddin',
      password: userPassword,
      role: 'USER',
      nid: '1234567890',
    },
  })
  console.log('Sample User created:', sampleUser.phone, '/ password: user123')

  console.log('\nSeed complete! Test accounts:')
  console.log('Super Admin: 01700000000 / admin123')
  console.log('Pump Admin:  01800000000 / pump123')
  console.log('User:        01900000000 / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
