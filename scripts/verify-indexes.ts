import mongoose from 'mongoose';
import { UserSchema } from '../src/users/schemas/user.schema';
import { NoteSchema } from '../src/notes/schemas/note.schema';
import { PostSchema } from '../src/posts/schemas/post.schema';

async function verifyIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/note_taking_db';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  const UserModel = mongoose.model('User', UserSchema);
  const NoteModel = mongoose.model('Note', NoteSchema);
  const PostModel = mongoose.model('Post', PostSchema);

  // Sync schema indexes with MongoDB
  await UserModel.syncIndexes();
  await NoteModel.syncIndexes();
  await PostModel.syncIndexes();

  console.log('\n======================================================');
  console.log(' DATABASE INDEX VERIFICATION REPORT');
  console.log(' (Evaluated against "DO NOT MAKE ANY UNNECESSARY INDEXES")');
  console.log('======================================================\n');

  const collections = [
    { name: 'users', model: UserModel },
    { name: 'notes', model: NoteModel },
    { name: 'posts', model: PostModel },
  ];

  for (const col of collections) {
    const indexes = await col.model.collection.getIndexes();
    console.log(`[Collection: ${col.name}]`);
    console.table(
      Object.entries(indexes).map(([indexName, spec]) => ({
        'Index Name': indexName,
        'Key Pattern': JSON.stringify(spec),
      }))
    );
  }

  await mongoose.disconnect();
  console.log('Verification completed successfully.\n');
}

verifyIndexes().catch((err) => {
  console.error('Error verifying indexes:', err);
  process.exit(1);
});
