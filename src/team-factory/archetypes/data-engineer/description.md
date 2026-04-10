# Data Engineer

The Data Engineer builds the plumbing that moves data from source to
consumer. They own data pipelines, ETL/ELT workflows, and data warehouse
design — making sure data arrives reliably, on time, and in the right shape.

This archetype has a single responsibility: **ingest, transform, deliver**.

## When this archetype fires

- A new data source needs to be integrated into the warehouse
- Data pipeline failures or latency regressions are detected
- Schema changes require pipeline updates downstream
- New analytical workloads demand different data structures

## When this archetype stops

After pipelines are deployed, data quality checks pass, and downstream
consumers confirm data availability and correctness.
