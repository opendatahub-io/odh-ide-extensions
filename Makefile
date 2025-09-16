PYTHON ?= python3
BLACK_CMD := $(PYTHON) -m black --check --diff --color .

require-extension:
	@if [ -z "$(EXTENSION)" ]; then echo "EXTENSION is required (e.g., make EXTENSION=odh-jupyter-trash-cleanup lint-ui)"; exit 1; fi

lint-dependencies:
	@$(PYTHON) -m pip install -q -r lint_requirements.txt

lint-python: require-extension lint-dependencies
	(cd $(EXTENSION) && $(PYTHON) -m flake8 .)
	@echo $(BLACK_CMD)
	@(cd $(EXTENSION) && $(BLACK_CMD)) || (echo "Black formatting encountered issues. Use 'make black-format' to fix."; exit 1)

black-format: require-extension
	(cd $(EXTENSION) && $(PYTHON) -m black .)

prettier-check-ui: require-extension
	npx --yes prettier "$(EXTENSION)/**/*{.ts,.tsx,.js,.jsx,.css,.json,.md}" --check

prettier-ui: require-extension
	npx --yes prettier "$(EXTENSION)/**/*{.ts,.tsx,.js,.jsx,.css,.json,.md}" --write --list-different

eslint-check-ui: require-extension
	npx --yes eslint "$(EXTENSION)" --cache --ext .ts,.tsx,.js,.jsx

eslint-ui: require-extension
	npx --yes eslint "$(EXTENSION)" --cache --ext .ts,.tsx,.js,.jsx --fix

lint-ui: require-extension
	$(MAKE) EXTENSION=$(EXTENSION) prettier-ui
	$(MAKE) EXTENSION=$(EXTENSION) eslint-ui
	$(MAKE) EXTENSION=$(EXTENSION) stylelint-ui

stylelint-check-ui: require-extension
	npx --yes stylelint "$(EXTENSION)/**/*.{css,scss}"

stylelint-ui: require-extension
	npx --yes stylelint "$(EXTENSION)/**/*.{css,scss}" --fix

lint: require-extension
	$(MAKE) EXTENSION=$(EXTENSION) lint-ui
	$(MAKE) EXTENSION=$(EXTENSION) lint-python
	@echo "All linters completed"
