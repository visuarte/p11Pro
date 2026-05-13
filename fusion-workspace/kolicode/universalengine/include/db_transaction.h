// db_transaction.h
// Wrapper RAII para transacciones atómicas en SQLite (C++)
// KoliCode 2026

#ifndef DB_TRANSACTION_H
#define DB_TRANSACTION_H

#include <sqlite3.h>

class DbTransaction {
public:
    DbTransaction(sqlite3* db);
    ~DbTransaction();
    void commit();
    bool isActive() const;
private:
    sqlite3* m_db;
    bool m_committed;
};

#endif // DB_TRANSACTION_H

