---
title: Extract Date Parts with pandas and Polars
search: extract date parts year month day weekday hour datetime components
description: Extract year, month, day, weekday and hour columns in Ciaren. Compare runnable pandas and Polars exports, null dates and weekday numbering.
---

# Extract date parts — `extractDateParts`

Add columns for parts of a date/datetime column.

## Use cases

- Add `year`/`month` columns to group sales by period.
- Pull `weekday` or `hour` for time-of-week analysis.

## What it does

Adds one new column per requested part, named `<column>_<part>`. All original
columns are preserved.

<DataTransform
  transform="Extract date parts (column=occurred_at, parts=[year, month])"
  :before='{
    "columns":["event_id","occurred_at","value"],
    "rows":[
      [1,"2024-01-05",10],[2,"2024-02-18",21],[3,"2024-03-01",17]
    ]
  }'
  :after='{
    "columns":["event_id","occurred_at","value","occurred_at_year","occurred_at_month"],
    "rows":[
      [1,"2024-01-05",10,2024,1],
      [2,"2024-02-18",21,2024,2],
      [3,"2024-03-01",17,2024,3]
    ]
  }'
  :highlight='["occurred_at_year","occurred_at_month"]'
/>

## Configuration

| Config key | Type | Required | Description |
| --- | --- | --- | --- |
| `column` | string | Yes | Date/datetime column |
| `parts` | string[] | Yes | Any of `year`, `month`, `day`, `weekday`, `hour` |

Each part becomes a new column named `<column>_<part>` (e.g. `ordered_at_year`).

## Generated Python code

Each complete File Input → Extract Date Parts → File Output flow reads `source.csv` and
writes `result.parquet`. The first example keeps the original configuration `column:
ordered_at`, `parts: [year, month]`; the illustration above instead uses `occurred_at`.
The second example requests all five supported parts. The input dates in these examples
are ISO text; valid dates and missing values are supported, and every original field and
row is retained. Put your original CSV beside the script; use an environment with Ciaren
and its file-format dependencies installed. Polars exports here use eager frames.

### pandas

#### Year month

```python
import pandas as pd

df_source = pd.read_csv('source.csv')
_dt = pd.to_datetime(df_source['ordered_at'])
df_source = df_source.assign(ordered_at_year=_dt.dt.year, ordered_at_month=_dt.dt.month)
df_source.to_parquet('result.parquet', index=False)
```

#### All parts

```python
import pandas as pd

df_source = pd.read_csv('source.csv')
_dt = pd.to_datetime(df_source['ordered_at'])
df_source = df_source.assign(ordered_at_year=_dt.dt.year, ordered_at_month=_dt.dt.month, ordered_at_day=_dt.dt.day, ordered_at_weekday=_dt.dt.weekday, ordered_at_hour=_dt.dt.hour)
df_source.to_parquet('result.parquet', index=False)
```

### Polars

#### Year month

```python
import polars as pl

df_source = pl.read_csv('source.csv')
_sch = df_source.collect_schema()
_dt = (pl.col('ordered_at').str.to_datetime(strict=False) if _sch['ordered_at'] == pl.Utf8 else pl.col('ordered_at').cast(pl.Datetime, strict=False))
df_source = df_source.with_columns([_dt.dt.year().alias('ordered_at_year'), _dt.dt.month().alias('ordered_at_month')])
df_source.write_parquet('result.parquet')
```

#### All parts

```python
import polars as pl

df_source = pl.read_csv('source.csv')
_sch = df_source.collect_schema()
_dt = (pl.col('ordered_at').str.to_datetime(strict=False) if _sch['ordered_at'] == pl.Utf8 else pl.col('ordered_at').cast(pl.Datetime, strict=False))
df_source = df_source.with_columns([_dt.dt.year().alias('ordered_at_year'), _dt.dt.month().alias('ordered_at_month'), _dt.dt.day().alias('ordered_at_day'), (_dt.dt.weekday() - 1).alias('ordered_at_weekday'), _dt.dt.hour().alias('ordered_at_hour')])
df_source.write_parquet('result.parquet')
```

## Tips & common mistakes

- **`weekday` is Monday=0 … Sunday=6.** The Polars export subtracts one from
  Polars' native weekday numbering to match pandas. Missing dates produce
  missing date parts.
- **Invalid text differs by engine.** pandas raises when it cannot parse a
  date; Polars uses non-strict parsing, so an invalid value can become null.
  Parse explicitly upstream when you need a chosen format or error policy.
- If the source is text, [Parse dates](./parse-dates.md) or
  [Change types](./cast-types.md) → `datetime` first; this node also parses on the
  fly but an explicit parse is clearer.

## See also

- [Parse dates](./parse-dates.md) · [Change types](./cast-types.md)
