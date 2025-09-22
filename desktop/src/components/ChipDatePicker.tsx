import { Chip, Stack } from "@mui/material";
import { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

export default function ({
  label,
  date,
  onChange,
}: // TODO: chipProps
{
  label?: string;
  date?: dayjs.Dayjs;
  onChange?: (value: dayjs.Dayjs | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Stack>
      <Chip
        variant="outlined"
        clickable={true}
        label={date ? `${label}  ${date?.format("MM / DD / YYYY")}` : label}
        onClick={() => setOpen(!open)}
        onDelete={date ? () => onChange?.(undefined) : undefined}
      />

      <DatePicker
        open={open}
        value={date ? dayjs(date) : null}
        onChange={(date) => date && onChange?.(date)}
        onClose={() => setOpen(false)}
        sx={{
          visibility: "hidden",
          width: 0,
          height: 0,
        }}
      />
    </Stack>
  );
}
