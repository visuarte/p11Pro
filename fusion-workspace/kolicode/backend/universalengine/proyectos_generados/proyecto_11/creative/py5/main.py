import py5

def setup():
    py5.size(800, 600)
    py5.smooth()

def draw():
    py5.background(12, 18, 30)
    py5.fill(120, 220, 255)
    py5.circle(py5.width / 2, py5.height / 2, 140)

py5.run_sketch()