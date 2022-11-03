FROM neo4j:community

RUN echo "server.memory.heap.max_size=8g" >> /var/lib/neo4j/conf/neo4j.conf && \
    echo "server.memory.pagecache.size=8g" >> /var/lib/neo4j/conf/neo4j.conf && \
    echo "server.bolt.listen_address=0.0.0.0:7687" >> /var/lib/neo4j/conf/neo4j.conf && \
    sed -i 's/retention_policy=.*/retention_policy=keep_none/g' /var/lib/neo4j/conf/neo4j.conf

RUN rm "${NEO4J_HOME}"/data && mkdir "${NEO4J_HOME}"/data
