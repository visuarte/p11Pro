# Multi-stage Dockerfile: build fat jar with Gradle, run on JRE 21
FROM gradle:9-jdk21 AS build
WORKDIR /home/gradle/project
COPY --chown=gradle:gradle . .
# Use the gradle wrapper present in the backend context to build a fat jar
RUN chmod +x ./gradlew || true
RUN ./gradlew -q fatJar --no-daemon --console=plain

FROM eclipse-temurin:21-jre
WORKDIR /app
# copy the produced jar
COPY --from=build /home/gradle/project/build/libs/*.jar /app/app.jar
EXPOSE 8040
ENV JAVA_OPTS="-Xms256m -Xmx512m"
CMD ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
