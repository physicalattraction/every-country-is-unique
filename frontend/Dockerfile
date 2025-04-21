FROM node:20-alpine AS builder

# Add build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
ARG NEXT_PUBLIC_API_URL

# Add labels
LABEL org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.version=$VERSION \
    org.label-schema.name="Every Country Is Unique Frontend" \
    org.label-schema.description="Frontend for Every Country Is Unique" \
    org.label-schema.vcs-url="https://codeberg.org/erwinrossen/every-country-is-unique"

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

RUN npm ci

# Copy all source code
COPY . .

# Build with environment variables
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copy only the necessary files for production
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/next.config.mjs ./
COPY --from=builder /usr/src/app/tsconfig.json ./
COPY --from=builder /usr/src/app/postcss.config.js ./
COPY --from=builder /usr/src/app/tailwind.config.js ./

EXPOSE ${PORT:-3000}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/ || exit 1

CMD ["sh", "-c", "npm run ${NODE_ENV:-development}"]
