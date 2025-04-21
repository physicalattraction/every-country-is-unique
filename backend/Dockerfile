FROM node:20-alpine

# Add build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Add labels
LABEL org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.version=$VERSION \
    org.label-schema.name="Every Country Is Unique Backend" \
    org.label-schema.description="Backend API for Every Country Is Unique" \
    org.label-schema.vcs-url="https://codeberg.org/erwinrossen/every-country-is-unique"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN rm -rf dist && npm run build

EXPOSE ${PORT:-3001}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/health || exit 1

CMD ["sh", "-c", "npm run ${NODE_ENV:-development}"]
