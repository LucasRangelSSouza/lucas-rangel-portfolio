# How to fix slow PySpark joins

### Most slow joins are not skew, and more shuffle partitions rarely help. Four shapes of the problem (a duplicated key, a hot key, a window over a weak key, and fan-out that is real), how to tell them apart with one GROUP BY, and the fix for each, measured on 20 million rows in a public benchmark and in a production lakehouse

A Spark job runs for an hour, spills terabytes, or dies with `ExecutorLostFailure`. The usual responses are a bigger cluster, `spark.sql.shuffle.partitions = 800`, and the skew-join settings. Sometimes they help. Often they change nothing, because the problem isn't the join's execution; it's what the join is asked to do.

This article is the method I use, in the order I use it, with four synthetic scenarios that reproduce the shapes I keep finding in production. The benchmark runs in GitHub Actions in [pyspark-fanout-skew-lab](https://github.com/LucasRangelSSouza/pyspark-fanout-skew-lab), so nothing depends on my machine and anyone can rerun it from the Actions tab.

> **On 20 million rows (median of three runs, 4-core GitHub runner)**
> - A header table at item grain made a join 11 times slower than needed: 56.3 s against 5.1 s after deduplicating the key, with 17 GB of spill going to zero. 800 shuffle partitions changed nothing (56.1 s).
> - On a hot key, more partitions made the skew worse: the slowest task went from 37 to 185 times the median. Adaptive skew join brought it to 1.6.
> - Fan-out that is real can't be deduplicated; aggregating each side before the join cut 19.1 s to 4.3 s.

## Step 1: measure every table in the join

Before touching configuration, count two things for every table: rows and distinct join keys.

```python
from pyspark.sql import functions as F

def profile(df, key):
    return df.agg(F.count(F.lit(1)).alias("rows"), F.countDistinct(*key).alias("keys")).first()
```

If `rows` is much larger than `keys` on the side you expected to be one row per key, the join will multiply rows before anything else happens. Then look at how the rows spread across keys:

```python
df.groupBy(*key).count().orderBy(F.desc("count")).show(10)
```

That one `GROUP BY` separates the four cases below. Many keys repeated a similar number of times is fan-out (by duplication or by design). A few keys with a huge share of the rows is skew. One key holding an enormous group, often an empty string or a null, is a weak key.

## Case 1: the key is duplicated

The most common case in my experience. A table that should have one row per order was built from a source at item grain, so each order appears once per item. Join it to the order lines and every line is repeated as many times as its order had items; a `dropDuplicates` at the end hides the damage in the result but not in the execution.

```python
# naive: lines.join(headers, "order_id").dropDuplicates(["line_id"])
right = lines.join(F.broadcast(headers.dropDuplicates(["order_id"])), "order_id")
```

Deduplicate before the join, and only after proving it is safe: every column you keep must be constant per key. `groupBy(key).agg(F.countDistinct(col))` for each kept column, and every count must be 1. If one isn't, the "duplicates" carry information and you need to decide which row wins.

After deduplicating, check the size again. A table that shrank by an order of magnitude often fits in a broadcast, which turns a sort-merge join (both sides shuffled and sorted) into a broadcast hash join (the small side copied to every executor, the big side not moved).

![Seconds per scenario and variant](fig1_seconds.png)
*Each scenario as first written, with the fix people try first (more shuffle partitions), and with the fix for its cause.*

**In a production lakehouse**, this was a join of order items that took 52 minutes. The header table had 14.4 million rows and 1.2 million distinct keys: 91.6% duplicates, inflating the join about 12 times. 800 shuffle partitions and the skew-join settings left a 4.1 TiB spill untouched. Deduplicating the key brought the table to 1.2 million rows, small enough to broadcast against 598 million rows, and the join ran in 4 minutes 13 seconds.

The same shape appeared in an incremental merge that died with `ExecutorLostFailure` after 22 minutes. The target table had 23.3 million rows for 1,007,058 distinct hashes, about 23 copies of each, and a daily overwrite kept rewriting the inflation. A machine twice the size made the executor timeout worse, not better (from 120,512 ms to 174,071 ms). After deduplication the table was back to 1,007,967 rows and the merge finished in about 5 minutes.

## Case 2: a hot key

Real skew: a few keys carry a large share of the rows (in the benchmark, 1% of the customers carry 40% of the events) and the join partner is too large to broadcast. In a sort-merge join, all rows of a key go to the same task, so a handful of tasks do most of the work while the rest wait.

More shuffle partitions don't split a key; they only make the other tasks smaller, so the imbalance gets worse. Spark 3's adaptive query execution can split the skewed partitions at run time:

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "3")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "16m")
```

![Spill and task imbalance](fig2_spill_and_skew.png)
*Left: the duplicated key spills about 17 GB with or without more partitions, and nothing after deduplication. Right: the ratio of the slowest task to the median task on the hot key.*

On a runner with four cores the time difference is small (8.5 s to 7.9 s), because there are few tasks to balance; the task ratio is the number that predicts what happens on a cluster with hundreds of cores. When adaptive execution isn't available or isn't enough, salting the hot keys (adding a random suffix on the big side and replicating the small side for those keys) is the manual version of the same idea.

To tell real skew from noise, such as a slow spot instance, look at the task metrics rather than the stage time: the distribution of `shuffleReadBytes` and `executorRunTime` per task, from the Spark UI's REST API or the event log. The benchmark records the slowest and median task of every run from the event log for exactly this reason.

## Case 3: a window over a weak key

`row_number()` over `Window.partitionBy("document")` looks harmless until 20% of the rows have no document and share the same empty string. Every one of them goes to a single window partition, sorted in a single task, and the numbering across unrelated rows is meaningless anyway.

```python
key = F.when(F.col("document") == "", F.concat(F.lit("no-doc:"), F.col("entry_id").cast("string"))) \
       .otherwise(F.col("document"))
