package com.newbie.newbiecore.controller;

import com.newbie.newbiecore.dto.catalogo.CatalogoItemDto;
import com.newbie.newbiecore.entity.CatalogoItem;
import com.newbie.newbiecore.service.CatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService service;

    @GetMapping
    public List<CatalogoItemDto> listar(@RequestParam(required = false) String search) {
        return service.listar(search);
    }

    @PostMapping
    public CatalogoItem crear(@RequestBody CatalogoItem item) {
        return service.crear(item);
    }

    @PutMapping("/{id}")
    public CatalogoItem actualizar(@PathVariable Long id, @RequestBody CatalogoItem item) {
        return service.actualizar(id, item);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
