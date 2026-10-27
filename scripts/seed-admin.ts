import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { UserSchema } from '../src/users/schemas/user.schema';

async function seedAdmin() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/note_taking_db';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@notetaking.local').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword123!';

  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  const UserModel = mongoose.model('User', UserSchema);
  const existing = await UserModel.findOne({ email: adminEmail });

  if (existing) {
    console.log(`Admin account "${adminEmail}" already exists. ID: ${existing._id}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const created = await UserModel.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      interests: ['system', 'administration', 'security'],
    });
    console.log(`Successfully seeded Admin account "${adminEmail}". ID: ${created._id}`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin:', err);
  process.exit(1);
});
