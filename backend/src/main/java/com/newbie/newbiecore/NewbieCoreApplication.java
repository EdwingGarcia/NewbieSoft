package com.newbie.newbiecore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NewbieCoreApplication extends org.springframework.boot.web.servlet.support.SpringBootServletInitializer {

	public static void main(String[] args) {
		org.springframework.boot.SpringApplication.run(NewbieCoreApplication.class, args);
	}

	@Override
	protected org.springframework.boot.builder.SpringApplicationBuilder configure(org.springframework.boot.builder.SpringApplicationBuilder builder) {
		return builder.sources(NewbieCoreApplication.class);
	}
}
