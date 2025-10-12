package com.newbie.newbiecore.entity;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Data @NoArgsConstructor @AllArgsConstructor
public class ReparacionServicioId implements Serializable {
    private Long idReparacion;
    private Long idServicio;
}