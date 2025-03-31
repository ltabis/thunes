import { useNavigate } from "react-router-dom";
import { AccountIdentifiers } from "../../../cli/bindings/AccountIdentifiers";

export function useAccountNavigate() {
    const navigate = useNavigate();

    return (account?: AccountIdentifiers) => {
        if (account) {
            navigate(`/account/${account.id.id.String}`);
        } else {
            navigate("/account");
        }
    }
}