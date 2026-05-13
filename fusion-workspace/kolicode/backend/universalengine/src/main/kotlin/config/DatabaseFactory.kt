package main.kotlin.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import com.universal.api.requireDbEnvInProd
import org.jetbrains.exposed.sql.Database

object DatabaseFactory {
    fun init() {
        requireDbEnvInProd()
        val appEnv = (System.getProperty("app.env") ?: System.getenv("APP_ENV") ?: "dev").trim().lowercase()
        val config = HikariConfig().apply {
            jdbcUrl = System.getenv("JDBC_DATABASE_URL")
                ?: if (appEnv == "prod") throw IllegalStateException("JDBC_DATABASE_URL is required in production")
                else "jdbc:postgresql://localhost:5432/cineops"
            driverClassName = "org.postgresql.Driver"
            username = System.getenv("DB_USER")
                ?: if (appEnv == "prod") throw IllegalStateException("DB_USER is required in production")
                else "postgres"
            password = System.getenv("DB_PASSWORD")
                ?: if (appEnv == "prod") throw IllegalStateException("DB_PASSWORD is required in production")
                else "postgres"
            maximumPoolSize = 10
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }
        val dataSource = HikariDataSource(config)
        Database.connect(dataSource)
    }
}
