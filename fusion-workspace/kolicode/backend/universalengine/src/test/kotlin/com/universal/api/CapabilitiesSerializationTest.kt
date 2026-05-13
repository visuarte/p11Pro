package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import kotlinx.serialization.builtins.serializer

class CapabilitiesSerializationTest : StringSpec({

    "GenericResponse con CapabilitiesDTO serializa y preserva campos clave" {
        val payload = CapabilitiesDTO(
            profile = "backend-ultralight-modern",
            features = listOf("project-hub", "next-level-fritz2-webgl"),
            profiles = listOf("static", "angular", "next-level"),
            webglEngines = listOf("kotlin-webgl-wrapper", "three-js-interop"),
            domainSpecFields = listOf("functionalRequirements", "useCases")
        )

        val response = GenericResponse(status = "SUCCESS", payload = payload)
        val json = customJson.encodeToString(
            GenericResponse.serializer(CapabilitiesDTO.serializer()),
            response
        )

        json shouldContain "\"profile\":\"backend-ultralight-modern\""
        json shouldContain "\"next-level\""
        json shouldContain "\"three-js-interop\""
        json shouldContain "\"domainSpecFields\""

        val decoded = customJson.decodeFromString(
            GenericResponse.serializer(CapabilitiesDTO.serializer()),
            json
        )

        decoded.status shouldBe "SUCCESS"
        decoded.payload?.profile shouldBe "backend-ultralight-modern"
        decoded.payload?.profiles?.contains("next-level") shouldBe true
    }
})

