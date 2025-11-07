package com.newbie.newbiecore.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "usuarios")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
	 @Id
	    @Column(nullable = false, unique = true)
	    private String cedula; 

	    @Column(nullable = false)
	    private String nombre;

	    @Column(nullable = false, unique = true)
	    private String correo;

	    @Column
	    private String telefono;

	    @Column
	    private String direccion;

    @Column(name="password", nullable=false)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="rol_id")
    private Rol rol;

    @Column(name="estado")
    private Boolean estado = true;
}


   