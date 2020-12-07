import os

from flask import Flask, jsonify
from neo4j import GraphDatabase as G

app = Flask(__name__)

PW = os.environ["NEO4J_PW"]
driver = G.driver("neo4j://localhost:7687", auth=("neo4j", PW))

q1 = """
    MATCH (n:Basin)
    WHERE n.HybasId = $idd
    OPTIONAL MATCH (u)-[:down*]->(n)
    RETURN n.HybasId+COLLECT(DISTINCT u.HybasId) AS x;
    """
q2 = """
    MATCH (n:Basin)
    WHERE n.HybasId = $idd
    OPTIONAL MATCH (n)-[:down*]->(d)
    RETURN n.HybasId+COLLECT(DISTINCT d.HybasId) AS x;
    """


@app.route("/api/<int:idd>/")
def api(idd):
    with driver.session() as s:
        up = s.run(q1, idd=idd).data()[0]["x"]
        down = s.run(q2, idd=idd).data()[0]["x"]
    return jsonify({"up": up, "down": down})


@app.route("/")
def index():
    return app.send_static_file("index.html")
