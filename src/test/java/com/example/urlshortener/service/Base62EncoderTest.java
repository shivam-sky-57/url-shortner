package com.example.urlshortener.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Base62EncoderTest {

    private final Base62Encoder encoder = new Base62Encoder(6);

    @Test
    void encodeZeroPadsToMinimumLength() {
        assertThat(encoder.generateShortCode(0L)).isEqualTo("000000");
        assertThat(encoder.generateShortCode(1L)).isEqualTo("000001");
        assertThat(encoder.generateShortCode(61L)).isEqualTo("00000z");
        assertThat(encoder.generateShortCode(62L)).isEqualTo("000010");
    }

    @Test
    void encodeAndDecodeAreSymmetric() {
        long original = 1_234_567_890L;
        String code = encoder.encode(original);
        assertThat(encoder.decode(code)).isEqualTo(original);
    }

    @Test
    void usesOnlyBase62Alphabet() {
        String code = encoder.generateShortCode(9_999_999L);
        assertThat(code).matches("[0-9A-Za-z]+");
        assertThat(code.length()).isGreaterThanOrEqualTo(6);
        assertThat(code.length()).isLessThanOrEqualTo(10);
    }

    @Test
    void rejectsNegativeIds() {
        assertThatThrownBy(() -> encoder.generateShortCode(-1L))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
