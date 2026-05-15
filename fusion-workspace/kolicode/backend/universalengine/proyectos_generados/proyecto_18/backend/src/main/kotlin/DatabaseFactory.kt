package com.generated.ciberpunk

import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database
import org.slf4j.Logger

fun initializeDatabase(config: AppConfig, logger: Logger) {
    if (config.skipDbInit) {
        logger.info("SKIP_DB_INIT=1 detected - skipping Flyway migrations and database connection")
        return
    }

    val flyway = Flyway.configure()
        .dataSource(config.jdbcUrl, config.dbUser, config.dbPassword)
        .locations("classpath:db/migration")
        .baselineOnMigrate(true)
        .cleanDisabled(true)
        .load()

    val result = flyway.migrate()

    Database.connect(
        url = config.jdbcUrl,
        driver = "org.postgresql.Driver",
        user = config.dbUser,
        password = config.dbPassword
    )

    logger.info(
        "Database initialized for {} with {} migration(s) applied",
        config.jdbcUrl,
        result.migrationsExecuted
    )
}
