// db_bootstrap.h
// Inicialización segura de SQLite con WAL y backup previo a migraciones
// KoliCode 2026

#ifndef DB_BOOTSTRAP_H
#define DB_BOOTSTRAP_H

#include <string>
#include <sqlite3.h>

namespace DbBootstrap {
    void configurePragmas(sqlite3* db);
    void backupBeforeMigration(const std::string& dbPath);
}

#endif // DB_BOOTSTRAP_H

