package com.newbie.newbiecore.dto.OrdenTrabajo;

public class CrearOrdenTrabajoRequest {

    private String clienteCedula;
    private String tecnicoCedula;
    private Long equipoId;
    private String medioContacto;
    private String contrasenaEquipo;
    private String accesorios;
    private String problemaReportado;
    private String observacionesIngreso;

    public CrearOrdenTrabajoRequest() {
        // constructor vacío requerido por Jackson
    }

    public String getClienteCedula() {
        return clienteCedula;
    }

    public void setClienteCedula(String clienteCedula) {
        this.clienteCedula = clienteCedula;
    }

    public String getTecnicoCedula() {
        return tecnicoCedula;
    }

    public void setTecnicoCedula(String tecnicoCedula) {
        this.tecnicoCedula = tecnicoCedula;
    }

    public Long getEquipoId() {
        return equipoId;
    }

    public void setEquipoId(Long equipoId) {
        this.equipoId = equipoId;
    }

    public String getMedioContacto() {
        return medioContacto;
    }

    public void setMedioContacto(String medioContacto) {
        this.medioContacto = medioContacto;
    }

    public String getContrasenaEquipo() {
        return contrasenaEquipo;
    }

    public void setContrasenaEquipo(String contrasenaEquipo) {
        this.contrasenaEquipo = contrasenaEquipo;
    }

    public String getAccesorios() {
        return accesorios;
    }

    public void setAccesorios(String accesorios) {
        this.accesorios = accesorios;
    }

    public String getProblemaReportado() {
        return problemaReportado;
    }

    public void setProblemaReportado(String problemaReportado) {
        this.problemaReportado = problemaReportado;
    }

    public String getObservacionesIngreso() {
        return observacionesIngreso;
    }

    public void setObservacionesIngreso(String observacionesIngreso) {
        this.observacionesIngreso = observacionesIngreso;
    }
}
