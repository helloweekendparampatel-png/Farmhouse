'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { apiDelete, apiGet } from '../lib/backend-api';
import { errorMessageFromUnknown } from '../lib/api-errors';
import { isTruncatedInList, truncateForList } from '../lib/text';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from '../ components/ConfirmDialog';
import { mediaSrc } from '../lib/media-url';
import { HeaderLink, PageIntro, SectionCard } from '../ui/admin-ui';

type Farm = {
  id: string;
  name: string;
  slug?: string | null;
  thumbnailUrl?: string | null;
  location?: string;
  description?: string;
  price?: string;
  capacity?: string;
  rating?: number;
  isPopular?: boolean;
};

export default function FarmsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState<number | null>(null);
  const [rowDeletingId, setRowDeletingId] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const loadFarms = async () => {
    if (!token) return;
    try {
      const res = await apiGet<{
        data: Farm[];
        meta: { total: number; totalPages: number };
      }>(
        `/farms?page=${page}&limit=15&search=${encodeURIComponent(debouncedSearch)}`,
        token,
      );
      setFarms(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalMatching(res.meta.total);
    } catch (err: any) {
      setError(errorMessageFromUnknown(err, 'Failed to load farms'));
    }
  };

  const deleteFarm = async () => {
    if (!token || !confirmDeleteSlug) return;

    setRowDeletingId(confirmDeleteSlug);
    setError(null);

    try {
      await apiDelete(`/farms/${confirmDeleteSlug}`, token);
      await loadFarms();
    } catch (err: any) {
      setError(errorMessageFromUnknown(err, 'Failed to delete farm'));
    } finally {
      setRowDeletingId(null);
      setConfirmDeleteSlug(null);
    }
  };

  useEffect(() => {
    if (token) {
      void loadFarms();
    }
  }, [token, page, debouncedSearch]);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const descPreviewLen = 30;

  return (
    <div className="page">
      <PageIntro
        eyebrow="Catalog"
        title="Farms"
        description="Review every property, inspect listing quality, and manage edits from one streamlined table."
        actions={
          isAdmin ? (
            <HeaderLink href="/farms/new" variant="primary">
              Add farm
            </HeaderLink>
          ) : null
        }
      />

      {error && <div className="error-banner">{error}</div>}

      <SectionCard
        title="Existing farms"
        description={
          totalMatching != null
            ? debouncedSearch.trim()
              ? `${totalMatching} listing${totalMatching === 1 ? '' : 's'} match your search (${farms.length} on this page).`
              : `${totalMatching} listing${totalMatching === 1 ? '' : 's'} in the catalog (${farms.length} on this page).`
            : 'Loading listing totals…'
        }
      >
        <div className="table-toolbar">
          <input
            type="text"
            className="table-search"
            placeholder="Search by name, slug, location, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th aria-label="Thumbnail" />
                <th>Name</th>
                <th>Slug</th>
                <th>Location</th>
                <th>Description</th>
                <th>Price</th>
                <th>Capacity</th>
                <th>Rating</th>
                <th>Popular</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {farms.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-state">
                    No farms found.
                  </td>
                </tr>
              ) : (
                farms.map((farm) => (
                  <tr key={farm.id}>
                    <td className="cell-thumb">
                      {farm.thumbnailUrl ? (
                        <img
                          src={mediaSrc(farm.thumbnailUrl)}
                          alt=""
                          width={44}
                          height={44}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 8,
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span className="cell-subtle">—</span>
                      )}
                    </td>
                    <td className="cell-title">{farm.name}</td>
                    <td className="cell-slug">{farm.slug?.trim() || '—'}</td>
                    <td>{farm.location || '—'}</td>
                    <td
                      className="cell-subtle cell-subtle--truncate"
                      title={
                        isTruncatedInList(farm.description, descPreviewLen)
                          ? farm.description!.trim()
                          : undefined
                      }
                    >
                      {truncateForList(farm.description, descPreviewLen)}
                    </td>
                    <td>{farm.price || '—'}</td>
                    <td>{farm.capacity || '—'}</td>
                    <td>{farm.rating ?? '—'}</td>
                    <td>
                      <span
                        className={
                          farm.isPopular
                            ? 'status-chip status-chip--success'
                            : 'status-chip status-chip--neutral'
                        }
                      >
                        {farm.isPopular ? 'Popular' : 'Standard'}
                      </span>
                    </td>

                    <td className="table-actions-cell">
                      <div className="table-actions">
                        <Link
                          href={`/farms/${farm.slug ?? farm.id}`}
                          className="table-action-btn"
                          title="View"
                          aria-label="View"
                          prefetch
                        >
                          <Eye size={16} strokeWidth={2.25} />
                        </Link>
                        {isAdmin ? (
                          <>
                            <Link
                              href={`/farms/${farm.slug ?? farm.id}/edit`}
                              className="table-action-btn"
                              title="Edit"
                              aria-label="Edit"
                              prefetch
                            >
                              <Pencil size={16} strokeWidth={2.25} />
                            </Link>
                            <button
                              type="button"
                              className="table-action-btn table-action-btn--danger"
                              title="Delete"
                              aria-label="Delete"
                                onClick={() =>
                                  setConfirmDeleteSlug(farm.slug ?? farm.id)
                                }
                            >
                              <Trash2 size={16} strokeWidth={2.25} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="pagination__meta">
            Page {page} of {totalPages || 1}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={!!confirmDeleteSlug}
        title="Delete Farm"
        description="Are you sure you want to delete this farm? This will also delete related photos and decorations."
        confirmText="Delete"
        loading={rowDeletingId === confirmDeleteSlug}
        onConfirm={deleteFarm}
        onCancel={() => setConfirmDeleteSlug(null)}
      />
    </div>
  );
}
