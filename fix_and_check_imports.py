#!/usr/bin/env python3
"""Fix and verify imports after the folder reorganization.

Run from the repo root (or from inside backend/ or frontend/):

    python3 fix_and_check_imports.py           # fix what it can, then verify
    python3 fix_and_check_imports.py --check   # verify only, change nothing

Backend: rewrites old module paths (including the pre-MySQL names like
app.core.supabase_auth) to the new domain-grouped ones, then statically
checks that every `from app.x import y` resolves to a real file and a name
that file actually defines. No need to boot the app to find broken imports.

Frontend: for every relative import that no longer resolves, looks for the
file on disk (same name, or the known renames api -> api/serviceCalls,
pmApi -> api/pm) and rewrites the import to the correct relative path.
Also flags case mismatches, which pass on Windows/macOS but FAIL on
Vercel/Linux.

Exit code is 1 if anything is still broken, so you can use it in CI.
"""
from __future__ import annotations

import ast
import os
import re
import sys
from pathlib import Path

CHECK_ONLY = "--check" in sys.argv

# ----------------------------------------------------------------------------
# Backend
# ----------------------------------------------------------------------------
BACKEND_MAP = {
    # auth / security (old Supabase name and the intermediate mysql_auth name)
    "app.core.supabase_auth": "app.core.auth",
    "app.core.mysql_auth": "app.core.auth",
    "app.core.security_middleware": "app.core.security",
    # core -> domains
    "app.core.session_auth": "app.domains.service_calls.session_auth",
    "app.core.schema_contract": "app.domains.service_calls.schema_contract",
    "app.core.pm_schema_contract": "app.domains.pm.schema_contract",
    # caches (old Redis names and the intermediate db_* names)
    "app.services.cache_service": "app.domains.service_calls.session_cache",
    "app.services.db_session_cache": "app.domains.service_calls.session_cache",
    "app.services.pm_cache_service": "app.domains.pm.cache",
    "app.services.db_pm_cache": "app.domains.pm.cache",
    "app.services.rate_limit_service": "app.shared.rate_limit_service",
    "app.services.db_rate_limit": "app.shared.rate_limit_service",
    # service_calls domain
    "app.services.focus_analytics": "app.domains.service_calls.analytics",
    "app.services.quarterly_analytics": "app.domains.service_calls.quarterly_analytics",
    "app.services.employee_analytics": "app.domains.service_calls.employee_analytics",
    "app.services.utilization_analytics": "app.domains.service_calls.utilization_analytics",
    "app.services.filters_service": "app.domains.service_calls.filters_service",
    "app.services.excel_service": "app.domains.service_calls.excel_service",
    "app.services.data_validation": "app.domains.service_calls.validation",
    "app.services.pdf_service": "app.domains.service_calls.pdf_service",
    "app.services.chart_render": "app.domains.service_calls.chart_render",
    # pm domain
    "app.services.pm_analytics": "app.domains.pm.analytics",
    "app.services.pm_excel_service": "app.domains.pm.excel_service",
    "app.services.pm_validation": "app.domains.pm.validation",
    "app.services.pm_common": "app.domains.pm.common",
    # shared
    "app.services.employee_mapping_service": "app.shared.employee_mapping_service",
}

# One pass with a single regex (longest keys first) so a rewritten path can
# never be matched and rewritten a second time. The lookahead stops
# "app.core.supabase_auth" from matching inside "app.core.supabase_auth_config".
_BACKEND_RE = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(BACKEND_MAP, key=len, reverse=True)) + r")(?![\w])"
)


def fix_backend(backend: Path) -> list[str]:
    changed = []
    for f in (backend / "app").rglob("*.py"):
        text = f.read_text(encoding="utf-8")
        new = _BACKEND_RE.sub(lambda m: BACKEND_MAP[m.group(1)], text)
        if new != text:
            f.write_text(new, encoding="utf-8")
            changed.append(str(f.relative_to(backend)))
    return changed


def _module_path(backend: Path, mod: str) -> Path | None:
    base = backend.joinpath(*mod.split("."))
    if base.with_suffix(".py").is_file():
        return base.with_suffix(".py")
    if (base / "__init__.py").is_file():
        return base / "__init__.py"
    if base.is_dir():  # implicit namespace package — Python allows it
        return base
    return None


