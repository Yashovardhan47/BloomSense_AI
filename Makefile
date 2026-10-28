.PHONY: install test build run clean

install:
	python3 -m venv backend/.venv
	backend/.venv/bin/pip install -r backend/requirements-dev.txt
	cd frontend && npm ci --ignore-scripts

test:
	backend/.venv/bin/python -m pytest -q backend/tests
	cd frontend && npm test

build:
	cd frontend && npm run build
	docker compose config --quiet

run:
	docker compose up --build

clean:
	rm -rf frontend/dist backend/.pytest_cache
