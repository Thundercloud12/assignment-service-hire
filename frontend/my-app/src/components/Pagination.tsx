import { useFilterStore } from '../store/filter.store';

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const Pagination: React.FC<PaginationProps> = ({ total, page, limit, totalPages }) => {
  const { setFilters } = useFilterStore();

  const handlePrevPage = () => {
    if (page > 1) {
      setFilters({ page: page - 1 });
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setFilters({ page: page + 1 });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters({ page: newPage });
    }
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-400">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
      </div>

      <div className="flex gap-2">
        <button
          onClick={handlePrevPage}
          disabled={page === 1}
          className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-2 rounded ${
                  pageNum === page
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-700 text-white hover:bg-zinc-600'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="px-2 py-2 text-gray-400">...</span>
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-2 rounded ${
                  page === totalPages
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-700 text-white hover:bg-zinc-600'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
