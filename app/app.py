import os
from typing import TypedDict

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

NEO4J_URL = os.environ["NEO4J_URL"]
NEO4J_PW = os.environ["NEO4J_PW"]
CYPHER_ENDPOINT = f"{NEO4J_URL}/db/neo4j/tx/commit"

q1 = """
    MATCH (n:Basin)
    WHERE n.HybasId = $idd
    OPTIONAL MATCH (u)-[:down*]->(n)
    RETURN $idd + COLLECT(DISTINCT u.HybasId) AS x;
    """

q2 = """
    MATCH (n:Basin)
    WHERE n.HybasId = $idd
    OPTIONAL MATCH (n)-[:down*]->(d)
    RETURN $idd + COLLECT(DISTINCT d.HybasId) AS x;
    """

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
)


class Params(TypedDict):
    idd: int


@app.get("/api/{idd}")
def api(idd: int):
    up = _run_cypher(q1, {"idd": idd})
    down = _run_cypher(q2, {"idd": idd})
    return {"up": up, "down": down}


def _run_cypher(query: str, params: Params):
    payload = {"statements": [{"statement": query, "parameters": params}]}

    response = requests.post(
        CYPHER_ENDPOINT,
        json=payload,
        auth=("neo4j", NEO4J_PW),
        headers={"Content-Type": "application/json"},
    )
    response.raise_for_status()

    result = response.json()
    if result.get("errors"):
        raise Exception(result["errors"])

    return result["results"][0]["data"][0]["row"][0]
