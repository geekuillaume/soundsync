# This is used only for the rendezvous service

FROM node:12 AS builder

WORKDIR /app

COPY package.json yarn.lock tsconfig.json ./
COPY app/package.json app/yarn.lock ./app/
RUN yarn

COPY webui/package.json webui/yarn.lock ./webui/
RUN cd webui && yarn

COPY rendezvous-service/package.json rendezvous-service/yarn.lock rendezvous-service/
RUN cd rendezvous-service && yarn

COPY ./src ./src
COPY ./webui/src ./webui/src
COPY ./webui/.babelrc ./webui/webpack.config.js ./webui/tsconfig.json ./webui/
RUN cd webui && yarn build
COPY ./rendezvous-service/tsconfig.json ./rendezvous-service/
COPY ./rendezvous-service/src ./rendezvous-service/src/
RUN cd rendezvous-service && yarn build

FROM node:12-alpine AS runner

EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /app

COPY rendezvous-service/package.json rendezvous-service/yarn.lock ./rendezvous-service/
RUN cd rendezvous-service && yarn install --prod

COPY rendezvous-service/config ./rendezvous-service/config/
COPY --from=builder /app/rendezvous-service/app ./rendezvous-service/app
COPY --from=builder /app/webui/dist ./webui/dist
COPY --from=builder /app/package.json ./package.json

CMD [ "sh", "-c", "cd rendezvous-service && yarn start" ]
