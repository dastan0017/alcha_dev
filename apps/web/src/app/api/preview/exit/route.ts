import { redirect } from 'next/navigation';
import { clearPreview } from '@/lib/preview';

/** Leaves draft preview (the pill shown when a preview URL is opened outside the CRM). */
export async function GET() {
  await clearPreview();
  redirect('/');
}
