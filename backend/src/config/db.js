import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/futureluck';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
}
