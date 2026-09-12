from fastapi import APIRouter, HTTPException, Depends

from app.core.supabase_auth import CurrentUser, require_roles
from app.services.pm_cache_service import get_pm_data
from app.services.pm_analytics import compute_pm_dashboard, compute_pm_filter_options

router = APIRouter()


def _resolve_company(user: CurrentUser, company_param: str | None) -> str:
    if user.is_customer:
        return user.company
    if not company_param:
        raise HTTPException(400, {"error": "company_required", "message": "Pass ?company= to view a company's PM dashboard."})
    return company_param


@router.get("/api/pm/dashboard")
def pm_dashboard(
    company: str | None = None,
    state: str | None = None,
    month: str | None = None,
    dealer_code: str | None = None,
    page: int = 1,
    page_size: int = 50,
    user: CurrentUser = Depends(require_roles("customer", "corob_employee")),
):
    resolved_company = _resolve_company(user, company)
    df = get_pm_data(resolved_company)
    if df is None:
        raise HTTPException(404, {
            "error": "no_data",
            "message": f"No PM data uploaded yet for {resolved_company}.",
        })
    return compute_pm_dashboard(
        df, state=state, month=month, dealer_code=dealer_code, page=page, page_size=page_size
    )


@router.get("/api/pm/filters")
def pm_filters(
    company: str | None = None,
    user: CurrentUser = Depends(require_roles("customer", "corob_employee")),
):
    resolved_company = _resolve_company(user, company)
    df = get_pm_data(resolved_company)
    if df is None:
        return {"states": []}
    return compute_pm_filter_options(df)
