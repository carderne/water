import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from neo4j import GraphDatabase as G  # type: ignore[import]

load_dotenv()

PW = os.environ["NEO4J_PW"]
driver = G.driver("neo4j+s://water-graph.fly.dev:7687", auth=("neo4j", PW))


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


@app.get("/api/{idd}")
def api(idd: int):
    with driver.session() as s:
        up = s.run(q1, idd=idd).data()[0]["x"]
        down = s.run(q2, idd=idd).data()[0]["x"]
    return {"up": up, "down": down}
