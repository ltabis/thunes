import { Chip, Stack } from "@mui/material";
import { useState } from "react";
import CategorySelector from "./form/CategorySelector";
import { CategoryWithId } from "../../../cli/bindings/CategoryWithId";
import { EMPTY_RECORD_ID, RecordId } from "../api";
import { useCategoryStore } from "../stores/category";
import { getMuiIcon } from "../utils/icons";

export default function ({
  category,
  onChange,
}: // TODO: chipProps
{
  category?: RecordId;
  onChange?: (value: CategoryWithId | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const categories = useCategoryStore((state) => state.categories);
  const value = category ? categories.get(category.id.String)! : undefined;

  return (
    // FIXME: Should respect the text length
    <Stack sx={{ maxWidth: 100 }}>
      <Chip
        variant="outlined"
        clickable={true}
        label={value?.name ?? "category"}
        onClick={() => setOpen(!open)}
        onDelete={category ? () => onChange?.(undefined) : undefined}
        icon={value ? getMuiIcon(value.icon) : undefined}
      />

      <CategorySelector
        category={value?.id ?? EMPTY_RECORD_ID}
        onChange={(category) => category && onChange?.(category)}
        props={{
          open,
          onClose: () => setOpen(false),
          sx: {
            visibility: "hidden",
            width: 500,
            height: 0,
          },
        }}
      />
    </Stack>
  );
}
