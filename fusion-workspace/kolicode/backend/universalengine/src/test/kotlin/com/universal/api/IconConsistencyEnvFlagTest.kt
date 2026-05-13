package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class IconConsistencyEnvFlagTest : StringSpec({
    "isIconConsistencyCheckEnabled usa true por defecto" {
        isIconConsistencyCheckEnabled(null) shouldBe true
        isIconConsistencyCheckEnabled("") shouldBe true
        isIconConsistencyCheckEnabled("   ") shouldBe true
    }

    "isIconConsistencyCheckEnabled reconoce valores true" {
        isIconConsistencyCheckEnabled("true") shouldBe true
        isIconConsistencyCheckEnabled("TRUE") shouldBe true
        isIconConsistencyCheckEnabled("1") shouldBe true
        isIconConsistencyCheckEnabled("yes") shouldBe true
        isIconConsistencyCheckEnabled("on") shouldBe true
    }

    "isIconConsistencyCheckEnabled reconoce valores false" {
        isIconConsistencyCheckEnabled("false") shouldBe false
        isIconConsistencyCheckEnabled("FALSE") shouldBe false
        isIconConsistencyCheckEnabled("0") shouldBe false
        isIconConsistencyCheckEnabled("no") shouldBe false
        isIconConsistencyCheckEnabled("off") shouldBe false
    }

    "isIconConsistencyCheckEnabled usa true para valores invalidos" {
        isIconConsistencyCheckEnabled("tal-vez") shouldBe true
        isIconConsistencyCheckEnabled("disabled") shouldBe true
    }
})

