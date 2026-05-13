// db_transaction.cpp
#include "../include/db_transaction.h"
#include <stdexcept>

DbTransaction::DbTransaction(sqlite3* db) : m_db(db), m_committed(false) {
    if (sqlite3_exec(m_db, "BEGIN TRANSACTION;", nullptr, nullptr, nullptr) != SQLITE_OK) {
        throw std::runtime_error("No se pudo iniciar la transacción");
    }
}

DbTransaction::~DbTransaction() {
    if (!m_committed) {
        sqlite3_exec(m_db, "ROLLBACK;", nullptr, nullptr, nullptr);
    }
}

void DbTransaction::commit() {
    if (sqlite3_exec(m_db, "COMMIT;", nullptr, nullptr, nullptr) != SQLITE_OK) {
        throw std::runtime_error("No se pudo hacer commit de la transacción");
    }
    m_committed = true;
}

bool DbTransaction::isActive() const {
    return !m_committed;
}

