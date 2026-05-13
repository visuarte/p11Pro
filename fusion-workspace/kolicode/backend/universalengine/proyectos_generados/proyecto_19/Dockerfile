FROM gradle:8-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle installDist --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /opt/app
# Copy the distribution produced by `gradle installDist` for the project name set in settings.gradle.kts
# The project is named 'imprenta-pricing', so installDist will create build/install/imprenta-pricing
COPY --from=build /app/build/install/imprenta-pricing /opt/app
EXPOSE 8080
CMD ["/opt/app/bin/imprenta-pricing"]
