import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI!);

const result = await mongoose.connection.collection('assignments').updateMany(
  {},
  {
    $unset: {
      pdfUrl: '',
      pdfPublicId: '',
      publicId: '',
      pdfDownloadUrl: '',
      pdfGeneratedAt: '',
      pdfResourceType: '',
    },
  },
);

console.log('Cleared PDF fields from', result.modifiedCount, 'assignments');
await mongoose.disconnect();
