import type { TimelineEntry } from "../../../ui/timeline";

export const CAREER: TimelineEntry[] = [
  {
    when: "Jun 2022 to Nov 2025",
    title: "KDM Force",
    role: "Data platform engineer. Remote, Rome.",
    results: [
      { before: "Ran ", result: "5–7 Hetzner Cloud VMs", after: " for dev and production, the public website, and a demo playground." },
      { before: "Built the GitLab CI/CD workflow for a five-person team. Every merge request ran review, pytest, and Playwright before an automatic deploy to dev." },
      { before: "Cut new-environment bring-up from ", result: "5–6 hours to under an hour", after: " with Terraform modules and cached CI stages." },
      { before: "Cut dashboard load time on multi-million-row tables from ", result: "20–30 s to 2–3 s", after: " with a PostgreSQL-backed cache." },
    ],
    stack: "GitLab CI, Docker, Terraform, Hetzner Cloud, Linux, pytest, Playwright, PostgreSQL, Trino, Iceberg",
  },
  {
    when: "Jun 2023 to Sep 2025",
    title: "Ministry of Tourism",
    role: "Data infrastructure engineer. Contract, remote, Riyadh.",
    results: [
      { before: "Owned deployments on ", result: "four RHEL VMs", after: " in the Ministry's VMware environment: a DMZ node, a control node, and two Spark workers." },
      { before: "Split the network into isolated subnets with least-privilege firewall rules. The cluster's only route out was the JDBC port to the warehouse." },
      { before: "Cut incident triage across 10+ unstable provider APIs from ", result: "about 4 hours to 30 minutes", after: " with rate-limit backoffs and dead-letter queues." },
      { before: "Kept every raw extract in an immutable Parquet layer, so a failed load replays without calling the providers again." },
      { before: "Wrote the runbooks for deployment, recovery, and the network layout at handover." },
    ],
    stack: "RHEL, VMware, Apache Spark, Kafka, Superset, MS SQL Server, Snowflake, Python, Bash",
  },
  {
    when: "Oct 2021 to May 2022",
    title: "Unibank",
    role: "Data engineer, intern. Baku.",
    results: [
      { before: "Documented the production telemetry pipeline (NiFi, Spark, ELK) and helped refactor log schemas to optimize Kibana queries." },
      { before: "Built an internal FastAPI metrics service and a benchmarking proof of concept across InfluxDB, Snowflake, and MongoDB." },
    ],
    stack: "Spark, NiFi, Elasticsearch, Logstash, Kibana, Python, FastAPI, MongoDB, InfluxDB, Snowflake",
  },
];
