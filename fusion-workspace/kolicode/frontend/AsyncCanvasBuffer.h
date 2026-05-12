// AsyncCanvasBuffer.h
// Ejemplo base para gestión de triple buffering asíncrono en C++/Qt
// KoliCode 2026 – Referencia para agentes y desarrolladores

#ifndef ASYNC_CANVAS_BUFFER_H
#define ASYNC_CANVAS_BUFFER_H

#include <QImage>
#include <atomic>
#include <array>
#include <mutex>

class AsyncCanvasBuffer {
public:
    static constexpr int BUFFER_COUNT = 3;

    AsyncCanvasBuffer(int width, int height);
    ~AsyncCanvasBuffer();

    // Escritura: el motor de renderizado llama a esto
    QImage* acquireBackBuffer();
    void swapBuffers();

    // Lectura: la UI llama a esto para obtener el buffer listo
    const QImage* acquireFrontBuffer() const;

    // Redimensionar buffers si cambia el tamaño del lienzo
    void resize(int width, int height);

private:
    std::array<QImage*, BUFFER_COUNT> buffers;
    std::atomic<int> frontIdx;
    std::atomic<int> backIdx;
    std::atomic<int> swapIdx;
    mutable std::mutex resizeMutex;
    int width, height;

    void allocateBuffers(int w, int h);
    void freeBuffers();
};

#endif // ASYNC_CANVAS_BUFFER_H

