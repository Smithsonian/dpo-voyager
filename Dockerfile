
FROM node:16 as build

RUN mkdir -p /app/dist /app/source
WORKDIR /app
COPY ./package*.json /app/
RUN npm ci

COPY ./libs /app/libs

COPY source/client /app/source/client
COPY source/ui /app/source/ui
COPY source/server /app/source/server

RUN cd /app/source/ui && npm ci
RUN npm run build-ui

RUN cd /app/source/server && npm ci
RUN npm run build-server



FROM node:16
ARG PORT=8000

ENV PUBLIC=false
ENV PORT=${PORT}

WORKDIR /app
COPY source/server/package*.json /app/
RUN npm ci --omit=dev

COPY ./assets /app/assets
COPY ./source/server/migrations /app/migrations
COPY --from=build /app/dist /app/dist
COPY --from=build /app/source/server/dist/server /app/server


VOLUME [ "/app/files" ]
EXPOSE ${PORT}

CMD node server/index.js
