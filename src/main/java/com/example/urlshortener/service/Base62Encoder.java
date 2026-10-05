package com.example.urlshortener.service;

/**
 * Converts numeric database IDs into URL-safe Base62 short codes.
 * Alphabet: 0-9, A-Z, a-z (62 characters).
 */
public class Base62Encoder {

    static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE = ALPHABET.length();

    private final int minLength;

    public Base62Encoder(int minLength) {
        this.minLength = minLength;
    }

    public String generateShortCode(Long id) {
        if (id == null || id < 0) {
            throw new IllegalArgumentException("id must be a non-negative number");
        }
        String encoded = encode(id);
        if (encoded.length() >= minLength) {
            return encoded;
        }
        return "0".repeat(minLength - encoded.length()) + encoded;
    }

    public String encode(long value) {
        if (value == 0) {
            return "0";
        }
        StringBuilder builder = new StringBuilder();
        long remaining = value;
        while (remaining > 0) {
            int index = (int) (remaining % BASE);
            builder.append(ALPHABET.charAt(index));
            remaining /= BASE;
        }
        return builder.reverse().toString();
    }

    public long decode(String code) {
        long result = 0;
        for (int i = 0; i < code.length(); i++) {
            int digit = ALPHABET.indexOf(code.charAt(i));
            if (digit < 0) {
                throw new IllegalArgumentException("Invalid Base62 character: " + code.charAt(i));
            }
            result = result * BASE + digit;
        }
        return result;
    }
}
