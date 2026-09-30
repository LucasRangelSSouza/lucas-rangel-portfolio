# Building a traceable MLOps pipeline for public education-finance indicators

**Versioned reference:** [v0.2.0](https://github.com/LucasRangelSSouza/education-finance-mlops/tree/v0.2.0)

Municipality-year indicators are easy to turn into a score and hard to read responsibly. The engineering problem worth solving is smaller. Make a review signal reproducible, show the data and model lineage behind it, and stop scoring when the input no longer looks like what the model saw in training. Version 0.2.0 does this on real public data, and its most useful result is a batch it refused to score.

## The data

The companion project [brazil-public-data-map](https://github.com/LucasRangelSSouza/brazil-public-data-map) publishes `lucasrangelss/brazil-education-data-lake` on Kaggle. Version 1 holds 27,830 annual municipal declarations to SIOPE, the education budget system run by FNDE, for 2019 through 2023, joined to IBGE municipality codes. The pipeline pins that version by manifest hash and checks every file before it reads a row.

The model looks at one declared value, investment per basic-education student. Nobody audits these values, and some are implausible, which suits a triage tool.

## The model

The raw value makes a poor feature: nominal investment per student rose about 30% from 2022 to 2023, so any fixed threshold would flag growth and nothing else. The pipeline divides each value by the national median of the same year and takes the log. Later years never inform earlier decisions.

Each municipality is compared with peers in the same macro-region and population band. For every group the model stores the median and the median absolute deviation (MAD) from the training years, and a later declaration more than 3.5 robust standard deviations from its group median becomes a review signal. A single-group global baseline runs alongside.

Training through 2020 and describing 2021, the peer model flagged 93 of 5,566 rows (1.67%) and the global baseline flagged 15. Training through 2021 and describing 2022 gave 89 signals, or 1.60%. No anomaly labels exist, so these are rates, not accuracy. The run also counts signals below the constitutional 25% education-spending minimum: 7 of 93 in 2021. That is co-occurrence, since the model never uses the threshold.

## The batch that was blocked

Before scoring, the pipeline compares the candidate year with the evaluation year on schema, missingness, population stability index (PSI), median shift, and spread. The 2022 batch passed (PSI 0.029, spread ratio 1.086) and produced 96 signals.

The 2023 batch is the instructive one. My first drift check had only schema, missingness, PSI, and median shift. On nominal values it blocked 2023 at a PSI of 0.615, for the wrong reason. After the switch to the relative feature the PSI fell to 0.233, under the 0.25 limit, and the batch went through with 921 signals. That is about ten times the evaluated rate. More than half of those signals (525 of 921) were Northeast municipalities, and 843 sat above their peers.

The median of the relative feature had not moved. Its spread had widened by roughly 38%, and decile PSI barely reacts to a symmetric widening around a fixed centre. The fix was a spread gate built on MAD, which the model's own outliers cannot trigger. With it, 2023 is blocked at a spread ratio of 1.384, and the run writes a drift report instead of a queue.

Why the spread widened, the data does not say. A change in funding rules is one candidate, though the release carries no evidence for it. Someone should find out before refitting on 2023: refitting silently would teach the baseline that the new dispersion is normal.

## Lineage and reproduction

Every registry and queue file records the dataset slug, version, manifest hash, data build commit, code commit, feature schema, model ID, and intended use. Two runs at the same commit produced byte-identical files. The CLI accepts only `review_triage` as an intended use and refuses allocation, eligibility, sanction, audit-finding, and ranking uses by name.

```powershell
python -m pip install -e ".[release]"
make check
make reproduce
```

The pipeline does not identify fraud, evaluate schools, or explain policy outcomes. It produces a short queue a person can inspect, and it stops when the data stops resembling its training input.
