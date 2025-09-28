package com.newbie.newbiecore.dto;


import lombok.Data;

@Data
public class OtpRequest {
    private Long clienteId;
    private String correo;
}
