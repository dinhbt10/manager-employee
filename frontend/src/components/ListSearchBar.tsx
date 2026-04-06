import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";

type Props = {
  /** Giá trị ô tìm nhanh */
  q: string;
  onQChange: (v: string) => void;
  /** Enter hoặc nút Tìm */
  onSearch: () => void;
  placeholder?: string;
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
  advancedTitle?: string;
  /** Nội dung popup nâng cao */
  advancedChildren: ReactNode;
  /** Nút trong popup: áp dụng bộ lọc nâng cao */
  onApplyAdvanced: () => void;
};

export function ListSearchBar({
  q,
  onQChange,
  onSearch,
  placeholder = "Tìm theo từ khóa…",
  advancedOpen,
  onAdvancedOpenChange,
  advancedTitle = "Tìm kiếm nâng cao",
  advancedChildren,
  onApplyAdvanced,
}: Props) {
  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-zinc-100 px-6 pb-4">
      <div className="min-w-[180px] flex-1 max-w-xl">
        <Label className="text-zinc-600">Tìm kiếm</Label>
        <Input
          className="mt-1"
          placeholder={placeholder}
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
          }}
        />
      </div>
      <Button type="button" variant="secondary" onClick={onSearch}>
        Tìm
      </Button>
      <Button type="button" variant="outline" onClick={() => onAdvancedOpenChange(true)}>
        Tìm kiếm nâng cao
      </Button>

      <Dialog open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{advancedTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">{advancedChildren}</div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onAdvancedOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => {
                onApplyAdvanced();
                onAdvancedOpenChange(false);
              }}
            >
              Áp dụng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
