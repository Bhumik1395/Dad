from app.domains.service_calls import (
    quarterly as quarterly_router,
    employees as employees_router,
    utilization as utilization_router,
    filters as filters_router,
    reports as reports_router,
    session as session_router,
)

__all__ = [
    "quarterly_router", "employees_router", "utilization_router",
    "filters_router", "reports_router", "session_router",
]