package com.newbie.newbiecore.dto.Config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BulkUpdateConfigurationDTO {

    @NotEmpty(message = "La lista de configuraciones no puede estar vacía")
    @Valid
    private List<UpdateConfigurationDTO> configurations;

    public BulkUpdateConfigurationDTO() {}

    public BulkUpdateConfigurationDTO(List<UpdateConfigurationDTO> configurations) {
        this.configurations = configurations;
    }

    public List<UpdateConfigurationDTO> getConfigurations() {
        return configurations;
    }

    public void setConfigurations(List<UpdateConfigurationDTO> configurations) {
        this.configurations = configurations;
    }
}