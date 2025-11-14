package com.newbie.newbiecore.dto.Auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String correo;
    private String password;
}
