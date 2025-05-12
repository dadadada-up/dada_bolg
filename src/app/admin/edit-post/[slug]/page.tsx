import { notFound } from 'next/navigation';
import EditPostPage from '@/components/admin/EditPostPage';

export default function EditPost({ params }: { params: { slug: string } }) {
  const { slug } = params;
  return <EditPostPage slug={slug} />;
} 