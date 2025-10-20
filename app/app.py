import os

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

NEO4J_URL = os.environ["NEO4J_URL"]
NEO4J_PW = os.environ["NEO4J_PW"]

# Extract host from bolt:// URL or use directly if it's already http://
if NEO4J_URL.startswith("bolt://"):
    NEO4J_HTTP_URL = NEO4J_URL.replace("bolt://", "http://").replace(":7687", ":7474")
elif NEO4J_URL.startswith("neo4j://"):
    NEO4J_HTTP_URL = NEO4J_URL.replace("neo4j://", "http://").replace(":7687", ":7474")
else:
    NEO4J_HTTP_URL = NEO4J_URL

CYPHER_ENDPOINT = f"{NEO4J_HTTP_URL}/db/neo4j/tx/commit"

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


def run_cypher(query: str, params: dict):
    payload = {
        "statements": [
            {
                "statement": query,
                "parameters": params
            }
        ]
    }
    
    response = requests.post(
        CYPHER_ENDPOINT,
        json=payload,
        auth=("neo4j", NEO4J_PW),
        headers={"Content-Type": "application/json"}
    )
    response.raise_for_status()
    
    result = response.json()
    if result.get("errors"):
        raise Exception(result["errors"])
    
    return result["results"][0]["data"][0]["row"][0]


@app.get("/api/{idd}")
def api(idd: int):
    up = run_cypher(q1, {"idd": idd})
    down = run_cypher(q2, {"idd": idd})
    return {"up": up, "down": down}
