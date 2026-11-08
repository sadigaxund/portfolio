# Career

## KDM Force

Data platform engineer. Remote, Rome. Jun 2022 to Nov 2025.

- Ran 5–7 Hetzner Cloud VMs for dev and production, the public website, and a demo playground.
- Built the GitLab CI/CD workflow for a five-person team. Every merge request ran review, pytest, and Playwright before an automatic deploy to dev.
- Cut new-environment bring-up from 5–6 hours to under an hour with Terraform modules and cached CI stages.
- Cut dashboard load time on multi-million-row tables from 20–30 s to 2–3 s with a PostgreSQL-backed cache.

Stack: GitLab CI, Docker, Terraform, Hetzner Cloud, Linux, pytest, Playwright, PostgreSQL, Trino, Iceberg

## Ministry of Tourism

Data infrastructure engineer. Contract, remote, Riyadh. Jun 2023 to Sep 2025.

- Owned deployments on four RHEL VMs in the Ministry's VMware environment: a DMZ node, a control node, and two Spark workers.
- Split the network into isolated subnets with least-privilege firewall rules. The cluster's only route out was the JDBC port to the warehouse.
- Cut incident triage across 10+ unstable provider APIs from about 4 hours to 30 minutes with rate-limit backoffs and dead-letter queues.
- Kept every raw extract in an immutable Parquet layer, so a failed load replays without calling the providers again.
- Wrote the runbooks for deployment, recovery, and the network layout at handover.

Stack: RHEL, VMware, Apache Spark, Kafka, Superset, MS SQL Server, Snowflake, Python, Bash

## Unibank

Data engineer, intern. Baku. Oct 2021 to May 2022.

- Documented the production telemetry pipeline (NiFi, Spark, ELK) and helped refactor log schemas to optimize Kibana queries.
- Built an internal FastAPI metrics service and a benchmarking proof of concept across InfluxDB, Snowflake, and MongoDB.

Stack: Spark, NiFi, Elasticsearch, Logstash, Kibana, Python, FastAPI, MongoDB, InfluxDB, Snowflake
