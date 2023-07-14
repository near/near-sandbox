FROM debian:bookworm as builder
WORKDIR /usr/src/app
RUN apt-get update && apt-get install --assume-yes curl
RUN curl -LJO https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/Linux-x86_64/master/d08187094a82b3bfab3b8b0fa076e71068f39cb7/near-sandbox.tar.gz
RUN tar -xf near-sandbox.tar.gz

FROM debian:bookworm-slim as runtime
WORKDIR /usr/local/bin
COPY --from=builder /usr/src/app/Linux-x86_64/near-sandbox /usr/local/bin/near-sandbox
RUN apt-get update && apt-get install --assume-yes curl
RUN near-sandbox --home /root/.near init

ENTRYPOINT [ "near-sandbox", "--home", "/root/.near", "run" ]
