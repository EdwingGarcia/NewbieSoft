package com.newbie.newbiecore;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")   // 👈 este perfil hace que NO se cree GoogleDriveService
class NewbieCoreApplicationTests {

    @Test
    void contextLoads() {
    }
}

