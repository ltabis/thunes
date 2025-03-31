import { useNavigate } from "react-router-dom";
import { BudgetIdentifiers } from "../../../cli/bindings/BudgetIdentifiers";

export function useBudgetNavigate() {
    const navigate = useNavigate();

    return (budget?: BudgetIdentifiers) => {
        if (budget) {
            navigate(`/budget/${budget.id.id.String}`);
        } else {
            navigate("/budget");
        }
    }
}