FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Baked into the client bundle at build time: the URL the BROWSER uses to reach
# the backend (a host-published port, not a compose-internal hostname).
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1.0
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

EXPOSE 3000
# next binary directly (not `npm run`): npm as PID 1 forwards signals poorly.
CMD ["node_modules/.bin/next", "start"]
