package com.arthova.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = "INTERNAL_API_SECRET=test-gateway-secret-for-backend-unit-tests")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
