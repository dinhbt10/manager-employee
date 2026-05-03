import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <span>Hiển thị</span>
        <select
          className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1); // Reset về trang 1
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>/ trang · Tổng {totalItems} bản ghi</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              // Show first, last, current, and adjacent pages
              return (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              );
            })
            .map((page, idx, arr) => {
              // Add ellipsis
              const prevPage = arr[idx - 1];
              const showEllipsis = prevPage && page - prevPage > 1;
              return (
                <div key={page} className="flex items-center gap-1">
                  {showEllipsis && (
                    <span className="px-2 text-zinc-400">...</span>
                  )}
                  <Button
                    size="sm"
                    variant={currentPage === page ? "default" : "ghost"}
                    onClick={() => onPageChange(page)}
                    className="min-w-[2rem]"
                  >
                    {page}
                  </Button>
                </div>
              );
            })}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
