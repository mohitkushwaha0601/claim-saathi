.PHONY: help backend frontend backend-install backend-dev backend-test frontend-install frontend-dev frontend-test frontend-build frontend-lint frontend-typecheck frontend-e2e check

.DEFAULT_GOAL := help

help:
	@echo "ClaimSaathi commands:"
	@echo ""
	@echo "  make backend           Start the backend dev server"
	@echo "  make frontend          Start the frontend dev server"
	@echo "  make backend-install   Sync backend Python dependencies"
	@echo "  make backend-test      Run backend tests"
	@echo "  make frontend-install  Install frontend dependencies"
	@echo "  make frontend-test     Run frontend unit tests"
	@echo "  make frontend-build    Build the frontend"
	@echo "  make frontend-lint     Lint the frontend"
	@echo "  make frontend-typecheck Type-check the frontend"
	@echo "  make frontend-e2e      Run frontend Playwright tests"
	@echo "  make check             Run backend and frontend validation"

backend: backend-dev

frontend: frontend-dev

backend-install:
	cd backend && uv sync

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload

backend-test:
	cd backend && uv run pytest

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-test:
	cd frontend && npm test

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

frontend-typecheck:
	cd frontend && npm run typecheck

frontend-e2e:
	cd frontend && npm run test:e2e

check: backend-test frontend-test frontend-typecheck frontend-lint frontend-build