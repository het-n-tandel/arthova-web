package com.arthova.backend.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum AssetType {
    stock, mutual_fund, gold, silver, fd, property, crypto, cash, bond, liability;

    @JsonCreator
    public static AssetType fromString(String value) {
        if (value == null) return null;
        for (AssetType type : AssetType.values()) {
            if (type.name().equalsIgnoreCase(value.trim())) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown asset type: " + value);
    }
}
