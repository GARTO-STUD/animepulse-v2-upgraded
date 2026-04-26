/**
 * /admin/review — Redirects to /admin (legacy route kept for compatibility)
 */
import { redirect } from 'next/navigation';
export default function ReviewRedirect() {
  redirect('/admin');
}
