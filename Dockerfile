# Stage 1: Install dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG BS_API_KEY
ARG LO_API_KEY
ARG LM_API_KEY
ARG HOST_API_KEY
ARG DMS_API_KEY
ARG AML_API_KEY
ARG SECRET_KEY

ENV BS_API_KEY=$BS_API_KEY \
    LO_API_KEY=$LO_API_KEY \
    LM_API_KEY=$LM_API_KEY \
    HOST_API_KEY=$HOST_API_KEY \
    DMS_API_KEY=$DMS_API_KEY \
    AML_API_KEY=$AML_API_KEY \
    SECRET_KEY=$SECRET_KEY

RUN npm run build

# Stage 3: Production runner (standalone)
# The package.json "postbuild" script already copies .next/static and
# public into .next/standalone, so this image is fully self-contained.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
