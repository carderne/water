FROM water-graph-mid

RUN sed -i 's/heap.max_size=.*/heap.max_size=500m/g' /var/lib/neo4j/conf/neo4j.conf && \
    sed -i 's/pagecache.size=.*/pagecache.size=500m/g' /var/lib/neo4j/conf/neo4j.conf

ENTRYPOINT ["/startup/docker-entrypoint.sh"]

CMD ["neo4j"]
