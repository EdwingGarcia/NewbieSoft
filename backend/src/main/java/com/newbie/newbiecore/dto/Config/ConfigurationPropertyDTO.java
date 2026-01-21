package com.newbie.newbiecore.dto.Config;

import com.newbie.newbiecore.entity.ConfigurationProperty;
import java.time.LocalDateTime;

public class ConfigurationPropertyDTO {

    private Long id;
    private String key;
    private String value;
    private String maskedValue;
    private String description;
    private String category;
    private Boolean isSensitive;
    private Boolean isEditable;
    private String valueType;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public ConfigurationPropertyDTO() {}

    public static ConfigurationPropertyDTO fromEntity(ConfigurationProperty entity, boolean maskSensitive) {
        ConfigurationPropertyDTO dto = new ConfigurationPropertyDTO();
        dto.setId(entity.getId());
        dto.setKey(entity.getKey());
        dto.setDescription(entity.getDescription());
        dto.setCategory(entity.getCategory());
        dto.setIsSensitive(entity.getIsSensitive());
        dto.setIsEditable(entity.getIsEditable());
        dto.setValueType(entity.getValueType().name());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setUpdatedBy(entity.getUpdatedBy());

        if (entity.getIsSensitive() && maskSensitive) {
            dto.setValue(null);
            dto.setMaskedValue(maskValue(entity.getValue()));
        } else {
            dto.setValue(entity.getValue());
            dto.setMaskedValue(entity.getValue());
        }

        return dto;
    }

    private static String maskValue(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        if (value.length() <= 4) {
            return "****";
        }
        return value.substring(0, 2) + "****" + value.substring(value.length() - 2);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getMaskedValue() {
        return maskedValue;
    }

    public void setMaskedValue(String maskedValue) {
        this.maskedValue = maskedValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getIsSensitive() {
        return isSensitive;
    }

    public void setIsSensitive(Boolean isSensitive) {
        this.isSensitive = isSensitive;
    }

    public Boolean getIsEditable() {
        return isEditable;
    }

    public void setIsEditable(Boolean isEditable) {
        this.isEditable = isEditable;
    }

    public String getValueType() {
        return valueType;
    }

    public void setValueType(String valueType) {
        this.valueType = valueType;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}