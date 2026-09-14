package com.arthova.backend.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum TransactionType {
    buy, sell, deposit, withdraw;

    @JsonCreator
    public static TransactionType fromString(String value) {
        if (value == null) return null;
        for (TransactionType type : TransactionType.values()) {
            if (type.name().equalsIgnoreCase(value.trim())) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown transaction type: " + value);
    }
}