def _top_level_names(py_file: Path) -> set[str]:
    tree = ast.parse(py_file.read_text(encoding="utf-8"))
    names: set[str] = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            names.add(node.name)
        elif isinstance(node, ast.Assign):
            for t in node.targets:
                for n in ast.walk(t):
                    if isinstance(n, ast.Name):
                        names.add(n.id)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            names.add(node.target.id)
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            for a in node.names:
                names.add((a.asname or a.name).split(".")[0])
    return names


def check_backend(backend: Path) -> list[str]:
    problems: list[str] = []
    app_dir = backend / "app"

    for f in sorted(app_dir.rglob("*.py")):
        rel = f.relative_to(backend)
        try:
            tree = ast.parse(f.read_text(encoding="utf-8"))
        except SyntaxError as e:
            problems.append(f"{rel}:{e.lineno}: syntax error: {e.msg}")
            continue

        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.level == 0 and node.module:
                top = node.module.split(".")[0]
                if top in ("redis", "supabase"):
                    problems.append(f"{rel}:{node.lineno}: still imports '{top}' (removed from the stack)")
                    continue
                if top != "app":
                    continue
                target = _module_path(backend, node.module)
                if target is None:
                    problems.append(f"{rel}:{node.lineno}: module '{node.module}' does not exist")
                    continue
                for alias in node.names:
                    if alias.name == "*":
                        continue
                    if target.is_dir() or target.name == "__init__.py":
                        pkg = target if target.is_dir() else target.parent
                        if (pkg / f"{alias.name}.py").is_file() or (pkg / alias.name).is_dir():
                            continue
                        if target.name == "__init__.py" and alias.name in _top_level_names(target):
                            continue
                        problems.append(
                            f"{rel}:{node.lineno}: '{alias.name}' not found in package '{node.module}'"
                        )
                    else:
                        try:
                            defined = _top_level_names(target)
                        except SyntaxError:
                            continue
                        if alias.name not in defined:
                            problems.append(
                                f"{rel}:{node.lineno}: '{alias.name}' is not defined in '{node.module}'"
                            )
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    top = alias.name.split(".")[0]
                    if top in ("redis", "supabase"):
                        problems.append(f"{rel}:{node.lineno}: still imports '{top}' (removed from the stack)")
                    elif top == "app" and _module_path(backend, alias.name) is None:
                        problems.append(f"{rel}:{node.lineno}: module '{alias.name}' does not exist")

    # Template-path trap: the original pdf_service loads "app/templates"
    # relative to the process's working directory.
    templates_old = app_dir / "templates" / "report_template.html"
    for f in app_dir.rglob("*.py"):
        if 'FileSystemLoader("app/templates")' in f.read_text(encoding="utf-8") and not templates_old.is_file():
            problems.append(
                f"{f.relative_to(backend)}: loads templates from 'app/templates' but report_template.html "
                f"moved — use FileSystemLoader(Path(__file__).resolve().parent / 'templates')"
            )
    return problems


# ----------------------------------------------------------------------------
# Frontend
# ----------------------------------------------------------------------------
CODE_EXTS = (".ts", ".tsx", ".js", ".jsx")
TRY_EXTS = CODE_EXTS + (".css", ".json")
# import specifier (relative only):  from "../x"   import "./x.css"   import("./x")
_SPEC_RE = re.compile(r"""(\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.{1,2}(?:/[^"']*)?)\2""")
# stems that were renamed, not just moved (old stem -> new stem inside src/api/)
RENAMED = {"api": "serviceCalls", "pmapi": "pm"}


def _exact_exists(src: Path, p: Path) -> bool:
    """True only if every path component matches on disk *case-sensitively*
    (Vercel runs Linux; Windows/macOS would say yes to wrong casing)."""
    try:
        rel = p.resolve().relative_to(src.resolve())
    except ValueError:
        return p.exists()
    cur = src
    for part in rel.parts:
        if part not in os.listdir(cur):
            return False
        cur = cur / part
    return True


