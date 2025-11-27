package com.newbie.newbiecore.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.newbie.newbiecore.dto.dashboard.DashboardResumenDto;
import com.newbie.newbiecore.service.DashboardService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenDto> obtenerResumen() {
        DashboardResumenDto resumen = dashboardService.obtenerResumen();
        return ResponseEntity.ok(resumen);
    }
}
