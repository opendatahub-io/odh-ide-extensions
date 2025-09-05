PYTHON ?= python3
BLACK_CMD := $(PYTHON) -m black --check --diff --color .

lint-dependencies:
	@$(PYTHON) -m pip install -q -r lint_requirements.txt

lint-server: lint-dependencies
	$(PYTHON) -m flake8 .
	@echo $(BLACK_CMD)
	@$(BLACK_CMD) || (echo "Black formatting encountered issues. Use 'make black-format' to fix."; exit 1)

black-format:
	$(PYTHON) -m black .

eslint-check-ui:
	npm run eslint:check

prettier-ui:
	npm run prettier:check

eslint-ui:
	npm run eslint:check

lint-ui: prettier-ui eslint-ui
