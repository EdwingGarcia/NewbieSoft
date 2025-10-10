package com.newbie.newbiecore.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpResponse {
    private boolean valido;
    private String mensaje;
}