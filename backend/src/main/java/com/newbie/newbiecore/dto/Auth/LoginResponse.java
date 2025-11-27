package com.newbie.newbiecore.dto.Auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {

    private String token;
    private String refreshToken;
    private String correo;
    private String rol;
    private List<String> roles;
    private List<String> permissions;
    private List<String> screens;
    private String cedula;
}
