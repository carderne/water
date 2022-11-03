# water-fly.io

## Steps
1. Build base image:
```bash
docker build --tag=water-graph-base -f base.Dockerfile .
```

2. Run base image:
```bash
docker run --rm -it -p7474:7474 -p7687:7687 \
  -v $(pwd):/import \
  -e NEO4J_AUTH=neo4j/<your-password-here> \
  --entrypoint='' water-graph-base bash
```

3. In the container terminal, run Neo4j:
```bash
/startup/docker-entrypoint.sh neo4j
```

4. Open the browser: http://localhost:7474/ and login with neo4j/neo4j and set a new password.

5. Run the three Cypher queries from [Water#Building the graph](https://github.com/carderne/water#building-the-graph).

6. In the container terminal, Ctrl-C the process.

7. In a separate terminal, get the container id with `docker ps`

8. Commit it to a new image:
```bash
docker commit <container-id> water-graph-mid
```

9. Build the prod image:
```bash
docker build --tag=carderne/water-graph-prod -f prod.Dockerfile .
docker push carderne/water-graph-prod
```

10. Fly launch:
```bash
fly launch
```

11. Fly deploy:
```bash
fly deploy --remote-only -i carderne/water-graph-prod
```
