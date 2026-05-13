// db_bootstrap.cpp
#include "../include/db_bootstrap.h"
#include <fstream>
#include <stdexcept>

void DbBootstrap::configurePragmas(sqlite3* db) {
    sqlite3_exec(db, "PRAGMA journal_mode = WAL;", nullptr, nullptr, nullptr);
    sqlite3_exec(db, "PRAGMA synchronous = NORMAL;", nullptr, nullptr, nullptr);
    sqlite3_exec(db, "PRAGMA temp_store = MEMORY;", nullptr, nullptr, nullptr);
}

void DbBootstrap::backupBeforeMigration(const std::string& dbPath) {
    std::ifstream src(dbPath, std::ios::binary);
    std::ofstream dst(dbPath + ".backup", std::ios::binary);
    if (!src || !dst) throw std::runtime_error("No se pudo crear el backup de la base de datos");
    dst << src.rdbuf();
}

