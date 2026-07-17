.PHONY: data build

data:
	mkdir -p data/raw
	for y in $$(seq 2009 2023); do \
		curl -s -A "Mozilla/5.0" -o data/raw/h1b_$$y.csv \
		"https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-$$y.csv"; \
	done

build:
	python3 etl/build.py