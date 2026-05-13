// secure_file_loader.h
// Utilidad C++ para descifrado AES-256 en memoria de archivos binarios
// ThunderKoli 2026

#ifndef SECURE_FILE_LOADER_H
#define SECURE_FILE_LOADER_H

#include <string>
#include <vector>

class SecureFileLoader {
public:
    // Carga y descifra un archivo binario cifrado con AES-256
    // key: clave secreta (32 bytes)
    // Devuelve el contenido descifrado en memoria
    static std::vector<unsigned char> loadAndDecrypt(const std::string& path, const std::vector<unsigned char>& key);
};

#endif // SECURE_FILE_LOADER_H

