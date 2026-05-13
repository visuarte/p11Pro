FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle installDist --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /opt/app
COPY --from=build /app/build/install /opt/app
EXPOSE 8080
ENTRYPOINT ["/opt/app/webmenu/bin/webmenu"]
CMD ["-config=src/main/resources/application.conf"]