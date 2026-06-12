from typing import Dict

# In-memory store (swap for DB in prod)
submissions: Dict = {}       # id -> APISubmission
benchmark_results: Dict = {} # id -> BenchmarkResult
