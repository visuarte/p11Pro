// AsyncCanvasBuffer.cpp
// Implementación base de triple buffering asíncrono para C++/Qt
// KoliCode 2026 – Referencia para agentes y desarrolladores

#include "AsyncCanvasBuffer.h"
#include <cstring>

AsyncCanvasBuffer::AsyncCanvasBuffer(int w, int h)
    : frontIdx(0), backIdx(1), swapIdx(2), width(w), height(h) {
    allocateBuffers(w, h);
}

AsyncCanvasBuffer::~AsyncCanvasBuffer() {
    freeBuffers();
}

void AsyncCanvasBuffer::allocateBuffers(int w, int h) {
    for (int i = 0; i < BUFFER_COUNT; ++i) {
        buffers[i] = new QImage(w, h, QImage::Format_ARGB32_Premultiplied);
        buffers[i]->fill(Qt::transparent);
    }
}

void AsyncCanvasBuffer::freeBuffers() {
    for (int i = 0; i < BUFFER_COUNT; ++i) {
        delete buffers[i];
        buffers[i] = nullptr;
    }
}

QImage* AsyncCanvasBuffer::acquireBackBuffer() {
    return buffers[backIdx.load()];
}

void AsyncCanvasBuffer::swapBuffers() {
    // Intercambia índices de forma atómica
    int prevFront = frontIdx.exchange(backIdx);
    int prevBack = backIdx.exchange(swapIdx);
    swapIdx.store(prevFront);
}

const QImage* AsyncCanvasBuffer::acquireFrontBuffer() const {
    return buffers[frontIdx.load()];
}

void AsyncCanvasBuffer::resize(int w, int h) {
    std::lock_guard<std::mutex> lock(resizeMutex);
    if (w == width && h == height) return;
    freeBuffers();
    width = w;
    height = h;
    allocateBuffers(w, h);
}

