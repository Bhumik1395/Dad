from fastapi import HTTPException
from app.core.supabase_auth import CurrentUser


def resolve_company(user: CurrentUser, company_param: str | None) -> str:
    """Customers are always scoped to their own company, regardless of
    what's in the query string. Corob employees must explicitly pass
    ?company= since they can act on any company."""
    if user.is_customer:
        return user.company
    if not company_param:
        raise HTTPException(400, {"error": "company_required", "message": "Pass ?company= to target a company."})
    return company_param