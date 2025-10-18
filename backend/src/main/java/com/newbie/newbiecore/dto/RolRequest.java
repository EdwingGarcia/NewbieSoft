package com.newbie.newbiecore.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Schema(description = "DTO para la creación de un rol")
@Data
@AllArgsConstructor
public class RolRequest {
    private String nombre;
    private String descripcion;


}