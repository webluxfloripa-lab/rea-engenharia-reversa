# Non-production local laboratory image.
# Network policy, quarantine, tenant isolation and broker auth are NOT provided here.
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl openjdk-17-jdk-headless procps python3 git \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/rea-lab
COPY rea-main/ ./rea-main/
RUN cd rea-main && npm ci --no-audit --no-fund && npm run build:cached
# Pin and verify the external headless JADX bridge described in upstream REA docs.
RUN mkdir -p /opt/rea-lab/tools && \
  curl --fail --location --retry 2 \
    https://github.com/1013503897/jadx-headless-mcp/releases/download/v0.7.1/jadx-headless-mcp-0.7.1-all.jar \
    -o /opt/rea-lab/tools/jadx-headless-mcp-0.7.1-all.jar && \
  echo "6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75  /opt/rea-lab/tools/jadx-headless-mcp-0.7.1-all.jar" | sha256sum -c -
COPY workers/executor/ ./workers/executor/
RUN mkdir -p /opt/rea-lab/.rea-executor-data && chown -R node:node /opt/rea-lab/.rea-executor-data
ENV NODE_ENV=production \
    REA_EXECUTOR_REA_DIR=/opt/rea-lab/rea-main \
    REA_EXECUTOR_DATA_DIR=/opt/rea-lab/.rea-executor-data \
    REA_JADX_MCP_JAR=/opt/rea-lab/tools/jadx-headless-mcp-0.7.1-all.jar \
    REA_EXECUTOR_HOST=127.0.0.1 \
    REA_EXECUTOR_PORT=4183
USER node
CMD ["node","workers/executor/server.mjs"]
