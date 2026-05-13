package com.app

import kotlin.random.Random

class Game {
    var playerX: Int = 100
    var playerY: Int = 50
    val walls = listOf(
        "bottom-right",
        "right",
        "top-left",
        "left"
    )

    fun draw() {
        println("Hello")
        for (y in 0 until 8) {
            for (x in 0 until 4) {
                if (x == playerX && y == playerY) {
                    println("Player X is here!")
                } else {
                    val direction = when {
                        x < walls[x].length -> "right"
                        else -> "left"
                    }
                    val wallIndex = Random.nextInt(0 until walls.size)
                    drawWall(walls[wallIndex], x, y)
                }
            }
        }
    }

    private fun drawWall(x: Int, y: Int) {
        for (y in 1 until 4) {
            if (x == 3 || x == 2) {
                val direction = "down"
            } else if (x < walls[x].length && x >= 0) {
                val direction = when {
                    x == 0 -> "left"
                    y == 5 -> "right"
                    else -> ""
                }
            } else {
                println("Invalid position")
            }
            drawLine(x, y, x + direction)
        }
    }

    private fun drawLine(x: Int, y: Int, direction: String) {
        val lineLength = if (x < walls[x].length && x >= 0) 5 else walls[wallIndex]
        print("$lineLength${direction} ${y - 1}")
        for (i in 2 until lineLength) {
            print(" ")
        }
    }

    fun main() {
        val player = Game()
        player.playerX = Random.nextInt(600, 850).toInt()
        player.playerY = 400
        player.draw()
    }
}