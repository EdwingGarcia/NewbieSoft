package com.newbie.newbiecore.dto.Config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateConfigurationDTO {

    @NotNull(message = "El ID es requerido")
    private Long id;

    @NotBlank(message = "El valor no puede estar vacío")
    private String value;

    public UpdateConfigurationDTO() {}

    public UpdateConfigurationDTO(Long id, String value) {
        this.id = id;
        this.value = value;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}