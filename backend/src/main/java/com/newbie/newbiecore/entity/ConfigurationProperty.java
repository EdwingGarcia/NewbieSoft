package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa una propiedad de configuración del sistema.
 * Estas propiedades se cargan en el Environment de Spring y pueden
 * ser modificadas en tiempo de ejecución.
 */
@Entity
@Table(name = "configuration_property", indexes = {
        @Index(name = "idx_config_key", columnList = "key", unique = true),
        @Index(name = "idx_config_category", columnList = "category"),
        @Index(name = "idx_config_active", columnList = "is_active")
})
public class ConfigurationProperty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Clave única de la propiedad (ej: spring.datasource.url)
     */
    @Column(name = "key", nullable = false, unique = true, length = 255)
    private String key;

    /**
     * Valor de la propiedad
     */
    @Column(name = "value", columnDefinition = "TEXT")
    private String value;

    /**
     * Categoría para agrupar propiedades relacionadas
     */
    @Column(name = "category", nullable = false, length = 100)
    private String category;

    /**
     * Descripción legible de la propiedad
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * Indica si el valor es sensible y debe enmascararse
     */
    @Column(name = "is_sensitive", nullable = false)
    private Boolean isSensitive = false;

    /**
     * Indica si la propiedad puede ser editada desde la UI
     */
    @Column(name = "is_editable", nullable = false)
    private Boolean isEditable = true;

    /**
     * Indica si la propiedad está activa y debe cargarse al Environment
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Tipo de valor para validación
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "value_type", nullable = false, length = 20)
    private ValueType valueType = ValueType.STRING;

    /**
     * Usuario que actualizó la propiedad por última vez
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    /**
     * Fecha de creación
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Fecha de última actualización
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Tipos de valor soportados
     */
    public enum ValueType {
        STRING,
        NUMBER,
        BOOLEAN,
        URL,
        EMAIL,
        PASSWORD
    }

    // ==================== GETTERS Y SETTERS ====================

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public ValueType getValueType() {
        return valueType;
    }

    public void setValueType(ValueType valueType) {
        this.valueType = valueType;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // ==================== MÉTODOS ÚTILES ====================

    @Override
    public String toString() {
        return "ConfigurationProperty{" +
                "id=" + id +
                ", key='" + key + '\'' +
                ", category='" + category + '\'' +
                ", valueType=" + valueType +
                ", isSensitive=" + isSensitive +
                ", isEditable=" + isEditable +
                ", isActive=" + isActive +
                '}';
    }
}