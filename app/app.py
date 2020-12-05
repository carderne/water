import os

from flask import Flask, jsonify, render_template
from neo4j import GraphDatabase as G

app = Flask(__name__)

PW = os.environ["NEO4J_PW"]
driver = G.driver("neo4j://localhost:7687", auth=("neo4j", PW))

q = """
    MATCH (n:Basin)
    WHERE n.HybasId = {idd}
    OPTIONAL MATCH p1=(u)-[:down*]->(n)
    OPTIONAL MATCH p2=(n)-[:down*]->(d)
    RETURN n.HybasId+COLLECT(DISTINCT u.HybasId) AS up,
           n.HybasId+COLLECT(DISTINCT d.HybasId) AS down
    """


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/<idd>/")
def api(idd):
    with driver.session() as s:
        res = s.run(q.format(idd=idd)).data()
    return jsonify({"up": res[0]["up"], "down": res[0]["down"]})
