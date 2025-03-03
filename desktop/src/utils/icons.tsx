import { Icon } from "../../../cli/bindings/Icon";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import HomeIcon from "@mui/icons-material/Home";

export function categoryIconToMuiIcon(icon: Icon) {
  switch (icon) {
    case "transport":
      return <AirplanemodeActiveIcon />;
    case "accommodation":
      return <HomeIcon />;
  }
}
