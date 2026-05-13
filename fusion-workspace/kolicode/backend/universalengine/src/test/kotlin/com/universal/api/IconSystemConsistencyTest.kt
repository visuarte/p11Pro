package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldContainExactlyInAnyOrder
import io.kotest.matchers.shouldBe

class IconSystemConsistencyTest : StringSpec({
    "normalizeIconId aplica convención canónica icon-*" {
        normalizeIconId("trash") shouldBe "icon-trash"
        normalizeIconId("icon-trash") shouldBe "icon-trash"
        normalizeIconId("trash-icon") shouldBe "icon-trash"
        normalizeIconId("  Open_Editor  ") shouldBe "icon-open-editor"
        normalizeIconId("") shouldBe "icon-alert"
    }

    "spritesheet y catálogo mantienen consistencia" {
        val issues = validateIconSystemConsistency()
        issues shouldBe emptyList()

        val expected = ICON_IDS.map { "icon-$it" }
        val actual = iconSpriteSymbolIds()

        actual.toList().sorted() shouldContainExactlyInAnyOrder expected
        actual shouldContain "icon-alert"
    }
})

