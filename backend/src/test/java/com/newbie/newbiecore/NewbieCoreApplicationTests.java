package com.newbie.newbiecore;

import com.newbie.newbiecore.config.TestContainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@Import(TestContainersConfig.class)
@ActiveProfiles("test")
class NewbieCoreApplicationTests {

    @Test
    void contextLoads() {
    }
}

