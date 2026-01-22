package com.newbie.newbiecore.service;

import org.springframework.cloud.context.refresh.ContextRefresher;
import org.springframework.stereotype.Service;

@Service
public class ConfigurationReloadService {

    private final ContextRefresher contextRefresher;

    public ConfigurationReloadService(ContextRefresher contextRefresher) {
        this.contextRefresher = contextRefresher;
    }

    public void refresh() {
        contextRefresher.refresh();
    }
}
