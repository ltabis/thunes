import { Icon } from "../../../cli/bindings/Icon";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import HomeIcon from "@mui/icons-material/Home";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import SavingsIcon from "@mui/icons-material/Savings";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import { Avatar } from "@mui/material";
import { Category } from "../../../cli/bindings/Category";

export function categoryIconToMuiIcon(
  category: Category | undefined,
  defaultCategory: Category
) {
  return category ? (
    <Avatar
      sx={{
        background: category.color,
      }}
    >
      {getMuiIcon(category.icon)}
    </Avatar>
  ) : (
    <Avatar
      sx={{
        background: defaultCategory.color,
      }}
    >
      {getMuiIcon(defaultCategory.icon)}
    </Avatar>
  );
}

function getMuiIcon(icon: Icon) {
  switch (icon) {
    case "transport":
      return <AirplanemodeActiveIcon />;
    case "accommodation":
      return <HomeIcon />;
    case "subscription":
      return <LoyaltyIcon />;
    case "car":
      return <DirectionsCarIcon />;
    case "other":
      return <AccountBalanceWalletIcon />;
    case "giftanddonations":
      return <VolunteerActivismIcon />;
    case "savings":
      return <SavingsIcon />;
    case "educationandfamily":
      return <FamilyRestroomIcon />;
    case "loan":
      return <CreditScoreIcon />;
    case "professionalfee":
      return <BusinessCenterIcon />;
    case "taxes":
      return <ReceiptLongIcon />;
    case "sparetimeactivities":
      return <VideogameAssetIcon />;
    case "internalmovements":
      return <SwapHorizIcon />;
    case "cashwithdrawal":
      return <AccountBalanceIcon />;
    case "health":
      return <HealthAndSafetyIcon />;
    case "everydaylife":
      return <LocalGroceryStoreIcon />;
  }
}