window = Window.partitionBy(key).orderBy("amount")
```

Rows without a document get their own key; rows with a document keep exactly the groups they had. In the benchmark the gain in time is modest (16.6 s to 15.2 s), and the task imbalance drops from 2.3 to 1.5; the bigger win is that the result stops numbering unrelated rows together.

**In production** the same pattern put 19 million rows without a document under one empty key; the largest window partition had 3,393,336 rows. With a strong composite key, the largest partition had 2 rows in one system and 55 in the other.

## Case 4: fan-out that is real

Sometimes a key legitimately has many children, and there is nothing to deduplicate. In the benchmark every account has 20 users and every transaction belongs to an account; joining transactions to users repeats each transaction 20 times before the aggregation divides it back out. In production the same shape had 22.86 children per key on average, up to 40.

When the result is an aggregate, aggregate each side to one row per key first, then join:

```python
spend = tx.groupBy("account_id").agg(F.sum("amount").alias("spend"), F.count("*").alias("transactions"))
members = users.groupBy("account_id").agg(F.count("*").alias("users"))
result = spend.join(members, "account_id")
```

The shuffle drops from 400 MB to 33 MB and the time from 19.1 s to 4.3 s.

## Validate the fix, not only the speed

A faster join that returns different rows is a new bug. The benchmark compares every fix against the naive query with a row count and an order-independent checksum, the sum of `xxhash64` over all columns, and only the window scenario is allowed to differ, because there the naive key is the bug. In production, compare distinct counts and the distribution of values per key, not only `COUNT(*)` and `SUM`: a deduplication that drops the wrong row keeps both the same.

## The method, in order

1. Count rows and distinct keys on every table in the join.
2. `GROUP BY` the key to tell duplicates, real fan-out, hot keys and weak keys apart.
3. Duplicates: prove the kept columns are constant per key, deduplicate before the join, and check whether the table now fits in a broadcast.
4. Real fan-out: aggregate each side to the key before joining.
5. Hot keys: adaptive skew join, or salting.
6. Windows: a key that doesn't collapse unrelated rows.
7. Validate against the old query with counts, checksums and distributions.
8. Only then, tune partitions and cluster size.

## Run it

The benchmark runs on push and on demand in GitHub Actions, three repeats per variant, and publishes `results.jsonl` as an artifact. The run in this article is in `results/run-37086764815/`. To run it yourself (Java 17 required):

```bash
git clone https://github.com/LucasRangelSSouza/pyspark-fanout-skew-lab && cd pyspark-fanout-skew-lab
pip install -r requirements.txt
python -m lab.bench generate --rows 2000000 --data /tmp/lab-data
python -m lab.bench run --scenario duplicate_key --variant right --data /tmp/lab-data --out results.jsonl
python -m lab.summary results.jsonl
python -m lab.figures results/run-37086764815/results.jsonl figures
```