def _resolve_import(src: Path, importer: Path, spec: str) -> tuple[Path | None, bool]:
    """Returns (path, case_ok). path is None if nothing matches at all."""
    base = (importer.parent / spec)
    candidates = [base]
    candidates += [base.with_name(base.name + e) for e in TRY_EXTS]
    candidates += [base / f"index{e}" for e in CODE_EXTS]
    loose = None
    for c in candidates:
        if c.is_file():
            if _exact_exists(src, c):
                return c, True
            loose = loose or c
    return (loose, False) if loose else (None, False)


def _index_files(src: Path) -> list[Path]:
    return [p for p in src.rglob("*") if p.is_file() and "node_modules" not in p.parts]


def _new_spec(importer: Path, target: Path) -> str:
    if target.suffix in CODE_EXTS:
        target = target.with_suffix("")
    rel = Path(os.path.relpath(target, importer.parent)).as_posix()
    return rel if rel.startswith(".") else "./" + rel


def process_frontend(frontend: Path) -> tuple[list[str], list[str]]:
    src = frontend / "src"
    files = _index_files(src)
    fixed: list[str] = []
    problems: list[str] = []

    for f in sorted(p for p in files if p.suffix in CODE_EXTS):
        text = f.read_text(encoding="utf-8")
        out, last = [], 0
        for m in _SPEC_RE.finditer(text):
            spec = m.group(3)
            target, case_ok = _resolve_import(src, f, spec)
            replacement = None

            if target is None or not case_ok:
                stem = Path(spec).stem.lower()
                cands = {p for p in files if p != f and p.stem.lower() == stem and p.suffix in CODE_EXTS + (".css", ".svg", ".png")}
                if not cands and stem in RENAMED:
                    alias = RENAMED[stem]
                    cands = {p for p in files if p.parent.name == "api" and p.stem.lower() == alias.lower()}
                if len(cands) == 1:
                    replacement = _new_spec(f, next(iter(cands)))

            if replacement and replacement != spec and not CHECK_ONLY:
                out.append(text[last:m.start(3)])
                out.append(replacement)
                last = m.end(3)
                fixed.append(f"{f.relative_to(frontend)}: '{spec}' -> '{replacement}'")
            elif target is None:
                problems.append(f"{f.relative_to(frontend)}: cannot resolve import '{spec}'")
            elif not case_ok:
                problems.append(
                    f"{f.relative_to(frontend)}: '{spec}' has the wrong letter casing "
                    f"(works on Windows/macOS, FAILS on Vercel/Linux)"
                )
        if out:
            out.append(text[last:])
            f.write_text("".join(out), encoding="utf-8")
    return fixed, problems


# ----------------------------------------------------------------------------
def locate() -> tuple[Path | None, Path | None]:
    cwd = Path.cwd().resolve()
    backend = frontend = None
    for p in [cwd, *cwd.parents]:
        if backend is None:
            if (p / "backend" / "app").is_dir():
                backend = p / "backend"
            elif (p / "app" / "main.py").is_file():
                backend = p
        if frontend is None:
            if (p / "frontend" / "src").is_dir():
                frontend = p / "frontend"
            elif (p / "src" / "main.tsx").is_file():
                frontend = p
    return backend, frontend


def main() -> int:
    backend, frontend = locate()
    if not backend and not frontend:
        print("Couldn't find backend/app or frontend/src from here — run this from the repo root.")
        return 2

    failed = False

    if backend:
        print(f"== Backend ({backend}) ==")
        if not CHECK_ONLY:
            changed = fix_backend(backend)
            print(f"Rewrote imports in {len(changed)} file(s)")
            for c in changed:
                print(f"  fixed  {c}")
        problems = check_backend(backend)
        if problems:
            failed = True
            print(f"\n{len(problems)} backend problem(s) still need a manual fix:")
            for p in problems:
                print(f"  BROKEN {p}")
        else:
            print("Backend: every app.* import resolves.")

    if frontend:
        print(f"\n== Frontend ({frontend}) ==")
        fixed, problems = process_frontend(frontend)
        print(f"Rewrote {len(fixed)} import(s)")
        for c in fixed:
            print(f"  fixed  {c}")
        if problems:
            failed = True
            print(f"\n{len(problems)} frontend problem(s) still need a manual fix:")
            for p in problems:
                print(f"  BROKEN {p}")
        else:
            print("Frontend: every relative import resolves.")

    print("\n" + ("Some problems remain — see BROKEN lines above." if failed else "All clear."))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
