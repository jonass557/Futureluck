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

  // Supprimer toutes les données fictives (utilisateurs, marchés, participations, transactions, notifications, journaux)
  await Promise.all([
    User.deleteMany({}),
    Market.deleteMany({}),
    Participation.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const adminPass = await bcrypt.hash('Admin@2026', 12);

  const admin = await User.create({
    fullName: 'Administrateur FutureLuck',
    phone: '+22500000000',
    email: 'admin@futureluck.com',
    passwordHash: adminPass,
    role: 'admin',
    tier: 'Administration',
  });

  await AuditLog.create({
    actor: admin._id,
    actorName: admin.fullName,
    actorRole: admin.role,
    action: 'SYSTEM_INITIALIZED',
    targetType: 'System',
    details: 'Base de données nettoyée et initialisée avec le compte administrateur uniquement.',
  });

  console.log('Base FutureLuck nettoyée et initialisée !');
  console.log('Admin: admin@futureluck.com / Admin@2026');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
