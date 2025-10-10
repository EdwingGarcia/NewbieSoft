package com.newbie.newbiecore.dto;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private Long cedula;
    private String codigo;
}
