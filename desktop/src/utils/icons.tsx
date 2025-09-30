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
import { TransactionCategory } from "../../../cli/bindings/TransactionCategory";

export function categoryIconToMuiIcon(
  category: TransactionCategory | undefined
) {
  return category ? (
    <Avatar
      sx={{
        background: category.color,
        color: "white",
      }}
    >
      {getMuiIcon(category.icon)}
    </Avatar>
  ) : (
    <Avatar>{getMuiIcon("other")}</Avatar>
  );
}

export function getMuiIcon(icon: Icon) {
  switch (icon) {
    case "transport":
      return <AirplanemodeActiveIcon fontSize="small" />;
    case "accommodation":
      return <HomeIcon fontSize="small" />;
    case "subscription":
      return <LoyaltyIcon fontSize="small" />;
    case "car":
      return <DirectionsCarIcon fontSize="small" />;
    case "other":
      return <AccountBalanceWalletIcon fontSize="small" />;
    case "giftanddonations":
      return <VolunteerActivismIcon fontSize="small" />;
    case "savings":
      return <SavingsIcon fontSize="small" />;
    case "educationandfamily":
      return <FamilyRestroomIcon fontSize="small" />;
    case "loan":
      return <CreditScoreIcon fontSize="small" />;
    case "professionalfee":
      return <BusinessCenterIcon fontSize="small" />;
    case "taxes":
      return <ReceiptLongIcon fontSize="small" />;
    case "sparetimeactivities":
      return <VideogameAssetIcon fontSize="small" />;
    case "internalmovements":
      return <SwapHorizIcon fontSize="small" />;
    case "cashwithdrawal":
      return <AccountBalanceIcon fontSize="small" />;
    case "health":
      return <HealthAndSafetyIcon fontSize="small" />;
    case "everydaylife":
      return <LocalGroceryStoreIcon fontSize="small" />;
  }
}
