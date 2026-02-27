import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import blogsRaw from '@/data/blogs.json';
import type { Blog } from '@/types';
import Badge from '@/components/ui/Badge';

const blogs = blogsRaw as Blog[];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function generateStaticParams() {
  return blogs.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const blog = blogs.find((b) => b.slug === params.slug);
  if (!blog) return {};
  return {
    title: blog.title,
    description: blog.excerpt,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://littleleaps.com'}/blogs/${blog.slug}` },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: 'article',
      publishedTime: blog.publishedAt,
      authors: [blog.author.name],
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const blog = blogs.find((b) => b.slug === params.slug);
  if (!blog) notFound();

  const imgSrc = blog.image.startsWith('/images') ? blog.image : '/images/blog-placeholder.svg';

  return (
    <div className="section-padding page-padding">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blush-500
                     transition-colors mb-8 focus-ring rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Blog
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge
              label={blog.category}
              color={
                blog.category === 'Development' ? 'lavender' :
                blog.category === 'Activities'  ? 'mint'     :
                blog.category === 'Language'    ? 'sky'      :
                blog.category === 'Health'      ? 'blush'    : 'peach'
              }
            />
            {blog.featured && <Badge label="Featured" color="peach" />}
            <span className="text-xs text-gray-400">{blog.readingTime} min read</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 leading-tight mb-4">
            {blog.title}
          </h1>

          <p className="text-lg text-gray-500 leading-relaxed mb-6">{blog.excerpt}</p>

          {/* Author + date */}
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
            <div className="w-11 h-11 rounded-full bg-blush-100 flex items-center justify-center
                            text-blush-500 font-bold text-sm shrink-0">
              {blog.author.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{blog.author.name}</p>
              <p className="text-xs text-gray-400">
                {blog.author.role} &middot;{' '}
                <time dateTime={blog.publishedAt}>{formatDate(blog.publishedAt)}</time>
              </p>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-10">
          <Image
            src={imgSrc}
            alt={blog.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
          {blog.content === 'placeholder' ? (
            <p className="text-gray-500 italic">Full article coming soon. Check back shortly!</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          )}
        </div>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span key={tag}
                      className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blush-50 to-lavender-50 rounded-3xl p-8 text-center">
          <p className="font-semibold text-gray-800 mb-2">Curious about your baby&apos;s development?</p>
          <p className="text-sm text-gray-500 mb-5">Take our free milestone quiz and get a personalised report.</p>
          <Link
            href="/quiz"
            className="inline-block bg-gradient-to-r from-blush-500 to-lavender-500 text-white
                       font-bold px-6 py-3 rounded-full text-sm hover:from-blush-600
                       hover:to-lavender-600 transition-all focus-ring"
          >
            Take the Free Quiz
          </Link>
        </div>

      </div>
    </div>
  );
}
