import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Market from './models/Market.js';
import Participation from './models/Participation.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import AuditLog from './models/AuditLog.js';

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Market.deleteMany({}),
    Participation.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const adminPass = await bcrypt.hash('Admin@2026', 12);
  const userPass = await bcrypt.hash('User@2026', 12);

  const admin = await User.create({
    fullName: 'Administrateur FutureLuck',
    phone: '+237600000000',
    email: 'admin@futureluck.com',
    passwordHash: adminPass,
    role: 'admin',
    tier: 'Administration',
  });

  const kasmando = await User.create({
    fullName: 'Kasmando',
    phone: '+237695008164',
    email: 'kasmando@futureluck.com',
    passwordHash: userPass,
    role: 'user',
    tier: 'Membre Argent',
    walletBalance: 25000,
    winningsBalance: 50000,
    totalDeposited: 75000,
    totalStaked: 10000,
    totalWon: 50000,
  });

  const winnersUsers = await User.insertMany([
    { fullName: 'Jean Momo', phone: '+237678957540', passwordHash: userPass, winningsBalance: 25000, totalWon: 25000 },
    { fullName: 'Amaka Tchué', phone: '+237676235054', passwordHash: userPass, winningsBalance: 25000, totalWon: 25000 },
    { fullName: 'Paul Ndong', phone: '+237650420945', passwordHash: userPass, winningsBalance: 25000, totalWon: 25000 },
    { fullName: 'Fatima Bello', phone: '+237695008164_w', passwordHash: userPass, winningsBalance: 25000, totalWon: 25000 },
    { fullName: 'David King', phone: '+237678123456', passwordHash: userPass, winningsBalance: 25000, totalWon: 25000 },
  ]);

  const tomorrow = new Date('2026-11-24T09:00:00Z');
  const tomorrowEnd = new Date('2026-11-24T21:00:00Z');

  const openMarket1 = await Market.create({
    title: 'Coffret cadeau intelligent',
    description: 'Investissez et tentez votre chance. Transformez votre participation en argent !',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80',
    marketDate: tomorrow,
    startTime: tomorrow,
    endTime: tomorrowEnd,
    winnersCount: 2,
    productPrice: 5000,
    prizeAmount: 25000,
    rewardRate: 50,
    minStake: 1000,
    maxStake: 100000,
    status: 'open',
    totalPool: 30000,
    participantsCount: 3,
    createdBy: admin._id,
  });

  const openMarket2 = await Market.create({
    title: 'Pack Tech Premium Gold',
    description: 'Participez à ce marché exclusif et multipliez votre mise grâce au taux de récompense garanti.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    marketDate: new Date('2026-11-28T10:00:00Z'),
    startTime: new Date('2026-11-28T10:00:00Z'),
    endTime: new Date('2026-11-28T22:00:00Z'),
    winnersCount: 3,
    productPrice: 10000,
    prizeAmount: 50000,
    rewardRate: 75,
    minStake: 2000,
    maxStake: 250000,
    status: 'open',
    totalPool: 15000,
    participantsCount: 2,
    createdBy: admin._id,
  });

  const settledMarket = await Market.create({
    title: 'Édition Spéciale Jackpot',
    description: 'Marché clôturé avec 5 heureux gagnants récompensés à 25 000 FCFA.',
    imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80',
    marketDate: new Date('2026-11-20T09:00:00Z'),
    startTime: new Date('2026-11-20T09:00:00Z'),
    endTime: new Date('2026-11-20T21:00:00Z'),
    winnersCount: 5,
    productPrice: 5000,
    prizeAmount: 25000,
    rewardRate: 50,
    minStake: 1000,
    maxStake: 100000,
    status: 'settled',
    resultsPublished: true,
    totalPool: 85000,
    participantsCount: 5,
    createdBy: admin._id,
  });

  for (let i = 0; i < winnersUsers.length; i++) {
    await Participation.create({
      market: settledMarket._id,
      user: winnersUsers[i]._id,
      stakeAmount: 16667,
      rewardRate: 50,
      potentialGain: 25000,
      status: 'won',
      actualGain: 25000,
      rank: i + 1,
    });
  }

  await Participation.create({
    market: openMarket1._id,
    user: kasmando._id,
    stakeAmount: 5000,
    rewardRate: 50,
    potentialGain: 7500,
    status: 'pending',
  });

  await Transaction.insertMany([
    {
      user: kasmando._id,
      type: 'deposit',
      amount: 30000,
      provider: 'MTN_MOMO',
      phone: kasmando.phone,
      reference: 'DEP-SEED-001',
      status: 'approved',
      note: 'Recharge LuckyGamble via MTN MoMo',
    },
    {
      user: kasmando._id,
      type: 'participation',
      amount: 5000,
      provider: 'WALLET',
      reference: 'PART-SEED-002',
      status: 'completed',
      market: openMarket1._id,
      note: 'Participation au marché "Coffret cadeau intelligent"',
    },
    {
      user: kasmando._id,
      type: 'winning',
      amount: 50000,
      provider: 'WALLET',
      reference: 'WIN-SEED-003',
      status: 'completed',
      market: settledMarket._id,
      note: 'Gain remporté sur "Édition Spéciale Jackpot"',
    },
  ]);

  await Notification.insertMany([
    {
      user: kasmando._id,
      title: 'Félicitations ! 50 000 FCFA disponibles',
      message: 'Vos gains sont prêts à être retirés vers MTN MoMo ou Orange Money.',
      type: 'win',
      link: '/wallet/withdraw',
    },
    {
      user: kasmando._id,
      title: 'Nouveau marché ouvert !',
      message: 'Le marché "Coffret cadeau intelligent" (Taux 50%) est ouvert jusqu’à 21h00.',
      type: 'market',
      link: `/markets/${openMarket1._id}`,
    },
  ]);

  await AuditLog.create({
    actor: admin._id,
    actorName: admin.fullName,
    actorRole: admin.role,
    action: 'SYSTEM_SEEDED',
    targetType: 'System',
    details: 'Base de données FutureLuck initialisée avec succès.',
  });

  console.log('Seed FutureLuck terminé !');
  console.log('Admin: admin@futureluck.com / Admin@2026');
  console.log('User : +237695008164 / User@2026');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
