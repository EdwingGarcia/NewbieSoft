package com.newbie.newbiecore.dto;

public class DatosCorreoDTO {

    private String nombreEquipo;
    private String correoCliente;
    private String nombreCliente;
    private String cedulaCliente;

    public DatosCorreoDTO(String nombreEquipo, String correoCliente,
                          String nombreCliente, String cedulaCliente) {
        this.nombreEquipo = nombreEquipo;
        this.correoCliente = correoCliente;
        this.nombreCliente = nombreCliente;
        this.cedulaCliente = cedulaCliente;
    }

    public String getNombreEquipo() { return nombreEquipo; }
    public String getCorreoCliente() { return correoCliente; }
    public String getNombreCliente() { return nombreCliente; }
    public String getCedulaCliente() { return cedulaCliente; }
}
