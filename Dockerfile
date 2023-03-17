
FROM node:16-alpine as build

RUN mkdir -p /app/dist /app/source
WORKDIR /app
COPY ./package*.json /app/
RUN npm ci

COPY ./libs /app/libs

COPY source/client /app/source/client
COPY source/ui /app/source/ui
COPY source/server /app/source/server

RUN (cd /app/source/ui && npm ci) \
  && npm run build-ui

RUN (cd /app/source/server && npm ci) \
  && npm run build-server


FROM node:16-alpine
LABEL org.opencontainers.image.source=https://github.com/Holusion/e-thesaurus
LABEL org.opencontainers.image.description="eCorpus base image"
LABEL org.opencontainers.image.licenses=Apache

ARG PORT=8000

ENV PUBLIC=false
ENV PORT=${PORT}

WORKDIR /app
COPY source/server/package*.json /app/
#might occasionally fail if the prebuilt version can't be downloaded, 
# because it can't rebuild it locally
RUN npm ci --omit=dev

COPY ./assets /app/assets
COPY ./source/server/migrations /app/migrations
COPY ./source/server/templates /app/templates

COPY --from=build /app/dist /app/dist
COPY --from=build /app/source/server/dist/server /app/server


VOLUME [ "/app/files" ]
EXPOSE ${PORT}

CMD node server/index.js
