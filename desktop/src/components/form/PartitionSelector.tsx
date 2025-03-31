import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getBudgetPartitions, RecordId } from "../../api";
import { useDispatchSnackbar } from "../../contexts/Snackbar";
import { Partition } from "../../../../cli/bindings/Partition";
import { Budget } from "../../../../cli/bindings/Budget";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export default function PartitionSelector({
  budget,
  partition,
  onChange,
}: {
  budget: Budget;
  partition: RecordId | undefined;
  onChange: (category: RecordId) => void;
}) {
  const dispatchSnackbar = useDispatchSnackbar()!;
  const [partitions, setPartitions] = useState<Map<string, Partition>>();

  useEffect(() => {
    getBudgetPartitions(budget.id)
      .then((partitions) =>
        setPartitions(
          new Map(
            partitions.map((partition) => [partition.id.id.String, partition])
          )
        )
      )
      .catch((error) =>
        dispatchSnackbar({ type: "open", severity: "error", message: error })
      );
  }, [budget.id, dispatchSnackbar]);

  if (!partitions) return;

  return (
    <FormControl fullWidth>
      <InputLabel>Partition</InputLabel>
      <Select
        value={partition?.id.String}
        label="Category"
        onChange={(event) => onChange(partitions.get(event.target.value)!.id)}
        renderValue={(selected) => {
          const partition = partitions.get(selected);
          return (
            partition && (
              <MenuItem>
                <ListItemText
                  primary={partition.name}
                  color={partition.color}
                />

                <ListItemIcon>
                  <FiberManualRecordIcon
                    fontSize="small"
                    sx={{ color: partition.color }}
                  />
                </ListItemIcon>
                <ListItemText>{partition.name}</ListItemText>
              </MenuItem>
            )
          );
        }}
      >
        {Array.from(partitions.values()).map((partition) => (
          <MenuItem key={partition.id.id.String} value={partition.id.id.String}>
            <ListItemText primary={partition.name} color={partition.color} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
