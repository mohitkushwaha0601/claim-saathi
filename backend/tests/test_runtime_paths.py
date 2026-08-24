from pathlib import Path

from app.api.dependencies import _resolve_repository_root


def test_resolve_repository_root_finds_repo_root_for_app_root_layout(tmp_path: Path) -> None:
    repo_root = tmp_path / "repo"
    (repo_root / "policies" / "epfo").mkdir(parents=True)
    (repo_root / "journeys" / "epfo").mkdir(parents=True)
    (repo_root / "resolutions" / "epfo").mkdir(parents=True)
    fake_app_file = repo_root / "app" / "api" / "dependencies.py"
    fake_app_file.parent.mkdir(parents=True)

    assert _resolve_repository_root(fake_app_file.parents[2]) == repo_root


def test_resolve_repository_root_finds_repo_root_for_nested_backend_layout(tmp_path: Path) -> None:
    repo_root = tmp_path / "repo"
    (repo_root / "policies" / "epfo").mkdir(parents=True)
    (repo_root / "journeys" / "epfo").mkdir(parents=True)
    (repo_root / "resolutions" / "epfo").mkdir(parents=True)
    backend_root = repo_root / "backend"
    (backend_root / "app" / "api").mkdir(parents=True)

    assert _resolve_repository_root(backend_root) == repo_root
