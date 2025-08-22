import { Button, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export type Item = {
  name: string;
  value: string;
};

export default function ({
  selected,
  items,
  selectPlaceholder,
  createPlaceholder,
  onChange,
  onCreate,
}: {
  selected?: Item;
  items: Item[];
  selectPlaceholder: string;
  createPlaceholder: string;
  onChange: (item: Item) => void;
  onCreate: () => void;
}) {
  const [selectAnchorEl, setSelectAnchorEl] = useState<null | HTMLElement>(
    null
  );

  const openMenu = Boolean(selectAnchorEl);

  return (
    <>
      <Button
        id="basic-button"
        aria-controls={openMenu ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={openMenu ? "true" : undefined}
        onClick={(event: React.MouseEvent<HTMLElement>) =>
          setSelectAnchorEl(event.currentTarget)
        }
        variant="text"
        endIcon={<KeyboardArrowDownIcon />}
        color="inherit"
        sx={{ textTransform: "none" }}
      >
        <Typography variant="h4">
          {selected?.name ?? selectPlaceholder}
        </Typography>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={selectAnchorEl}
        open={openMenu}
        onClose={() => setSelectAnchorEl(null)}
      >
        {Array.from(items)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((item) => (
            <MenuItem
              key={item.name}
              selected={item.value === selected?.value}
              onClick={() => onChange(item)}
            >
              {item.name}
            </MenuItem>
          ))}
        {items.length !== 0 && <Divider />}
        <MenuItem onClick={() => onCreate()}>{createPlaceholder}</MenuItem>
      </Menu>
    </>
  );
}
